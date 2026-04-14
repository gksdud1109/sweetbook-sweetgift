// Tests for POST /api/v1/orders — idempotency and validation.
//
// Critical scenario from review:
//   - Same bookId submitted twice → must NOT create two SweetBook orders
//   - Invalid body → must return VALIDATION_ERROR, not a 500
//
// env vars are set in tests/setup.ts (Jest setupFiles) before modules load

import Fastify from "fastify";
import cors from "@fastify/cors";
import { orderRoutes } from "../src/routes/orders.js";
import { albumDraftRoutes } from "../src/routes/album-drafts.js";
import { bookRoutes } from "../src/routes/books.js";
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

const SAMPLE_DRAFT_BODY = {
  anniversaryType: "100days",
  anniversaryDate: "2026-04-20",
  couple: { senderName: "민수", receiverName: "지은" },
  title: "Our 100 Days",
  subtitle: "앨범",
  letter: "지은아, 벌써 100일이야.",
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
  address2: "101동 101호",
  zipCode: "06123",
};

describe("POST /api/v1/orders", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let bookId: string;

  beforeAll(async () => {
    app = await buildApp();

    // Create a draft then a book so we have a real bookId to order against
    const draftRes = await app.inject({
      method: "POST",
      url: "/api/v1/album-drafts",
      payload: SAMPLE_DRAFT_BODY,
    });
    const draftId = JSON.parse(draftRes.body).data.draftId;

    const bookRes = await app.inject({
      method: "POST",
      url: "/api/v1/books",
      payload: { draftId },
    });
    bookId = JSON.parse(bookRes.body).data.bookId;
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates an order and returns orderId + status ordered", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: { bookId, recipient: SAMPLE_RECIPIENT },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.orderId).toBeTruthy();
    expect(body.data.bookId).toBe(bookId);
    expect(body.data.status).toBe("ordered");
  });

  it("returns the SAME orderId on duplicate submission (idempotency guard)", async () => {
    // First order (may have been created in the previous test — that's fine,
    // the guard should kick in for any subsequent call)
    const res1 = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: { bookId, recipient: SAMPLE_RECIPIENT },
    });
    const res2 = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: { bookId, recipient: SAMPLE_RECIPIENT },
    });

    const orderId1 = JSON.parse(res1.body).data?.orderId;
    const orderId2 = JSON.parse(res2.body).data?.orderId;

    expect(orderId1).toBe(orderId2);
  });

  it("rejects missing recipient fields with VALIDATION_ERROR", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: { bookId, recipient: { name: "홍길동" } }, // missing phone, address, zipCode
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
  });

  it("rejects invalid zipCode format", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: {
        bookId,
        recipient: { ...SAMPLE_RECIPIENT, zipCode: "abc" },
      },
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe("VALIDATION_ERROR");
  });
});
