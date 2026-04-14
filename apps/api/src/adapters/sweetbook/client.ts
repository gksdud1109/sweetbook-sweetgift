// SweetBook REST adapter.
//
// The official SweetBook Node.js SDK is used if it ships with the project.
// Since it is not yet available on npm, this file provides an HTTP adapter
// that mirrors the same interface so the swap is a one-line change.
//
// Design decisions:
// - AbortController timeout is applied per request (default 10 s).
//   TODO: make SWEETBOOK_TIMEOUT_MS an env var when the SDK ships.
// - Idempotency: SweetBook's API may accept an idempotency key header.
//   TODO: pass X-Idempotency-Key from the caller when order retries are added.
// - Mock mode: set SWEETBOOK_MOCK=true to skip real calls (local dev / CI).

import { env } from "../../env.js";
import {
  SweetBookBookResponseSchema,
  SweetBookOrderResponseSchema,
} from "./types.js";
import type {
  SweetBookBookPayload,
  SweetBookBookResponse,
  SweetBookOrderPayload,
  SweetBookOrderResponse,
} from "./types.js";

const REQUEST_TIMEOUT_MS = 10_000;

// Carries the HTTP status code so mapUpstreamError can branch on numbers,
// not on message string patterns.
export class SweetBookHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`SweetBook HTTP ${status}`);
    this.name = "SweetBookHttpError";
  }
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${env.SWEETBOOK_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SWEETBOOK_API_KEY}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new SweetBookHttpError(response.status, text);
  }

  // Return raw JSON; callers validate with zod schemas
  return response.json() as Promise<T>;
}

// ── Books ─────────────────────────────────────────────────────────────────────

export async function createBook(
  payload: SweetBookBookPayload,
): Promise<SweetBookBookResponse> {
  if (env.SWEETBOOK_MOCK) {
    return mockCreateBook(payload);
  }
  const raw = await request<unknown>("POST", "/books", payload);
  // Runtime validation: catch upstream shape changes (e.g. "id" → "bookId")
  // before they silently corrupt our draft store.
  return SweetBookBookResponseSchema.parse(raw);
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function createOrder(
  payload: SweetBookOrderPayload,
): Promise<SweetBookOrderResponse> {
  if (env.SWEETBOOK_MOCK) {
    return mockCreateOrder(payload);
  }
  const raw = await request<unknown>("POST", "/orders", payload);
  return SweetBookOrderResponseSchema.parse(raw);
}

// ── Mock implementations ──────────────────────────────────────────────────────
// Used when SWEETBOOK_MOCK=true. Returns plausible data so the frontend can
// run an end-to-end demo without a real API key.

function mockCreateBook(payload: SweetBookBookPayload): SweetBookBookResponse {
  return {
    id: `book_mock_${Date.now()}`,
    title: payload.title,
    status: "created",
    createdAt: new Date().toISOString(),
  };
}

function mockCreateOrder(
  payload: SweetBookOrderPayload,
): SweetBookOrderResponse {
  return {
    id: `order_mock_${Date.now()}`,
    bookId: payload.bookId,
    status: "accepted",
    createdAt: new Date().toISOString(),
  };
}
