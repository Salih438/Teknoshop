import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Özel hata sınıfı oluşturuyoruz ki nerede patladığını anlayalım
export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAdmin() {
  const clerkUser = await currentUser();
  
  // 1. Kullanıcı hiç giriş yapmamışsa
  if (!clerkUser) {
    throw new AuthError("Bu işlem için giriş yapmalısınız.", 401); // Unauthorized
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new AuthError("Geçerli bir e-posta adresi bulunamadı.", 400); // Bad Request
  }

  // 2. Veritabanından kullanıcıyı bul (Sadece id ve role alanlarını çekiyoruz - Optimizasyon)
  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true }
  });

  // 3. Kullanıcı yoksa veya rolü ADMIN değilse kapı dışarı et!
  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new AuthError("Bu işlem için yetkiniz bulunmamaktadır.", 403); // Forbidden
  }

  // 4. Her şey yolundaysa güvenli kullanıcıyı döndür
  return dbUser;
}