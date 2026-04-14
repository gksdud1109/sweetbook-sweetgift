// Maps upstream SweetBook errors to our stable error codes.
// The frontend only ever sees the codes defined in the contract.
//
// Error classification uses HTTP status codes (SweetBookHttpError.status),
// not message string patterns — avoids false matches like msg.includes("4").

import { SweetBookHttpError } from "./client.js";

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UPSTREAM_TIMEOUT"
  | "UPSTREAM_ERROR"
  | "BOOK_CREATION_FAILED"
  | "ORDER_CREATION_FAILED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function mapUpstreamError(
  err: unknown,
  context: "book" | "order",
): AppError {
  const code =
    context === "book" ? "BOOK_CREATION_FAILED" : "ORDER_CREATION_FAILED";

  // AbortError: our AbortController fired — request exceeded REQUEST_TIMEOUT_MS.
  // DOMException (the actual type fetch throws in Node.js) does not extend Error,
  // so check .name independently of instanceof.
  if (
    err != null &&
    typeof err === "object" &&
    "name" in err &&
    err.name === "AbortError"
  ) {
    return new AppError("UPSTREAM_TIMEOUT", "SweetBook API timed out.", 504);
  }

  // Structured HTTP error from SweetBook — classify by status number
  if (err instanceof SweetBookHttpError) {
    if (err.status === 402) {
      return new AppError(
        code,
        "SweetBook account balance is insufficient. Contact support.",
        402,
      );
    }
    if (err.status === 408 || err.status === 504) {
      return new AppError("UPSTREAM_TIMEOUT", "SweetBook API timed out.", 504);
    }
    if (err.status >= 400 && err.status < 500) {
      return new AppError(
        "UPSTREAM_ERROR",
        `SweetBook rejected the request (${err.status}).`,
        400,
      );
    }
    if (err.status >= 500) {
      return new AppError(
        code,
        `SweetBook upstream error (${err.status}).`,
        502,
      );
    }
  }

  // Network-level error (DNS failure, connection refused, etc.)
  if (err instanceof Error) {
    return new AppError(code, `Network error: ${err.message}`, 502);
  }

  return new AppError(code, "Upstream error.", 502);
}
