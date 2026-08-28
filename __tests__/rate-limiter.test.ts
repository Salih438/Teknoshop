import { describe, it, expect } from "vitest";
import { getClientIdentifier, checkRateLimit } from "@/lib/rate-limiter";

describe("Rate Limiter & Client Identifier Security", () => {
  describe("getClientIdentifier", () => {
    it("should prioritize authenticated userId over headers", () => {
      const req = new Request("https://example.com/api/test", {
        headers: {
          "x-real-ip": "1.2.3.4",
          "x-forwarded-for": "5.6.7.8",
        },
      });
      expect(getClientIdentifier(req, "user_123")).toBe("user:user_123");
    });

    it("should extract valid x-real-ip when user is unauthenticated", () => {
      const req = new Request("https://example.com/api/test", {
        headers: {
          "x-real-ip": "198.51.100.1",
        },
      });
      expect(getClientIdentifier(req)).toBe("ip:198.51.100.1");
    });

    it("should extract valid cf-connecting-ip or x-vercel-ip", () => {
      const vercelReq = new Request("https://example.com/api/test", {
        headers: {
          "x-vercel-ip": "203.0.113.195",
        },
      });
      expect(getClientIdentifier(vercelReq)).toBe("ip:203.0.113.195");

      const cfReq = new Request("https://example.com/api/test", {
        headers: {
          "cf-connecting-ip": "192.0.2.1",
        },
      });
      expect(getClientIdentifier(cfReq)).toBe("ip:192.0.2.1");
    });

    it("should parse primary IP from x-forwarded-for list and reject invalid spoofed strings", () => {
      const multiHopReq = new Request("https://example.com/api/test", {
        headers: {
          "x-forwarded-for": "198.51.100.25, 10.0.0.1, 172.16.0.1",
        },
      });
      expect(getClientIdentifier(multiHopReq)).toBe("ip:198.51.100.25");

      const spoofedReq = new Request("https://example.com/api/test", {
        headers: {
          "x-forwarded-for": "malicious<script>alert(1)</script>",
        },
      });
      expect(getClientIdentifier(spoofedReq)).toBe("ip:anonymous");
    });

    it("should fallback to anonymous when no valid IP headers are found", () => {
      const bareReq = new Request("https://example.com/api/test");
      expect(getClientIdentifier(bareReq)).toBe("ip:anonymous");
    });
  });

  describe("checkRateLimit (In-Memory Token Window Bucket)", () => {
    it("should allow requests under the limit and decrement remaining count", async () => {
      const testId = `test-user-${Date.now()}`;
      const config = { limit: 5, windowSeconds: 60 };

      const res1 = await checkRateLimit(testId, config);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(4);
      expect(res1.limit).toBe(5);

      const res2 = await checkRateLimit(testId, config);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(3);
    });

    it("should block requests when limit is exhausted", async () => {
      const testId = `test-exhaust-${Date.now()}`;
      const config = { limit: 2, windowSeconds: 60 };

      const res1 = await checkRateLimit(testId, config);
      expect(res1.success).toBe(true);

      const res2 = await checkRateLimit(testId, config);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(0);

      const res3 = await checkRateLimit(testId, config);
      expect(res3.success).toBe(false);
      expect(res3.remaining).toBe(0);
    });
  });
});
