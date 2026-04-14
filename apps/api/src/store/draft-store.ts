// In-memory draft store.
//
// No database is required for the MVP; drafts live in process memory.
// Tradeoffs to be aware of:
//   - Drafts are lost on server restart.
//   - Not safe for multi-process / horizontally scaled deployments.
//   - Duplicate POST /album-drafts calls create new drafts each time
//     (acceptable for assignment scope; add idempotency key + DB for production).
//
// TODO: replace with a lightweight KV store (e.g. Redis, SQLite) if this
// service is promoted to production.

export interface StoredDraft {
  draftId: string;
  status: "draft" | "book_created" | "ordered";
  anniversaryType: "100days" | "200days" | "1year" | "custom";
  anniversaryDate: string;
  couple: {
    senderName: string;
    receiverName: string;
  };
  title: string;
  subtitle: string;
  letter: string;
  coverPhotoUrl: string;
  moments: Array<{
    id: string;
    date: string;
    title: string;
    body: string;
    photoUrl: string;
  }>;
  generatedPages: Array<{
    pageNumber: number;
    type: "cover" | "moment" | "letter" | "closing";
    title?: string;
    body?: string;
    photoUrl?: string;
  }>;
  // bookId is set when POST /books succeeds
  bookId?: string;
  // orderId is set when POST /orders succeeds — used for idempotency check
  orderId?: string;
}

const store = new Map<string, StoredDraft>();

export function saveDraft(draft: StoredDraft): void {
  store.set(draft.draftId, draft);
}

export function getDraft(draftId: string): StoredDraft | undefined {
  return store.get(draftId);
}

export function updateDraft(
  draftId: string,
  patch: Partial<StoredDraft>,
): StoredDraft | undefined {
  const existing = store.get(draftId);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  store.set(draftId, updated);
  return updated;
}

// Reverse lookup: find the draft that owns a given bookId.
// Used by POST /orders to detect duplicate submissions for the same book.
export function getDraftByBookId(bookId: string): StoredDraft | undefined {
  for (const draft of store.values()) {
    if (draft.bookId === bookId) return draft;
  }
  return undefined;
}
