// SweetBook upstream types.
// These represent what we send TO and receive FROM SweetBook.
// They are intentionally separated from our frontend-facing contract
// so that upstream shape changes don't silently propagate to the UI.
//
// Runtime validation: zod schemas are used to parse the actual HTTP response
// body so that missing or renamed fields (e.g. SweetBook returning "bookId"
// instead of "id") are caught immediately rather than silently producing
// undefined values that corrupt our draft store.

import { z } from "zod";

// ── Request payloads (outbound) ───────────────────────────────────────────────

export interface SweetBookBookPayload {
  title: string;
  subtitle: string;
  coverPhotoUrl: string;
  pages: SweetBookPage[];
}

export interface SweetBookPage {
  pageNumber: number;
  type: "cover" | "moment" | "letter" | "closing";
  title?: string;
  body?: string;
  photoUrl?: string;
}

export interface SweetBookOrderPayload {
  bookId: string;
  recipient: {
    name: string;
    phone: string;
    address1: string;
    address2: string;
    zipCode: string;
  };
}

// ── Response schemas (inbound, runtime-validated) ─────────────────────────────

export const SweetBookBookResponseSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  status: z.string(),
  createdAt: z.string(),
});

export const SweetBookOrderResponseSchema = z.object({
  id: z.string().min(1),
  bookId: z.string().min(1),
  status: z.string(),
  createdAt: z.string(),
});

export type SweetBookBookResponse = z.infer<typeof SweetBookBookResponseSchema>;
export type SweetBookOrderResponse = z.infer<typeof SweetBookOrderResponseSchema>;

// Upstream error response shape (best-effort — adapt if real API differs)
export interface SweetBookErrorBody {
  code?: string;
  message?: string;
}
