// Tests for POST /api/v1/books
// Covers: happy path, NOT_FOUND, idempotency (duplicate → cached bookId),
// and ordered-state guard (no re-creation after order placed).

// env vars set in tests/setup.ts

import Fastify from "fastify";
import cors from "@fastify/cors";
import { albumDraftRoutes } from "../src/routes/album-drafts.js";
import { bookRoutes } from "../src/routes/books.js";
import { orderRoutes } from "../src/routes/orders.js";
import { registerErrorHandler } from "../src/plugins/error-handler.js";
import { env } from "../src/env.js";

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: env.CORS_ORIGIN });
  registerErrorHandler(app);
  await app.register(albumDraftRoutes);
  await app.register(bookRoutes);
  await app.register(orderRoutes);
  return app;
}

const SAMPLE_DRAFT = {
  anniversaryType: "100days",
  anniversaryDate: "2026-04-20",
  couple: { senderName: "민수", receiverName: "지은" },
  title: "Our 100 Days",
  subtitle: "앨범",
  letter: "지은아.",
  coverPhotoUrl: "https://images.example.com/cover.jpg",
  moments: [
    { date: "2026-01-10", title: "M1", body: "B1", photoUrl: "https://images.example.com/01.jpg" },
    { date: "2026-02-14", title: "M2", body: "B2", photoUrl: "https://images.example.com/02.jpg" },
    { date: "2026-03-01", title: "M3", body: "B3", photoUrl: "https://images.example.com/03.jpg" },
  ],
};

const SAMPLE_RECIPIENT = {
  name: "홍길동",
  phone: "010-0000-0000",
  address1: "서울특별시 강남구 테헤란로 1",
  address2: "101동",
  zipCode: "06123",
};

describe("POST /api/v1/books", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });

  it("creates a book and returns bookId + book_created status", async () => {
    const draftRes = await app.inject({ method: "POST", url: "/api/v1/album-drafts", payload: SAMPLE_DRAFT });
    const draftId = JSON.parse(draftRes.body).data.draftId;

    const res = await app.inject({ method: "POST", url: "/api/v1/books", payload: { draftId } });
    expect(res.statusCode).toBe(201);
    const { data } = JSON.parse(res.body);
    expect(data.bookId).toBeTruthy();
    expect(data.draftId).toBe(draftId);
    expect(data.status).toBe("book_created");
  });

  it("returns the same bookId on duplicate submission (idempotency)", async () => {
    const draftRes = await app.inject({ method: "POST", url: "/api/v1/album-drafts", payload: SAMPLE_DRAFT });
    const draftId = JSON.parse(draftRes.body).data.draftId;

    const res1 = await app.inject({ method: "POST", url: "/api/v1/books", payload: { draftId } });
    const res2 = await app.inject({ method: "POST", url: "/api/v1/books", payload: { draftId } });

    expect(JSON.parse(res1.body).data.bookId).toBe(JSON.parse(res2.body).data.bookId);
  });

  it("returns NOT_FOUND for unknown draftId", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/books", payload: { draftId: "draft_nope" } });
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error.code).toBe("NOT_FOUND");
  });

  it("rejects missing draftId with VALIDATION_ERROR", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/books", payload: {} });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe("VALIDATION_ERROR");
  });

  it("blocks book re-creation after order is placed (ordered guard)", async () => {
    // Create draft → book → order → attempt second book creation
    const draftRes = await app.inject({ method: "POST", url: "/api/v1/album-drafts", payload: SAMPLE_DRAFT });
    const draftId = JSON.parse(draftRes.body).data.draftId;

    const bookRes = await app.inject({ method: "POST", url: "/api/v1/books", payload: { draftId } });
    const bookId = JSON.parse(bookRes.body).data.bookId;

    await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: { bookId, recipient: SAMPLE_RECIPIENT },
    });

    // Second book creation attempt after order — must return the same cached bookId
    const reCreateRes = await app.inject({ method: "POST", url: "/api/v1/books", payload: { draftId } });
    expect(reCreateRes.statusCode).toBe(200);
    expect(JSON.parse(reCreateRes.body).data.bookId).toBe(bookId);
  });
});
