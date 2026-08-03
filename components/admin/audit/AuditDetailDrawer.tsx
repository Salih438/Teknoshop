"use client";

import { useEffect } from "react";

export interface AuditDetailDrawerData {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

interface AuditDetailDrawerProps {
  log: AuditDetailDrawerData | null;
  isOpen: boolean;
  onClose: () => void;
}

const RISK_BADGES = {
  LOW: { label: "LOW RISK", bg: "bg-green-100 border-green-200 text-green-800", icon: "🟢" },
  MEDIUM: { label: "MEDIUM RISK", bg: "bg-amber-100 border-amber-200 text-amber-800", icon: "🟡" },
  HIGH: { label: "HIGH RISK", bg: "bg-orange-100 border-orange-200 text-orange-800", icon: "🟠" },
  CRITICAL: { label: "CRITICAL RISK", bg: "bg-red-100 border-red-200 text-red-800 animate-pulse", icon: "🔴" },
};

export default function AuditDetailDrawer({ log, isOpen, onClose }: AuditDetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const risk = RISK_BADGES[log.riskLevel] || RISK_BADGES.LOW;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left">
      {/* MOBİL VE MASAÜSTÜ ARKA PLAN OVERLAY */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        {/* 🚀 KAYAR AUDIT DRAWER PANELİ (DESKTOP SAĞ, MOBİL TAM GENİŞLİK / BOTTOM SHEET) */}
        <div className="w-screen max-w-md md:max-w-xl bg-white shadow-2xl border-l border-gray-200 pointer-events-auto flex flex-col justify-between rounded-l-3xl animate-in slide-in-from-right duration-300">
          
          {/* DRAWER HEADER */}
          <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between rounded-tl-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white font-black text-xl flex items-center justify-center shadow-md">
                🛡️
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-black text-gray-900 text-sm sm:text-base uppercase tracking-wider">{log.action}</h3>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${risk.bg}`}>
                    {risk.icon} {risk.label}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 font-medium">Log ID: {log.id.slice(0, 12)}...</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-xs transition"
            >
              ✕
            </button>
          </div>

          {/* DRAWER İÇERİK LİSTESİ */}
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-xs">
            
            {/* YÖNETİCİ VE METADATA KARTLARI */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 font-medium">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">İşlemi Yapan Admin:</span>
                <span className="font-extrabold text-gray-900">{log.adminName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Admin E-Posta:</span>
                <span className="font-bold text-blue-600">{log.adminEmail || "Bilinmiyor"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Etkilenen Kayıt (Entity):</span>
                <span className="font-bold text-gray-900">{log.entityType} • {log.entityName || log.entityId || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Tarih & Saat:</span>
                <span className="font-mono font-bold text-gray-800">{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">IP Adresi:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-800 font-bold">{log.ipAddress || "127.0.0.1"}</span>
              </div>
            </div>

            {/* 🚀 DEĞİŞİKLİK DİFF BİLEŞENİ (CHANGE DIFF VIEWER) */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>🔄</span> Veri Değişiklik Analizi (JSON Diff)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* ESKİ DEĞER (OLD VALUE) */}
                <div className="bg-red-50/70 border border-red-200 p-3.5 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-black text-red-700 uppercase tracking-wider block">- ESKİ DEĞER (OLD VALUE)</span>
                  {log.oldValue ? (
                    <pre className="font-mono text-[11px] text-red-900 whitespace-pre-wrap break-all bg-white/70 p-2 rounded-xl border border-red-100 overflow-x-auto">
                      {JSON.stringify(log.oldValue, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-[11px] text-red-400 font-medium">Eski değer kaydı yok (Yeni Kayıt).</p>
                  )}
                </div>

                {/* YENİ DEĞER (NEW VALUE) */}
                <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">+ YENİ DEĞER (NEW VALUE)</span>
                  {log.newValue ? (
                    <pre className="font-mono text-[11px] text-emerald-900 whitespace-pre-wrap break-all bg-white/70 p-2 rounded-xl border border-emerald-100 overflow-x-auto">
                      {JSON.stringify(log.newValue, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-[11px] text-emerald-400 font-medium">Yeni değer kaydı yok (Silme İşlemi).</p>
                  )}
                </div>

              </div>
            </div>

            {/* BROWSER USER AGENT */}
            {log.userAgent && (
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-1">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Tarayıcı & Cihaz (User Agent)</span>
                <p className="font-mono text-[10px] text-gray-600 break-all">{log.userAgent}</p>
              </div>
            )}

          </div>

          {/* DRAWER FOOTER */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3 rounded-bl-3xl">
            <button
              onClick={onClose}
              className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition flex-1 text-center min-h-[44px]"
            >
              Kapat
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
