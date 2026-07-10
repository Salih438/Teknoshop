
import Link from 'next/link';
// ../lib/data YERİNE @/lib/data KULLANIYORUZ
import { Product } from '@/lib/data';
// Bu bileşen dışarıdan bir "product" (ürün) alacak ve bunu ekrana çizecek
export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white flex flex-col hover:shadow-lg transition-shadow duration-300">
      {/* Ürün Görseli */}
      <div className="h-48 w-full overflow-hidden bg-gray-100">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
        />
      </div>

      {/* Ürün Bilgileri */}
      <div className="p-4 flex flex-col flex-grow">
        <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          {product.category}
        </span>
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xl font-bold text-blue-600 mb-4">
          {product.price} TL
        </p>
        
        {/* Alt Kısım: Stok Durumu ve Buton */}
        <div className="mt-auto flex items-center justify-between">
          <span className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-500'}`}>
            {product.inStock ? 'Stokta Var' : 'Tükendi'}
          </span>
          <Link 
            href={`/products/${product.id}`}
            className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            İncele
          </Link>
        </div>
      </div>
    </div>
  );
}