import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  SWEETBOOK_API_KEY: z.string().min(1, "SWEETBOOK_API_KEY is required"),
  SWEETBOOK_BASE_URL: z
    .string()
    .url("SWEETBOOK_BASE_URL must be a valid URL")
    .default("https://api.sweetbook.io/v1"),
  // When true, SweetBook calls are skipped and mock responses are returned.
  // Set to "true" during local development without a real API key.
  SWEETBOOK_MOCK: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  // Public base URL of this API server. Used to construct upload file URLs.
  // Example: http://localhost:3001  or  https://api.yourdomain.com
  BASE_URL: z.string().url().optional(),
});

function loadEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error(
      "❌ Invalid environment variables:",
      result.error.flatten().fieldErrors,
    );
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export type Env = typeof env;
