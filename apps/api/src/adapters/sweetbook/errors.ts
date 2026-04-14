// Maps upstream SweetBook errors to our stable error codes.
// The frontend only ever sees the codes defined in the contract.

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
  const code = context === "book" ? "BOOK_CREATION_FAILED" : "ORDER_CREATION_FAILED";

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();

    // Node fetch / undici network-level timeout signals
    if (
      msg.includes("timeout") ||
      msg.includes("abort") ||
      msg.includes("timedout") ||
      (err as NodeJS.ErrnoException).code === "UND_ERR_CONNECT_TIMEOUT"
    ) {
      return new AppError(
        "UPSTREAM_TIMEOUT",
        "SweetBook API timed out. Please try again.",
        504,
      );
    }

    // Payment / balance errors (HTTP 402)
    if (msg.includes("402") || msg.includes("payment") || msg.includes("balance")) {
      return new AppError(
        code,
        "SweetBook account balance is insufficient. Contact support.",
        402,
      );
    }

    // Generic upstream 4xx
    if (msg.includes("4")) {
      return new AppError(
        "UPSTREAM_ERROR",
        `SweetBook rejected the request: ${err.message}`,
        400,
      );
    }
  }

  return new AppError(
    code,
    `${context === "book" ? "Book creation" : "Order creation"} failed due to an upstream error.`,
    502,
  );
}
