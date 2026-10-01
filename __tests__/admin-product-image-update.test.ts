import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";

// Mock @clerk/nextjs/server currentUser to return an active SUPER_ADMIN user
vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

import { currentUser } from "@clerk/nextjs/server";
import { PUT } from "@/app/api/admin/products/[id]/route";

describe("Admin Product Cover Image Update (PUT /api/admin/products/[id])", () => {
  let testProduct: any;
  let originalImageUrl: string;
  let adminUser: any;

  beforeAll(async () => {
    // 0. SECURITY GUARD: CANLI/PROD VERİTABANI KORUMASI
    const rawDbUrl = process.env.DATABASE_URL || "";
    let detectedHost = "";
    try {
      detectedHost = new URL(rawDbUrl).hostname;
    } catch {
      // Invalid URL
    }

    const LIVE_PROD_HOSTS = [
      "ep-delicate-hat-asph4gow-pooler.c-4.eu-central-1.aws.neon.tech",
      "ep-delicate-hat-asph4gow.c-4.eu-central-1.aws.neon.tech",
    ];

    if (!detectedHost || LIVE_PROD_HOSTS.includes(detectedHost)) {
      throw new Error(
        `🚨 GÜVENLİK ENGELİ: Testler CANLI veritabanına bağlanamaz! ` +
        `Tespit edilen DATABASE_URL host'u: "${detectedHost || "Bilinmiyor"}". ` +
        `Lütfen .env.test dosyasında izole bir test veritabanı veya Neon test branch'i tanımlayın.`
      );
    }

    // 1. Find or verify an active admin user
    adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
    });

    if (!adminUser) {
      throw new Error("No active ADMIN user found in database for testing.");
    }

    // Mock Clerk currentUser with the real admin's email
    (currentUser as any).mockResolvedValue({
      id: "clerk_test_admin_id",
      emailAddresses: [{ emailAddress: adminUser.email }],
    });

    // 2. Find a test product
    testProduct = await prisma.product.findFirst({
      where: { isActive: true },
      include: { category: true, brand: true },
    });

    if (!testProduct) {
      throw new Error("No product found in database for testing.");
    }

    originalImageUrl = testProduct.imageUrl;
    console.log(`[TEST SETUP] Selected product: "${testProduct.name}" (${testProduct.id})`);
    console.log(`[TEST SETUP] Original imageUrl: "${originalImageUrl}"`);
  });

  afterAll(async () => {
    // Cleanup: restore original imageUrl
    if (testProduct && originalImageUrl) {
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { imageUrl: originalImageUrl },
      });
      console.log(`[TEST CLEANUP] Restored product original imageUrl.`);
    }
  });

  it("Test 1: URL ile ekleme — kapağı harici URL ile günceller ve DB'ye yazar", async () => {
    const newExternalUrl = "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80";

    const formData = new FormData();
    formData.set("name", testProduct.name);
    formData.set("slug", testProduct.slug);
    formData.set("description", testProduct.description || "Test açıklama");
    formData.set("price", String(testProduct.price));
    formData.set("stock", String(testProduct.stock));
    formData.set("categoryId", testProduct.categoryId);
    formData.set("brandId", testProduct.brandId);
    formData.set("imageUrl", newExternalUrl);
    formData.set("isActive", String(testProduct.isActive));

    const req = new Request(`http://localhost:3000/api/admin/products/${testProduct.id}`, {
      method: "PUT",
      body: formData,
    });

    const res = await PUT(req, { params: Promise.resolve({ id: testProduct.id }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.imageUrl).toBe(newExternalUrl);

    // Verify directly from DB
    const dbProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
      select: { imageUrl: true },
    });

    console.log(`[TEST 1 DB VERIFIED] Product.imageUrl in DB: "${dbProduct?.imageUrl}"`);
    expect(dbProduct?.imageUrl).toBe(newExternalUrl);
  });

  it("Test 2: UploadThing ile yükleme — kapağı utfs.io bulut URL'si ile günceller ve DB'ye yazar", async () => {
    const newUploadThingUrl = "https://utfs.io/f/test-cover-image-998877.jpg";

    const formData = new FormData();
    formData.set("name", testProduct.name);
    formData.set("slug", testProduct.slug);
    formData.set("description", testProduct.description || "Test açıklama");
    formData.set("price", String(testProduct.price));
    formData.set("stock", String(testProduct.stock));
    formData.set("categoryId", testProduct.categoryId);
    formData.set("brandId", testProduct.brandId);
    formData.set("imageUrl", newUploadThingUrl);
    formData.set("isActive", String(testProduct.isActive));

    const req = new Request(`http://localhost:3000/api/admin/products/${testProduct.id}`, {
      method: "PUT",
      body: formData,
    });

    const res = await PUT(req, { params: Promise.resolve({ id: testProduct.id }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.imageUrl).toBe(newUploadThingUrl);

    // Verify directly from DB
    const dbProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
      select: { imageUrl: true },
    });

    console.log(`[TEST 2 DB VERIFIED] Product.imageUrl in DB: "${dbProduct?.imageUrl}"`);
    expect(dbProduct?.imageUrl).toBe(newUploadThingUrl);
  });

  it("Test 3: Boş veya geçersiz imageUrl gelirse mevcut görseli silmez ve HTTP 400 döner", async () => {
    // 1. Boş string denemesi
    const emptyFormData = new FormData();
    emptyFormData.set("name", testProduct.name);
    emptyFormData.set("slug", testProduct.slug);
    emptyFormData.set("description", testProduct.description || "Test açıklama");
    emptyFormData.set("price", String(testProduct.price));
    emptyFormData.set("stock", String(testProduct.stock));
    emptyFormData.set("categoryId", testProduct.categoryId);
    emptyFormData.set("brandId", testProduct.brandId);
    emptyFormData.set("imageUrl", ""); // Boş görsel!
    emptyFormData.set("isActive", String(testProduct.isActive));

    const reqEmpty = new Request(`http://localhost:3000/api/admin/products/${testProduct.id}`, {
      method: "PUT",
      body: emptyFormData,
    });

    const resEmpty = await PUT(reqEmpty, { params: Promise.resolve({ id: testProduct.id }) });
    expect(resEmpty.status).toBe(400);

    // 2. Geçersiz URL formatı denemesi
    const invalidFormData = new FormData();
    invalidFormData.set("name", testProduct.name);
    invalidFormData.set("slug", testProduct.slug);
    invalidFormData.set("description", testProduct.description || "Test açıklama");
    invalidFormData.set("price", String(testProduct.price));
    invalidFormData.set("stock", String(testProduct.stock));
    invalidFormData.set("categoryId", testProduct.categoryId);
    invalidFormData.set("brandId", testProduct.brandId);
    invalidFormData.set("imageUrl", "bu-bir-url-degildir"); // Geçersiz!
    invalidFormData.set("isActive", String(testProduct.isActive));

    const reqInvalid = new Request(`http://localhost:3000/api/admin/products/${testProduct.id}`, {
      method: "PUT",
      body: invalidFormData,
    });

    const resInvalid = await PUT(reqInvalid, { params: Promise.resolve({ id: testProduct.id }) });
    expect(resInvalid.status).toBe(400);

    // DB'deki mevcut görselin silinmediğini (Test 2'deki utfs.io görselinin korunduğunu) doğrula
    const dbProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
      select: { imageUrl: true },
    });

    console.log(`[TEST 3 DB VERIFIED] Product.imageUrl NOT deleted/corrupted in DB: "${dbProduct?.imageUrl}"`);
    expect(dbProduct?.imageUrl).toBe("https://utfs.io/f/test-cover-image-998877.jpg");
  });
});
