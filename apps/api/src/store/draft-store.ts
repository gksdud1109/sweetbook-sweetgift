// Draft store — JSON file-backed persistence.
//
// Replaces the in-memory Map with a JSON file so drafts, bookIds, and orderIds
// survive server restarts. This eliminates the demo breakage scenario where:
//   1. draft created → book created → server restarts → order fails (draft gone)
//   2. idempotency guard for orders also survives across restarts
//
// Design tradeoffs:
//   - Single-process only: no file locking, not safe for concurrent writers.
//   - Synchronous fs calls on hot path to avoid async complexity in MVP scope.
//     In production, replace with SQLite (better-sqlite3) or a proper KV store.
//   - Store path: DATA_DIR env var (default: <project-root>/data/drafts.json).
//     The file is created on first write if absent.
//
// TODO for production: swap to better-sqlite3 with WAL mode for concurrency safety.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

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

// ── Storage path ─────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveStorePath(): string {
  if (process.env.DATA_DIR) {
    return resolve(process.env.DATA_DIR, "drafts.json");
  }
  // Default: apps/api/data/drafts.json (ignored by apps/api/.gitignore)
  return resolve(__dirname, "../../data/drafts.json");
}

// ── Persistence helpers ───────────────────────────────────────────────────────

function load(): Map<string, StoredDraft> {
  const path = resolveStorePath();
  if (!existsSync(path)) return new Map();
  try {
    const raw = readFileSync(path, "utf-8");
    const entries = JSON.parse(raw) as Array<[string, StoredDraft]>;
    return new Map(entries);
  } catch {
    // Corrupt or empty file — start fresh rather than crashing the server
    return new Map();
  }
}

function persist(store: Map<string, StoredDraft>): void {
  const path = resolveStorePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify([...store.entries()], null, 2), "utf-8");
}

// Single in-process Map — loaded once from disk at startup
const store = load();

// ── Public API ────────────────────────────────────────────────────────────────

export function saveDraft(draft: StoredDraft): void {
  store.set(draft.draftId, draft);
  persist(store);
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
  persist(store);
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
