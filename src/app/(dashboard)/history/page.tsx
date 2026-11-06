"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CRITERIA_NAMES, formatEuro } from "@/lib/constants";
import {
  FileText,
  AlertTriangle,
  Star,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Trash2,
  GraduationCap,
  Laptop,
  Palette,
  Gamepad2,
  Plane,
} from "lucide-react";

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
      setHistories(data.data);
      setPagination(data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus riwayat sesi kalkulasi ini? Data rekomendasi terkait akan dihapus.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal menghapus riwayat");
      }
      setHistories((prev) => prev.filter((h) => h.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[10px] shadow-[6px_6px_0px_#171717] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F4D35E] border border-[#171717] rounded-[4px] font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">
              <FileText size={14} strokeWidth={2.5} /> Log Aktivitas
            </div>
            <h1 className="font-['Space_Grotesk',sans-serif] text-2xl md:text-3xl font-extrabold text-[#171717] uppercase tracking-tight">
              Riwayat Sesi Rekomendasi
            </h1>
            <p className="font-['Inter',sans-serif] text-xs md:text-sm text-[#666666] mt-1 max-w-2xl">
              Arsip seluruh kalkulasi SAW yang telah dieksekusi sebelumnya. Periksa bobot yang digunakan dan daftar laptop pemenang rekomendasi.
            </p>
          </div>
          <Link
            href="/recommendation"
            className="neo-btn-primary px-5 py-2.5 text-xs inline-flex items-center gap-2 self-start md:self-auto"
          >
            <Star size={14} fill="#F4D35E" stroke="#171717" /> Jalankan Kalkulasi Baru
          </Link>
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
            Memuat arsip riwayat...
          </p>
        </div>
      ) : histories.length === 0 ? (
        <div className="bg-[#FFFFFF] border-2 border-dashed border-[#171717] rounded-[8px] p-12 text-center">
          <div className="w-16 h-16 bg-[#F4D35E] border-2 border-[#171717] rounded-[8px] shadow-[3px_3px_0px_#171717] flex items-center justify-center mx-auto mb-4">
            <Clock size={28} strokeWidth={2.5} className="text-[#171717]" />
          </div>
          <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#171717] mb-2">
            Belum Ada Riwayat Rekomendasi
          </h3>
          <p className="font-['Inter',sans-serif] text-xs text-[#666666] max-w-sm mx-auto mb-4 leading-relaxed">
            Jalankan kalkulasi pertama Anda pada halaman Rekomendasi untuk mulai mencatat riwayat perankingan.
          </p>
          <Link
            href="/recommendation"
            className="neo-btn-primary px-5 py-2.5 text-xs inline-flex items-center gap-2"
          >
            Mulai Rekomendasi Sekarang <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {histories.map((entry) => {
            const weights = JSON.parse(entry.weightsUsed) as Record<string, number>;
            const isExpanded = expanded === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] overflow-hidden transition-all"
              >
                {/* Entry Summary Card Header */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                  className="w-full text-left p-4 md:p-5 hover:bg-[#F8F7F2] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start md:items-center gap-3.5">
                    {/* Rank 1 Badge */}
                    <div className="w-10 h-10 bg-[#F4D35E] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] rounded-[6px] flex items-center justify-center shrink-0">
                      <span className="font-['Space_Grotesk',sans-serif] font-black text-sm text-[#171717]">
                        #{entry.items[0]?.rank ?? "1"}
                      </span>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-['Space_Grotesk',sans-serif] text-sm md:text-base font-bold text-[#171717]">
                          {entry.items[0]?.laptop.company}{" "}
                          {entry.items[0]?.laptop.product}
                        </p>
                        {entry.usageType && (
                          <span className="neo-badge bg-[#B8E0D2] text-[#171717] inline-flex items-center gap-1.5">
                            {USAGE_ICONS[entry.usageType] && (() => {
                              const Icon = USAGE_ICONS[entry.usageType];
                              return <Icon size={12} />;
                            })()}
                            {USAGE_LABELS[entry.usageType] ?? entry.usageType}
                          </span>
                        )}
                        {entry.budgetMax && (
                          <span className="neo-badge bg-[#EAE8E1] text-[#171717]">
                            ≤ {formatEuro(entry.budgetMax)}
                          </span>
                        )}
                      </div>
                      <p className="font-['Inter',sans-serif] text-xs text-[#666666]">
                        {formatDate(entry.calculatedAt)} · {entry.totalAlternatives.toLocaleString("id-ID")} alternatif dianalisis
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-[#EAE8E1]">
                    <div className="text-left md:text-right">
                      <span className="font-['Inter',sans-serif] text-[10px] text-[#666666] block">
                        Skor Tertinggi
                      </span>
                      <span className="font-['Space_Grotesk',sans-serif] text-sm font-extrabold text-[#171717]">
                        {entry.items[0]?.sawScore.toFixed(4) ?? "—"}
                      </span>
                    </div>

                    <div className="w-7 h-7 bg-[#EAE8E1] border border-[#171717] rounded-[4px] flex items-center justify-center text-[#171717]">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t-2 border-[#171717] bg-[#F8F7F2] p-4 md:p-6 space-y-5">
                    {/* Weight Breakdown */}
                    <div>
                      <h4 className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#666666] mb-2.5">
                        Bobot Kriteria yang Digunakan
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {Object.entries(weights).map(([code, w]) => (
                          <div
                            key={code}
                            className="bg-[#FFFFFF] border border-[#171717] rounded-[6px] p-2 text-center"
                          >
                            <span className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold text-[#666666]">
                              {code} ({CRITERIA_NAMES[code]})
                            </span>
                            <div className="font-['Space_Grotesk',sans-serif] text-base font-black text-[#171717]">
                              {(w * 100).toFixed(0)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Result Items */}
                    <div>
                      <h4 className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#666666] mb-2.5">
                        Top {entry.items.length} Laptop Terpilih
                      </h4>
                      <div className="space-y-2">
                        {entry.items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[6px] p-3.5 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-7 h-7 rounded-[4px] border border-[#171717] flex items-center justify-center font-['Space_Grotesk',sans-serif] text-xs font-bold shrink-0 ${
                                  item.rank === 1
                                    ? "bg-[#F4D35E]"
                                    : item.rank === 2
                                    ? "bg-[#EAE8E1]"
                                    : item.rank === 3
                                    ? "bg-[#FF9B85]"
                                    : "bg-[#FFFFFF]"
                                }`}
                              >
                                #{item.rank}
                              </span>
                              <div className="min-w-0">
                                <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] truncate">
                                  {item.laptop.company} {item.laptop.product}
                                </p>
                                <div className="flex flex-wrap gap-2 text-[11px] text-[#666666] mt-0.5">
                                  <span>RAM {item.laptop.ram}GB</span>
                                  <span>•</span>
                                  <span>{item.laptop.weight}kg</span>
                                  <span>•</span>
                                  <span>CPU {item.laptop.cpuScore ?? "?"}/100</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="font-['Space_Grotesk',sans-serif] text-xs font-extrabold text-[#171717]">
                                {formatEuro(item.laptop.priceEuros)}
                              </p>
                              <span className="font-['Space_Grotesk',sans-serif] text-[11px] font-bold text-[#171717] px-1.5 py-0.5 bg-[#F4D35E] border border-[#171717] rounded-[3px]">
                                Skor: {item.sawScore.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delete Action */}
                    <div className="flex justify-end pt-2 border-t border-[#D6D3CB]">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                        className="neo-btn-coral px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        <span>{deleting === entry.id ? "Menghapus..." : "Hapus Riwayat Sesi Ini"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#666666]">
            Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} sesi tersimpan)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="neo-btn-secondary px-3.5 py-1.5 text-xs font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="neo-btn-secondary px-3.5 py-1.5 text-xs font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              Berikutnya <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
