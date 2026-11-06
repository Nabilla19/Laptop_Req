"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatEuro, CRITERIA_NAMES } from "@/lib/constants";
import {
  BarChart2,
  RotateCcw,
  AlertTriangle,
  Laptop,
  Tag,
  SlidersHorizontal,
  Layers,
  FileText,
  ArrowRight,
  Sparkles,
  Check,
  GraduationCap,
  Palette,
  Gamepad2,
  Plane,
} from "lucide-react";

interface StatsData {
  totalLaptops: number;
  totalBrands: number;
  totalCriteria: number;
  totalPresets: number;
  totalHistory: number;
  latestHistory: {
    id: string;
    calculatedAt: string;
    usageType: string | null;
    budgetMax: number | null;
    totalAlternatives: number;
    weightsUsed: string;
    items: {
      rank: number;
      sawScore: number;
      laptop: { company: string; product: string } | null;
    }[];
  }[];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const USAGE_LABELS: Record<string, string> = {
  kuliah_umum: "Kuliah Umum",
  pemrograman: "Pemrograman",
  desain_grafis: "Desain Grafis",
  gaming: "Gaming",
  mobilitas_tinggi: "Mobilitas Tinggi",
};

const USAGE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  kuliah_umum: GraduationCap,
  pemrograman: Laptop,
  desain_grafis: Palette,
  gaming: Gamepad2,
  mobilitas_tinggi: Plane,
};

export default function ReportsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat laporan");
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[10px] shadow-[6px_6px_0px_#171717] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F4D35E] border border-[#171717] rounded-[4px] font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">
              <BarChart2 size={14} strokeWidth={2.5} /> Analitik Sistem
            </div>
            <h1 className="font-['Space_Grotesk',sans-serif] text-2xl md:text-3xl font-extrabold text-[#171717] uppercase tracking-tight">
              Laporan &amp; Ringkasan Statistik
            </h1>
            <p className="font-['Inter',sans-serif] text-xs md:text-sm text-[#666666] mt-1 max-w-2xl">
              Tinjauan metrik dataset laptop, distribusi kriteria, performa kalkulasi, serta catatan metodologis algoritma SAW.
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="neo-btn-secondary px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2 self-start md:self-auto"
          >
            <RotateCcw size={14} /> Segarkan Data
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#FF9B85] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-4 text-xs font-bold text-[#171717] flex items-center gap-3">
          <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-12 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#171717] border-t-[#F4D35E] rounded-full animate-spin mb-3" />
          <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717]">
            Menyusun laporan data...
          </p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* 5 Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 md:gap-4">
            {[
              {
                label: "Total Laptop",
                value: stats.totalLaptops.toLocaleString("id-ID"),
                sub: "unit dalam database",
                color: "bg-[#F4D35E]", // Butter Yellow
                Icon: Laptop,
              },
              {
                label: "Merek Produsen",
                value: stats.totalBrands.toString(),
                sub: "brand vendor unik",
                color: "bg-[#B8E0D2]", // Mint Green
                Icon: Tag,
              },
              {
                label: "Kriteria SAW",
                value: stats.totalCriteria.toString(),
                sub: "C1 s/d C5 aktif",
                color: "bg-[#C9B8F5]", // Lavender
                Icon: SlidersHorizontal,
              },
              {
                label: "Preset Profil",
                value: stats.totalPresets.toString(),
                sub: "profil pembobotan",
                color: "bg-[#FFFFFF]",
                Icon: Layers,
              },
              {
                label: "Sesi Selesai",
                value: stats.totalHistory.toString(),
                sub: "kalkulasi dieksekusi",
                color: "bg-[#FF9B85]", // Soft Coral
                Icon: FileText,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-4 flex flex-col justify-between hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#171717] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-['Space_Grotesk',sans-serif] text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                      {s.label}
                    </span>
                    <div
                      className={`w-7 h-7 ${s.color} border border-[#171717] rounded-[4px] flex items-center justify-center text-[#171717]`}
                    >
                      <s.Icon size={14} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="font-['Space_Grotesk',sans-serif] text-2xl font-black text-[#171717]">
                    {s.value}
                  </div>
                </div>
                <div className="font-['Inter',sans-serif] text-[11px] text-[#666666] mt-2 pt-2 border-t border-[#EAE8E1]">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Recommendation Activity */}
          <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] overflow-hidden">
            <div className="p-4 border-b-2 border-[#171717] bg-[#F8F7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] uppercase tracking-wide">
                  5 Sesi Rekomendasi Terakhir
                </span>
                <span className="neo-badge bg-[#F4D35E] text-[#171717]">Terbaru</span>
              </div>
              <Link
                href="/history"
                className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] hover:underline inline-flex items-center gap-1"
              >
                Lihat Semua Riwayat <ArrowRight size={14} />
              </Link>
            </div>

            {stats.latestHistory.length > 0 ? (
              <div className="divide-y-2 divide-[#171717]">
                {stats.latestHistory.map((h) => {
                  const weights = JSON.parse(h.weightsUsed) as Record<string, number>;
                  const topLaptop = h.items[0];

                  return (
                    <div
                      key={h.id}
                      className="p-4 hover:bg-[#F8F7F2] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex items-start md:items-center gap-3">
                        <div className="w-8 h-8 bg-[#F4D35E] border-2 border-[#171717] rounded-[4px] flex items-center justify-center shrink-0">
                          <Sparkles size={16} strokeWidth={2.5} className="text-[#171717]" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717]">
                              {topLaptop?.laptop
                                ? `${topLaptop.laptop.company} ${topLaptop.laptop.product}`
                                : "—"}
                            </span>
                            {h.usageType && (
                              <span className="neo-badge bg-[#B8E0D2] text-[#171717] inline-flex items-center gap-1">
                                {USAGE_ICONS[h.usageType] && (() => {
                                  const Icon = USAGE_ICONS[h.usageType];
                                  return <Icon size={12} />;
                                })()}
                                {USAGE_LABELS[h.usageType] ?? h.usageType}
                              </span>
                            )}
                            {h.budgetMax && (
                              <span className="neo-badge bg-[#EAE8E1] text-[#171717]">
                                ≤ {formatEuro(h.budgetMax)}
                              </span>
                            )}
                          </div>
                          <p className="font-['Inter',sans-serif] text-[11px] text-[#666666]">
                            {formatDate(h.calculatedAt)} · {h.totalAlternatives.toLocaleString("id-ID")} alternatif diuji
                          </p>
                        </div>
                      </div>

                      {/* Weight Mini Badges */}
                      <div className="flex items-center gap-1.5 self-start md:self-auto border-t md:border-t-0 pt-2 md:pt-0 border-[#EAE8E1]">
                        {Object.entries(weights).map(([code, w]) => (
                          <div
                            key={code}
                            className="bg-[#FFFFFF] border border-[#171717] rounded-[3px] px-1.5 py-0.5 text-center"
                          >
                            <span className="text-[9px] text-[#666666] block leading-none">{code}</span>
                            <span className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold text-[#171717]">
                              {(w * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#666666]">
                Belum ada riwayat kalkulasi tersimpan.
              </div>
            )}
          </div>

          {/* Reference Table for Criteria */}
          <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
            <h2 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] uppercase tracking-wide mb-3">
              Kamus &amp; Definisi Kriteria SAW
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#171717] bg-[#F8F7F2]">
                    <th className="p-2.5 font-['Space_Grotesk',sans-serif] font-bold">Kode</th>
                    <th className="p-2.5 font-['Space_Grotesk',sans-serif] font-bold">Nama Kriteria</th>
                    <th className="p-2.5 font-['Space_Grotesk',sans-serif] font-bold text-center">Tipe</th>
                    <th className="p-2.5 font-['Space_Grotesk',sans-serif] font-bold">Deskripsi Atribut</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b border-[#171717]">
                  {Object.entries(CRITERIA_NAMES).map(([code, name]) => {
                    const isCost = code === "C1" || code === "C5";
                    return (
                      <tr key={code} className="hover:bg-[#F8F7F2]">
                        <td className="p-2.5 font-bold font-['Space_Grotesk',sans-serif]">
                          <span className="px-2 py-0.5 bg-[#F4D35E] border border-[#171717] rounded-[4px]">
                            {code}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-[#171717]">{name}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`neo-badge ${
                              isCost ? "bg-[#FF9B85] text-[#171717]" : "bg-[#B8E0D2] text-[#171717]"
                            }`}
                          >
                            {isCost ? "COST (↓)" : "BENEFIT (↑)"}
                          </span>
                        </td>
                        <td className="p-2.5 text-[#666666]">
                          {code === "C1" && "Harga laptop dalam Euro (€). Semakin murah harga alternatif, semakin tinggi nilai preferensinya."}
                          {code === "C2" && "Skor heuristik prosesor (0–100) berdasarkan generasi & frekuensi CPU. Semakin tinggi semakin baik."}
                          {code === "C3" && "Kapasitas RAM dalam Gigabyte (GB). Semakin besar RAM semakin tinggi kemampuan multitasking."}
                          {code === "C4" && "Total kapasitas media penyimpanan dalam Gigabyte (GB). Semakin lega kapasitas semakin baik."}
                          {code === "C5" && "Berat fisik laptop dalam Kilogram (kg). Semakin ringan semakin tinggi nilai portabilitasnya."}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formula & Method Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Mathematical Model */}
            <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
              <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-[#F4D35E] border border-[#171717] rounded-[4px] flex items-center justify-center font-bold text-xs">
                  ∑
                </span>
                Model Matematis SAW
              </h3>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="bg-[#F8F7F2] border border-[#171717] rounded-[6px] p-3">
                  <p className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase text-[#666666] mb-1">
                    Normalisasi Benefit
                  </p>
                  <p className="font-bold text-[#171717]">r_ij = x_ij / max(x_j)</p>
                </div>

                <div className="bg-[#F8F7F2] border border-[#171717] rounded-[6px] p-3">
                  <p className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase text-[#666666] mb-1">
                    Normalisasi Cost
                  </p>
                  <p className="font-bold text-[#171717]">r_ij = min(x_j) / x_ij</p>
                </div>

                <div className="bg-[#F4D35E] border border-[#171717] rounded-[6px] p-3">
                  <p className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase text-[#171717] mb-1">
                    Skor Preferensi Terbobot (V_i)
                  </p>
                  <p className="font-bold text-[#171717]">V_i = ∑ (w_j × r_ij)</p>
                </div>
              </div>
            </div>

            {/* Methodological Notes */}
            <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
              <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] uppercase tracking-wide mb-3">
                Catatan Metodologis
              </h3>
              <ul className="space-y-2.5 text-xs text-[#666666]">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-[#B8E0D2] border border-[#171717] rounded-[3px] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} strokeWidth={3} className="text-[#171717]" />
                  </span>
                  <span>
                    <strong>Simple Additive Weighting (SAW)</strong> dikenal sebagai metode penjumlahan terbobot. Konsep dasarnya adalah mencari penjumlahan terbobot dari rating kinerja pada setiap alternatif pada semua atribut.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-[#B8E0D2] border border-[#171717] rounded-[3px] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} strokeWidth={3} className="text-[#171717]" />
                  </span>
                  <span>
                    Skor prosesor (C2) dihitung secara <strong>heuristik</strong> berbasis ekstraksi keluarga CPU, seri, dan clockspeed.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-[#B8E0D2] border border-[#171717] rounded-[3px] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={10} strokeWidth={3} className="text-[#171717]" />
                  </span>
                  <span>
                    Total seluruh bobot kriteria harus tepat berjumlah <strong>1.0 (100%)</strong> agar hasil pemeringkatan proporsional dan tidak bias.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
