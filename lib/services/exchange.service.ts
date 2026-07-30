import { prisma } from "@/lib/prisma";
import { ExchangeStatus, ExchangeReason, Prisma } from "@prisma/client";

export interface CreateExchangeItemInput {
  orderItemId: string;
  quantity: number;
  reason: ExchangeReason;
  requestedProductId?: string;
  requestedVariantId?: string;
}

export interface CreateExchangeRequestInput {
  orderId: string;
  userId: string;
  customerNote?: string;
  items: CreateExchangeItemInput[];
}

export class ExchangeService {
  /**
   * Private Helper: Aynı istek içinde mükerrer orderItemId kontrolü
   */
  private static validateUniqueOrderItemsInInput(items: CreateExchangeItemInput[]) {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.orderItemId)) {
        throw new Error("Aynı ürün kalemi tek bir değişim talebinde birden fazla kez listelenemez.");
      }
      seen.add(item.orderItemId);
    }
  }

  /**
   * 1. Ürün Değişim Talebi Oluşturma (Müşteri)
   * ENTERPRISE VALIDATION & RACE CONDITION SAFETY
   */
  static async createExchangeRequest(input: CreateExchangeRequestInput) {
    const { orderId, userId, customerNote, items } = input;

    if (!items || items.length === 0) {
      throw new Error("En az bir ürün için değişim talebi oluşturulmalıdır.");
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
      throw new Error("Bu sipariş için değişim talebi oluşturma yetkiniz bulunmuyor.");
    }

    // 2. KURAL: Sadece DELIVERED siparişler için değişim yapılabilir
    if (order.status !== "DELIVERED") {
      throw new Error("Yalnızca teslim edilmiş (DELIVERED) siparişler için değişim talebi oluşturulabilir.");
    }

    // 3. KURAL: Teslim tarihinden itibaren 14 günü geçen siparişler değiştirilemez
    const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
    // GEÇİCİ FALLBACK: Bu sadece migration öncesi deliveredAt'ı olmayan eski siparişler içindir. Yeni siparişlerde deliveredAt admin route'u tarafından set edildiği için bu satıra hiç düşülmemelidir.
    const deliveryDate = order.deliveredAt || order.updatedAt;
    const orderDate = new Date(deliveryDate).getTime();
    const currentDate = new Date().getTime();

    if (currentDate - orderDate > fourteenDaysInMs) {
      throw new Error("Teslim tarihinin üzerinden 14 günden fazla zaman geçtiği için değişim talebi oluşturulamaz.");
    }

    // 4. KURAL: Devam eden aktif iadeleri ve aktif değişimleri çek
    const [activeReturns, activeExchanges] = await Promise.all([
      prisma.returnRequest.findMany({
        where: {
          orderId,
          status: { in: ["PENDING", "APPROVED", "SHIPPED", "RECEIVED"] },
        },
        include: { items: true },
      }),
      prisma.exchangeRequest.findMany({
        where: {
          orderId,
          status: { in: ["PENDING", "APPROVED", "WAITING_FOR_CUSTOMER", "WAITING_STOCK", "SHIPPED", "RECEIVED", "PROCESSING"] },
        },
        include: { items: true },
      }),
    ]);

    // Kalem bazlı beklemede olan iade ve değişim miktarlarını haritala
    const activePendingQtyMap = new Map<string, number>();

    for (const ret of activeReturns) {
      for (const retItem of ret.items) {
        const curr = activePendingQtyMap.get(retItem.orderItemId) || 0;
        activePendingQtyMap.set(retItem.orderItemId, curr + retItem.quantity);
      }
    }

    for (const exc of activeExchanges) {
      for (const excItem of exc.items) {
        const curr = activePendingQtyMap.get(excItem.orderItemId) || 0;
        activePendingQtyMap.set(excItem.orderItemId, curr + excItem.quantity);
      }
    }

    const exchangeItemsData: {
      orderItemId: string;
      quantity: number;
      reason: ExchangeReason;
      requestedProductId?: string;
      requestedVariantId?: string;
    }[] = [];

    for (const itemInput of items) {
      const orderItem = order.items.find((i) => i.id === itemInput.orderItemId);

      if (!orderItem) {
        throw new Error(`Siparişe ait ürün kalemi bulunamadı: ${itemInput.orderItemId}`);
      }

      if (itemInput.quantity <= 0) {
        throw new Error("Değişim miktarı 0'dan büyük olmalıdır.");
      }

      // KURAL 5: Self-Exchange Engeli (Aynı ürün / aynı varyasyon isteniyorsa engelle)
      const targetVariantId = itemInput.requestedVariantId || orderItem.variantId;
      const targetProductId = itemInput.requestedProductId || orderItem.productId;

      if (orderItem.variantId && targetVariantId === orderItem.variantId) {
        throw new Error("Değişim yapılabilmesi için mevcut üründen farklı bir beden, renk veya varyasyon seçilmelidir.");
      }
      if (!orderItem.variantId && targetProductId === orderItem.productId && !itemInput.requestedVariantId) {
        throw new Error("Değişim yapılabilmesi için mevcut üründen farklı bir beden veya ürün seçilmelidir.");
      }

      // Değişim yapılabilir kalan miktar kontrolü
      const activePendingQty = activePendingQtyMap.get(itemInput.orderItemId) || 0;
      const remainingExchangeable =
        orderItem.quantity - orderItem.returnedQuantity - orderItem.exchangedQuantity - activePendingQty;

      if (itemInput.quantity > remainingExchangeable) {
        throw new Error(
          `Değişim yapılmak istenen miktar (${itemInput.quantity}), kalan değişim yapılabilir miktarı (${remainingExchangeable}) aşıyor.${
            activePendingQty > 0 ? " (Devam eden aktif bir iade veya değişim talebiniz bulunmaktadır.)" : ""
          }`
        );
      }

      // İstenen yeni varyasyon/ürün geçerlilik ve stok kontrolü
      if (itemInput.requestedVariantId) {
        const requestedVariant = await prisma.productVariant.findUnique({
          where: { id: itemInput.requestedVariantId },
        });

        if (!requestedVariant) {
          throw new Error("Değişim için talep edilen varyasyon bulunamadı.");
        }

        if (requestedVariant.stock < itemInput.quantity) {
          throw new Error(`Talep edilen yeni varyasyon stokta yetersiz. Kalan stok: ${requestedVariant.stock}`);
        }
      } else if (itemInput.requestedProductId) {
        const requestedProduct = await prisma.product.findUnique({
          where: { id: itemInput.requestedProductId },
        });

        if (!requestedProduct) {
          throw new Error("Değişim için talep edilen ürün bulunamadı.");
        }

        if (requestedProduct.stock < itemInput.quantity) {
          throw new Error(`Talep edilen yeni ürün stokta yetersiz. Kalan stok: ${requestedProduct.stock}`);
        }
      }

      exchangeItemsData.push({
        orderItemId: itemInput.orderItemId,
        quantity: itemInput.quantity,
        reason: itemInput.reason || "SIZE_CHANGE",
        requestedProductId: itemInput.requestedProductId || orderItem.productId,
        requestedVariantId: itemInput.requestedVariantId || orderItem.variantId || undefined,
      });
    }

    // 6. TRANSACTION İÇİ ATOMİK GÜVENLİK (RACE CONDITION PREVENTION)
    return await prisma.$transaction(async (tx) => {
      // Transaction içi çift miktar kontrolü
      for (const itemInput of items) {
        const txOrderItem = await tx.orderItem.findUnique({
          where: { id: itemInput.orderItemId },
        });

        if (!txOrderItem) {
          throw new Error(`Siparişe ait ürün kalemi bulunamadı: ${itemInput.orderItemId}`);
        }

        const txActiveItems = await tx.exchangeItem.findMany({
          where: {
            orderItemId: itemInput.orderItemId,
            exchangeRequest: {
              status: { in: ["PENDING", "APPROVED", "WAITING_FOR_CUSTOMER", "WAITING_STOCK", "SHIPPED", "RECEIVED", "PROCESSING"] },
            },
          },
        });

        const txPendingQty = txActiveItems.reduce((acc, i) => acc + i.quantity, 0);
        const txRemaining =
          txOrderItem.quantity - txOrderItem.returnedQuantity - txOrderItem.exchangedQuantity - txPendingQty;

        if (itemInput.quantity > txRemaining) {
          throw new Error("Eşzamanlı başka bir işlem nedeniyle değişim yapılabilir miktar değişti. Lütfen sayfayı yenileyiniz.");
        }
      }

      // Kayıt oluştur
      const exchangeRequest = await tx.exchangeRequest.create({
        data: {
          orderId,
          userId,
          status: ExchangeStatus.PENDING,
          customerNote: customerNote?.trim() || null,
          items: {
            create: exchangeItemsData,
          },
        },
        include: {
          items: {
            include: {
              orderItem: {
                include: {
                  product: true,
                  variant: true,
                },
              },
              requestedProduct: true,
              requestedVariant: true,
            },
          },
        },
      });

      return exchangeRequest;
    });
  }

  /**
   * 2. Değişim Talebi Onaylama (Admin)
   */
  static async approveExchangeRequest(
    exchangeRequestId: string,
    returnTrackingNumber?: string,
    adminNote?: string
  ) {
    const exchangeRequest = await prisma.exchangeRequest.findUnique({
      where: { id: exchangeRequestId },
    });

    if (!exchangeRequest) {
      throw new Error("Değişim talebi bulunamadı.");
    }

    // STATE MACHINE KONTROLÜ
    if (exchangeRequest.status !== ExchangeStatus.PENDING && exchangeRequest.status !== ExchangeStatus.WAITING_STOCK) {
      throw new Error("Sadece bekleyen (PENDING) veya stok bekleyen (WAITING_STOCK) değişim talepleri onaylanabilir.");
    }

    return await prisma.exchangeRequest.update({
      where: { id: exchangeRequestId },
      data: {
        status: ExchangeStatus.APPROVED,
        approvedAt: new Date(),
        returnTrackingNumber: returnTrackingNumber?.trim() || exchangeRequest.returnTrackingNumber,
        adminNote: adminNote?.trim() || exchangeRequest.adminNote,
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });
  }

  /**
   * 3. Değişim Talebi Reddetme (Admin)
   */
  static async rejectExchangeRequest(exchangeRequestId: string, adminNote: string) {
    if (!adminNote || adminNote.trim() === "") {
      throw new Error("Değişim talebi reddedilirken gerekçe / admin notu yazılması zorunludur.");
    }

    const exchangeRequest = await prisma.exchangeRequest.findUnique({
      where: { id: exchangeRequestId },
    });

    if (!exchangeRequest) {
      throw new Error("Değişim talebi bulunamadı.");
    }

    // STATE MACHINE KONTROLÜ
    if (exchangeRequest.status === ExchangeStatus.COMPLETED) {
      throw new Error("Tamamlanmış değişim talepleri reddedilemez.");
    }

    return await prisma.exchangeRequest.update({
      where: { id: exchangeRequestId },
      data: {
        status: ExchangeStatus.REJECTED,
        adminNote: adminNote.trim(),
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });
  }

  /**
   * 4. Değişim Ürünü Depoya Ulaştı (Admin)
   */
  static async receiveExchangeRequest(exchangeRequestId: string, adminNote?: string) {
    const exchangeRequest = await prisma.exchangeRequest.findUnique({
      where: { id: exchangeRequestId },
    });

    if (!exchangeRequest) {
      throw new Error("Değişim talebi bulunamadı.");
    }

    // STATE MACHINE KONTROLÜ
    if (
      exchangeRequest.status !== ExchangeStatus.APPROVED &&
      exchangeRequest.status !== ExchangeStatus.SHIPPED &&
      exchangeRequest.status !== ExchangeStatus.WAITING_FOR_CUSTOMER &&
      exchangeRequest.status !== ExchangeStatus.WAITING_STOCK
    ) {
      throw new Error("Sadece onaylanmış veya kargolanmış değişim talepleri teslim alındı olarak işaretlenebilir.");
    }

    return await prisma.exchangeRequest.update({
      where: { id: exchangeRequestId },
      data: {
        status: ExchangeStatus.RECEIVED,
        receivedAt: new Date(),
        adminNote: adminNote?.trim() || exchangeRequest.adminNote,
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });
  }

  /**
   * 5. Yeni Ürün Kargolandı / İşleniyor (Admin)
   */
  static async updateShipmentStatus(
    exchangeRequestId: string,
    status: ExchangeStatus,
    newShipmentTrackingNumber?: string,
    adminNote?: string
  ) {
    const exchangeRequest = await prisma.exchangeRequest.findUnique({
      where: { id: exchangeRequestId },
    });

    if (!exchangeRequest) {
      throw new Error("Değişim talebi bulunamadı.");
    }

    // STATE MACHINE KONTROLÜ
    if (exchangeRequest.status === ExchangeStatus.COMPLETED || exchangeRequest.status === ExchangeStatus.REJECTED) {
      throw new Error("Sonuçlanmış (Tamamlanan / Reddedilen) bir değişim talebinin durumu değiştirilemez.");
    }

    return await prisma.exchangeRequest.update({
      where: { id: exchangeRequestId },
      data: {
        status,
        newShipmentTrackingNumber: newShipmentTrackingNumber?.trim() || exchangeRequest.newShipmentTrackingNumber,
        adminNote: adminNote?.trim() || exchangeRequest.adminNote,
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });
  }

  /**
   * 6. Değişimi Tamamlama (Admin)
   * STOK BÜTÜNLÜĞÜ (STOCK INTEGRITY) & DOUBLE-COMPLETE PREVENTING ATOMIC TRANSACTION
   */
  static async completeExchangeRequest(exchangeRequestId: string, adminNote?: string) {
    const exchangeRequest = await prisma.exchangeRequest.findUnique({
      where: { id: exchangeRequestId },
      include: {
        items: {
          include: {
            orderItem: true,
            requestedProduct: true,
            requestedVariant: true,
          },
        },
      },
    });

    if (!exchangeRequest) {
      throw new Error("Değişim talebi bulunamadı.");
    }

    // STATE MACHINE KONTROLÜ
    if (exchangeRequest.status === ExchangeStatus.COMPLETED) {
      throw new Error("Bu değişim talebi zaten tamamlanmış.");
    }

    if (exchangeRequest.status === ExchangeStatus.REJECTED) {
      throw new Error("Reddedilmiş bir değişim talebi tamamlanamaz.");
    }

    return await prisma.$transaction(async (tx) => {
      // 🚀 1. ATOMİK CONCURRENCY UPDATE (updateMany) - Double Complete Koruması
      const updateCount = await tx.exchangeRequest.updateMany({
        where: {
          id: exchangeRequestId,
          status: { notIn: [ExchangeStatus.COMPLETED, ExchangeStatus.REJECTED] },
        },
        data: {
          status: ExchangeStatus.COMPLETED,
          completedAt: new Date(),
          adminNote: adminNote?.trim() || exchangeRequest.adminNote,
        },
      });

      if (updateCount.count === 0) {
        throw new Error("Bu değişim talebi eşzamanlı başka bir işlem ile zaten tamamlanmış.");
      }

      // 🚀 2. STOK BÜTÜNLÜĞÜ DOĞRULAMASI (COMPLETE ANINDA YENİ ÜRÜN STOĞU YETERLİ Mİ?)
      for (const item of exchangeRequest.items) {
        if (item.requestedVariantId) {
          const reqVariant = await tx.productVariant.findUnique({
            where: { id: item.requestedVariantId },
          });

          if (!reqVariant || reqVariant.stock < item.quantity) {
            throw new Error(
              `İstenen yeni varyasyonun (${reqVariant?.combination || "Varyasyon"}) stoğu yetersiz (Kalan Stok: ${reqVariant?.stock || 0}). Değişim tamamlanamıyor, talebi 'Stok Bekleniyor' durumuna alabilirsiniz.`
            );
          }
        } else if (item.requestedProductId) {
          const reqProduct = await tx.product.findUnique({
            where: { id: item.requestedProductId },
          });

          if (!reqProduct || reqProduct.stock < item.quantity) {
            throw new Error(
              `İstenen yeni ürünün (${reqProduct?.name || "Ürün"}) stoğu yetersiz (Kalan Stok: ${reqProduct?.stock || 0}). Değişim tamamlanamıyor.`
            );
          }
        }
      }

      // 🚀 3. STOK SENKRONİZASYONU: Eski Ürün (Stock++), Yeni Ürün (Stock--)
      const stockPromises = exchangeRequest.items.map(async (item) => {
        const orderItem = item.orderItem;

        // OrderItem.exchangedQuantity miktarını artır
        const p1 = tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            exchangedQuantity: {
              increment: item.quantity,
            },
          },
        });

        const targetProductId = item.requestedProductId || orderItem.productId;

        // Geri gelen eski ürün: varyantı varsa Product.stock'a dokunma, sadece salesCount düşür
        const p2 = tx.product.update({
          where: { id: orderItem.productId },
          data: orderItem.variantId
            ? { salesCount: { decrement: item.quantity } }
            : {
                stock: { increment: item.quantity },
                salesCount: { decrement: item.quantity },
              },
        });

        const p3 = orderItem.variantId
          ? tx.productVariant.update({
              where: { id: orderItem.variantId },
              data: { stock: { increment: item.quantity } },
            })
          : Promise.resolve();

        // Müşteriye gönderilen yeni ürün: varyantı varsa Product.stock'a dokunma, sadece salesCount artır
        const p4 = tx.product.update({
          where: { id: targetProductId },
          data: item.requestedVariantId
            ? { salesCount: { increment: item.quantity } }
            : {
                stock: { decrement: item.quantity },
                salesCount: { increment: item.quantity },
              },
        });

        const p5 = item.requestedVariantId
          ? tx.productVariant.update({
              where: { id: item.requestedVariantId },
              data: { stock: { decrement: item.quantity } },
            })
          : Promise.resolve();

        return Promise.all([p1, p2, p3, p4, p5]);
      });

      await Promise.all(stockPromises);

      return await tx.exchangeRequest.findUnique({
        where: { id: exchangeRequestId },
        include: {
          user: { select: { email: true, name: true } },
          items: {
            include: {
              orderItem: {
                include: { product: true, variant: true },
              },
              requestedProduct: true,
              requestedVariant: true,
            },
          },
        },
      });
    });
  }

  /**
   * Sorgulama: Kullanıcı Değişim Talepleri
   */
  static async getUserExchangeRequests(userId: string) {
    return await prisma.exchangeRequest.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            orderItem: {
              include: { product: true, variant: true },
            },
            requestedProduct: true,
            requestedVariant: true,
          },
        },
        order: {
          select: { id: true, createdAt: true, totalPrice: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Sorgulama: Admin Tüm Değişim Talepleri
   */
  static async getAdminExchangeRequests(statusFilter?: ExchangeStatus) {
    const whereCondition: Prisma.ExchangeRequestWhereInput = {};
    if (statusFilter) {
      whereCondition.status = statusFilter;
    }

    return await prisma.exchangeRequest.findMany({
      where: whereCondition,
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, createdAt: true, totalPrice: true } },
        items: {
          include: {
            orderItem: {
              include: { product: true, variant: true },
            },
            requestedProduct: true,
            requestedVariant: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
