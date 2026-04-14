// Draft store — SQLite-backed persistence via better-sqlite3.
//
// Replaces the previous JSON-file store.  All public function signatures are
// identical so existing routes require no changes.
//
// Design notes:
//   - better-sqlite3 is synchronous; wrapping calls in async functions keeps
//     the caller API compatible and allows a future swap to an async driver.
//   - moments and generatedPages are stored as JSON strings in TEXT columns —
//     avoids extra tables while remaining fully queryable for MVP needs.
//   - order_index is a separate table so idempotency holds even when the
//     draft row is missing (corrupt DB, manually provided bookId).

import { db } from "./db.js";

// ── Public types ──────────────────────────────────────────────────────────────

/** A single sticker / decoration overlay element applied to a page or cover. */
export interface Decoration {
  id: string;
  type: string;
  value: string;
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

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
  coverDecorations?: Decoration[];
  moments: Array<{
    id: string;
    date: string;
    title: string;
    body: string;
    photoUrl: string;
    decorations?: Decoration[];
  }>;
  generatedPages: Array<{
    pageNumber: number;
    type: "cover" | "moment" | "letter" | "closing";
    title?: string;
    body?: string;
    photoUrl?: string;
    decorations?: Decoration[];
  }>;
  bookId?: string;
  orderId?: string;
}

// ── Row type (internal) ───────────────────────────────────────────────────────

interface DraftRow {
  draft_id: string;
  status: string;
  anniversary_type: string;
  anniversary_date: string;
  sender_name: string;
  receiver_name: string;
  title: string;
  subtitle: string;
  letter: string;
  cover_photo_url: string;
  moments_json: string;
  generated_pages_json: string;
  cover_decorations_json: string | null;
  book_id: string | null;
  order_id: string | null;
  created_at: number;
}

// ── Mapping ───────────────────────────────────────────────────────────────────

function rowToDraft(row: DraftRow): StoredDraft {
  return {
    draftId: row.draft_id,
    status: row.status as StoredDraft["status"],
    anniversaryType: row.anniversary_type as StoredDraft["anniversaryType"],
    anniversaryDate: row.anniversary_date,
    couple: {
      senderName: row.sender_name,
      receiverName: row.receiver_name,
    },
    title: row.title,
    subtitle: row.subtitle,
    letter: row.letter,
    coverPhotoUrl: row.cover_photo_url,
    ...(row.cover_decorations_json != null
      ? { coverDecorations: JSON.parse(row.cover_decorations_json) }
      : {}),
    moments: JSON.parse(row.moments_json),
    generatedPages: JSON.parse(row.generated_pages_json),
    ...(row.book_id != null ? { bookId: row.book_id } : {}),
    ...(row.order_id != null ? { orderId: row.order_id } : {}),
  };
}

// ── Draft API ─────────────────────────────────────────────────────────────────

export async function saveDraft(draft: StoredDraft): Promise<void> {
  db.prepare(`
    INSERT INTO drafts (
      draft_id, status, anniversary_type, anniversary_date,
      sender_name, receiver_name, title, subtitle, letter,
      cover_photo_url, moments_json, generated_pages_json,
      cover_decorations_json, book_id, order_id, created_at
    ) VALUES (
      @draftId, @status, @anniversaryType, @anniversaryDate,
      @senderName, @receiverName, @title, @subtitle, @letter,
      @coverPhotoUrl, @momentsJson, @generatedPagesJson,
      @coverDecorationsJson, @bookId, @orderId, @createdAt
    )
    ON CONFLICT(draft_id) DO UPDATE SET
      status                 = excluded.status,
      anniversary_type       = excluded.anniversary_type,
      anniversary_date       = excluded.anniversary_date,
      sender_name            = excluded.sender_name,
      receiver_name          = excluded.receiver_name,
      title                  = excluded.title,
      subtitle               = excluded.subtitle,
      letter                 = excluded.letter,
      cover_photo_url        = excluded.cover_photo_url,
      moments_json           = excluded.moments_json,
      generated_pages_json   = excluded.generated_pages_json,
      cover_decorations_json = excluded.cover_decorations_json,
      book_id                = excluded.book_id,
      order_id               = excluded.order_id
      -- created_at is intentionally excluded: preserve original creation time on update
  `).run({
    draftId: draft.draftId,
    status: draft.status,
    anniversaryType: draft.anniversaryType,
    anniversaryDate: draft.anniversaryDate,
    senderName: draft.couple.senderName,
    receiverName: draft.couple.receiverName,
    title: draft.title,
    subtitle: draft.subtitle,
    letter: draft.letter,
    coverPhotoUrl: draft.coverPhotoUrl,
    momentsJson: JSON.stringify(draft.moments),
    generatedPagesJson: JSON.stringify(draft.generatedPages),
    coverDecorationsJson: draft.coverDecorations != null
      ? JSON.stringify(draft.coverDecorations)
      : null,
    bookId: draft.bookId ?? null,
    orderId: draft.orderId ?? null,
    createdAt: Date.now(), // milliseconds — monotonic within a process, survives fast test sequences
  });
}

export function getDraft(draftId: string): StoredDraft | undefined {
  const row = db.prepare(
    "SELECT * FROM drafts WHERE draft_id = ?",
  ).get(draftId) as DraftRow | undefined;
  return row ? rowToDraft(row) : undefined;
}

export async function updateDraft(
  draftId: string,
  patch: Partial<StoredDraft>,
): Promise<StoredDraft | undefined> {
  const existing = getDraft(draftId);
  if (!existing) return undefined;

  const updated = { ...existing, ...patch };

  // Use a direct UPDATE rather than saveDraft() to:
  //   (a) never touch created_at — saveDraft always passes Date.now() into the
  //       INSERT even though ON CONFLICT excludes it, which is confusing.
  //   (b) make "update only" intent explicit — this path never inserts new rows.
  db.prepare(`
    UPDATE drafts SET
      status                 = @status,
      anniversary_type       = @anniversaryType,
      anniversary_date       = @anniversaryDate,
      sender_name            = @senderName,
      receiver_name          = @receiverName,
      title                  = @title,
      subtitle               = @subtitle,
      letter                 = @letter,
      cover_photo_url        = @coverPhotoUrl,
      moments_json           = @momentsJson,
      generated_pages_json   = @generatedPagesJson,
      cover_decorations_json = @coverDecorationsJson,
      book_id                = @bookId,
      order_id               = @orderId
    WHERE draft_id = @draftId
  `).run({
    draftId: updated.draftId,
    status: updated.status,
    anniversaryType: updated.anniversaryType,
    anniversaryDate: updated.anniversaryDate,
    senderName: updated.couple.senderName,
    receiverName: updated.couple.receiverName,
    title: updated.title,
    subtitle: updated.subtitle,
    letter: updated.letter,
    coverPhotoUrl: updated.coverPhotoUrl,
    momentsJson: JSON.stringify(updated.moments),
    generatedPagesJson: JSON.stringify(updated.generatedPages),
    coverDecorationsJson: updated.coverDecorations != null
      ? JSON.stringify(updated.coverDecorations)
      : null,
    bookId: updated.bookId ?? null,
    orderId: updated.orderId ?? null,
  });

  return updated;
}

export function getDraftByBookId(bookId: string): StoredDraft | undefined {
  const row = db.prepare(
    "SELECT * FROM drafts WHERE book_id = ?",
  ).get(bookId) as DraftRow | undefined;
  return row ? rowToDraft(row) : undefined;
}

// ── Recent drafts ─────────────────────────────────────────────────────────────

export interface RecentDraftSummary {
  draftId: string;
  title: string;
  status: StoredDraft["status"];
  coverPhotoUrl: string;
  createdAt: number;
}

export function getRecentDrafts(limit = 5): RecentDraftSummary[] {
  const rows = db.prepare(`
    SELECT draft_id, title, status, cover_photo_url, created_at
    FROM drafts
    ORDER BY created_at DESC, rowid DESC
    LIMIT ?
  `).all(limit) as Array<{
    draft_id: string;
    title: string;
    status: string;
    cover_photo_url: string;
    created_at: number;
  }>;

  return rows.map((r) => ({
    draftId: r.draft_id,
    title: r.title,
    status: r.status as StoredDraft["status"],
    coverPhotoUrl: r.cover_photo_url,
    createdAt: r.created_at,
  }));
}

// ── Order idempotency index ───────────────────────────────────────────────────
// Separate table so idempotency holds even when the draft row is gone.

export function getOrderIdByBookId(bookId: string): string | undefined {
  const row = db.prepare(
    "SELECT order_id FROM order_index WHERE book_id = ?",
  ).get(bookId) as { order_id: string } | undefined;
  return row?.order_id;
}

export async function saveOrderId(bookId: string, orderId: string): Promise<void> {
  db.prepare(`
    INSERT INTO order_index (book_id, order_id)
    VALUES (?, ?)
    ON CONFLICT(book_id) DO UPDATE SET order_id = excluded.order_id
  `).run(bookId, orderId);
}
