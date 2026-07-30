import { prisma } from "@/lib/prisma";
import { ReturnStatus, ReturnReason, Prisma } from "@prisma/client";

export interface CreateReturnItemInput {
  orderItemId: string;
  quantity: number;
  reason: ReturnReason;
}

export interface CreateReturnRequestInput {
  orderId: string;
  userId: string;
  customerNote?: string;
  items: CreateReturnItemInput[];
  imageUrls?: string[];
}

export class ReturnService {
  /**
   * Private Helper: Aynı istek içinde mükerrer orderItemId kontrolü
   */
  private static validateUniqueOrderItemsInInput(items: CreateReturnItemInput[]) {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.orderItemId)) {
        throw new Error("Aynı ürün kalemi tek bir iade talebinde birden fazla kez listelenemez.");
      }
      seen.add(item.orderItemId);
    }
  }

  /**
   * 1. İade Talebi Oluşturma (Müşteri)
   * PROFESYONEL ORANSAL İADE & NET ÖDEME HESAPLAMA SİSTEMİ
   */
  static async createReturnRequest(input: CreateReturnRequestInput) {
    const { orderId, userId, customerNote, items, imageUrls } = input;

    if (!items || items.length === 0) {
      throw new Error("En az bir ürün için iade talebi oluşturulmalıdır.");
    }

    // 1. KURAL: Aynı istek içinde mükerrer orderItemId olamaz
    this.validateUniqueOrderItemsInInput(items);

    // Siparişi ve kalemlerini kontrol et
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("Sipariş bulunamadı.");
    }

    if (order.userId !== userId) {
      throw new Error("Bu sipariş için iade talebi oluşturma yetkiniz bulunmuyor.");
    }

    // 2. KURAL: Sadece DELIVERED siparişler iade edilebilir
    if (order.status !== "DELIVERED") {
      throw new Error("Yalnızca teslim edilmiş (DELIVERED) siparişler için iade talebi oluşturulabilir.");
    }

    // 3. KURAL: Teslim tarihinden itibaren 14 günü geçen siparişler iade edilemez
    const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
    // GEÇİCİ FALLBACK: Bu sadece migration öncesi deliveredAt'ı olmayan eski siparişler içindir. Yeni siparişlerde deliveredAt admin route'u tarafından set edildiği için bu satıra hiç düşülmemelidir.
    const deliveryDate = order.deliveredAt || order.updatedAt;
    const orderDate = new Date(deliveryDate).getTime();
    const currentDate = new Date().getTime();

    if (currentDate - orderDate > fourteenDaysInMs) {
      throw new Error("Teslim tarihinin üzerinden 14 günden fazla zaman geçtiği için iade talebi oluşturulamaz.");
    }

    // A. Sipariş seviyesinde geçmiş ve aktif tüm iade taleplerini çek (REJECTED hariç)
    const existingReturns = await prisma.returnRequest.findMany({
      where: {
        orderId,
        status: { in: [ReturnStatus.PENDING, ReturnStatus.APPROVED, ReturnStatus.SHIPPED, ReturnStatus.RECEIVED, ReturnStatus.COMPLETED] },
      },
      include: {
        items: true,
      },
    });

    // B. Sipariş için bugüne kadar yapılmış / istenmiş toplam iade tutarı
    const existingTotalRefundAmount = existingReturns.reduce((acc, r) => acc + r.refundAmount, 0);

    // Siparişte kalan maksimum iade edilebilir toplam tutar (Müşterinin ödediği net totalPrice'ı KESİNLİKLE aşamaz!)
    const maxOrderRefundableLimit = Number(Math.max(0, order.totalPrice - existingTotalRefundAmount).toFixed(2));

    if (maxOrderRefundableLimit <= 0) {
      throw new Error("Bu siparişe ait ödenen toplam tutarın tamamı için iade talebi oluşturulmuştur.");
    }

    // C. OrderItem bazında bugüne kadar iade edilmiş / iadesi istenmiş miktar ve tutarları haritala
    const itemRefundHistoryMap = new Map<string, { activePendingQty: number; totalRefundedForThisItem: number }>();

    for (const ret of existingReturns) {
      for (const retItem of ret.items) {
        const curr = itemRefundHistoryMap.get(retItem.orderItemId) || { activePendingQty: 0, totalRefundedForThisItem: 0 };
        itemRefundHistoryMap.set(retItem.orderItemId, {
          activePendingQty: curr.activePendingQty + (ret.status === ReturnStatus.COMPLETED ? 0 : retItem.quantity),
          totalRefundedForThisItem: Number((curr.totalRefundedForThisItem + retItem.refundAmount).toFixed(2)),
        });
      }
    }

    // D. Kupon İndirimi Oransal Dağıtımı (Kupon indirimini her kaleme oransal dağıt)
    const grossOrderTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountRatio = grossOrderTotal > 0 ? (order.discountAmount || 0) / grossOrderTotal : 0;

    let totalRefundAmount = 0;
    const returnItemsData: {
      orderItemId: string;
      quantity: number;
      reason: ReturnReason;
      refundAmount: number;
    }[] = [];

    for (const itemInput of items) {
      const orderItem = order.items.find((i) => i.id === itemInput.orderItemId);

      if (!orderItem) {
        throw new Error(`Siparişe ait ürün kalemi bulunamadı: ${itemInput.orderItemId}`);
      }

      if (itemInput.quantity <= 0) {
        throw new Error("İade miktarı 0'dan büyük olmalıdır.");
      }

      const history = itemRefundHistoryMap.get(itemInput.orderItemId) || { activePendingQty: 0, totalRefundedForThisItem: 0 };
      const remainingReturnableQty = orderItem.quantity - orderItem.returnedQuantity - history.activePendingQty;

      if (itemInput.quantity > remainingReturnableQty) {
        throw new Error(
          `İade edilmek istenen miktar (${itemInput.quantity}), kalan iade edilebilir miktarı (${remainingReturnableQty}) aşıyor.${
            history.activePendingQty > 0 ? " (Devam eden aktif bir iade talebiniz bulunmaktadır.)" : ""
          }`
        );
      }

      // Bu kalemin net toplam satır değeri (indirim düşülmüş net ödenen değer)
      const netLineTotal = Number((orderItem.price * orderItem.quantity * (1 - discountRatio)).toFixed(2));
      // Bu kalem için henüz iade edilmemiş kalan maksimum net tutar
      const maxItemRefundLimit = Number(Math.max(0, netLineTotal - history.totalRefundedForThisItem).toFixed(2));

      // Net birim iade tutarı
      const netUnitPrice = orderItem.price * (1 - discountRatio);

      // Kuruş ve yuvarlama hatalarını önlemek için: Son kalan ürünler iade ediliyorsa kalan net tutarı tamamen sıfırla
      let itemRefund = 0;
      if (itemInput.quantity === remainingReturnableQty) {
        itemRefund = maxItemRefundLimit;
      } else {
        itemRefund = Number(Math.min(netUnitPrice * itemInput.quantity, maxItemRefundLimit).toFixed(2));
      }

      totalRefundAmount += itemRefund;

      returnItemsData.push({
        orderItemId: itemInput.orderItemId,
        quantity: itemInput.quantity,
        reason: itemInput.reason || "OTHER",
        refundAmount: itemRefund,
      });
    }

    // Toplam iade tutarını siparişin kalan net ödenen tutarı ile sınırla (Max Cap)
    if (totalRefundAmount > maxOrderRefundableLimit) {
      totalRefundAmount = maxOrderRefundableLimit;
    }
    totalRefundAmount = Number(totalRefundAmount.toFixed(2));

    // 5. TRANSACTION İÇİ ATOMİK ÇİFT DOĞRULAMA (RACE CONDITION KORUMASI)
    return await prisma.$transaction(async (tx) => {
      // Transaction içi veritabanı anlık kontrolü
      for (const itemInput of items) {
        const txOrderItem = await tx.orderItem.findUnique({
          where: { id: itemInput.orderItemId },
        });

        if (!txOrderItem) {
          throw new Error(`Siparişe ait ürün kalemi bulunamadı: ${itemInput.orderItemId}`);
        }

        const txActiveItems = await tx.returnItem.findMany({
          where: {
            orderItemId: itemInput.orderItemId,
            returnRequest: {
              status: { in: [ReturnStatus.PENDING, ReturnStatus.APPROVED, ReturnStatus.SHIPPED, ReturnStatus.RECEIVED] },
            },
          },
        });

        const txActivePendingQty = txActiveItems.reduce((acc, i) => acc + i.quantity, 0);
        const txRemaining = txOrderItem.quantity - txOrderItem.returnedQuantity - txActivePendingQty;

        if (itemInput.quantity > txRemaining) {
          throw new Error(
            "Eşzamanlı başka bir işlem nedeniyle iade edilebilir miktar değişti. Lütfen sayfayı yenileyip tekrar deneyin."
          );
        }
      }

      // Kayıt oluşturulur
      const returnRequest = await tx.returnRequest.create({
        data: {
          orderId,
          userId,
          status: ReturnStatus.PENDING,
          refundAmount: totalRefundAmount,
          customerNote: customerNote?.trim() || null,
          items: {
            create: returnItemsData,
          },
          ...(imageUrls && imageUrls.length > 0 && {
            images: {
              create: imageUrls.map((url) => ({ imageUrl: url })),
            },
          }),
        },
        include: {
          items: true,
          images: true,
        },
      });

      return returnRequest;
    });
  }

  /**
   * 2. İade Talebi Onaylama (Admin)
   */
  static async approveReturnRequest(returnRequestId: string, returnTrackingNumber?: string, adminNote?: string) {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
    });

    if (!returnRequest) {
      throw new Error("İade talebi bulunamadı.");
    }

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new Error("Sadece bekleyen (PENDING) iade talepleri onaylanabilir.");
    }

    return await prisma.returnRequest.update({
      where: { id: returnRequestId },
      data: {
        status: ReturnStatus.APPROVED,
        approvedAt: new Date(),
        returnTrackingNumber: returnTrackingNumber?.trim() || null,
        adminNote: adminNote?.trim() || returnRequest.adminNote,
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });
  }

  /**
   * 3. İade Talebi Reddetme (Admin)
   */
  static async rejectReturnRequest(returnRequestId: string, adminNote: string) {
    if (!adminNote || adminNote.trim() === "") {
      throw new Error("İade reddedilirken admin notu / red gerekçesi zorunludur.");
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
    });

    if (!returnRequest) {
      throw new Error("İade talebi bulunamadı.");
    }

    if (returnRequest.status === ReturnStatus.COMPLETED) {
      throw new Error("Tamamlanmış iade talepleri reddedilemez.");
    }

    return await prisma.returnRequest.update({
      where: { id: returnRequestId },
      data: {
        status: ReturnStatus.REJECTED,
        adminNote: adminNote.trim(),
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });
  }

  /**
   * 4. İade Depoya Ulaştı (Admin)
   */
  static async receiveReturnRequest(returnRequestId: string, adminNote?: string) {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
    });

    if (!returnRequest) {
      throw new Error("İade talebi bulunamadı.");
    }

    if (returnRequest.status !== ReturnStatus.APPROVED && returnRequest.status !== ReturnStatus.SHIPPED) {
      throw new Error("Sadece onaylanmış veya kargolanmış iade talepleri teslim alındı olarak işaretlenebilir.");
    }

    return await prisma.returnRequest.update({
      where: { id: returnRequestId },
      data: {
        status: ReturnStatus.RECEIVED,
        receivedAt: new Date(),
        adminNote: adminNote?.trim() || returnRequest.adminNote,
      },
    });
  }

  /**
   * 5. İade Tamamlama (Admin)
   * ATOMİK CONCURRENCY KİLİTLENMESİ & DOUBLE COMPLETE KORUMASI
   */
  static async completeReturnRequest(returnRequestId: string, refundMethod?: string, adminNote?: string) {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: {
        items: {
          include: {
            orderItem: true,
          },
        },
        order: {
          include: {
            payment: true,
            items: true,
          },
        },
      },
    });

    if (!returnRequest) {
      throw new Error("İade talebi bulunamadı.");
    }

    if (returnRequest.status === ReturnStatus.COMPLETED) {
      throw new Error("Bu iade talebi zaten tamamlanmış.");
    }

    if (returnRequest.status === ReturnStatus.REJECTED) {
      throw new Error("Reddedilmiş bir iade talebi tamamlanamaz.");
    }

    return await prisma.$transaction(async (tx) => {
      // 🚀 ATOMİK CONCURRENCY KİLİTLENMESİ (updateMany)
      // Yalnızca durumu henüz COMPLETED veya REJECTED olmayan kayıtları COMPLETED yapar.
      // İki admin aynı anda tıklarsa, veritabanı seviyesinde ilk gelen updateMany 1 döndürür, ikinci gelen 0 döndürür ve exception fırlatır!
      const updateCount = await tx.returnRequest.updateMany({
        where: {
          id: returnRequestId,
          status: { notIn: [ReturnStatus.COMPLETED, ReturnStatus.REJECTED] },
        },
        data: {
          status: ReturnStatus.COMPLETED,
          completedAt: new Date(),
          refundMethod: refundMethod || "CREDIT_CARD_REFUND",
          adminNote: adminNote?.trim() || returnRequest.adminNote,
        },
      });

      if (updateCount.count === 0) {
        throw new Error("Bu iade talebi eşzamanlı başka bir işlem ile zaten tamamlanmış.");
      }

      // A. Stokların Artırılması (Stock++) & OrderItem.returnedQuantity Güncellenmesi (PARALEL BATCHING OPTİMİZASYONU)
      const stockUpdatePromises = returnRequest.items.map(async (item) => {
        const orderItem = item.orderItem;

        const updateOrderItem = tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            returnedQuantity: {
              increment: item.quantity,
            },
          },
        });

        const updateProduct = tx.product.update({
          where: { id: orderItem.productId },
          data: orderItem.variantId
            ? {
                salesCount: {
                  decrement: item.quantity,
                },
              }
            : {
                stock: {
                  increment: item.quantity,
                },
                salesCount: {
                  decrement: item.quantity,
                },
              },
        });

        const updateVariant = orderItem.variantId
          ? tx.productVariant.update({
              where: { id: orderItem.variantId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            })
          : Promise.resolve();

        return Promise.all([updateOrderItem, updateProduct, updateVariant]);
      });

      await Promise.all(stockUpdatePromises);

      // B. Ödeme (Payment) İade Kaydının Güncellenmesi & Max Capping (SADECE 1 KEZ ÇALIŞIR)
      if (returnRequest.order.payment) {
        const payment = returnRequest.order.payment;
        const maxAllowedRefund = returnRequest.order.totalPrice;
        const newRefundedAmount = Number(
          Math.min(payment.refundedAmount + returnRequest.refundAmount, maxAllowedRefund).toFixed(2)
        );

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            refundedAmount: newRefundedAmount,
            refundedAt: new Date(),
            status: "REFUNDED",
          },
        });
      }

      // C. Güncellenmiş son iade talebini döndür
      return await tx.returnRequest.findUnique({
        where: { id: returnRequestId },
        include: {
          items: true,
          images: true,
          user: { select: { email: true, name: true } },
        },
      });
    });
  }

  /**
   * Sorgulama: Kullanıcının İade Talepleri
   */
  static async getUserReturnRequests(userId: string) {
    return await prisma.returnRequest.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
        images: true,
        order: {
          select: {
            id: true,
            createdAt: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Sorgulama: Admin Tüm İade Talepleri
   */
  static async getAdminReturnRequests(statusFilter?: ReturnStatus) {
    const whereCondition: Prisma.ReturnRequestWhereInput = {};
    if (statusFilter) {
      whereCondition.status = statusFilter;
    }

    return await prisma.returnRequest.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            createdAt: true,
            totalPrice: true,
          },
        },
        items: {
          include: {
            orderItem: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
        images: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
