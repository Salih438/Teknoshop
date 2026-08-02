"use client";

import { useUser, SignOutButton, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AccountPopoverProps {
  onClose?: () => void;
}

interface UserProfileResponse {
  name?: string;
  email?: string;
  avatarUrl?: string;
  _count?: {
    orders?: number;
    returns?: number;
    exchanges?: number;
  };
}

export default function AccountPopover({ onClose }: AccountPopoverProps) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const router = useRouter();

  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setProfileData(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const displayName =
    profileData?.name ||
    user?.fullName ||
    user?.firstName ||
    "Değerli Müşterimiz";

  const displayEmail =
    profileData?.email ||
    user?.primaryEmailAddress?.emailAddress ||
    "";

  const displayAvatar =
    profileData?.avatarUrl || user?.imageUrl || "";

  const ordersCount = profileData?._count?.orders ?? 0;
  const returnsCount = (profileData?._count?.returns ?? 0) + (profileData?._count?.exchanges ?? 0);

  const handleEditProfile = () => {
    onClose?.();
    if (typeof openUserProfile === "function") {
      try {
        openUserProfile();
        return;
      } catch (e) {}
    }
    router.push("/profile?tab=settings");
  };

  return (
    <div
      role="dialog"
      aria-label="Kullanıcı Menüsü"
      className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white shadow-2xl rounded-2xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200 p-4 text-xs sm:text-sm text-gray-800"
    >
      {/* a) ÜST KULLANICI BİLGİ ALANI */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 border border-blue-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-base">
            {displayAvatar ? (
              <Image
                src={displayAvatar}
                alt={displayName}
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            ) : (
              <span>{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-gray-900 text-sm truncate">{displayName}</p>
            <p className="text-[11px] text-gray-400 font-medium truncate">{displayEmail}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEditProfile}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer"
          title="Profili Düzenle"
          aria-label="Profili Düzenle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>

      {/* b) İSTATİSTİK HIZLI BAKIŞ ŞERİDİ (Mini Stat Cards - Dinamik Veri) */}
      <div className="my-3 grid grid-cols-2 gap-2 bg-gray-50/80 p-2 rounded-xl border border-gray-100/80 text-center">
        <Link
          href="/profile?tab=orders"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white transition-colors group"
        >
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Siparişlerim</span>
          <span className="font-extrabold text-blue-600 text-xs">
            {ordersCount} Sipariş
          </span>
        </Link>
        <Link
          href="/profile?tab=returns"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white transition-colors group"
        >
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">İade & Değişim</span>
          <span className="font-extrabold text-amber-600 text-xs">
            {returnsCount} Talep
          </span>
        </Link>
      </div>

      {/* c) PROFİL SEKMELERİNE DOĞRUDAN ERİŞİM MENÜSÜ */}
      <div className="space-y-1">
        <Link
          href="/profile?tab=overview"
          onClick={onClose}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-700 hover:text-blue-600 text-xs"
        >
          <div className="flex items-center gap-2">
            <span>📊</span>
            <span>Genel Bakış</span>
          </div>
          <span className="text-gray-400 text-[10px] font-extrabold">&rarr;</span>
        </Link>

        <Link
          href="/profile?tab=orders"
          onClick={onClose}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-700 hover:text-blue-600 text-xs"
        >
          <div className="flex items-center gap-2">
            <span>📦</span>
            <span>Siparişlerim</span>
          </div>
          <div className="flex items-center gap-1.5">
            {ordersCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {ordersCount}
              </span>
            )}
            <span className="text-gray-400 text-[10px] font-extrabold">&rarr;</span>
          </div>
        </Link>

        <Link
          href="/profile?tab=returns"
          onClick={onClose}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-700 hover:text-blue-600 text-xs"
        >
          <div className="flex items-center gap-2">
            <span>🔄</span>
            <span>İade & Değişimlerim</span>
          </div>
          <div className="flex items-center gap-1.5">
            {returnsCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {returnsCount}
              </span>
            )}
            <span className="text-gray-400 text-[10px] font-extrabold">&rarr;</span>
          </div>
        </Link>

        <Link
          href="/favorites"
          onClick={onClose}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-700 hover:text-blue-600 text-xs"
        >
          <div className="flex items-center gap-2">
            <span>❤️</span>
            <span>Favorilerim</span>
          </div>
          <span className="text-gray-400 text-[10px] font-extrabold">&rarr;</span>
        </Link>

        <Link
          href="/profile?tab=addresses"
          onClick={onClose}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-700 hover:text-blue-600 text-xs"
        >
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>Adreslerim</span>
          </div>
          <span className="text-gray-400 text-[10px] font-extrabold">&rarr;</span>
        </Link>

        <Link
          href="/profile?tab=settings"
          onClick={onClose}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors font-bold text-gray-700 hover:text-blue-600 text-xs"
        >
          <div className="flex items-center gap-2">
            <span>⚙️</span>
            <span>Hesap Ayarları</span>
          </div>
          <span className="text-gray-400 text-[10px] font-extrabold">&rarr;</span>
        </Link>
      </div>

      {/* d) ALT ÇIKIŞ ALANI */}
      <div className="border-t border-gray-100 mt-3 pt-3">
        <SignOutButton>
          <button
            onClick={onClose}
            className="text-rose-600 hover:bg-rose-50 w-full rounded-xl py-2 px-3 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>🚪</span>
              <span>Çıkış Yap</span>
            </div>
            <span>➔</span>
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
