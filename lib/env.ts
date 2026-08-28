import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
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

const isServer = typeof window === "undefined";

const serverParsed = isServer ? serverSchema.safeParse(process.env) : { success: true, data: {} as any };
const clientParsed = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_STORE_NAME: process.env.NEXT_PUBLIC_STORE_NAME,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

if (isServer && !serverParsed.success) {
  console.error("❌ Invalid environment variables:", (serverParsed as any).error?.format());
  throw new Error("Invalid server environment variables. Please check your .env file.");
}

if (!clientParsed.success) {
  console.error("❌ Invalid public environment variables:", clientParsed.error.format());
  throw new Error("Invalid client environment variables. Please check your .env file.");
}

export const env = {
  ...(isServer ? (serverParsed as any).data : {}),
  ...clientParsed.data,
} as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
