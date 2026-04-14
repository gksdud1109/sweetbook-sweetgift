import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import { mkdirSync } from "fs";
import { env } from "./env.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { healthRoutes } from "./routes/health.js";
import { albumDraftRoutes } from "./routes/album-drafts.js";
import { bookRoutes } from "./routes/books.js";
import { orderRoutes } from "./routes/orders.js";
import { uploadRoutes, resolveUploadsDir } from "./routes/uploads.js";
import { recentDraftsRoutes } from "./routes/recent-drafts.js";

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

// Multipart support for POST /api/v1/uploads.
// File size limit is enforced per-request inside the route (not globally here)
// so other routes are unaffected.
await app.register(multipart);

// Serve uploaded files at /uploads/<filename>.
// The directory is created eagerly so @fastify/static does not throw on startup.
const uploadsDir = resolveUploadsDir();
mkdirSync(uploadsDir, { recursive: true });
await app.register(staticFiles, {
  root: uploadsDir,
  prefix: "/uploads/",
});

// ── Error handler ──────────────────────────────────────────────────────────────
registerErrorHandler(app);

// ── Routes ────────────────────────────────────────────────────────────────────
await app.register(healthRoutes);
await app.register(albumDraftRoutes);
await app.register(bookRoutes);
await app.register(orderRoutes);
await app.register(uploadRoutes);
await app.register(recentDraftsRoutes);

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
