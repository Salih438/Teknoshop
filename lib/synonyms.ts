import { prisma } from "@/lib/prisma";

export const SYNONYM_MAP: Record<string, string[]> = {
  "Dizüstü Bilgisayar": ["laptop", "notebook", "dizüstü", "dizustu", "macbook", "bilgisayar", "laptoplar"],
  "Akıllı Telefon": ["telefon", "phone", "iphone", "cep telefonu", "mobile", "akilli telefon", "android"],
  "Kulaklık": ["headphone", "earphone", "headset", "airpods", "kulaklik", "ses"],
  "Televizyon": ["tv", "televizyon", "ekran", "monitor", "monitör", "görüntü"],
  "Oyuncu Ekipmanları": ["gaming", "oyuncu", "gamer", "oyun", "ps5", "xbox"],
  "Akıllı Saat": ["watch", "saat", "smartwatch", "apple watch", "galaxy watch"],
  "Aksesuar": ["kılıf", "kablosuz", "şarj", "adaptör", "kablo", "aksesuar"],
};

/**
 * Searches for category IDs that match the query either directly or via synonyms.
 */
export async function getMatchingCategoryIds(query: string): Promise<{ id: string; name: string }[]> {
  if (!query.trim()) return [];

  const queryLower = query.toLowerCase().trim();
  const targetCategoryNames = new Set<string>();

  // Check synonym map entries
  Object.entries(SYNONYM_MAP).forEach(([categoryName, synonyms]) => {
    if (
      categoryName.toLowerCase().includes(queryLower) ||
      synonyms.some((syn) => syn.toLowerCase().includes(queryLower) || queryLower.includes(syn.toLowerCase()))
    ) {
      targetCategoryNames.add(categoryName);
    }
  });

  const categoryNameFilters = Array.from(targetCategoryNames).map((name) => ({
    name: { contains: name, mode: "insensitive" as const },
  }));

  const categories = await prisma.category.findMany({
    where: {
      OR: [
        { name: { contains: queryLower, mode: "insensitive" } },
        ...(categoryNameFilters.length > 0 ? categoryNameFilters : []),
      ],
    },
    select: {
      id: true,
      name: true,
    },
  });

  return categories;
}
