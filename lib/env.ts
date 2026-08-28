import { z } from "zod";

const isTest = process.env.NODE_ENV === "test";

const serverSchema = z.object({
  DATABASE_URL: isTest
    ? z.string().default("postgresql://test:test@localhost:5432/test")
    : z.string().min(1, "DATABASE_URL is required"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLERK_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Teknoshop <onboarding@resend.dev>"),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().default("https://vitrin.com"),
  NEXT_PUBLIC_STORE_NAME: z.string().default("TEKNOSHOP TEKNOLOJİ A.Ş."),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

const isServer = typeof window === "undefined";

let serverEnv: Partial<ServerEnv> = {};

if (isServer) {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid server environment variables:", parsed.error.format());
    throw new Error("Invalid server environment variables. Please check your .env file.");
  }
  serverEnv = parsed.data;
}

const clientParsed = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_STORE_NAME: process.env.NEXT_PUBLIC_STORE_NAME,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

if (!clientParsed.success) {
  console.error("❌ Invalid public environment variables:", clientParsed.error.format());
  throw new Error("Invalid client environment variables. Please check your .env file.");
}

export const env = {
  ...serverEnv,
  ...clientParsed.data,
} as ServerEnv & ClientEnv;
