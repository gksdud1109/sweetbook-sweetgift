// Tests for GET /api/v1/recent-drafts — returns up to 5 most recent drafts.
//
// env vars and DATA_DIR tmpdir are set in tests/setup.ts before modules load.

import Fastify from "fastify";
import cors from "@fastify/cors";
import { albumDraftRoutes } from "../src/routes/album-drafts.js";
import { recentDraftsRoutes } from "../src/routes/recent-drafts.js";
import { registerErrorHandler } from "../src/plugins/error-handler.js";
import { env } from "../src/env.js";

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: env.CORS_ORIGIN });
  registerErrorHandler(app);
  await app.register(albumDraftRoutes);
  await app.register(recentDraftsRoutes);
  return app;
}

const SAMPLE_BODY = {
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

describe("GET /api/v1/recent-drafts", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });

  it("returns empty array when no drafts exist", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/recent-drafts" });

    expect(res.statusCode).toBe(200);
    const { data } = JSON.parse(res.body);
    expect(Array.isArray(data.drafts)).toBe(true);
    expect(data.drafts).toHaveLength(0);
  });

  it("returns created drafts in descending creation order", async () => {
    // Create 3 drafts with distinct titles
    for (const title of ["Draft A", "Draft B", "Draft C"]) {
      await app.inject({
        method: "POST",
        url: "/api/v1/album-drafts",
        payload: { ...SAMPLE_BODY, title },
      });
    }

    const res = await app.inject({ method: "GET", url: "/api/v1/recent-drafts" });

    expect(res.statusCode).toBe(200);
    const { data } = JSON.parse(res.body);
    expect(data.drafts.length).toBeGreaterThanOrEqual(3);

    // Most recently created should appear first
    expect(data.drafts[0].title).toBe("Draft C");
  });

  it("each draft summary has required fields", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/recent-drafts" });

    const { data } = JSON.parse(res.body);
    const draft = data.drafts[0];
    expect(draft).toHaveProperty("draftId");
    expect(draft).toHaveProperty("title");
    expect(draft).toHaveProperty("status");
    expect(draft).toHaveProperty("coverPhotoUrl");
    expect(draft).toHaveProperty("createdAt");
    expect(typeof draft.createdAt).toBe("number");
  });

  it("returns at most 5 drafts even when more exist", async () => {
    // Create 4 more drafts (3 already created above = 7 total)
    for (let i = 0; i < 4; i++) {
      await app.inject({
        method: "POST",
        url: "/api/v1/album-drafts",
        payload: { ...SAMPLE_BODY, title: `Extra Draft ${i}` },
      });
    }

    const res = await app.inject({ method: "GET", url: "/api/v1/recent-drafts" });

    const { data } = JSON.parse(res.body);
    expect(data.drafts.length).toBeLessThanOrEqual(5);
  });
});
