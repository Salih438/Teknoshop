"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import {
  submitReview,
  deleteReview,
  getPaginatedProductReviews,
  ReviewSortOption,
} from "@/actions/review";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface ProductReviewsProps {
  productId: string;
}

type PaginatedData = Awaited<ReturnType<typeof getPaginatedProductReviews>>;
type ReviewItem = PaginatedData["reviews"][number];

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // State Management
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination & Filter States
  const [currentPage, setCurrentPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<ReviewSortOption>("newest");
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [grandTotalCount, setGrandTotalCount] = useState(0);
  const [averageRating, setAverageRating] = useState("0.0");
  const [distribution, setDistribution] = useState<
    { star: number; count: number; percentage: number }[]
  >([
    { star: 5, count: 0, percentage: 0 },
    { star: 4, count: 0, percentage: 0 },
    { star: 3, count: 0, percentage: 0 },
    { star: 2, count: 0, percentage: 0 },
    { star: 1, count: 0, percentage: 0 },
  ]);

  // Form State
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch reviews from server action
  const loadReviewsData = useCallback(
    async (pageToLoad: number, append = false, isInitial = false) => {
      if (isInitial) setLoading(true);
      else setListLoading(true);

      try {
        const res = await getPaginatedProductReviews({
          productId,
          page: pageToLoad,
          limit: 10,
          ratingFilter,
          sortBy,
        });

        if (append) {
          setReviews((prev) => [...prev, ...res.reviews]);
        } else {
          setReviews(res.reviews);
        }

        setHasMore(res.hasMore);
        setTotalCount(res.totalCount);
        setGrandTotalCount(res.grandTotalCount);
        setAverageRating(res.averageRating);
        setDistribution(res.distribution);

        // Pre-fill user review if present
        if (res.hasUserReviewed && res.userReviewData && isInitial) {
          setRating(res.userReviewData.rating);
          setComment(res.userReviewData.comment);
          setIsEditing(true);
        }
      } catch (error) {
        console.error("Yorumlar yüklenirken hata:", error);
      } finally {
        setLoading(false);
        setListLoading(false);
      }
    },
    [productId, ratingFilter, sortBy]
  );

  // Trigger fetch when productId, ratingFilter, or sortBy changes
  useEffect(() => {
    setCurrentPage(1);
    loadReviewsData(1, false, true);
  }, [loadReviewsData]);

  // Load More button click handler
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadReviewsData(nextPage, true, false);
  };

  // Form Submit Handler
  const handleSubmit = async () => {
    if (rating === 0 || comment.length < 10) {
      toast.error("Lütfen puan verin ve en az 10 karakterlik bir yorum yazın.");
      return;
    }
    setSubmitting(true);
    const result = await submitReview(productId, { rating, comment });

    if (result.success) {
      toast.success(
        isEditing
          ? "Değerlendirmeniz başarıyla güncellendi!"
          : "Değerlendirmeniz için teşekkürler!"
      );
      setIsEditing(true);
      setCurrentPage(1);
      loadReviewsData(1, false, false);
    } else {
      toast.error(result.error || "Bir hata oluştu.");
    }
    setSubmitting(false);
  };

  // Delete Review Handler
  const handleDelete = async () => {
    setSubmitting(true);
    const result = await deleteReview(productId);

    if (result.success) {
      toast.success("Yorumunuz başarıyla kaldırıldı.");
      setRating(0);
      setComment("");
      setIsEditing(false);
      setCurrentPage(1);
      loadReviewsData(1, false, false);
    } else {
      toast.error(result.error || "Silme işlemi başarısız.");
    }
    setSubmitting(false);
  };

  const handleResetFilters = () => {
    setRatingFilter(null);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const formatDate = (dateString: string | Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return new Date(dateString).toLocaleDateString("tr-TR", options);
  };

  // Star Icon SVG
  const StarIcon = ({
    filled,
    className = "w-5 h-5",
  }: {
    filled: boolean;
    className?: string;
  }) => (
    <svg
      className={`${className} ${filled ? "text-amber-400" : "text-gray-200"}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  // Initial Loading Skeleton
  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-12 animate-pulse">
        <div className="lg:w-1/3 space-y-8">
          <div className="h-64 bg-gray-100 rounded-3xl"></div>
          <div className="h-72 bg-gray-100 rounded-3xl"></div>
        </div>
        <div className="lg:w-2/3 space-y-6">
          <div className="h-12 w-full bg-gray-100 rounded-2xl"></div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 bg-gray-50 border border-gray-100 rounded-3xl"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
      {/* SOL TARAF: İSTATİSTİKLER VE YORUM FORMU */}
      <div className="lg:w-1/3 space-y-8">
        {/* Ortalama ve Histogram Alanı */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-5 mb-8 border-b border-gray-100 pb-6">
            <span className="text-6xl font-black text-gray-900 tracking-tighter">
              {averageRating}
            </span>
            <div className="flex flex-col">
              <div className="flex mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    filled={star <= Math.round(Number(averageRating))}
                    className="w-5 h-5"
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {grandTotalCount} Değerlendirme
              </span>
            </div>
          </div>

          {/* Histogram Bar Chart — Interactive Click to Filter */}
          <div className="space-y-3">
            {distribution.map((item) => (
              <button
                key={item.star}
                type="button"
                onClick={() =>
                  setRatingFilter((prev) => (prev === item.star ? null : item.star))
                }
                className={`w-full flex items-center gap-4 text-sm group p-1.5 rounded-xl transition-colors text-left ${
                  ratingFilter === item.star
                    ? "bg-blue-50/70 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-1 w-12 text-gray-700 font-bold flex-shrink-0">
                  {item.star}{" "}
                  <StarIcon
                    filled={true}
                    className="w-3.5 h-3.5 text-amber-400"
                  />
                </div>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="w-10 text-right text-gray-500 font-bold text-xs flex-shrink-0">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Yorum Yapma / Düzenleme Formu */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 bg-gray-50/50 border-b border-gray-100">
            <h3 className="text-lg font-extrabold text-gray-900">
              {isEditing ? "Değerlendirmeni Düzenle" : "Değerlendirme Yaz"}
            </h3>
          </div>

          <div className="p-6">
            {isSignedIn ? (
              <div>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Ürüne Puanın
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="focus:outline-none transition-transform hover:scale-110"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setRating(star)}
                      >
                        <StarIcon
                          filled={star <= (hoveredStar || rating)}
                          className="w-8 h-8 transition-colors"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Deneyimini Paylaş (En az 10 karakter)
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none transition-shadow shadow-sm bg-gray-50 focus:bg-white text-sm"
                    placeholder="Bu ürün hakkındaki düşünceleriniz nelerdir?"
                  ></textarea>
                  <div className="text-right text-[11px] text-gray-400 mt-1 font-medium">
                    {comment.length} / 1000
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={rating === 0 || comment.trim().length < 10 || submitting}
                  className="w-full bg-blue-600 text-white font-extrabold py-3.5 px-4 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2 text-sm"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                      İşleniyor...
                    </>
                  ) : isEditing ? (
                    "Güncelle"
                  ) : (
                    "Gönder"
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <p className="text-gray-900 font-bold mb-2">Deneyiminizi Paylaşın</p>
                <p className="text-sm text-gray-500 mb-6">
                  Değerlendirme yapabilmek için hesabınıza giriş yapmanız
                  gerekmektedir.
                </p>
                <a
                  href="/sign-in"
                  className="inline-block w-full bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors shadow-sm text-sm"
                >
                  Giriş Yap / Kayıt Ol
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SAĞ TARAF: YAPILAN YORUMLAR LİSTESİ, FİLTRE VE SIRALAMA */}
      <div className="lg:w-2/3 flex flex-col space-y-6">
        {/* 🚀 1. REVISED SINGLE-LINE FILTER & SORT BAR */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
              Filtrele:
            </span>
            <button
              type="button"
              onClick={() => setRatingFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                ratingFilter === null
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Tümü ({grandTotalCount})
            </button>
            {[5, 4, 3, 2, 1].map((star) => {
              const item = distribution.find((d) => d.star === star);
              const isActive = ratingFilter === star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setRatingFilter((prev) => (prev === star ? null : star))
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm font-semibold"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <span>{star}</span>
                  <StarIcon
                    filled={true}
                    className={`w-3.5 h-3.5 ${isActive ? "text-amber-300" : "text-amber-400"}`}
                  />
                  <span className={`text-[10px] ${isActive ? "text-blue-100" : "text-gray-400"}`}>
                    ({item?.count || 0})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Sırala:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ReviewSortOption)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="highest">En Yüksek Puan</option>
              <option value="lowest">En Düşük Puan</option>
            </select>
          </div>
        </div>

        {/* 🚀 2. ELEGANT & SEAMLESS ACTIVE FILTER INDICATOR */}
        {ratingFilter !== null && (
          <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200/80 px-4 py-2.5 rounded-2xl text-xs font-medium text-blue-900 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                ★
              </span>
              <span>
                Yalnızca <strong>{ratingFilter} Yıldız</strong> verilen yorumlar gösteriliyor ({totalCount} adet)
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Filtreyi Kaldır</span>
              <span className="text-sm font-bold">✕</span>
            </button>
          </div>
        )}

        {/* SKELETON CARDS LOADING (FILTERS / SORTING CHANGE) */}
        {listLoading && reviews.length === 0 ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 bg-gray-50 border border-gray-100 rounded-2xl"
              ></div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          /* EMPTY STATE */
          <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-900 font-bold text-lg">
              {ratingFilter !== null
                ? "Seçilen filtreye uygun değerlendirme bulunamadı."
                : "Henüz değerlendirme yapılmamış."}
            </p>
            <p className="text-gray-500 text-sm mt-1 mb-6 max-w-md">
              {ratingFilter !== null
                ? "Farklı bir yıldız filtresi seçebilir veya tüm yorumları görüntüleyebilirsiniz."
                : "Bu ürün için ilk yorumu siz yazın ve diğer kullanıcılara rehberlik edin!"}
            </p>
            {ratingFilter !== null && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-gray-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl hover:bg-black transition-colors"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          /* 🚀 3. REFINED REVIEW ITEM CARD LIST */
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-5 bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-5"
              >
                {/* Sol Profil Alanı */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:w-44 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Image
                        src={
                          review.user?.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            review.user?.name || "User"
                          )}&background=random`
                        }
                        alt={review.user?.name || "User"}
                        className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                        width={100}
                        height={100}
                      />
                      {review.isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-xs">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {review.user?.name || "İsimsiz Kullanıcı"}
                      </span>
                      {review.isVerified && (
                        <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">
                          Doğrulanmış Alıcı
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sağ Yorum İçeriği */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-50">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          filled={star <= review.rating}
                          className="w-4 h-4"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                    {review.comment}
                  </p>

                  {/* Alt Etkileşim Çubuğu (Kullanıcının Kendi Yorumu) */}
                  {review.isOwnReview && (
                    <div className="mt-3 pt-3 flex items-center justify-between gap-3 border-t border-gray-50">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[11px] font-bold tracking-wide uppercase">
                        Sizin Yorumunuz
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={submitting}
                        className="text-gray-400 hover:text-red-600 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        {submitting ? "Siliniyor..." : "Sil"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* DAHA FAZLA YÜKLE / SKELETON PAGINATION CONTROL */}
            {hasMore && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={listLoading}
                  className="bg-white border border-gray-200 text-gray-900 font-extrabold py-3.5 px-8 rounded-2xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-2 text-sm cursor-pointer"
                >
                  {listLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-gray-900"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                      Daha Fazla Yorum Yükleniyor...
                    </>
                  ) : (
                    `Daha Fazla Yorum Göster (${reviews.length} / ${totalCount})`
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Yorum Silme Onay Modalı */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Yorumu Sil"
        description="Bu yorumu silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
        isLoading={submitting}
      />
    </div>
  );
}