export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  inStock: boolean;
  rating: number;
  discount?: number;
};

export type Coupon = {
  code: string;
  type: 'percent' | 'shipping';
  value: number;
  label: string;
};

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'akıllı-kulaklık',
    name: 'Akıllı Kulaklık',
    price: 1890,
    description: 'Yüksek kaliteli ses ve uzun pil ömrü sunan, günlük kullanım için ideal kulaklık.',
    category: 'Elektronik',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    inStock: true,
    rating: 4.8,
    discount: 10,
  },
  {
    id: 'p2',
    slug: 'spor-ayakkabi',
    name: 'Spor Ayakkabı',
    price: 1490,
    description: 'Hafif taban yapısı ve rahat destek sistemiyle her koşuya uygun spor ayakkabı.',
    category: 'Moda',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    inStock: true,
    rating: 4.6,
  },
  {
    id: 'p3',
    slug: 'fotoğraf-makinesi',
    name: 'Fotoğraf Makinesi',
    price: 2890,
    description: 'Yüksek çözünürlüklü çekimler için profesyonel düzeyde performans.',
    category: 'Elektronik',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
    inStock: false,
    rating: 4.9,
    discount: 15,
  },
  {
    id: 'p4',
    slug: 'laptop',
    name: 'Taşınabilir Laptop',
    price: 3290,
    description: 'Hızlı işlemci ve uzun pil ömrü ile ofis ve öğrenme için güçlü seçenek.',
    category: 'Elektronik',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
    inStock: true,
    rating: 4.7,
  },
  {
    id: 'p5',
    slug: 'saat',
    name: 'Akıllı Saat',
    price: 2190,
    description: 'Fitness takibi, bildirimler ve şık tasarımı bir arada sunan akıllı saat.',
    category: 'Elektronik',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    inStock: true,
    rating: 4.5,
  },
  {
    id: 'p6',
    slug: 'çanta',
    name: 'Şık Sırt Çantası',
    price: 1290,
    description: 'Günlük kullanım için hafif, düzenli ve modern bir seçenek.',
    category: 'Moda',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    inStock: true,
    rating: 4.4,
    discount: 5,
  },
];

export const categories = ['Tümü', ...Array.from(new Set(products.map((product) => product.category)))];

export const coupons: Coupon[] = [
  { code: 'WELCOME10', type: 'percent', value: 10, label: '%10 indirim' },
  { code: 'FREESHIP', type: 'shipping', value: 0, label: 'Ücretsiz kargo' },
  { code: 'SUMMER20', type: 'percent', value: 20, label: '%20 indirim' },
];

export function getDiscountedPrice(product: Product) {
  if (!product.discount) {
    return product.price;
  }

  return product.price - (product.price * product.discount) / 100;
}
