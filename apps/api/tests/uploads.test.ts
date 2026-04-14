// Tests for POST /api/v1/uploads — file upload and validation.
//
// Multipart bodies are constructed manually as Buffers so there are no
// extra test-only dependencies (no 'form-data' package needed).
//
// env vars and DATA_DIR tmpdir are set in tests/setup.ts before modules load.

import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import { mkdirSync } from "fs";
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

const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
    "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN" +
    "DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy" +
    "MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAA" +
    "AAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/" +
    "2gAMAwEAAhEDEQA/AJVA/9k=",
  "base64",
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/v1/uploads", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp(); });
  afterAll(async () => { await app.close(); });

  it("uploads a valid JPEG and returns 201 with url and filename", async () => {
    const payload = buildMultipartBody("photo.jpg", "image/jpeg", TINY_JPEG);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: {
        "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      },
      payload,
    });

    expect(res.statusCode).toBe(201);
    const { data } = JSON.parse(res.body);
    expect(data.filename).toMatch(/^[a-f0-9]+\.jpg$/);
    expect(data.url).toMatch(/\/uploads\/[a-f0-9]+\.jpg$/);
  });

  it("uploads a valid PNG and returns 201", async () => {
    // Minimal 1×1 PNG (67 bytes)
    const tinyPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
    const payload = buildMultipartBody("photo.png", "image/png", tinyPng);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: {
        "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      },
      payload,
    });

    expect(res.statusCode).toBe(201);
    const { data } = JSON.parse(res.body);
    expect(data.filename).toMatch(/\.png$/);
  });

  it("rejects unsupported MIME type with VALIDATION_ERROR (400)", async () => {
    const payload = buildMultipartBody("doc.pdf", "application/pdf", Buffer.from("%PDF-1.4"));

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: {
        "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      },
      payload,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toMatch(/application\/pdf/);
  });

  it("rejects a text/plain file with VALIDATION_ERROR (400)", async () => {
    const payload = buildMultipartBody("note.txt", "text/plain", Buffer.from("hello"));

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: {
        "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      },
      payload,
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a file exceeding 5MB with VALIDATION_ERROR (400)", async () => {
    // 6 MB of zeros — exceeds the 5 MB limit
    const bigFile = Buffer.alloc(6 * 1024 * 1024, 0xff);
    const payload = buildMultipartBody("big.jpg", "image/jpeg", bigFile);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: {
        "content-type": `multipart/form-data; boundary=${BOUNDARY}`,
      },
      payload,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toMatch(/5MB/);
  });

  it("returns 400 when no file field is provided", async () => {
    // Send a multipart body with a non-file text field
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
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe("VALIDATION_ERROR");
  });

  it("returns different filenames for two separate uploads", async () => {
    const payload = () =>
      buildMultipartBody("photo.jpg", "image/jpeg", TINY_JPEG);

    const [r1, r2] = await Promise.all([
      app.inject({
        method: "POST",
        url: "/api/v1/uploads",
        headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
        payload: payload(),
      }),
      app.inject({
        method: "POST",
        url: "/api/v1/uploads",
        headers: { "content-type": `multipart/form-data; boundary=${BOUNDARY}` },
        payload: payload(),
      }),
    ]);

    expect(r1.statusCode).toBe(201);
    expect(r2.statusCode).toBe(201);
    expect(JSON.parse(r1.body).data.filename).not.toBe(
      JSON.parse(r2.body).data.filename,
    );
  });
});
