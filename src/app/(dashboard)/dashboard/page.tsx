import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStats() {
  try {
    const [totalLaptops, brandsRaw, totalCriteria, totalPresets, totalHistory] =
      await Promise.all([
        prisma.laptop.count(),
        prisma.laptop.findMany({ select: { company: true }, distinct: ["company"] }),
        prisma.criteria.count(),
        prisma.weightPreset.count(),
        prisma.recommendationHistory.count(),
      ]);
    return {
      totalLaptops,
      totalBrands: brandsRaw.length,
      totalCriteria,
      totalPresets,
      totalHistory,
    };
  } catch {
    return { totalLaptops: 0, totalBrands: 0, totalCriteria: 0, totalPresets: 0, totalHistory: 0 };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    {
      label: "Total Laptop",
      value: stats.totalLaptops > 0 ? stats.totalLaptops.toLocaleString("id-ID") : "—",
      sub: "dalam dataset",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Merek Tersedia",
      value: stats.totalBrands > 0 ? stats.totalBrands.toString() : "—",
      sub: "brand laptop",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Kriteria SAW",
      value: stats.totalCriteria > 0 ? stats.totalCriteria.toString() : "—",
      sub: "C1 sampai C5",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Sesi Rekomendasi",
      value: stats.totalHistory.toString(),
      sub: "kalkulasi dijalankan",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  const needsSeed = stats.totalLaptops === 0;

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
          Beranda
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Sistem Pendukung Keputusan Pemilihan Laptop — Metode SAW
        </p>
      </div>

      {/* Seed alert */}
      {needsSeed && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-amber-500 text-xl">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Database belum di-seed</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Belum ada data laptop di database. Pergi ke{" "}
              <Link href="/settings" className="underline font-medium">
                Pengaturan
              </Link>{" "}
              dan jalankan Seed untuk mengisi data dari{" "}
              <code className="bg-amber-100 px-1 rounded">public/laptop_price.csv</code>.
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.bg} mb-3`}>
              <span className={`text-xl font-bold ${s.color}`}>#</span>
            </div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm font-medium text-slate-700 mt-1">{s.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Link href="/recommendation" className="group block">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white hover:bg-indigo-700 transition-colors cursor-pointer">
            <div className="text-3xl mb-3">✦</div>
            <h3 className="font-bold text-lg">Mulai Rekomendasi</h3>
            <p className="text-indigo-200 text-sm mt-1">
              Dapatkan ranking laptop terbaik sesuai kebutuhan dan anggaran kamu
            </p>
            <div className="mt-4 text-indigo-300 text-xs font-medium group-hover:text-white transition-colors">
              Mulai sekarang →
            </div>
          </div>
        </Link>

        <Link href="/laptops" className="group block">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">⊡</div>
            <h3 className="font-bold text-lg text-slate-800">Data Laptop</h3>
            <p className="text-slate-500 text-sm mt-1">
              Jelajahi{" "}
              {stats.totalLaptops > 0
                ? `${stats.totalLaptops.toLocaleString("id-ID")} laptop`
                : "laptop"}{" "}
              dari berbagai merek dengan spesifikasi lengkap
            </p>
            <div className="mt-4 text-indigo-600 text-xs font-medium group-hover:underline">
              Lihat data →
            </div>
          </div>
        </Link>

        <Link href="/criteria" className="group block">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">◈</div>
            <h3 className="font-bold text-lg text-slate-800">Atur Kriteria</h3>
            <p className="text-slate-500 text-sm mt-1">
              Sesuaikan bobot 5 kriteria SAW: Harga, CPU, RAM, Storage, Berat
            </p>
            <div className="mt-4 text-indigo-600 text-xs font-medium group-hover:underline">
              Atur bobot →
            </div>
          </div>
        </Link>
      </div>

      {/* Alur SAW */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-800 mb-6">Alur Perhitungan SAW</h2>
        <div className="grid grid-cols-5 gap-3 relative">
          {[
            { n: "01", title: "Input Preferensi", desc: "Anggaran & jenis penggunaan" },
            { n: "02", title: "Bobot Kriteria", desc: "Normalisasi bobot W₁…W₅" },
            { n: "03", title: "Matriks Keputusan", desc: "Nilai tiap laptop per kriteria" },
            { n: "04", title: "Normalisasi", desc: "r_ij = x_ij / max atau min/x_ij" },
            { n: "05", title: "Skor SAW", desc: "V_i = Σ(w_j × r_ij) → ranking" },
          ].map((step, i) => (
            <div key={step.n} className="relative">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {step.n}
                </div>
                <p className="text-xs font-semibold text-slate-700">{step.title}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
              {i < 4 && (
                <div className="absolute top-5 left-full w-full flex items-center justify-center -translate-x-1/2 z-10">
                  <div className="text-slate-300 text-xs">→</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-center">
          <Link
            href="/recommendation"
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Mulai Perhitungan SAW →
          </Link>
        </div>
      </div>
    </div>
  );
}
