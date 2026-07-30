import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permission, SystemRole } from "@/lib/rbac";

// Özel hata sınıfı oluşturuyoruz ki nerede patladığını anlayalım
export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAdmin(permission?: Permission) {
  const clerkUser = await currentUser();

  // 1. Kullanıcı hiç giriş yapmamışsa
  if (!clerkUser) {
    throw new AuthError("Bu işlem için giriş yapmalısınız.", 401); // Unauthorized
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new AuthError("Geçerli bir e-posta adresi bulunamadı.", 400); // Bad Request
  }

  // 2. Veritabanından kullanıcıyı bul
  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, systemRole: true, name: true, email: true, isActive: true },
  });

  // 3. Kullanıcı yoksa, rolü ADMIN değilse veya hesabı pasifse kapı dışarı et!
  if (!dbUser || dbUser.role !== "ADMIN" || !dbUser.isActive) {
    throw new AuthError("Hesabınız pasife alınmıştır veya bu işlem için yetkiniz bulunmamaktadır.", 403); // Forbidden
  }

  // 4. Granular RBAC İzin Kontrolü
  if (permission && !hasPermission(dbUser.systemRole as SystemRole, permission)) {
    throw new AuthError(`Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır (İzin: ${permission}).`, 403);
  }

  // 5. Her şey yolundaysa güvenli kullanıcıyı döndür
  return dbUser;
}

export async function requirePermission(permission: Permission) {
  return requireAdmin(permission);
}