// SQLite database initialization.
//
// Opens (or creates) the database at DATA_DIR/sweetgift.db and ensures the
// schema exists.  All writes are synchronous (better-sqlite3 API) which is
// fine for a single-process server — SQLite WAL mode handles concurrent reads.
//
// Schema notes:
//   - moments, generated_pages, and cover_decorations are stored as JSON strings.
//     This avoids extra tables for an MVP while still being fully queryable.
//   - cover_decorations_json stores the sticker/decoration overlay applied to the
//     album cover. Each decoration: { id, type, value, x, y, scale, rotate }.
//   - order_index keeps the bookId→orderId mapping that the Orders route needs
//     for idempotency even when the matching draft is missing.
//   - created_at is a millisecond timestamp set by the application (Date.now())
//     on INSERT.  Using application time instead of SQLite's unixepoch() gives
//     millisecond resolution, which matters for ordering in fast test sequences.

import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function resolveDbPath(): string {
  if (process.env.DATA_DIR) {
    return resolve(process.env.DATA_DIR, "sweetgift.db");
  }
  return resolve(__dirname, "../../data/sweetgift.db");
}

function openDatabase(): Database.Database {
  const dbPath = resolveDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });

  const database = new Database(dbPath);

  // WAL mode: concurrent readers don't block the single writer.
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  database.exec(`
    CREATE TABLE IF NOT EXISTS drafts (
      draft_id              TEXT    PRIMARY KEY,
      status                TEXT    NOT NULL DEFAULT 'draft',
      anniversary_type      TEXT    NOT NULL,
      anniversary_date      TEXT    NOT NULL,
      sender_name           TEXT    NOT NULL,
      receiver_name         TEXT    NOT NULL,
      title                 TEXT    NOT NULL,
      subtitle              TEXT    NOT NULL,
      letter                TEXT    NOT NULL,
      cover_photo_url          TEXT    NOT NULL,
      moments_json             TEXT    NOT NULL,
      generated_pages_json     TEXT    NOT NULL,
      cover_decorations_json   TEXT,
      book_id                  TEXT,
      order_id                 TEXT,
      created_at               INTEGER NOT NULL  -- milliseconds since epoch, set by application
    );

    CREATE TABLE IF NOT EXISTS order_index (
      book_id   TEXT PRIMARY KEY,
      order_id  TEXT NOT NULL
    );
  `);

  // Migrate existing databases: add cover_decorations_json if it doesn't exist yet.
  // SQLite ALTER TABLE does not support IF NOT EXISTS — use try/catch instead.
  // This is safe: the only error thrown here is "duplicate column name".
  try {
    database.exec(`ALTER TABLE drafts ADD COLUMN cover_decorations_json TEXT`);
  } catch {
    // column already present — no-op
  }

  return database;
}

export const db = openDatabase();
