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
        const userEmail = user.primaryEmailAddress?.emailAddress; 
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
      toast.success(isEditing ? "Değerlendirmeniz başarıyla güncellendi!" : "Değerlendirmeniz için teşekkürler!");
      setIsEditing(true);
      fetchReviews(); // Listeyi yenile
    } else {
      toast.error(result.error || "Bir hata oluştu.");
    }
    setSubmitting(false);
  };

  // Yorum Silme İşlemi
  const handleDelete = async () => {
    if (!window.confirm("Yorumunuzu silmek istediğinize emin misiniz?")) return;
    
    setSubmitting(true);
    const result = await deleteReview(productId);
    
    if (result.success) {
      toast.success("Yorumunuz başarıyla kaldırıldı.");
      setRating(0);
      setComment("");
      setIsEditing(false);
      fetchReviews(); 
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

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  // 🚀 PROFESYONEL SKELETON LOADING
  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-12 animate-pulse">
        <div className="lg:w-1/3 space-y-8">
          <div className="h-48 bg-gray-100 rounded-3xl"></div>
          <div className="h-64 bg-gray-100 rounded-3xl"></div>
        </div>
        <div className="lg:w-2/3 space-y-6">
          <div className="h-10 w-64 bg-gray-100 rounded-lg mb-6"></div>
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-gray-50 border border-gray-100 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // YILDIZ İKONU (SVG)
  const StarIcon = ({ filled, className = "w-6 h-6" }: { filled: boolean, className?: string }) => (
    <svg className={`${className} ${filled ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
      
      {/* SOL TARAF: İSTATİSTİKLER VE YORUM FORMU */}
      <div className="lg:w-1/3 space-y-8">
        
        {/* Ortalama ve Histogram Alanı */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-5 mb-8 border-b border-gray-50 pb-6">
            <span className="text-6xl font-black text-gray-900 tracking-tighter">{averageRating}</span>
            <div className="flex flex-col">
              <div className="flex mb-1">
                {[1,2,3,4,5].map(star => (
                  <StarIcon key={star} filled={star <= Math.round(Number(averageRating))} className="w-5 h-5" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{totalReviews} Değerlendirme</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {distribution.map((item) => (
              <div key={item.star} className="flex items-center gap-4 text-sm group">
                <div className="flex items-center gap-1 w-12 text-gray-500 font-bold">
                  {item.star} <StarIcon filled={true} className="w-3.5 h-3.5 text-gray-300 group-hover:text-yellow-400 transition-colors" />
                </div>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="w-8 text-right text-gray-400 font-medium text-xs">{item.count}</span>
              </div>
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
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ürüne Puanın</label>
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
                        <StarIcon filled={star <= (hoveredStar || rating)} className="w-8 h-8 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Deneyimini Paylaş</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none transition-shadow shadow-sm bg-gray-50 focus:bg-white"
                    placeholder="Bu ürün hakkındaki düşünceleriniz nelerdir?"
                  ></textarea>
                </div>

                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={rating === 0 || comment.length < 5 || submitting}
                  className="w-full bg-blue-600 text-white font-extrabold py-3.5 px-4 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2"
                >
                  {submitting ? (
                    <><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> İşleniyor...</>
                  ) : (
                    isEditing ? "Güncelle" : "Gönder"
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <p className="text-gray-900 font-bold mb-2">Deneyiminizi Paylaşın</p>
                <p className="text-sm text-gray-500 mb-6">Değerlendirme yapabilmek için hesabınıza giriş yapmanız gerekmektedir.</p>
                <a href="/sign-in" className="inline-block w-full bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors shadow-sm">
                  Giriş Yap / Kayıt Ol
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SAĞ TARAF: YAPILAN YORUMLAR LİSTESİ */}
      <div className="lg:w-2/3">
        <h3 className="text-2xl font-extrabold text-gray-900 mb-8 border-b border-gray-100 pb-4">
          Müşteri Değerlendirmeleri <span className="text-gray-400 text-lg">({totalReviews})</span>
        </h3>

        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="text-gray-900 font-bold text-lg">Henüz değerlendirme yapılmamış.</p>
            <p className="text-gray-500 text-sm mt-1">Bu ürün için ilk yorumu siz yazın ve diğer kullanıcılara rehberlik edin!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group">
                
                {/* Sol Profil Alanı */}
                <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:w-48 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={review.user?.avatarUrl || `https://ui-avatars.com/api/?name=${review.user?.name || 'User'}&background=random`} 
                        alt={review.user?.name || 'User'} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                      />
                      {review.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm">{review.user?.name || 'İsimsiz Kullanıcı'}</span>
                      {review.isVerified && (
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-0.5">
                          Doğrulanmış
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Sağ Yorum İçeriği */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} filled={star <= review.rating} className="w-4 h-4" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {review.comment}
                  </p>

                  {/* Alt Etkileşim Çubuğu */}
                  {user?.primaryEmailAddress?.emailAddress === review.user?.email && (
                    <div className="mt-4 pt-4 flex items-center justify-between gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">
                        Sizin Yorumunuz
                      </span>
                      <button 
                        onClick={handleDelete}
                        disabled={submitting}
                        className="text-[11px] font-bold text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        {submitting ? "Siliniyor..." : "Sil"}
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