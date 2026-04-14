// Jest setup file — runs before each test module is loaded.
// Must set env vars here because ESM imports are hoisted and env.ts
// calls process.exit(1) on startup if required vars are missing.

import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// Isolate each test run to a fresh temp directory.
// Prevents test runs from writing to apps/api/data/drafts.json and
// prevents cross-test contamination from leftover store state.
const testDataDir = mkdtempSync(join(tmpdir(), "sweetgift-test-"));
process.env.DATA_DIR = testDataDir;

process.env.SWEETBOOK_API_KEY = "sk_test_dummy";
process.env.SWEETBOOK_MOCK = "true";
process.env.CORS_ORIGIN = "http://localhost:3000";
