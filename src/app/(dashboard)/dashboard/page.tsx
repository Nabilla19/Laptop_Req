import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Sistem Pendukung Keputusan Pemilihan Laptop — Metode SAW
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <QuickCard
          href="/recommendation"
          title="Mulai Rekomendasi"
          desc="Dapatkan rekomendasi laptop terbaik sesuai kebutuhan kamu"
          icon="🎯"
          color="bg-indigo-600"
        />
        <QuickCard
          href="/laptops"
          title="Data Laptop"
          desc="Lihat dan kelola dataset laptop yang tersedia"
          icon="💻"
          color="bg-emerald-600"
        />
        <QuickCard
          href="/criteria"
          title="Atur Kriteria"
          desc="Sesuaikan bobot kriteria SAW untuk perhitungan"
          icon="⚖️"
          color="bg-amber-500"
        />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Laptop" value="1.300+" icon="💻" />
        <StatCard label="Merek" value="19" icon="🏷️" />
        <StatCard label="Kriteria SAW" value="5" icon="📐" />
        <StatCard label="Preset Bobot" value="5" icon="🎚️" />
      </div>

      {/* Cara Kerja */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Cara Kerja SPK</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: "1", title: "Pilih Kebutuhan", desc: "Tentukan anggaran & jenis penggunaan" },
            { step: "2", title: "Atur Bobot", desc: "Sesuaikan prioritas kriteria" },
            { step: "3", title: "Normalisasi", desc: "SAW menormalisasi nilai tiap kriteria" },
            { step: "4", title: "Perhitungan", desc: "Hitung skor tertimbang tiap laptop" },
            { step: "5", title: "Ranking", desc: "Tampilkan rekomendasi terbaik" },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                {s.step}
              </div>
              <p className="text-sm font-medium text-slate-700">{s.title}</p>
              <p className="text-xs text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Link
            href="/recommendation"
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Mulai Sekarang →
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickCard({
  href,
  title,
  desc,
  icon,
  color,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
}) {
  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all">
        <div
          className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl mb-4`}
        >
          {icon}
        </div>
        <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
