// Draft store — JSON file-backed persistence.
//
// Stores drafts AND a bookId→orderId index in the same JSON file so both
// survive server restarts. The index ensures idempotency for POST /orders
// even when the draft itself cannot be found (corrupt file, manual bookId).
//
// File format:
//   { "drafts": [[draftId, draft], ...], "orderIndex": [[bookId, orderId], ...] }
//
// Design tradeoffs:
//   - Single-process only: no file locking, not safe for concurrent writers.
//   - Every write rewrites the entire file. Acceptable at MVP scale; switch to
//     SQLite (WAL mode) for concurrent or high-write scenarios.
//   - writeFile (async) is used to avoid blocking the Node.js event loop on
//     every POST request.
//
// Path: DATA_DIR env var (default: apps/api/data/drafts.json).
// Set DATA_DIR to a tmpdir in tests so test runs never touch the real file.

import { existsSync, mkdirSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  bookId?: string;
  orderId?: string;
}

interface PersistenceData {
  drafts: Array<[string, StoredDraft]>;
  orderIndex: Array<[string, string]>; // [bookId, orderId]
}

// ── Storage path ──────────────────────────────────────────────────────────────

function resolveStorePath(): string {
  if (process.env.DATA_DIR) {
    return resolve(process.env.DATA_DIR, "drafts.json");
  }
  return resolve(__dirname, "../../data/drafts.json");
}

// ── Load ──────────────────────────────────────────────────────────────────────

function load(): { draftStore: Map<string, StoredDraft>; orderStore: Map<string, string> } {
  const path = resolveStorePath();
  if (!existsSync(path)) {
    return { draftStore: new Map(), orderStore: new Map() };
  }
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw) as PersistenceData | Array<[string, StoredDraft]>;

    // Legacy format: flat array of [draftId, draft] pairs (migrate transparently)
    if (Array.isArray(parsed)) {
      return { draftStore: new Map(parsed), orderStore: new Map() };
    }

    return {
      draftStore: new Map(parsed.drafts ?? []),
      orderStore: new Map(parsed.orderIndex ?? []),
    };
  } catch (e) {
    console.error("[draft-store] corrupt or unreadable store file — starting fresh:", e);
    return { draftStore: new Map(), orderStore: new Map() };
  }
}

// ── In-process state (loaded once at startup) ─────────────────────────────────

const { draftStore: store, orderStore: orderIndex } = load();

// ── Persist ───────────────────────────────────────────────────────────────────

async function persist(): Promise<void> {
  const path = resolveStorePath();
  mkdirSync(dirname(path), { recursive: true });
  const data: PersistenceData = {
    drafts: [...store.entries()],
    orderIndex: [...orderIndex.entries()],
  };
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

// ── Draft API ─────────────────────────────────────────────────────────────────

export async function saveDraft(draft: StoredDraft): Promise<void> {
  store.set(draft.draftId, draft);
  await persist();
}

export function getDraft(draftId: string): StoredDraft | undefined {
  return store.get(draftId);
}

export async function updateDraft(
  draftId: string,
  patch: Partial<StoredDraft>,
): Promise<StoredDraft | undefined> {
  const existing = store.get(draftId);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  store.set(draftId, updated);
  await persist();
  return updated;
}

export function getDraftByBookId(bookId: string): StoredDraft | undefined {
  for (const draft of store.values()) {
    if (draft.bookId === bookId) return draft;
  }
  return undefined;
}

// ── Order idempotency index ───────────────────────────────────────────────────
// Separate from draft lookup so idempotency holds even when the draft cannot
// be found (corrupt store, external bookId, store was cleared).

export function getOrderIdByBookId(bookId: string): string | undefined {
  return orderIndex.get(bookId);
}

export async function saveOrderId(bookId: string, orderId: string): Promise<void> {
  orderIndex.set(bookId, orderId);
  await persist();
}
