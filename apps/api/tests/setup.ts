// Jest setup file — runs before each test module is loaded.
// Must set env vars here because ESM imports are hoisted and env.ts
// calls process.exit(1) on startup if required vars are missing.
process.env.SWEETBOOK_API_KEY = "sk_test_dummy";
process.env.SWEETBOOK_MOCK = "true";
process.env.CORS_ORIGIN = "http://localhost:3000";
