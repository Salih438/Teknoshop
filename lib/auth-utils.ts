import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getDbUser(options?: { allowInactive?: boolean }) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.emailAddresses?.[0]?.emailAddress) {
      return null;
    }

    const email = clerkUser.emailAddresses[0].emailAddress;
    const dbUser = await prisma.user.findUnique({
      where: { email },
    });

    // Pasife alınmış/engellenmiş hesapları yetkisiz say
    if (dbUser && !dbUser.isActive && !options?.allowInactive) {
      return null;
    }

    return dbUser;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Dynamic server usage")) {
      return null;
    }
    console.error("getDbUser Hata:", error);
    return null;
  }
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const dbUser = await getDbUser();
    return Boolean(dbUser && dbUser.role === "ADMIN" && dbUser.isActive);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Dynamic server usage")) {
      return false;
    }
    console.error("checkIsAdmin Hata:", error);
    return false;
  }
}
