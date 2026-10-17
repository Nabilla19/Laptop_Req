"use client";

import { useState, useEffect, useCallback } from "react";
import { CRITERIA_NAMES, formatEuro } from "@/lib/constants";

interface HistoryItem {
  id: string;
  rank: number;
  sawScore: number;
  laptop: {
    company: string;
    product: string;
    priceEuros: number;
    ram: number;
    weight: number;
    cpuScore: number | null;
  };
}

interface HistoryEntry {
  id: string;
  calculatedAt: string;
  budgetMax: number | null;
  usageType: string | null;
  presetUsed: string | null;
  totalAlternatives: number;
  weightsUsed: string;
  items: HistoryItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const USAGE_LABELS: Record<string, string> = {
  kuliah_umum: "🎓 Kuliah Umum",
  pemrograman: "💻 Pemrograman",
  desain_grafis: "🎨 Desain Grafis",
  gaming: "🎮 Gaming",
  mobilitas_tinggi: "✈️ Mobilitas Tinggi",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function HistoryPage() {
  const [histories, setHistories] = useState<HistoryEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/history?page=${page}&limit=10`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat riwayat");
      setHistories(data.data ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      fetchHistory();
    } catch {
      alert("Gagal menghapus riwayat");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
          Log
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Riwayat Rekomendasi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Semua sesi perhitungan SAW yang pernah dijalankan
        </p>
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
      ) : histories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-4xl mb-4">◷</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">Belum Ada Riwayat</h3>
          <p className="text-sm text-slate-400">
            Jalankan rekomendasi di halaman{" "}
            <a href="/recommendation" className="text-indigo-600 hover:underline">
              Rekomendasi
            </a>{" "}
            untuk mulai menyimpan riwayat.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {histories.map((entry) => {
            const weights = JSON.parse(entry.weightsUsed) as Record<string, number>;
            const isExpanded = expanded === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                {/* Entry Header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 text-sm font-bold">
                          #{entry.items[0]?.rank ?? "?"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">
                            {entry.items[0]?.laptop.company}{" "}
                            {entry.items[0]?.laptop.product}
                          </p>
                          {entry.usageType && (
                            <span className="text-[11px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                              {USAGE_LABELS[entry.usageType] ?? entry.usageType}
                            </span>
                          )}
                          {entry.budgetMax && (
                            <span className="text-[11px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                              ≤ {formatEuro(entry.budgetMax)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(entry.calculatedAt)} ·{" "}
                          {entry.totalAlternatives.toLocaleString()} alternatif dievaluasi
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Skor #1</p>
                        <p className="text-sm font-bold text-indigo-600">
                          {entry.items[0]?.sawScore.toFixed(4) ?? "—"}
                        </p>
                      </div>
                      <span className="text-slate-400 text-sm">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    {/* Weights */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Bobot yang Digunakan
                      </p>
                      <div className="flex gap-4">
                        {Object.entries(weights).map(([code, w]) => (
                          <div key={code} className="text-center">
                            <div className="text-xs font-bold text-slate-600">{code}</div>
                            <div className="text-sm font-bold text-indigo-600">
                              {(w * 100).toFixed(0)}%
                            </div>
                            <div className="text-[10px] text-slate-400">{CRITERIA_NAMES[code]}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top items */}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Top {entry.items.length} Hasil
                    </p>
                    <div className="space-y-2 mb-4">
                      {entry.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3"
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                              item.rank === 1
                                ? "bg-amber-400 text-amber-900"
                                : item.rank === 2
                                ? "bg-slate-300 text-slate-700"
                                : item.rank === 3
                                ? "bg-orange-300 text-orange-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {item.rank}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                              {item.laptop.company} {item.laptop.product}
                            </p>
                            <div className="flex gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-500">
                                RAM {item.laptop.ram}GB
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {item.laptop.weight}kg
                              </span>
                              <span className="text-[11px] text-slate-500">
                                CPU {item.laptop.cpuScore ?? "?"}/100
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">
                              {formatEuro(item.laptop.priceEuros)}
                            </p>
                            <p className="text-[11px] text-indigo-600 font-medium">
                              {item.sawScore.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
                      >
                        {deleting === entry.id ? "Menghapus..." : "🗑 Hapus Riwayat Ini"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Halaman {pagination.page} dari {pagination.totalPages} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 disabled:opacity-40 transition-colors"
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 disabled:opacity-40 transition-colors"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
