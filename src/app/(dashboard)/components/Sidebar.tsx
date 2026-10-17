"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/laptops", label: "Data Laptop", icon: "⊡" },
  { href: "/criteria", label: "Kriteria SAW", icon: "◈" },
  { href: "/recommendation", label: "Rekomendasi", icon: "✦" },
  { href: "/history", label: "Riwayat", icon: "◷" },
  { href: "/reports", label: "Laporan", icon: "◫" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            SPK
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">SPK Laptop</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Sistem Pendukung Keputusan</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] uppercase tracking-widest text-slate-600 px-3 pb-2 pt-1 font-semibold">
          Menu Utama
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom badge */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="bg-slate-900 rounded-lg px-3 py-2.5">
          <p className="text-[11px] text-slate-400 font-medium">Metode</p>
          <p className="text-xs text-slate-200 font-semibold mt-0.5">
            Simple Additive Weighting
          </p>
        </div>
      </div>
    </aside>
  );
}
