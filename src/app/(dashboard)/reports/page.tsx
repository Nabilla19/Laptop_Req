"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEuro, CRITERIA_NAMES } from "@/lib/constants";

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
  kuliah_umum: "🎓 Kuliah Umum",
  pemrograman: "💻 Pemrograman",
  desain_grafis: "🎨 Desain Grafis",
  gaming: "🎮 Gaming",
  mobilitas_tinggi: "✈️ Mobilitas Tinggi",
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
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
            Analitik
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Laporan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan statistik sistem dan aktivitas rekomendasi
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="text-xs px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
        >
          ↺ Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <svg className="w-8 h-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
          </svg>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Stat Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: "Total Laptop",
                value: stats.totalLaptops.toLocaleString("id-ID"),
                sub: "dalam database",
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                label: "Merek",
                value: stats.totalBrands.toString(),
                sub: "brand berbeda",
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Kriteria",
                value: stats.totalCriteria.toString(),
                sub: "C1 s/d C5",
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Preset",
                value: stats.totalPresets.toString(),
                sub: "profil bobot",
                color: "text-violet-600",
                bg: "bg-violet-50",
              },
              {
                label: "Sesi SAW",
                value: stats.totalHistory.toString(),
                sub: "kalkulasi dijalankan",
                color: "text-rose-600",
                bg: "bg-rose-50",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.bg} mb-3`}
                >
                  <span className={`text-xl font-bold ${s.color}`}>#</span>
                </div>
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm font-medium text-slate-700 mt-1">{s.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Aktivitas Terbaru */}
          {stats.latestHistory.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800">5 Sesi Rekomendasi Terbaru</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.latestHistory.map((h) => {
                  const weights = JSON.parse(h.weightsUsed) as Record<string, number>;
                  const topLaptop = h.items[0];
                  return (
                    <div key={h.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <span className="text-indigo-600 text-xs font-bold">✦</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                {topLaptop?.laptop
                                  ? `${topLaptop.laptop.company} ${topLaptop.laptop.product}`
                                  : "—"}
                              </p>
                              {h.usageType && (
                                <span className="text-[11px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                                  {USAGE_LABELS[h.usageType] ?? h.usageType}
                                </span>
                              )}
                              {h.budgetMax && (
                                <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                  ≤ {formatEuro(h.budgetMax)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatDate(h.calculatedAt)} · {h.totalAlternatives.toLocaleString()} alternatif
                            </p>
                          </div>
                        </div>
                        {/* Weight pills */}
                        <div className="flex gap-1.5">
                          {Object.entries(weights).map(([code, w]) => (
                            <div key={code} className="text-center">
                              <div className="text-[9px] text-slate-400">{code}</div>
                              <div className="text-[11px] font-bold text-slate-600">
                                {(w * 100).toFixed(0)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-slate-500 text-sm">
                Belum ada riwayat kalkulasi. Jalankan rekomendasi pertama di halaman{" "}
                <a href="/recommendation" className="text-indigo-600 hover:underline">
                  Rekomendasi
                </a>
                .
              </p>
            </div>
          )}

          {/* Kriteria Reference */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Referensi Kriteria SAW</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Kode", "Nama", "Tipe", "Deskripsi"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(CRITERIA_NAMES).map(([code, name]) => (
                    <tr key={code} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg">
                          {code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium text-xs">{name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            code === "C1" || code === "C5"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {code === "C1" || code === "C5" ? "Cost" : "Benefit"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {code === "C1" && "Harga laptop dalam euro. Semakin murah semakin baik."}
                        {code === "C2" && "Skor performa CPU (0–100). Semakin tinggi semakin baik."}
                        {code === "C3" && "Kapasitas RAM dalam GB. Semakin besar semakin baik."}
                        {code === "C4" && "Total kapasitas penyimpanan dalam GB."}
                        {code === "C5" && "Berat laptop dalam kg. Semakin ringan semakin baik."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formula Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900 rounded-2xl p-6 text-white">
              <h3 className="text-sm font-bold mb-4">Formula Normalisasi SAW</h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">Benefit Criteria:</p>
                  <p className="text-emerald-400">r_ij = x_ij / max(x_j)</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">Cost Criteria:</p>
                  <p className="text-amber-400">r_ij = min(x_j) / x_ij</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 text-xs mb-1">SAW Score:</p>
                  <p className="text-indigo-400">V_i = Σ(w_j × r_ij)</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Catatan Metode</h3>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span>
                    <strong>Simple Additive Weighting (SAW)</strong> adalah metode MCDM yang menjumlahkan nilai
                    berbobot dari setiap kriteria.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span>
                    Skor CPU dihitung secara <strong>heuristik</strong> berdasarkan nama CPU — bukan benchmark resmi.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span>
                    Harga asli dalam <strong>Euro (€)</strong> dari dataset Kaggle Laptop Price Dataset.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span>
                    Total bobot seluruh kriteria <strong>harus = 100%</strong> agar perhitungan valid.
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
