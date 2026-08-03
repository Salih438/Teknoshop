import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import OrderTimeline from "@/components/orders/OrderTimeline";
import ShipmentTrackingCard from "@/components/orders/ShipmentTrackingCard";
import PrintInvoiceButton from "@/components/profile/PrintInvoiceButton";
import ReturnRequestModal from "@/components/profile/ReturnRequestModal";
import ExchangeRequestModal from "@/components/profile/ExchangeRequestModal";
import ReturnStatusCard from "@/components/profile/ReturnStatusCard";
import ExchangeStatusCard from "@/components/profile/ExchangeStatusCard";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/");

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) redirect("/");

  const dbUser = await prisma.user.findUnique({ where: { email } });
  if (!dbUser) redirect("/");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              variants: true,
              images: true,
            },
          },
          variant: true,
        },
      },
      address: true,
      payment: {
        include: {
          paymentMethod: true,
        },
      },
      shipment: true,
      couponUsages: {
        include: {
          coupon: true,
        },
      },
      returns: {
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  product: {
                    include: {
                      images: true,
                    },
                  },
                  variant: true,
                },
              },
            },
          },
          images: true,
        },
        orderBy: { createdAt: "desc" },
      },
      exchanges: {
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  product: {
                    include: {
                      images: true,
                    },
                  },
                  variant: true,
                },
              },
              requestedProduct: {
                include: {
                  images: true,
                },
              },
              requestedVariant: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order || order.userId !== dbUser.id) {
    return notFound();
  }

  const shortOrderCode = `#ORD-${order.id.slice(-8).toUpperCase()}`;

  const deliveryDate = order.deliveredAt || order.updatedAt;
  const ageInMs = Date.now() - new Date(deliveryDate).getTime();
  const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
  const isWithinReturnPeriod = ageInMs <= fourteenDaysInMs;

  const hasPendingReturn =
    order.returns?.some((r) =>
      ["PENDING", "APPROVED", "SHIPPED", "RECEIVED"].includes(r.status)
    ) ?? false;

  const hasPendingExchange =
    order.exchanges?.some((e) =>
      ["PENDING", "APPROVED", "SHIPPED_BY_CUSTOMER", "RECEIVED", "SHIPPED_BY_ADMIN"].includes(e.status)
    ) ?? false;

  const canCreateReturn =
    order.status === "DELIVERED" &&
    isWithinReturnPeriod &&
    !hasPendingReturn &&
    order.items.some((i) => i.quantity - i.returnedQuantity > 0);

  const canCreateExchange =
    order.status === "DELIVERED" &&
    isWithinReturnPeriod &&
    !hasPendingExchange &&
    order.items.some((i) => i.quantity - (i.returnedQuantity + i.exchangedQuantity) > 0);

  return (
    <main className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 w-full text-left">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* ÜST GEZİNME VE BAŞLIK BARI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/profile" className="text-xs font-bold text-gray-500 hover:text-blue-600">
                ← Tüm Siparişlerim
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-mono font-black text-blue-600">{shortOrderCode}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">Sipariş Detayı</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canCreateReturn && (
              <ReturnRequestModal orderId={order.id} items={order.items} />
            )}
            {canCreateExchange && (
              <ExchangeRequestModal orderId={order.id} items={order.items} />
            )}
            <PrintInvoiceButton />
            <Link
              href="/support"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
            >
              <span>🎧 Destek Al</span>
            </Link>
          </div>
        </div>

        {/* 🚀 AMAZON TIMELINE VE KARGO TAKİP KARTI */}
        <OrderTimeline status={order.status} createdAt={order.createdAt} />
        
        {order.shipment && (
          <ShipmentTrackingCard
            company={order.shipment.company}
            trackingNumber={order.shipment.trackingNumber}
          />
        )}

        {/* 🚀 CANLI İADE TALEPLERİ KARTI */}
        {order.returns && order.returns.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <span>↩️</span> Siparişe Ait İade Talepleri ({order.returns.length})
            </h3>
            {order.returns.map((ret: Parameters<typeof ReturnStatusCard>[0]["returnRequest"]) => (
              <ReturnStatusCard key={ret.id} returnRequest={ret} />
            ))}
          </div>
        )}

        {/* 🚀 CANLI DEĞİŞİM TALEPLERİ KARTI */}
        {order.exchanges && order.exchanges.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <span>🔄</span> Siparişe Ait Değişim Talepleri ({order.exchanges.length})
            </h3>
            {order.exchanges.map((ex: Parameters<typeof ExchangeStatusCard>[0]["exchangeRequest"]) => (
              <ExchangeStatusCard key={ex.id} exchangeRequest={ex} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SOL: ÜRÜN LİSTESİ */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="font-black text-gray-900 text-base border-b border-gray-100 pb-3">
                Siparişteki Ürünler ({order.items.length})
              </h3>

              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl p-1 flex-shrink-0 flex items-center justify-center">
                        {item.product?.imageUrl ? (
                          <Image src={item.product.imageUrl} alt={item.product.name} width={64} height={64} className="object-contain max-h-full" />
                        ) : (
                          <span>📦</span>
                        )}
                      </div>
                      <div>
                        <Link href={`/products/${item.product?.id}`} className="font-black text-xs sm:text-sm text-gray-900 hover:text-blue-600 transition line-clamp-2">
                          {item.product?.name}
                        </Link>
                        {item.variant && (
                          <span className="text-[10px] text-gray-400 font-bold block">
                            Varyasyon: {[item.variant.color, item.variant.storage].filter(Boolean).join(" • ")}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 font-bold block mt-0.5">Adet: {item.quantity}</span>
                        
                        {/* 🚀 ÜRÜN İADE/DEĞİŞİM BİLGİ ETİKETLERİ */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.returnedQuantity > 0 && (
                            <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                              ↩️ İade Edildi ({item.returnedQuantity} Adet)
                            </span>
                          )}
                          {item.exchangedQuantity > 0 && (
                            <span className="inline-block bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                              🔁 Değiştirildi ({item.exchangedQuantity} Adet)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right sm:text-right w-full sm:w-auto">
                      <span className="font-black text-blue-600 text-sm block">
                        {(item.price * item.quantity).toLocaleString("tr-TR")} ₺
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SAĞ: ÖZET VE DETAYLAR */}
          <div className="space-y-4">
            
            {/* ADRES KARTI */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-2 text-xs">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">📍 TESLİMAT ADRESİ</span>
              <h4 className="font-extrabold text-gray-900 text-sm">{order.address?.title}</h4>
              <p className="text-gray-600 font-medium">{order.address?.address}</p>
              <p className="text-gray-400 font-bold">{order.address?.district}, {order.address?.city}</p>
            </div>

            {/* ÖDEME KARTI */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-2 text-xs">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">💳 ÖDEME BİLGİSİ</span>
              <h4 className="font-extrabold text-gray-900 text-sm">{order.payment?.paymentMethod?.name || "Kredi Kartı"}</h4>
              <p className="text-gray-600 font-medium">Ödeme Durumu: <strong className="text-green-600">Ödendi</strong></p>
            </div>

            {/* FATURA DÖKÜM KARTI */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-3 text-xs">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">📄 FİYAT DÖKÜMÜ</span>
              
              <div className="space-y-2 text-gray-600 font-medium border-b border-gray-100 pb-3">
                <div className="flex justify-between">
                  <span>Toplam</span>
                  <span className="font-bold text-gray-900">{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Kupon İndirimi</span>
                    <span>-{order.discountAmount.toLocaleString("tr-TR")} ₺</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400 text-[10px]">
                  <span>Tahmini KDV (%20)</span>
                  <span>{Math.round(order.totalPrice * 0.2).toLocaleString("tr-TR")} ₺</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black">
                <span>Ödenen Tutar</span>
                <span className="text-blue-600 text-base">{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}