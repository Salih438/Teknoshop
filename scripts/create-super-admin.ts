import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("❌ Hata: Lütfen geçerli bir e-posta adresi belirtin.");
    console.log("Kullanım: npx tsx scripts/create-super-admin.ts <email>");
    process.exit(1);
  }

  console.log(`🔍 '${email}' kullanıcısı kontrol ediliyor...`);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: "ADMIN",
        systemRole: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log("✅ Mevcut kullanıcı başarıyla SUPER_ADMIN yetkisine yükseltildi:");
    console.log(`   - ID: ${updated.id}`);
    console.log(`   - İsim: ${updated.name}`);
    console.log(`   - Email: ${updated.email}`);
    console.log(`   - Rol: ${updated.role} (systemRole: ${updated.systemRole})`);
    console.log(`   - Durum: ${updated.isActive ? "Aktif" : "Pasif"}`);
  } else {
    const defaultName = email.split("@")[0] || "Super Admin";
    const created = await prisma.user.create({
      data: {
        email,
        name: defaultName,
        role: "ADMIN",
        systemRole: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log("🎉 Yeni kullanıcı oluşturuldu ve SUPER_ADMIN olarak atandı:");
    console.log(`   - ID: ${created.id}`);
    console.log(`   - İsim: ${created.name}`);
    console.log(`   - Email: ${created.email}`);
    console.log(`   - Rol: ${created.role} (systemRole: ${created.systemRole})`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Bir hata oluştu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
