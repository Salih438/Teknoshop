"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { submitContactAction } from "@/actions/contact";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error("Lütfen adınızı ve soyadınızı giriniz.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      toast.error("Lütfen geçerli bir e-posta adresi giriniz (ör: ahmet@example.com).");
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      toast.error("Lütfen en az 10 karakterlik bir mesaj giriniz.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Mesajınız iletiliyor...");

    try {
      const res = await submitContactAction({
        name,
        email,
        phone,
        subject,
        message,
      });

      if (res.success) {
        toast.success(res.message || "Mesajınız başarıyla iletildi!", { id: toastId });
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
      } else {
        toast.error(res.error || "Mesaj gönderilemedi.", { id: toastId });
      }
    } catch {
      toast.error("Bağlantı hatası oluştu, lütfen tekrar deneyin.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Adınız Soyadınız <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
            placeholder="Ahmet Yılmaz"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            E-Posta Adresiniz <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
            placeholder="ahmet@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Telefon Numarası <span className="text-gray-400 font-normal">(İsteğe Bağlı)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white text-sm"
            placeholder="0555 123 45 67"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Konu</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white text-sm cursor-pointer"
          >
            <option value="">Lütfen seçiniz (İsteğe Bağlı)</option>
            <option value="Siparişim Hakkında">Siparişim Hakkında</option>
            <option value="İade ve Değişim Talebi">İade ve Değişim Talebi</option>
            <option value="Teknik Destek">Teknik Destek</option>
            <option value="Öneri & Şikayet">Öneri & Şikayet</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Mesajınız <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
          required
          minLength={10}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white text-sm resize-none"
          placeholder="Mesajınızı buraya en az 10 karakter olarak yazabilirsiniz..."
        ></textarea>
        <div className="text-right text-xs text-gray-400 mt-1 font-medium">
          {message.length} karakter
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={`w-full text-white font-bold text-base py-3.5 px-6 rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer ${
          submitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
        }`}
      >
        {submitting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Gönderiliyor...</span>
          </>
        ) : (
          <span>Mesajı Gönder ✉️</span>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
        Mesajınızı göndererek Gizlilik Politikamızı ve Kişisel Verilerin Korunması aydınlatma metnini okuyup kabul etmiş sayılırsınız.
      </p>
    </form>
  );
}
