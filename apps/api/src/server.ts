import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { healthRoutes } from "./routes/health.js";
import { albumDraftRoutes } from "./routes/album-drafts.js";
import { bookRoutes } from "./routes/books.js";
import { orderRoutes } from "./routes/orders.js";

const app = Fastify({
  logger: {
    level: "info",
  },
});

// ── Plugins ───────────────────────────────────────────────────────────────────
await app.register(cors, {
  origin: env.CORS_ORIGIN,
  methods: ["GET", "POST", "OPTIONS"],
});

// ── Error handler ──────────────────────────────────────────────────────────────
registerErrorHandler(app);

// ── Routes ────────────────────────────────────────────────────────────────────
await app.register(healthRoutes);
await app.register(albumDraftRoutes);
await app.register(bookRoutes);
await app.register(orderRoutes);

// ── Start ─────────────────────────────────────────────────────────────────────
try {
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`SweetGift API running on port ${env.PORT}`);
  if (env.SWEETBOOK_MOCK) {
    app.log.warn("SWEETBOOK_MOCK=true — SweetBook calls are mocked");
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
