import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">SPK Laptop</h1>
          <p className="text-xs text-slate-400 mt-0.5">Sistem Pendukung Keputusan</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem href="/dashboard" label="Dashboard" icon="📊" />
          <NavItem href="/laptops" label="Data Laptop" icon="💻" />
          <NavItem href="/criteria" label="Kriteria SAW" icon="⚖️" />
          <NavItem href="/recommendation" label="Rekomendasi" icon="🎯" />
          <NavItem href="/history" label="Riwayat" icon="📋" />
          <NavItem href="/settings" label="Pengaturan" icon="⚙️" />
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">Metode SAW (Simple Additive Weighting)</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium"
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}
