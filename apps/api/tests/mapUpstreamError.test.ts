// Tests for mapUpstreamError — the critical path that translates SweetBook
// upstream failures into stable UI-safe error codes.
//
// These tests exist because the original implementation used string pattern
// matching (msg.includes("4")) which caused false positives and misclassification.
// The new implementation uses SweetBookHttpError.status (integer) so we verify
// each classification bucket explicitly.

// env vars are set in tests/setup.ts (Jest setupFiles) before modules load
import { SweetBookHttpError, SweetBookResponseError } from "../src/adapters/sweetbook/client.js";
import {
  mapUpstreamError,
  AppError,
} from "../src/adapters/sweetbook/errors.js";

describe("mapUpstreamError", () => {
  describe("AbortError → UPSTREAM_TIMEOUT", () => {
    it("maps AbortError (our timeout) to UPSTREAM_TIMEOUT 504", () => {
      const abort = new DOMException("signal is aborted", "AbortError");
      const result = mapUpstreamError(abort, "book");
      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe("UPSTREAM_TIMEOUT");
      expect(result.statusCode).toBe(504);
    });
  });

  describe("SweetBookHttpError → status-based mapping", () => {
    it("402 → BOOK_CREATION_FAILED 402 (insufficient balance)", () => {
      const err = new SweetBookHttpError(402, "insufficient balance");
      const result = mapUpstreamError(err, "book");
      expect(result.code).toBe("BOOK_CREATION_FAILED");
      expect(result.statusCode).toBe(402);
    });

    it("402 → ORDER_CREATION_FAILED 402 for order context", () => {
      const err = new SweetBookHttpError(402, "insufficient credits");
      const result = mapUpstreamError(err, "order");
      expect(result.code).toBe("ORDER_CREATION_FAILED");
      expect(result.statusCode).toBe(402);
    });

    it("408 → UPSTREAM_TIMEOUT 504", () => {
      const err = new SweetBookHttpError(408, "request timeout");
      const result = mapUpstreamError(err, "book");
      expect(result.code).toBe("UPSTREAM_TIMEOUT");
      expect(result.statusCode).toBe(504);
    });

    it("504 → UPSTREAM_TIMEOUT 504", () => {
      const err = new SweetBookHttpError(504, "gateway timeout");
      const result = mapUpstreamError(err, "order");
      expect(result.code).toBe("UPSTREAM_TIMEOUT");
      expect(result.statusCode).toBe(504);
    });

    it("400 → UPSTREAM_ERROR 400 (bad request, not balance)", () => {
      const err = new SweetBookHttpError(400, "invalid page count");
      const result = mapUpstreamError(err, "book");
      expect(result.code).toBe("UPSTREAM_ERROR");
      expect(result.statusCode).toBe(400);
    });

    it("422 → UPSTREAM_ERROR 400", () => {
      const err = new SweetBookHttpError(422, "unprocessable entity");
      const result = mapUpstreamError(err, "book");
      expect(result.code).toBe("UPSTREAM_ERROR");
      expect(result.statusCode).toBe(400);
    });

    it("500 → BOOK_CREATION_FAILED 502", () => {
      const err = new SweetBookHttpError(500, "internal server error");
      const result = mapUpstreamError(err, "book");
      expect(result.code).toBe("BOOK_CREATION_FAILED");
      expect(result.statusCode).toBe(502);
    });

    it("503 → ORDER_CREATION_FAILED 502", () => {
      const err = new SweetBookHttpError(503, "service unavailable");
      const result = mapUpstreamError(err, "order");
      expect(result.code).toBe("ORDER_CREATION_FAILED");
      expect(result.statusCode).toBe(502);
    });

    it("does NOT misclassify error messages containing '4' as 4xx", () => {
      // Regression: old code had msg.includes("4") which would match
      // "factory error", "timeout", "HTTP 400 balance required" (double-match), etc.
      // With SweetBookHttpError, only the status integer matters.
      const err = new SweetBookHttpError(500, "factory error with 4 pages");
      const result = mapUpstreamError(err, "book");
      // Should be 5xx, NOT UPSTREAM_ERROR from false 4xx match
      expect(result.code).toBe("BOOK_CREATION_FAILED");
      expect(result.statusCode).toBe(502);
    });
  });

  describe("network-level errors", () => {
    it("generic Error (DNS, ECONNREFUSED) → BOOK_CREATION_FAILED 502", () => {
      const err = new Error("fetch failed");
      const result = mapUpstreamError(err, "book");
      expect(result.code).toBe("BOOK_CREATION_FAILED");
      expect(result.statusCode).toBe(502);
    });

    it("unknown thrown value → ORDER_CREATION_FAILED 502", () => {
      const result = mapUpstreamError("some string", "order");
      expect(result.code).toBe("ORDER_CREATION_FAILED");
      expect(result.statusCode).toBe(502);
    });
  });

  describe("SweetBookResponseError (schema mismatch)", () => {
    it("book context → BOOK_CREATION_FAILED 502 with descriptive message", () => {
      const err = new SweetBookResponseError("Required at 'id'");
      const result = mapUpstreamError(err, "book");
      expect(result.code).toBe("BOOK_CREATION_FAILED");
      expect(result.statusCode).toBe(502);
      expect(result.message).toMatch(/shape invalid/);
    });

    it("order context → ORDER_CREATION_FAILED 502", () => {
      const err = new SweetBookResponseError("Expected string, received number at 'bookId'");
      const result = mapUpstreamError(err, "order");
      expect(result.code).toBe("ORDER_CREATION_FAILED");
      expect(result.statusCode).toBe(502);
    });

    it("is NOT classified as a generic network error (message is specific)", () => {
      const err = new SweetBookResponseError("missing id field");
      const result = mapUpstreamError(err, "book");
      // Should NOT produce "Network error: ..." — that label is for ECONNREFUSED etc.
      expect(result.message).not.toMatch(/^Network error/);
    });
  });
});
