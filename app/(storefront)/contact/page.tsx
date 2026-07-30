import React from "react";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "İletişim | Vitrin E-Ticaret",
  description: "Bize ulaşın, öneri ve şikayetlerinizi iletin.",
};

export default async function ContactPage() {
  const settings = await prisma.storeSettings.findFirst();

  const address = settings?.address || "Teknoloji Vadisi, Bilişim Plaza No:42\nLevent, Şişli / İstanbul";
  const phone = settings?.phone || "0850 123 45 67";
  const workingHours = settings?.workingHours || "Hafta içi: 09:00 - 18:00";
  const email = settings?.email || "destek@vitrin.com";

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">İletişim</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sorularınız, önerileriniz veya destek talepleriniz için bize ulaşabilirsiniz. Ekibimiz size en kısa sürede geri dönüş yapacaktır.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* İletişim Bilgileri */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Merkez Ofis</h3>
              <p className="text-gray-600 whitespace-pre-line text-sm leading-relaxed">{address}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Telefon</h3>
              <p className="text-gray-600 mb-1 text-sm font-medium">Müşteri Hizmetleri: {phone}</p>
              <p className="text-xs text-gray-500">{workingHours}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition duration-300">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">E-Posta</h3>
              <p className="text-gray-600 text-sm font-medium">{email}</p>
            </div>
          </div>

          {/* İletişim Formu */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Bize Mesaj Gönderin</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
