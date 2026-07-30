import HelpCenterClient from "@/components/support/HelpCenterClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hesabım - Destek Merkezi | Vitrin E-Ticaret",
  description: "Siparişleriniz, iade süreçleriniz ve canlı yardım hizmetiniz.",
};

export default function ProfileSupportPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HelpCenterClient />
      </div>
    </div>
  );
}
