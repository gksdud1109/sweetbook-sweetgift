// Tests for POST /api/v1/uploads — multipart upload, image processing, validation.
//
// Test images are generated with sharp in beforeAll so they are guaranteed
// to be valid images with known dimensions and correct magic bytes.
//
// Key behavioural changes vs. the previous plain-storage implementation:
//   - All uploads are converted to WebP → filenames always end in .webp
//   - Magic-byte check rejects files whose content doesn't match declared MIME
//   - printQualityWarning is returned in every 201 response
//   - @fastify/multipart v8 throws 413 on toBuffer() for oversized files;
//     the route converts this to VALIDATION_ERROR 400

import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import { mkdirSync } from "fs";
import sharp from "sharp";
import { uploadRoutes, resolveUploadsDir } from "../src/routes/uploads.js";
import { registerErrorHandler } from "../src/plugins/error-handler.js";
import { env } from "../src/env.js";

async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: env.CORS_ORIGIN });
  await app.register(multipart);

  const uploadsDir = resolveUploadsDir();
  mkdirSync(uploadsDir, { recursive: true });
  await app.register(staticFiles, {
    root: uploadsDir,
    prefix: "/uploads/",
  });

  registerErrorHandler(app);
  await app.register(uploadRoutes);
  return app;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BOUNDARY = "----TestBoundary7f3a9b2e";

function buildMultipartBody(
  filename: string,
  mimeType: string,
  content: Buffer,
): Buffer {
  const header = [
    `--${BOUNDARY}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    `Content-Type: ${mimeType}`,
    "",
    "",
  ].join("\r\n");
  const footer = `\r\n--${BOUNDARY}--\r\n`;
  return Buffer.concat([Buffer.from(header), content, Buffer.from(footer)]);
}

// ── Test images (generated once, guaranteed valid) ────────────────────────────

// Small image well below the print-quality threshold (100×100 → warning)
let smallJpeg: Buffer;
// Large image above print-quality threshold (1200×1200 → no warning)
let largeJpeg: Buffer;
// Valid PNG
let smallPng: Buffer;
// A buffer that starts with PDF magic bytes — used for MIME/magic mismatch test
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-

beforeAll(async () => {
  smallJpeg = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 200, g: 100, b: 50 } },
  })
    .jpeg()
    .toBuffer();

  largeJpeg = await sharp({
    create: { width: 1200, height: 1200, channels: 3, background: { r: 50, g: 150, b: 250 } },
  })
    .jpeg()
    .toBuffer();

  smallPng = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 200, b: 100 } },
  })
    .png()
    .toBuffer();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/v1/uploads", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });

  // ── Happy paths ──────────────────────────────────────────────────────────────

  it("uploads a valid JPEG, returns 201 with .webp filename and url", async () => {
    const payload = buildMultipartBody("photo.jpg", "image/jpeg", largeJpeg);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload,
    });

    expect(res.statusCode).toBe(201);
    const { data } = JSON.parse(res.body);
    // All uploads are converted to WebP
    expect(data.filename).toMatch(/^[a-f0-9]+\.webp$/);
    expect(data.url).toMatch(/\/uploads\/[a-f0-9]+\.webp$/);
    expect(typeof data.printQualityWarning).toBe("boolean");
  });

  it("uploads a valid PNG and returns 201 with .webp output", async () => {
    const payload = buildMultipartBody("photo.png", "image/png", smallPng);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload,
    });

    expect(res.statusCode).toBe(201);
    const { data } = JSON.parse(res.body);
    expect(data.filename).toMatch(/\.webp$/);
  });

  // ── Print quality warning ────────────────────────────────────────────────────

  it("sets printQualityWarning=true for images below 800px short side", async () => {
    // smallJpeg is 100×100 — well below the 800px threshold
    const payload = buildMultipartBody("small.jpg", "image/jpeg", smallJpeg);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload,
    });

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).data.printQualityWarning).toBe(true);
  });

  it("sets printQualityWarning=false for images at or above 800px short side", async () => {
    // largeJpeg is 1200×1200 — above the 800px threshold
    const payload = buildMultipartBody("large.jpg", "image/jpeg", largeJpeg);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload,
    });

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).data.printQualityWarning).toBe(false);
  });

  // ── Validation errors ────────────────────────────────────────────────────────

  it("rejects unsupported MIME type with VALIDATION_ERROR (400)", async () => {
    const payload = buildMultipartBody("doc.pdf", "application/pdf", PDF_MAGIC);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toMatch(/application\/pdf/);
  });

  it("rejects a file whose magic bytes don't match the declared MIME type", async () => {
    // Declare image/jpeg but send PDF magic bytes
    const payload = buildMultipartBody("evil.jpg", "image/jpeg", PDF_MAGIC);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toMatch(/magic|MIME|corrupt|mismatch/i);
  });

  it("rejects a file exceeding 5MB with VALIDATION_ERROR (400)", async () => {
    // 6 MB buffer — exceeds the 5 MB limit
    // @fastify/multipart v8 throws a 413 on toBuffer(); route converts to 400
    const bigFile = Buffer.alloc(6 * 1024 * 1024, 0x42);
    const payload = buildMultipartBody("big.jpg", "image/jpeg", bigFile);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
      payload,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toMatch(/5MB/);
  });

  it("returns 400 when no file field is provided", async () => {
    const boundary = "----EmptyBoundary";
    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="other"`,
      "",
      "some text",
      `--${boundary}--`,
    ].join("\r\n");

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe("VALIDATION_ERROR");
  });

  // ── Uniqueness ────────────────────────────────────────────────────────────────

  it("returns different filenames for two separate uploads", async () => {
    const makePayload = () =>
      buildMultipartBody("photo.jpg", "image/jpeg", largeJpeg);

    const [r1, r2] = await Promise.all([
      app.inject({
        method: "POST",
        url: "/api/v1/uploads",
        headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
        payload: makePayload(),
      }),
      app.inject({
        method: "POST",
        url: "/api/v1/uploads",
        headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
        payload: makePayload(),
      }),
    ]);

    expect(r1.statusCode).toBe(201);
    expect(r2.statusCode).toBe(201);
    expect(JSON.parse(r1.body).data.filename).not.toBe(
      JSON.parse(r2.body).data.filename,
    );
  });
});
