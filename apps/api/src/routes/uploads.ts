// POST /api/v1/uploads — local disk file upload with image processing.
//
// Processing pipeline:
//   1. Receive multipart file (limit: 5 MB)
//   2. Buffer entire file in memory (toBuffer).
//      NOTE: @fastify/multipart v8 throws a 413 FastifyError when the file
//      exceeds the limit (throwFileSizeLimit defaults to true). We catch it
//      and convert to VALIDATION_ERROR.
//   3. Validate declared MIME type is in the allow-list
//   4. Validate magic bytes — rejects files that lie about their MIME type
//   5. Process via sharp: convert to WebP (quality 85), resize if > 3000px
//   6. Check print quality: warn if shorter side < 800px
//   7. Write .webp file to disk with UUID filename
//   8. Return { url, filename, printQualityWarning }
//
// Storage: DATA_DIR/uploads/ (default: apps/api/data/uploads/)
// All output files are .webp regardless of input format.

import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { createWriteStream, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { AppError } from "../adapters/sweetbook/index.js";
import { env } from "../env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Maximum dimension before downsizing (preserves aspect ratio)
const MAX_DIMENSION = 3000;

// Minimum shorter-side dimension for print quality (< this → warning)
const MIN_PRINT_DIMENSION = 800;

// Accepted MIME types and their magic-byte signatures.
// Each entry is a list of byte sequences — any match is valid (e.g. GIF87a / GIF89a).
const MAGIC_SIGNATURES: Record<string, Buffer[]> = {
  "image/jpeg": [Buffer.from([0xff, 0xd8, 0xff])],
  "image/png":  [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "image/gif":  [Buffer.from("GIF87a", "ascii"), Buffer.from("GIF89a", "ascii")],
  // WebP: bytes 0-3 = "RIFF", bytes 8-11 = "WEBP" — handled separately below
  "image/webp": [],
};

const ALLOWED_MIME_TYPES = new Set(Object.keys(MAGIC_SIGNATURES));

// ── Helpers ───────────────────────────────────────────────────────────────────

export function resolveUploadsDir(): string {
  if (process.env.DATA_DIR) {
    return resolve(process.env.DATA_DIR, "uploads");
  }
  return resolve(__dirname, "../../data/uploads");
}

function resolveBaseUrl(): string {
  return env.BASE_URL ?? `http://localhost:${env.PORT}`;
}

/**
 * Returns true if the buffer's leading bytes match the expected magic for the
 * given MIME type.  WebP has a two-segment signature (RIFF...WEBP) so it is
 * checked separately.
 */
function matchesMagic(buf: Buffer, mimeType: string): boolean {
  if (mimeType === "image/webp") {
    return (
      buf.length >= 12 &&
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  const sigs = MAGIC_SIGNATURES[mimeType];
  if (!sigs) return false;
  return sigs.some((sig) => buf.subarray(0, sig.length).equals(sig));
}

/**
 * @fastify/multipart v8 throws a FastifyError with statusCode 413 when the
 * file size limit is exceeded (throwFileSizeLimit defaults to true).
 * Normalise this into a VALIDATION_ERROR 400 rather than leaking a 413.
 */
function isFileSizeLimitError(err: unknown): boolean {
  return (
    err != null &&
    typeof err === "object" &&
    "statusCode" in err &&
    (err as { statusCode: number }).statusCode === 413
  );
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function uploadRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/v1/uploads", async (req, reply) => {
    // ── 1. Parse multipart (5 MB stream limit) ────────────────────────────────
    const part = await req.file({ limits: { fileSize: MAX_FILE_SIZE } });

    if (!part) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message:
            "No file provided. Send a multipart/form-data request with a 'file' field.",
          details: {},
        },
      });
    }

    // ── 2. Buffer the entire file ─────────────────────────────────────────────
    // toBuffer() throws a 413 FastifyError if the stream exceeds the limit.
    let fileBuffer: Buffer;
    try {
      fileBuffer = await part.toBuffer();
    } catch (err: unknown) {
      if (isFileSizeLimitError(err)) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "File too large. Maximum allowed size is 5MB.",
            details: {},
          },
        });
      }
      throw new AppError("INTERNAL_ERROR", "Failed to read uploaded file.", 500);
    }

    // ── 3. MIME type allow-list ───────────────────────────────────────────────
    if (!ALLOWED_MIME_TYPES.has(part.mimetype)) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: `Unsupported file type '${part.mimetype}'. Accepted: image/jpeg, image/png, image/webp, image/gif.`,
          details: {},
        },
      });
    }

    // ── 4. Magic-byte validation ──────────────────────────────────────────────
    // Defends against a client that declares "image/jpeg" but uploads a PDF.
    if (!matchesMagic(fileBuffer, part.mimetype)) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message:
            "File content does not match the declared MIME type. The file may be corrupt or misnamed.",
          details: {},
        },
      });
    }

    // ── 5. Process with sharp ─────────────────────────────────────────────────
    // Get original dimensions before conversion (for print quality check)
    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(fileBuffer).metadata();
    } catch {
      throw new AppError("INTERNAL_ERROR", "Failed to read image metadata.", 500);
    }

    // Convert to WebP; resize only if a dimension exceeds MAX_DIMENSION
    let webpBuffer: Buffer;
    try {
      webpBuffer = await sharp(fileBuffer)
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new AppError("INTERNAL_ERROR", "Failed to process image.", 500);
    }

    // ── 6. Print quality check ────────────────────────────────────────────────
    const originalWidth = metadata.width ?? 0;
    const originalHeight = metadata.height ?? 0;
    const shortSide = Math.min(originalWidth, originalHeight);
    const printQualityWarning = shortSide > 0 && shortSide < MIN_PRINT_DIMENSION;

    // ── 7. Write to disk ──────────────────────────────────────────────────────
    const filename = `${randomUUID().replace(/-/g, "")}.webp`;
    const uploadsDir = resolveUploadsDir();
    mkdirSync(uploadsDir, { recursive: true });
    const filePath = resolve(uploadsDir, filename);

    await new Promise<void>((res, rej) => {
      const dest = createWriteStream(filePath);
      dest.on("error", rej);
      dest.on("finish", res);
      dest.end(webpBuffer);
    });

    // ── 8. Response ───────────────────────────────────────────────────────────
    const url = `${resolveBaseUrl()}/uploads/${filename}`;

    return reply.status(201).send({
      data: { url, filename, printQualityWarning },
    });
  });
}
