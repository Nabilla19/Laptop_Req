"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Laptop,
  Tag,
  BarChart2,
  Clock,
  Database,
  SlidersHorizontal,
  Star,
  ArrowRight,
  DollarSign,
  Cpu,
  HardDrive,
  Weight,
  MemoryStick,
} from "lucide-react";

interface Stats {
  totalLaptops: number;
  totalBrands: number;
  totalCriteria: number;
  totalHistory: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalLaptops: 0,
    totalBrands: 0,
    totalCriteria: 0,
    totalHistory: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Failed to load stats", e);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  const statCards = [
    {
      label: "Total Laptop",
      value: loading ? "..." : stats.totalLaptops.toLocaleString("id-ID"),
      sub: "dataset tersedia",
      Icon: Laptop,
      accent: "bg-[#F4D35E]",
    },
    {
      label: "Merek Laptop",
      value: loading ? "..." : stats.totalBrands.toString(),
      sub: "produsen terdaftar",
      Icon: Tag,
      accent: "bg-[#B8E0D2]",
    },
    {
      label: "Kriteria SAW",
      value: loading ? "..." : stats.totalCriteria.toString(),
      sub: "C1 s/d C5 aktif",
      Icon: BarChart2,
      accent: "bg-[#C9B8F5]",
    },
    {
      label: "Riwayat Sesi",
      value: loading ? "..." : stats.totalHistory.toString(),
      sub: "kalkulasi tersimpan",
      Icon: Clock,
      accent: "bg-[#FF9B85]",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[10px] shadow-[6px_6px_0px_#171717] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F4D35E] border border-[#171717] rounded-[4px] font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#171717] mb-3">
              <Star size={12} strokeWidth={2.5} fill="#171717" /> Sistem Pendukung Keputusan
            </div>
            <h1 className="font-['Space_Grotesk',sans-serif] text-2xl md:text-4xl font-extrabold text-[#171717] uppercase tracking-tight leading-tight">
              Rekomendasi Laptop Terbaik
            </h1>
            <p className="font-['Inter',sans-serif] text-sm md:text-base text-[#666666] mt-2 max-w-2xl">
              Evaluasi multikriteria berbasis metode{" "}
              <strong className="text-[#171717]">Simple Additive Weighting (SAW)</strong> untuk membantu Anda menemukan laptop ideal berdasarkan kebutuhan dan anggaran.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/recommendation"
              className="neo-btn-primary px-6 py-3 text-sm inline-flex items-center gap-2"
            >
              <Star size={14} strokeWidth={2.5} /> Mulai Hitung SAW
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#171717] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#666666]">
                {card.label}
              </span>
              <div
                className={`w-9 h-9 ${card.accent} border-2 border-[#171717] rounded-[6px] shadow-[2px_2px_0px_#171717] flex items-center justify-center`}
              >
                <card.Icon size={16} strokeWidth={2.5} />
              </div>
            </div>
            <div className="font-['Space_Grotesk',sans-serif] text-3xl font-extrabold text-[#171717] mb-1">
              {card.value}
            </div>
            <p className="font-['Inter',sans-serif] text-xs text-[#666666]">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-['Space_Grotesk',sans-serif] text-lg md:text-xl font-bold text-[#171717] uppercase tracking-wide">
            Akses Cepat Modul
          </h2>
          <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#666666] uppercase">
            Fitur Utama
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              href: "/laptops",
              label: "Data Laptop",
              desc: "Telusuri, filter & kelola katalog dataset laptop",
              Icon: Database,
              badge: "Dataset",
            },
            {
              href: "/criteria",
              label: "Kriteria SAW",
              desc: "Atur bobot kriteria C1 s/d C5 sesuai kebutuhan",
              Icon: SlidersHorizontal,
              badge: "Bobot",
            },
            {
              href: "/recommendation",
              label: "Kalkulasi Rekomendasi",
              desc: "Pilih profil atau kustomisasi bobot untuk ranking",
              Icon: Star,
              accent: "bg-[#F4D35E]",
              badge: "SAW Core",
            },
            {
              href: "/history",
              label: "Riwayat Sesi",
              desc: "Periksa kembali kalkulasi dan ranking terdahulu",
              Icon: Clock,
              badge: "Log",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#171717] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${action.accent ?? "bg-[#EAE8E1]"} border-2 border-[#171717] rounded-[6px] shadow-[2px_2px_0px_#171717] flex items-center justify-center`}>
                    <action.Icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="neo-badge bg-[#EAE8E1] text-[#171717]">
                    {action.badge}
                  </span>
                </div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-[#171717] mb-1.5 group-hover:underline">
                  {action.label}
                </h3>
                <p className="font-['Inter',sans-serif] text-xs text-[#666666] leading-relaxed">
                  {action.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#EAE8E1] flex items-center justify-between text-xs font-bold font-['Space_Grotesk',sans-serif]">
                <span>Buka Modul</span>
                <ArrowRight size={14} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 5 Kriteria Quick Overview */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-[#171717] uppercase tracking-wide">
              5 Kriteria Penilaian SAW
            </h3>
            <p className="font-['Inter',sans-serif] text-xs text-[#666666]">
              Setiap alternatif laptop dinilai berdasarkan matriks normalisasi berikut
            </p>
          </div>
          <Link
            href="/criteria"
            className="neo-btn-secondary px-3.5 py-1.5 text-xs inline-flex items-center gap-1.5 self-start"
          >
            <span>Atur Bobot</span> →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { code: "C1", name: "Harga", type: "Cost", defaultWeight: "30%", desc: "Semakin murah semakin baik", color: "bg-[#FF9B85]", Icon: DollarSign },
            { code: "C2", name: "Performa CPU", type: "Benefit", defaultWeight: "25%", desc: "Skor heuristik performa prosesor", color: "bg-[#B8E0D2]", Icon: Cpu },
            { code: "C3", name: "Kapasitas RAM", type: "Benefit", defaultWeight: "20%", desc: "Multitasking & kelancaran aplikasi", color: "bg-[#B8E0D2]", Icon: MemoryStick },
            { code: "C4", name: "Kapasitas Storage", type: "Benefit", defaultWeight: "15%", desc: "Penyimpanan SSD / HDD (GB)", color: "bg-[#B8E0D2]", Icon: HardDrive },
            { code: "C5", name: "Berat Laptop", type: "Cost", defaultWeight: "10%", desc: "Semakin ringan semakin portabel", color: "bg-[#FF9B85]", Icon: Weight },
          ].map((c) => (
            <div
              key={c.code}
              className="bg-[#F8F7F2] border-2 border-[#171717] rounded-[6px] p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-['Space_Grotesk',sans-serif] font-bold text-xs px-2 py-0.5 bg-[#FFFFFF] border border-[#171717] rounded-[4px]">
                    {c.code}
                  </span>
                  <span
                    className={`font-['Space_Grotesk',sans-serif] text-[10px] font-bold px-2 py-0.5 border border-[#171717] rounded-[4px] ${c.color}`}
                  >
                    {c.type}
                  </span>
                </div>
                <div className={`w-7 h-7 ${c.color} border border-[#171717] rounded-[4px] flex items-center justify-center mb-1.5`}>
                  <c.Icon size={14} strokeWidth={2.5} />
                </div>
                <h4 className="font-['Space_Grotesk',sans-serif] font-bold text-sm text-[#171717] mb-1">
                  {c.name}
                </h4>
                <p className="font-['Inter',sans-serif] text-[11px] text-[#666666] leading-snug">
                  {c.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#D6D3CB] flex items-center justify-between text-xs">
                <span className="text-[#666666] text-[11px]">Bobot Default</span>
                <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#171717]">
                  {c.defaultWeight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured CTA Banner */}
      <div className="bg-[#F4D35E] border-2 border-[#171717] rounded-[10px] shadow-[6px_6px_0px_#171717] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="neo-badge bg-[#FFFFFF] text-[#171717] mb-2">
              Langkah Berikutnya
            </span>
            <h3 className="font-['Space_Grotesk',sans-serif] text-xl md:text-2xl font-black text-[#171717] uppercase tracking-tight">
              Ingin Menemukan Laptop Paling Tepat?
            </h3>
            <p className="font-['Inter',sans-serif] text-xs md:text-sm text-[#171717]/85 mt-2 leading-relaxed">
              Gunakan wizard rekomendasi interaktif kami. Anda bisa memilih profil siap pakai seperti Kuliah Umum, Pemrograman, Desain Grafis, Gaming, atau menyesuaikan preferensi sendiri.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/recommendation"
              className="neo-btn-primary px-6 py-3.5 text-sm inline-flex items-center gap-2 shadow-[3px_3px_0px_#171717]"
            >
              <Star size={16} fill="#F4D35E" stroke="#171717" /> Mulai Rekomendasi Sekarang
            </Link>
            <Link
              href="/reports"
              className="neo-btn-secondary px-5 py-3.5 text-sm inline-flex items-center gap-1.5"
            >
              Lihat Laporan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
