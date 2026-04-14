import type { FastifyInstance } from "fastify";
import { getRecentDrafts } from "../store/draft-store.js";

export async function recentDraftsRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/recent-drafts
  //
  // Returns up to 5 most recently created drafts in the current database.
  // No user identification — suitable for single-user local demo.
  app.get("/api/v1/recent-drafts", async (_req, reply) => {
    const drafts = getRecentDrafts(5);
    return reply.send({ data: { drafts } });
  });
}
