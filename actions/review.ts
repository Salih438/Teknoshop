"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const COMMENT_MIN_LENGTH = 10;
const COMMENT_MAX_LENGTH = 1000;

// ---------------------------------------------------------------------------
// VALIDATION SCHEMA
// ---------------------------------------------------------------------------

const reviewInputSchema = z.object({
  rating: z
    .number({ message: "Puan sayı olmalıdır." })
    .int({ message: "Puan tam sayı olmalıdır." })
    .min(1, { message: "Puan en az 1 olmalıdır." })
    .max(5, { message: "Puan en fazla 5 olabilir." }),
  comment: z
    .string({ message: "Yorum metin olmalıdır." })
    .trim()
    .min(COMMENT_MIN_LENGTH, {
      message: `Yorum en az ${COMMENT_MIN_LENGTH} karakter olmalıdır.`,
    })
    .max(COMMENT_MAX_LENGTH, {
      message: `Yorum en fazla ${COMMENT_MAX_LENGTH} karakter olabilmektedir.`,
    }),
});

type ReviewInput = z.infer<typeof reviewInputSchema>;

export type ReviewSortOption = "newest" | "oldest" | "highest" | "lowest";

export interface GetPaginatedReviewsParams {
  productId: string;
  page?: number;
  limit?: number;
  ratingFilter?: number | null;
  sortBy?: ReviewSortOption;
}

// ---------------------------------------------------------------------------
// HELPER — Resolve the current Clerk user to a DB user record.
// Returns null if the caller is unauthenticated or has no matching DB record.
// ---------------------------------------------------------------------------

async function resolveDbUser() {
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;

  if (!clerkUser || !email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

// ---------------------------------------------------------------------------
// 1. SUBMIT (CREATE OR UPDATE) A REVIEW
// ---------------------------------------------------------------------------

export async function submitReview(
  productId: string,
  data: ReviewInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // --- Authentication ---
    const dbUser = await resolveDbUser();
    if (!dbUser) {
      return { success: false, error: "Yorum eklemek için giriş yapmanız gerekmektedir." };
    }

    // --- Server-side validation (never trust the client) ---
    const parsed = reviewInputSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Geçersiz yorum verisi.";
      return { success: false, error: firstError };
    }

    // Sanitize: collapse runs of whitespace, trim edges
    const sanitizedComment = parsed.data.comment
      .trim()
      .replace(/\s{2,}/g, " ");

    const { rating } = parsed.data;

    // --- Product existence check (prevents IDOR / orphaned reviews) ---
    const productExists = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      select: { id: true },
    });
    if (!productExists) {
      return { success: false, error: "Ürün bulunamadı." };
    }

    // --- Verified purchase check ---
    const deliveredOrder = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: dbUser.id,
          status: "DELIVERED",
        },
      },
      select: { id: true },
    });

    const isVerified = Boolean(deliveredOrder);

    // --- Upsert (create or update) ---
    await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: dbUser.id,
          productId,
        },
      },
      update: {
        rating,
        comment: sanitizedComment,
        isVerified,
      },
      create: {
        userId: dbUser.id,
        productId,
        rating,
        comment: sanitizedComment,
        isVerified,
      },
    });

    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (error) {
    // Never leak internal error details to the client
    console.error("[submitReview] Hata:", error);
    return { success: false, error: "İşlem sırasında bir hata oluştu." };
  }
}

// ---------------------------------------------------------------------------
// 2. FETCH PAGINATED & FILTERED REVIEWS FOR A PRODUCT (SERVER-SIDE)
// ---------------------------------------------------------------------------

export async function getPaginatedProductReviews({
  productId,
  page = 1,
  limit = 10,
  ratingFilter = null,
  sortBy = "newest",
}: GetPaginatedReviewsParams) {
  try {
    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, Math.min(50, limit));
    const skip = (pageNum - 1) * limitNum;

    // Resolve current user for ownership flag
    const dbUser = await resolveDbUser();
    const currentUserId = dbUser?.id || null;

    // 1. Unfiltered product stats & rating histogram
    const allReviews = await prisma.review.findMany({
      where: { productId, isHidden: false },
      select: { rating: true, userId: true, comment: true },
    });

    const grandTotalCount = allReviews.length;
    const averageRating =
      grandTotalCount > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / grandTotalCount).toFixed(1)
        : "0.0";

    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = allReviews.filter((r) => r.rating === star).length;
      const percentage = grandTotalCount > 0 ? Math.round((count / grandTotalCount) * 100) : 0;
      return { star, count, percentage };
    });

    // Determine if current user has already reviewed
    const currentUserReview = currentUserId
      ? allReviews.find((r) => r.userId === currentUserId)
      : null;

    // 2. Build filtered WHERE clause
    const whereClause: { productId: string; isHidden: boolean; rating?: number } = {
      productId,
      isHidden: false,
    };

    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      whereClause.rating = ratingFilter;
    }

    // 3. Build ORDER BY clause
    let orderByClause: Record<string, "asc" | "desc">[] = [{ createdAt: "desc" }];
    if (sortBy === "oldest") {
      orderByClause = [{ createdAt: "asc" }];
    } else if (sortBy === "highest") {
      orderByClause = [{ rating: "desc" }, { createdAt: "desc" }];
    } else if (sortBy === "lowest") {
      orderByClause = [{ rating: "asc" }, { createdAt: "desc" }];
    }

    // 4. Query paginated reviews & total filtered count
    const [filteredCount, reviewRecords] = await Promise.all([
      prisma.review.count({ where: whereClause }),
      prisma.review.findMany({
        where: whereClause,
        select: {
          id: true,
          rating: true,
          comment: true,
          isVerified: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: orderByClause,
        skip,
        take: limitNum,
      }),
    ]);

    const totalPages = Math.ceil(filteredCount / limitNum) || 1;
    const hasMore = pageNum < totalPages;

    const reviews = reviewRecords.map((r) => ({
      ...r,
      isOwnReview: currentUserId ? r.user?.id === currentUserId : false,
    }));

    return {
      reviews,
      totalCount: filteredCount,
      grandTotalCount,
      page: pageNum,
      totalPages,
      hasMore,
      averageRating,
      distribution,
      hasUserReviewed: Boolean(currentUserReview),
      userReviewData: currentUserReview ? { rating: currentUserReview.rating, comment: currentUserReview.comment } : null,
    };
  } catch (error) {
    console.error("[getPaginatedProductReviews] Hata:", error);
    return {
      reviews: [],
      totalCount: 0,
      grandTotalCount: 0,
      page: 1,
      totalPages: 1,
      hasMore: false,
      averageRating: "0.0",
      distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, percentage: 0 })),
      hasUserReviewed: false,
      userReviewData: null,
    };
  }
}

// ---------------------------------------------------------------------------
// 3. FETCH REVIEWS FOR A PRODUCT (LEGACY FOR BACKWARD COMPATIBILITY)
// ---------------------------------------------------------------------------

export async function getProductReviews(productId: string) {
  try {
    return await prisma.review.findMany({
      where: { productId, isHidden: false },
      select: {
        id: true,
        rating: true,
        comment: true,
        isVerified: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[getProductReviews] Hata:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 4. DELETE A REVIEW
// ---------------------------------------------------------------------------

export async function deleteReview(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // --- Authentication ---
    const dbUser = await resolveDbUser();
    if (!dbUser) {
      return { success: false, error: "Giriş yapmanız gerekmektedir." };
    }

    await prisma.review.delete({
      where: {
        userId_productId: {
          userId: dbUser.id,
          productId,
        },
      },
    });

    revalidatePath(`/products/${productId}`);
    return { success: true };
  } catch (error) {
    console.error("[deleteReview] Hata:", error);
    return { success: false, error: "Yorum silinemedi, lütfen tekrar deneyin." };
  }
}