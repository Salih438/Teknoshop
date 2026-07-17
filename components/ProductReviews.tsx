"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { submitReview, getProductReviews, deleteReview } from "@/actions/review";

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State'leri
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Verileri Çek
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await getProductReviews(productId);
      setReviews(data || []);
      
      // Kullanıcı daha önce yorum yaptıysa formda göster (Düzenleme Modu)
      if (user && data) {
        // Clerk kullanıcısının e-postasını alıyoruz
        const userEmail = user.primaryEmailAddress?.emailAddress; 
        
        // Yorumun sahibinin e-postası ile karşılaştırıyoruz
        const existingReview = data.find((r: any) => r.user?.email === userEmail);
        
        if (existingReview) {
          setRating(existingReview.rating);
          setComment(existingReview.comment || "");
          setIsEditing(true);
        }
      }
    } catch (error) {
      console.error("Yorumlar çekilirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, user]);

  // Form Gönderme İşlemi
  const handleSubmit = async () => {
    if (rating === 0 || comment.length < 5) {
      toast.error("Lütfen puan verin ve en az 5 karakterlik bir yorum yazın.");
      return;
    }
    setSubmitting(true);
    const result = await submitReview(productId, { rating, comment });
    
    if (result.success) {
      toast.success(isEditing ? "Yorumunuz güncellendi! ✏️" : "Yorumunuz paylaşıldı! 🚀");
      setIsEditing(true);
      fetchReviews(); // Listeyi yenile
    } else {
      toast.error(result.error || "Bir hata oluştu.");
    }
    setSubmitting(false);
  };

  // Yorum Silme İşlemi
  const handleDelete = async () => {
    if (!confirm("Yorumunuzu silmek istediğinize emin misiniz?")) return;
    
    setSubmitting(true);
    const result = await deleteReview(productId);
    
    if (result.success) {
      toast.success("Yorumunuz başarıyla silindi. 🗑️");
      // Formu sıfırla
      setRating(0);
      setComment("");
      setIsEditing(false);
      fetchReviews(); // Listeyi yenile
    } else {
      toast.error(result.error || "Silme işlemi başarısız.");
    }
    setSubmitting(false);
  };

  // İstatistik Hesaplamaları
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  const distribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { star, count, percentage };
  });

  // Tarih Formatlayıcı
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  if (loading) {
    return <div className="animate-pulse flex gap-12 h-64 bg-gray-50 rounded-2xl"></div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      
      {/* SOL TARAF: İSTATİSTİKLER VE YORUM FORMU */}
      <div className="lg:w-1/3 space-y-8">
        
        {/* Ortalama ve Histogram Alanı */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl font-extrabold text-gray-900">{averageRating}</span>
            <div className="flex flex-col">
              <div className="flex text-yellow-400 text-xl">
                {[1,2,3,4,5].map(star => (
                  <span key={star}>{star <= Math.round(Number(averageRating)) ? "★" : "☆"}</span>
                ))}
              </div>
              <span className="text-sm text-gray-500 font-medium">{totalReviews} Değerlendirme</span>
            </div>
          </div>

          <div className="space-y-3">
            {distribution.map((item) => (
              <div key={item.star} className="flex items-center gap-3 text-sm">
                <span className="w-12 font-medium text-gray-600">{item.star} Yıldız</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 rounded-full transition-all duration-1000"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="w-8 text-right text-gray-500 text-xs">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Yorum Yapma / Düzenleme Formu */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {isEditing ? "Değerlendirmeni Düzenle" : "Değerlendirme Yaz"}
          </h3>
          
          {isSignedIn ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Puanınız</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none transition-transform hover:scale-110"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                    >
                      <span className={`text-3xl ${star <= (hoveredStar || rating) ? 'text-yellow-400' : 'text-gray-200'}`}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Yorumunuz</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none transition-all"
                  placeholder="Ürün hakkındaki deneyimlerinizi paylaşın..."
                ></textarea>
              </div>

              <button 
                type="button"
                onClick={handleSubmit}
                disabled={rating === 0 || comment.length < 5 || submitting}
                className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "İşleniyor..." : (isEditing ? "Yorumu Güncelle" : "Yorumu Gönder")}
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
              <p className="text-blue-800 font-medium mb-4">Yorum yapabilmek için giriş yapmalısınız.</p>
              <a href="/sign-in" className="inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                Giriş Yap
              </a>
            </div>
          )}
        </div>
      </div>

      {/* SAĞ TARAF: YAPILAN YORUMLAR LİSTESİ */}
      <div className="lg:w-2/3">
        <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
          Müşteri Değerlendirmeleri ({totalReviews})
        </h3>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500">
            Henüz yorum yapılmamış. İlk değerlendiren siz olun!
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row gap-5 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                
                {/* Sol Profil Alanı */}
                <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:w-48 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <img 
                      src={review.user?.avatarUrl || `https://ui-avatars.com/api/?name=${review.user?.name || 'User'}&background=random`} 
                      alt={review.user?.name || 'User'} 
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm">{review.user?.name || 'İsimsiz Kullanıcı'}</span>
                      {review.isVerified && (
                        <span className="text-[11px] font-bold text-green-600 flex items-center gap-1 mt-0.5">
                          ✅ Doğrulanmış Satın Alma
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Sağ Yorum İçeriği */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-yellow-400 text-lg">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>{star <= review.rating ? "★" : "☆"}</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-400 font-medium flex items-center gap-1">
                      📅 {formatDate(review.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                    {review.comment}
                  </p>

                  {/* Alt Etkileşim Çubuğu */}
                  {user?.primaryEmailAddress?.emailAddress === review.user?.email && (
                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-end gap-3">
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        Sizin Yorumunuz
                      </span>
                      <button 
                        onClick={handleDelete}
                        disabled={submitting}
                        className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {submitting ? "Siliniyor..." : "Yorumu Sil"}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}