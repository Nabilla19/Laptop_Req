"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Laptop,
  SlidersHorizontal,
  Star,
  Clock,
  BarChart2,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Circle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/laptops", label: "Data Laptop", icon: Laptop },
  { href: "/criteria", label: "Kriteria SAW", icon: SlidersHorizontal },
  { href: "/recommendation", label: "Rekomendasi", icon: Star },
  { href: "/history", label: "Riwayat", icon: Clock },
  { href: "/reports", label: "Laporan", icon: BarChart2 },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-[#171717]/40 z-40 backdrop-blur-none transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen bg-[#FFFFFF] border-r-2 border-[#171717] z-50
          transition-all duration-200 ease-in-out flex flex-col shrink-0
          ${isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 lg:w-20"}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-[#171717] bg-[#F4D35E] flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${!isOpen && "lg:hidden"}`}>
            <div className="w-10 h-10 bg-[#FFFFFF] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] rounded-[6px] flex items-center justify-center shrink-0">
              <span className="font-['Space_Grotesk',sans-serif] text-[#171717] font-extrabold text-lg">SPK</span>
            </div>
            <div className="overflow-hidden leading-tight">
              <p className="font-['Space_Grotesk',sans-serif] font-extrabold text-[#171717] uppercase tracking-tight text-sm">
                SPK LAPTOP
              </p>
              <p className="font-['Space_Grotesk',sans-serif] text-[10px] text-[#171717] font-bold tracking-wider uppercase">
                Metode SAW
              </p>
            </div>
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle sidebar"
            className="hidden lg:flex w-8 h-8 bg-[#FFFFFF] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] rounded-[4px] hover:bg-[#EAE8E1] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all items-center justify-center font-bold text-xs"
          >
            {isOpen ? <ChevronLeft size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="lg:hidden w-8 h-8 bg-[#FFFFFF] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] rounded-[4px] hover:bg-[#EAE8E1] flex items-center justify-center font-black text-sm"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {isOpen && (
            <p className="font-['Space_Grotesk',sans-serif] text-[11px] font-bold uppercase tracking-wider text-[#666666] px-3 pt-2 pb-1">
              Navigasi Utama
            </p>
          )}

          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setIsOpen(false)}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-xs font-bold font-['Space_Grotesk',sans-serif]
                    transition-all border-2
                    ${
                      isActive
                        ? "bg-[#F4D35E] text-[#171717] border-[#171717] shadow-[3px_3px_0px_#171717]"
                        : "bg-transparent text-[#171717] border-transparent hover:bg-[#EAE8E1] hover:border-[#171717] hover:shadow-[2px_2px_0px_#171717]"
                    }
                    ${!isOpen && "lg:justify-center lg:px-0"}
                  `}
                >
                  <Icon size={16} strokeWidth={2.5} className="shrink-0" />
                  {(isOpen || isMobile) && (
                    <span className="truncate tracking-wide">{item.label}</span>
                  )}
                  {isActive && (isOpen || isMobile) && (
                    <Circle size={8} fill="#171717" className="ml-auto shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* System Info Widget */}
        <div className="p-3 border-t-2 border-[#171717] bg-[#F8F7F2]">
          <div className={`bg-[#FFFFFF] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] rounded-[6px] p-3 ${!isOpen && "lg:p-2 lg:text-center"}`}>
            {isOpen ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                    Status Sistem
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-[#B8E0D2] border border-[#171717] rounded-full animate-pulse" />
                    <span className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold text-[#171717]">AKTIF</span>
                  </div>
                </div>
                <p className="font-['Space_Grotesk',sans-serif] font-bold text-xs text-[#171717]">
                  Simple Additive Weighting
                </p>
                <div className="mt-2 pt-2 border-t border-[#EAE8E1] flex items-center justify-between text-[10px] text-[#666666] font-medium">
                  <span>5 Kriteria</span>
                  <span className="font-bold text-[#171717]">Dataset Kaggle</span>
                </div>
              </>
            ) : (
              <div className="hidden lg:flex flex-col items-center gap-1">
                <span className="font-['Space_Grotesk',sans-serif] text-[#171717] font-black text-xs">SAW</span>
                <div className="w-2 h-2 bg-[#B8E0D2] border border-[#171717] rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Floating Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        className={`
          fixed bottom-5 right-5 lg:hidden z-30
          w-12 h-12 bg-[#F4D35E] text-[#171717] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] rounded-[6px]
          flex items-center justify-center
          hover:bg-[#ecd04e] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all
          ${isOpen && "hidden"}
        `}
      >
        <Menu size={22} strokeWidth={2.5} />
      </button>
    </>
  );
}
