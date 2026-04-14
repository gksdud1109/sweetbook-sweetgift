// Tests for POST /api/v1/orders — idempotency and validation.
//
// Each bookId is isolated per test so happy-path and idempotency tests
// don't share state and test intent stays unambiguous.
//
// env vars and DATA_DIR tmpdir are set in tests/setup.ts before modules load.

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

/** Create a fresh draft + book and return the bookId. */
async function createBookId(app: Awaited<ReturnType<typeof buildApp>>): Promise<string> {
  const draftRes = await app.inject({ method: "POST", url: "/api/v1/album-drafts", payload: SAMPLE_DRAFT_BODY });
  const draftId = JSON.parse(draftRes.body).data.draftId;
  const bookRes = await app.inject({ method: "POST", url: "/api/v1/books", payload: { draftId } });
  return JSON.parse(bookRes.body).data.bookId;
}

describe("POST /api/v1/orders", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });

  it("creates an order and returns orderId + status ordered (201)", async () => {
    const bookId = await createBookId(app);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: { bookId, recipient: SAMPLE_RECIPIENT },
    });
    expect(res.statusCode).toBe(201);
    const { data } = JSON.parse(res.body);
    expect(data.orderId).toBeTruthy();
    expect(data.bookId).toBe(bookId);
    expect(data.status).toBe("ordered");
  });

  it("returns the same orderId on duplicate submission (idempotency guard)", async () => {
    // Fresh bookId: first call creates the order, second call must return the same orderId
    const bookId = await createBookId(app);
    const payload = { bookId, recipient: SAMPLE_RECIPIENT };

    const first = await app.inject({ method: "POST", url: "/api/v1/orders", payload });
    const second = await app.inject({ method: "POST", url: "/api/v1/orders", payload });

    expect(first.statusCode).toBe(201);
    // Second call hits the idempotency guard — returns cached result (200)
    expect(second.statusCode).toBe(200);
    expect(JSON.parse(first.body).data.orderId).toBe(JSON.parse(second.body).data.orderId);
  });

  it("idempotency holds even without a matching draft (external bookId scenario)", async () => {
    // Call order with a bookId that has no draft in the store.
    // First call creates the order; second call returns the same orderId via the
    // bookId→orderId index (not via getDraftByBookId).
    const externalBookId = `book_external_${Date.now()}`;
    const payload = { bookId: externalBookId, recipient: SAMPLE_RECIPIENT };

    const first = await app.inject({ method: "POST", url: "/api/v1/orders", payload });
    const second = await app.inject({ method: "POST", url: "/api/v1/orders", payload });

    expect(first.statusCode).toBe(201);
    expect(JSON.parse(first.body).data.orderId).toBe(JSON.parse(second.body).data.orderId);
  });

  it("rejects missing recipient fields with VALIDATION_ERROR", async () => {
    const bookId = await createBookId(app);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: { bookId, recipient: { name: "홍길동" } },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
  });

  it("rejects invalid zipCode format", async () => {
    const bookId = await createBookId(app);
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/orders",
      payload: { bookId, recipient: { ...SAMPLE_RECIPIENT, zipCode: "abc" } },
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe("VALIDATION_ERROR");
  });
});
