// Tests for POST /api/v1/album-drafts and GET /api/v1/album-drafts/:draftId

// env vars set in tests/setup.ts

import Fastify from "fastify";
import cors from "@fastify/cors";
import { albumDraftRoutes } from "../src/routes/album-drafts.js";
import { registerErrorHandler } from "../src/plugins/error-handler.js";
import { env } from "../src/env.js";

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: env.CORS_ORIGIN });
  registerErrorHandler(app);
  await app.register(albumDraftRoutes);
  return app;
}

const VALID_BODY = {
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

describe("POST /api/v1/album-drafts", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });

  it("returns 201 with draftId, status, and generatedPages", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/album-drafts", payload: VALID_BODY });
    expect(res.statusCode).toBe(201);
    const { data } = JSON.parse(res.body);
    expect(data.draftId).toMatch(/^draft_/);
    expect(data.status).toBe("draft");
    expect(data.title).toBe("Our 100 Days");
    expect(data.generatedPages.length).toBeGreaterThanOrEqual(5); // cover + 3 moments + letter + closing
  });

  it("generates a cover page as the first page", async () => {
    const res = await app.inject({ method: "POST", url: "/api/v1/album-drafts", payload: VALID_BODY });
    const { data } = JSON.parse(res.body);
    expect(data.generatedPages[0].type).toBe("cover");
    expect(data.generatedPages[0].pageNumber).toBe(1);
  });

  it("sorts moments by date ascending in generatedPages", async () => {
    const body = {
      ...VALID_BODY,
      moments: [
        { date: "2026-03-01", title: "Third", body: "B", photoUrl: "https://images.example.com/03.jpg" },
        { date: "2026-01-10", title: "First",  body: "B", photoUrl: "https://images.example.com/01.jpg" },
        { date: "2026-02-14", title: "Second", body: "B", photoUrl: "https://images.example.com/02.jpg" },
      ],
    };
    const res = await app.inject({ method: "POST", url: "/api/v1/album-drafts", payload: body });
    const { data } = JSON.parse(res.body);
    const momentPages = data.generatedPages.filter((p: { type: string }) => p.type === "moment");
    expect(momentPages[0].title).toBe("First");
    expect(momentPages[1].title).toBe("Second");
    expect(momentPages[2].title).toBe("Third");
  });

  it("rejects when moments < 3", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/album-drafts",
      payload: { ...VALID_BODY, moments: [VALID_BODY.moments[0]] },
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects when moments > 8", async () => {
    const tooMany = Array.from({ length: 9 }, (_, i) => ({
      date: `2026-0${(i % 9) + 1}-01`,
      title: `M${i}`,
      body: "B",
      photoUrl: `https://images.example.com/0${i}.jpg`,
    }));
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/album-drafts",
      payload: { ...VALID_BODY, moments: tooMany },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects title > 40 chars", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/album-drafts",
      payload: { ...VALID_BODY, title: "A".repeat(41) },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects letter > 2000 chars", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/album-drafts",
      payload: { ...VALID_BODY, letter: "A".repeat(2001) },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects invalid photoUrl", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/album-drafts",
      payload: { ...VALID_BODY, coverPhotoUrl: "not-a-url" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/v1/album-drafts/:draftId", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let draftId: string;

  beforeAll(async () => {
    app = await buildApp();
    const res = await app.inject({ method: "POST", url: "/api/v1/album-drafts", payload: VALID_BODY });
    draftId = JSON.parse(res.body).data.draftId;
  });
  afterAll(async () => { await app.close(); });

  it("returns the draft with full fields", async () => {
    const res = await app.inject({ method: "GET", url: `/api/v1/album-drafts/${draftId}` });
    expect(res.statusCode).toBe(200);
    const { data } = JSON.parse(res.body);
    expect(data.draftId).toBe(draftId);
    expect(data.couple.senderName).toBe("민수");
    expect(data.moments.length).toBe(3);
    expect(data.generatedPages.length).toBeGreaterThan(0);
  });

  it("returns NOT_FOUND for unknown draftId", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/album-drafts/draft_doesnotexist" });
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error.code).toBe("NOT_FOUND");
  });
});
