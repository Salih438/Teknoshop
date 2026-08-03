"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

// Özellik Seçeneği (Option Value) tipi
export interface OptionValue {
  id: string;
  value: string;
}

// Özellik grubu (Option Group) tipi
export interface OptionGroup {
  id: string;
  name: string;
  values: OptionValue[];
}

// Gerçekleşecek Varyasyon Satırı
export interface VariantRow {
  id: string;
  combination: string;
  price: string;
  discountedPrice: string;
  stock: string;
  sku: string;
  isActive: boolean;
}

export interface DynamicVariantBuilderProps {
  resetSignal?: number;
  initialData?: VariantRow[];
  onVariantsChange?: (variants: VariantRow[]) => void;
}

export default function DynamicVariantBuilder({
  resetSignal = 0,
  initialData = [],
  onVariantsChange,
}: DynamicVariantBuilderProps) {
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>(initialData);
  const [deletedCombinations, setDeletedCombinations] = useState<string[]>([]);
  const isFirstRender = useRef(true);

  // 1. Parent komponenti değişikliklerden haberdar et
  useEffect(() => {
    if (!isFirstRender.current && onVariantsChange) {
      onVariantsChange(variantRows);
    }
    isFirstRender.current = false;
  }, [variantRows, onVariantsChange]);

  const [prevResetSignal, setPrevResetSignal] = useState(resetSignal);
  if (prevResetSignal !== resetSignal) {
    setPrevResetSignal(resetSignal);
    if (resetSignal > 0) {
      setGroups([]);
      setVariantRows([]);
      setDeletedCombinations([]);
    }
  }

  // Grup ekleme
  const addGroup = () => {
    setGroups([...groups, { id: crypto.randomUUID(), name: "", values: [] }]);
  };

  // Grubu silme
  const removeGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
  };

  // Grup Adını Güncelleme (Geçici olarak yazılırken duplicate kontrolü onBlur'da yapılır)
  const updateGroupName = (id: string, rawName: string) => {
    setGroups(groups.map(g => (g.id === id ? { ...g, name: rawName } : g)));
  };

  // Grup Adı Kaydedilirken Boşlukları Temizle ve Duplicate Kontrolü Yap
  const handleGroupNameBlur = (id: string, e: React.FocusEvent<HTMLInputElement>) => {
    const normalized = e.target.value.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      setGroups(groups.map(g => (g.id === id ? { ...g, name: "" } : g)));
      return;
    }
    
    // Büyük-küçük harf duyarsız duplicate kontrolü
    const isDuplicate = groups.some(g => g.id !== id && g.name.toLowerCase() === normalized.toLowerCase());
    if (isDuplicate) {
      toast.error(`"${normalized}" adında bir özellik grubu zaten var!`);
      setGroups(groups.map(g => (g.id === id ? { ...g, name: "" } : g)));
    } else {
      setGroups(groups.map(g => (g.id === id ? { ...g, name: normalized } : g)));
    }
  };

  // Gruba Yeni Seçenek Ekleme
  const addValueToGroup = (groupId: string, rawValue: string) => {
    const normalized = rawValue.replace(/\s+/g, ' ').trim();
    if (!normalized) return;
    
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        // Büyük-küçük harf duyarsız duplicate kontrolü
        const isDuplicate = g.values.some(v => v.value.toLowerCase() === normalized.toLowerCase());
        if (isDuplicate) {
          toast.error(`"${normalized}" seçeneği zaten ekli!`);
          return g;
        }
        return { ...g, values: [...g.values, { id: crypto.randomUUID(), value: normalized }] };
      }
      return g;
    }));
  };

  // Gruptan Seçenek Çıkarma
  const removeValueFromGroup = (groupId: string, valueIdToRemove: string) => {
    setGroups(groups.map(g => (g.id === groupId ? { ...g, values: g.values.filter(v => v.id !== valueIdToRemove) } : g)));
  };

  // Varyasyon Satırını Güncelleme
  const updateVariantRow = (id: string, field: keyof VariantRow, value: string | boolean) => {
    setVariantRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  // Varyasyon Satırını Silme (Geri gelmemesi için deletedCombinations listesine atılır)
  const removeVariantRow = (id: string, combination: string) => {
    setVariantRows(prev => prev.filter(row => row.id !== id));
    setDeletedCombinations(prev => [...prev, combination]);
  };

  // Kombinasyon Oluştur Butonu Mantığı
  const generateCombinations = () => {
    const validGroups = groups.filter(g => g.name.trim() !== "" && g.values.length > 0);
    
    if (validGroups.length === 0) {
      setVariantRows([]);
      setDeletedCombinations([]);
      return;
    }

    // Her yeni kombinasyon oluşturma denemesinde silinenleri temizliyoruz. 
    // Böylece grupları/seçenekleri değiştiren kullanıcı yeni bir "oturum" açmış olur.
    setDeletedCombinations([]);

    // Kartezyen Çarpım Algoritması
    const combine = (arrays: string[][]): string[][] => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(c => curr.map(n => [...c, n]));
      }, [[]] as string[][]);
    };

    const valueArrays = validGroups.map(g => g.values.map(v => v.value));
    const resultArrays = combine(valueArrays);
    const newCombinations = resultArrays.map(arr => arr.join(" / "));

    setVariantRows(prevRows => {
      // Mevcut olan ve halen geçerliliğini koruyan kombinasyonları sakla
      const nextRows = prevRows.filter(row => newCombinations.includes(row.combination));
      const existingCombos = nextRows.map(r => r.combination);

      // Yeni kombinasyonları listeye ekle
      newCombinations.forEach(combo => {
        if (!existingCombos.includes(combo) && !deletedCombinations.includes(combo)) {
          nextRows.push({
            id: crypto.randomUUID(),
            combination: combo,
            price: "",
            discountedPrice: "",
            stock: "0",
            sku: "",
            isActive: true, // Her yeni satır default olarak satışta başlar
          });
        }
      });

      return nextRows;
    });
  };

  return (
    <div className="border border-indigo-200 rounded-xl p-6 bg-indigo-50/30">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">✨ Dinamik Varyasyon Yöneticisi</h2>
        <p className="text-xs text-gray-500 mt-1">Özellik grupları oluşturun (Renk, Beden vb.) ve kombinasyonları otomatik üretin.</p>
      </div>

      <div className="space-y-4 mb-6">
        {groups.map((group) => (
          <div key={group.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                placeholder="Özellik Grubu Adı (Örn: Renk)"
                value={group.name}
                onChange={(e) => updateGroupName(group.id, e.target.value)}
                onBlur={(e) => handleGroupNameBlur(group.id, e)}
                className="w-1/2 px-3 py-2 text-sm font-bold border-b-2 border-transparent focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => removeGroup(group.id)}
                className="text-red-500 hover:text-red-700 text-sm font-bold transition"
              >
                Grubu Sil
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              {group.values.map(val => (
                <span key={val.id} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full flex items-center gap-1">
                  {val.value}
                  <button type="button" onClick={() => removeValueFromGroup(group.id, val.id)} className="hover:text-red-500 ml-1">✕</button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Seçenek Ekle (Enter'a bas)"
                className="px-3 py-1 text-sm border border-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none w-48"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addValueToGroup(group.id, e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-center mb-6">
        <button
          type="button"
          onClick={addGroup}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          + Yeni Özellik Grubu Ekle
        </button>

        <button
          type="button"
          onClick={generateCombinations}
          className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm"
        >
          Kombinasyon Oluştur ⚡
        </button>
      </div>

      {/* DETAYLI VARYASYON SATIRLARI BÖLÜMÜ */}
      {variantRows.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-gray-800">📋 Oluşan Kombinasyonlar</h3>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
              Kombinasyon Sayısı: {variantRows.length}
            </span>
          </div>
          
          <div className="space-y-4">
            {variantRows.map((row) => (
              <div key={row.id} className="relative p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
                <button
                  type="button"
                  onClick={() => removeVariantRow(row.id, row.combination)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                  title="Bu kombinasyonu sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 mb-4 gap-4 pr-8">
                  <h4 className="font-bold text-gray-800 text-sm md:text-base">{row.combination}</h4>
                  
                  <label className="flex items-center cursor-pointer bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                    <input 
                      type="checkbox" 
                      checked={row.isActive}
                      onChange={(e) => updateVariantRow(row.id, "isActive", e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" 
                    />
                    <span className="ml-2 text-sm font-bold text-gray-700 select-none">Satışta</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Fiyat (₺)</label>
                    <input 
                      type="number" step="0.01" 
                      value={row.price} onChange={(e) => updateVariantRow(row.id, "price", e.target.value)}
                      placeholder="Boşsa ana fiyat" 
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">İndirimli Fiyat (₺)</label>
                    <input 
                      type="number" step="0.01" 
                      value={row.discountedPrice} onChange={(e) => updateVariantRow(row.id, "discountedPrice", e.target.value)}
                      placeholder="İsteğe bağlı" 
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Stok</label>
                    <input 
                      type="number" 
                      value={row.stock} onChange={(e) => updateVariantRow(row.id, "stock", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">SKU (Stok Kodu)</label>
                    <input 
                      type="text" 
                      value={row.sku} onChange={(e) => updateVariantRow(row.id, "sku", e.target.value)}
                      placeholder="Örn: SYH-128" 
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
