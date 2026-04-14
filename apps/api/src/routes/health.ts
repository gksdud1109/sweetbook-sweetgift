import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/health", async (_req, reply) => {
    return reply.send({ data: { status: "ok" } });
  });
}
