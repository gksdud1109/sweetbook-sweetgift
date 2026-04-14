// POST /api/v1/uploads — local disk file upload.
//
// Design notes:
//   - Stores files in DATA_DIR/uploads/ (default: apps/api/data/uploads/).
//     This directory is git-ignored; reviewers must start the server first.
//   - Returns BASE_URL/uploads/<filename> so the frontend can use the URL
//     directly as coverPhotoUrl or moments[].photoUrl.
//   - UUID-based filenames prevent collisions and avoid exposing original names.
//   - File size limit enforced by @fastify/multipart stream truncation flag.
//     Partial file is removed from disk when truncation is detected.
//   - MIME type is checked before writing — unsupported types drain the stream
//     and return 400 immediately.
//
// Limitations (acceptable for assignment scope):
//   - Single-process only; no distributed storage.
//   - No virus scan, no image dimension validation.
//   - Uploaded files are served via @fastify/static registered in server.ts.

import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { createWriteStream, mkdirSync, unlinkSync } from "fs";
import { pipeline } from "stream/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { AppError } from "../adapters/sweetbook/index.js";
import { env } from "../env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// ── Path helpers ──────────────────────────────────────────────────────────────

export function resolveUploadsDir(): string {
  if (process.env.DATA_DIR) {
    return resolve(process.env.DATA_DIR, "uploads");
  }
  return resolve(__dirname, "../../data/uploads");
}

function resolveBaseUrl(): string {
  return env.BASE_URL ?? `http://localhost:${env.PORT}`;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/uploads", async (req, reply) => {
    const data = await req.file({ limits: { fileSize: MAX_FILE_SIZE } });

    if (!data) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message:
            "No file provided. Send a multipart/form-data request with a 'file' field.",
          details: {},
        },
      });
    }

    // Reject unsupported MIME types before touching the disk.
    // Drain the stream first to prevent @fastify/multipart leaks.
    if (!ALLOWED_MIME_TYPES.has(data.mimetype)) {
      data.file.resume();
      await new Promise<void>((res) => data.file.on("end", res));
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: `Unsupported file type '${data.mimetype}'. Accepted: image/jpeg, image/png, image/webp, image/gif.`,
          details: {},
        },
      });
    }

    const ext = MIME_TO_EXT[data.mimetype] ?? ".bin";
    const filename = `${randomUUID().replace(/-/g, "")}${ext}`;
    const uploadsDir = resolveUploadsDir();
    mkdirSync(uploadsDir, { recursive: true });
    const filePath = resolve(uploadsDir, filename);

    const dest = createWriteStream(filePath);
    try {
      await pipeline(data.file, dest);
    } catch {
      // Clean up partial file on write error
      try { unlinkSync(filePath); } catch { /* ignore */ }
      throw new AppError("INTERNAL_ERROR", "Failed to write uploaded file.", 500);
    }

    // @fastify/multipart sets file.truncated when the stream exceeded the limit.
    // The partial file is already on disk — remove it before returning the error.
    if (data.file.truncated) {
      try { unlinkSync(filePath); } catch { /* ignore */ }
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "File too large. Maximum allowed size is 5MB.",
          details: {},
        },
      });
    }

    const url = `${resolveBaseUrl()}/uploads/${filename}`;

    return reply.status(201).send({
      data: { url, filename },
    });
  });
}
