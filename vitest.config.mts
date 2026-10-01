import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode || "test", process.cwd(), "");

  // Explicitly ensure .env.test takes precedence if present
  const envTestPath = path.resolve(process.cwd(), ".env.test");
  if (fs.existsSync(envTestPath)) {
    const lines = fs.readFileSync(envTestPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const idx = trimmed.indexOf("=");
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        env[key] = val;
      }
    }
  }

  // Ensure process.env is populated for PrismaClient and modules
  Object.assign(process.env, env);

  return {
    test: {
      environment: "node",
      globals: true,
      env,
    },
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./"),
      },
    },
  };
});
