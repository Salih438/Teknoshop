import { Prisma } from "@prisma/client";
import { CheckoutError } from "@/lib/services/checkout.service";
import { AuthError } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Veritabanı ve Prisma dahili hata tiplerini tespit eder
 */
export function isPrismaError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    return true;
  }

  if (error && typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    const name = typeof errObj.name === "string" ? errObj.name : "";
    const code = typeof errObj.code === "string" ? errObj.code : "";

    if (name.startsWith("PrismaClient") || (code.startsWith("P") && code.length >= 4)) {
      return true;
    }
  }

  return false;
}

/**
 * JavaScript çalışma zamanı motor hatalarını (TypeError, SyntaxError vb.) tespit eder
 */
export function isSystemEngineError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    error instanceof ReferenceError ||
    error instanceof SyntaxError ||
    error instanceof RangeError ||
    error instanceof URIError
  );
}

/**
 * Hata mesajının veritabanı sorgusu, dosya yolu veya yığın izi gibi hassas bilgiler içerip içermediğini denetler
 */
export function containsSensitiveLeak(message: string): boolean {
  const lowercase = message.toLowerCase();
  const sensitivePatterns = [
    "prisma",
    "invocation",
    "foreign key",
    "constraint",
    "unique constraint",
    "node_modules",
    "at async",
    "at object",
    "select ",
    "update ",
    "delete from",
    "insert into",
    "table",
    "column",
    "relation",
    "p200",
    "p201",
    "p202",
  ];

  return sensitivePatterns.some((pattern) => lowercase.includes(pattern));
}

/**
 * Prisma hatalarını güvenli ve kullanıcı dostu mesaj/durum kodlarına dönüştürür
 */
function getPrismaSafeResponse(error: unknown): { message: string; status: number } {
  const code = (error as { code?: string })?.code;

  switch (code) {
    case "P2002":
      return {
        message: "Bu kayıt zaten mevcut veya kullanılıyor.",
        status: 409,
      };
    case "P2003":
      return {
        message: "İlişkili kayıtlar nedeniyle bu işlem gerçekleştirilemez.",
        status: 400,
      };
    case "P2025":
      return {
        message: "İstenen kayıt bulunamadı.",
        status: 404,
      };
    default:
      if (error instanceof Prisma.PrismaClientValidationError) {
        return {
          message: "Geçersiz veri formatı gönderildi.",
          status: 400,
        };
      }
      return {
        message: "Veritabanı işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.",
        status: 500,
      };
  }
}

/**
 * Her türlü yakalanan hatayı analiz eder, hassas bilgileri filtreler ve
 * istemciye güvenli mesaj ve HTTP durum kodu döndürür.
 */
export function getSafeErrorMessage(
  error: unknown,
  fallbackMessage: string = "İşlem sırasında bir hata oluştu."
): { message: string; status: number } {
  // 1. Bilinen Uygulama Düzeyi Tip Hataları (CheckoutError, InsufficientStockError vb.)
  if (error instanceof CheckoutError) {
    return {
      message: error.message,
      status: error.status || 400,
    };
  }

  // 2. Yetkilendirme Hataları (AuthError)
  if (error instanceof AuthError) {
    return {
      message: error.message,
      status: error.status || 401,
    };
  }

  // 3. Prisma ve Veritabanı Hataları — Sunucuda tam logla, istemciye jenerik güvenli mesaj dön
  if (isPrismaError(error)) {
    console.error("[BE-05 Sanitized Database Error]:", error);
    return getPrismaSafeResponse(error);
  }

  // 4. JavaScript Motor Hataları (TypeError, ReferenceError vb.) — Sunucuda logla, istemciye fallback dön
  if (isSystemEngineError(error)) {
    console.error("[BE-05 Sanitized System Runtime Error]:", error);
    return {
      message: fallbackMessage,
      status: 500,
    };
  }

  // 5. Standart JavaScript Error — İçerik hassasiyet denetimi
  if (error instanceof Error) {
    if (containsSensitiveLeak(error.message)) {
      console.error("[BE-05 Sanitized Leaking Error Message]:", error);
      return {
        message: fallbackMessage,
        status: 500,
      };
    }

    // Güvenli iş mantığı mesajı (örn. "Sipariş bulunamadı", "Yalnızca teslim edilmiş siparişler...")
    return {
      message: error.message,
      status: 400,
    };
  }

  // 6. Bilinmeyen/Öngörülemeyen Nesneler
  console.error("[BE-05 Sanitized Unknown Error]:", error);
  return {
    message: fallbackMessage,
    status: 500,
  };
}

/**
 * Server Action'lar için standartlaştırılmış güvenli hata dönüşü:
 * { success: false, error: string }
 */
export function formatActionError(
  error: unknown,
  fallbackMessage: string = "İşlem sırasında bir hata oluştu."
): { success: false; error: string } {
  const { message } = getSafeErrorMessage(error, fallbackMessage);
  return { success: false, error: message };
}

/**
 * Next.js Route Handler'lar (API Routes) için standartlaştırılmış güvenli HTTP dönüşü:
 * NextResponse.json({ error: string }, { status: number })
 */
export function formatApiError(
  error: unknown,
  fallbackMessage: string = "İşlem sırasında bir hata oluştu."
): NextResponse {
  const { message, status } = getSafeErrorMessage(error, fallbackMessage);
  return NextResponse.json({ error: message }, { status });
}
