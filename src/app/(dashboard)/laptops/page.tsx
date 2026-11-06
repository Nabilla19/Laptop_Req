"use client";

import { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/constants";
import {
  Laptop,
  Plus,
  Search,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react";

interface LaptopItem {
  id: string;
  company: string;
  product: string;
  typeName: string | null;
  inches: number | null;
  screenResolution: string | null;
  cpu: string | null;
  ram: number;
  memory: string | null;
  storageGb: number;
  gpu: string | null;
  opSys: string | null;
  weight: number;
  priceEuros: number;
  cpuScore: number | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function LaptopsPage() {
  const [laptops, setLaptops] = useState<LaptopItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [typeName, setTypeName] = useState("");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Laptop Form State
  const [newLaptop, setNewLaptop] = useState({
    company: "",
    product: "",
    typeName: "Notebook",
    ram: "8",
    storageGb: "256",
    cpu: "Intel Core i5 2.5GHz",
    weight: "1.8",
    priceEuros: "800",
  });

  const fetchLaptops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (search) params.set("search", search);
      if (company) params.set("company", company);
      if (typeName) params.set("typeName", typeName);

      const res = await fetch(`/api/laptops?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat katalog laptop");

      setLaptops(data.data ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, search, company, typeName]);

  useEffect(() => {
    fetchLaptops();
  }, [fetchLaptops]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLaptops();
  };

  const handleResetFilter = () => {
    setSearch("");
    setCompany("");
    setTypeName("");
    setPage(1);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data laptop "${name}"?`)) return;
    try {
      const res = await fetch(`/api/laptops/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      fetchLaptops();
    } catch {
      alert("Gagal menghapus data laptop");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/laptops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLaptop),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambah laptop");
      setIsAddModalOpen(false);
      setNewLaptop({
        company: "",
        product: "",
        typeName: "Notebook",
        ram: "8",
        storageGb: "256",
        cpu: "Intel Core i5 2.5GHz",
        weight: "1.8",
        priceEuros: "800",
      });
      fetchLaptops();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const brandOptions = [
    "Acer", "Apple", "Asus", "Dell", "HP", "Lenovo", "MSI", "Toshiba", "Xiaomi"
  ];

  const typeOptions = [
    "Notebook", "Gaming", "Ultrabook", "2 in 1 Convertible", "Workstation", "Netbook"
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[10px] shadow-[6px_6px_0px_#171717] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F4D35E] border border-[#171717] rounded-[4px] font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">
              <Laptop size={14} strokeWidth={2.5} /> Dataset Alternatif
            </div>
            <h1 className="font-['Space_Grotesk',sans-serif] text-2xl md:text-3xl font-extrabold text-[#171717] uppercase tracking-tight">
              Katalog Data Laptop
            </h1>
            <p className="font-['Inter',sans-serif] text-xs md:text-sm text-[#666666] mt-1 max-w-2xl">
              Daftar seluruh alternatif laptop yang menjadi basis perankingan SAW. Anda dapat mencari, memfilter berdasarkan spesifikasi, atau menambahkan entri baru.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="neo-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 self-start md:self-auto"
          >
            <Plus size={14} strokeWidth={2.5} /> Tambah Unit Laptop
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div>
              <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                Pencarian Model / CPU
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cth: ThinkPad, i7, Asus..."
                className="neo-input w-full"
              />
            </div>

            {/* Brand Filter */}
            <div>
              <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                Merek (Brand)
              </label>
              <select
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setPage(1);
                }}
                className="neo-input w-full cursor-pointer"
              >
                <option value="">Semua Merek</option>
                {brandOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                Tipe Laptop
              </label>
              <select
                value={typeName}
                onChange={(e) => {
                  setTypeName(e.target.value);
                  setPage(1);
                }}
                className="neo-input w-full cursor-pointer"
              >
                <option value="">Semua Tipe</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="neo-btn-accent flex-1 py-2.5 text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <Search size={14} /> Terapkan Filter
              </button>
              {(search || company || typeName) && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="neo-btn-secondary px-3 py-2.5 text-xs font-bold inline-flex items-center gap-1"
                  title="Reset Filter"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-[#FF9B85] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-4 text-xs font-bold text-[#171717] flex items-center gap-3">
          <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Laptop Data Table */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] overflow-hidden">
        <div className="p-4 border-b-2 border-[#171717] bg-[#F8F7F2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] uppercase tracking-wide">
              Daftar Alternatif Laptop
            </span>
            {pagination && (
              <span className="neo-badge bg-[#B8E0D2] text-[#171717]">
                {pagination.total} Total
              </span>
            )}
          </div>
          {loading && (
            <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717]">
              Memuat data...
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#171717] border-t-[#F4D35E] rounded-full animate-spin mb-3" />
            <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717]">
              Memuat katalog laptop...
            </p>
          </div>
        ) : laptops.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] mb-2">
              Tidak ada data laptop yang cocok dengan filter.
            </p>
            <button
              onClick={handleResetFilter}
              className="neo-btn-secondary px-4 py-2 text-xs font-bold"
            >
              Reset Filter Pencarian
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#171717] bg-[#F8F7F2]">
                  <th className="p-3 font-['Space_Grotesk',sans-serif] font-bold">Merek &amp; Model</th>
                  <th className="p-3 font-['Space_Grotesk',sans-serif] font-bold">Tipe</th>
                  <th className="p-3 font-['Space_Grotesk',sans-serif] font-bold">Prosesor (CPU)</th>
                  <th className="p-3 font-['Space_Grotesk',sans-serif] font-bold text-center">RAM (C3)</th>
                  <th className="p-3 font-['Space_Grotesk',sans-serif] font-bold text-center">Storage (C4)</th>
                  <th className="p-3 font-['Space_Grotesk',sans-serif] font-bold text-center">Berat (C5)</th>
                  <th className="p-3 font-['Space_Grotesk',sans-serif] font-bold text-right">Harga (C1)</th>
                  <th className="p-3 font-['Space_Grotesk',sans-serif] font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-[#171717]">
                {laptops.map((laptop) => (
                  <tr key={laptop.id} className="hover:bg-[#F8F7F2] transition-colors">
                    <td className="p-3">
                      <div className="font-['Space_Grotesk',sans-serif] font-bold text-sm text-[#171717]">
                        {laptop.company} {laptop.product}
                      </div>
                      <div className="text-[11px] text-[#666666] mt-0.5 font-mono">
                        {laptop.inches ? `${laptop.inches}"` : ""} {laptop.screenResolution ?? ""}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="neo-badge bg-[#EAE8E1] text-[#171717]">
                        {laptop.typeName ?? "Standard"}
                      </span>
                    </td>

                    <td className="p-3 max-w-[200px]">
                      <div className="font-medium text-[#171717] truncate">{laptop.cpu ?? "—"}</div>
                      {laptop.cpuScore !== null && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-[#B8E0D2] border border-[#171717] rounded-[3px] text-[10px] font-bold text-[#171717]">
                          Skor: {laptop.cpuScore}/100
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center font-bold font-['Space_Grotesk',sans-serif]">
                      {laptop.ram} GB
                    </td>

                    <td className="p-3 text-center font-bold font-['Space_Grotesk',sans-serif]">
                      {laptop.storageGb} GB
                    </td>

                    <td className="p-3 text-center font-medium font-mono">
                      {laptop.weight} kg
                    </td>

                    <td className="p-3 text-right">
                      <span className="font-['Space_Grotesk',sans-serif] font-extrabold text-sm text-[#171717] px-2 py-0.5 bg-[#F4D35E] border border-[#171717] rounded-[4px] inline-block">
                        {formatEuro(laptop.priceEuros)}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDelete(laptop.id, `${laptop.company} ${laptop.product}`)}
                        className="neo-btn-coral px-2.5 py-1 text-[11px] font-bold"
                        title="Hapus Laptop"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#666666]">
            Halaman {pagination.page} dari {pagination.totalPages} (Total {pagination.total} laptop)
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

      {/* Add Laptop Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#171717]/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[6px_6px_0px_#171717] max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717] mb-4">
              <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-[#171717] uppercase tracking-wide">
                Tambah Data Laptop Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 bg-[#EAE8E1] border border-[#171717] rounded-[4px] flex items-center justify-center text-[#171717]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                    Merek (Company) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLaptop.company}
                    onChange={(e) => setNewLaptop({ ...newLaptop, company: e.target.value })}
                    placeholder="Contoh: Asus"
                    className="neo-input w-full"
                  />
                </div>

                <div>
                  <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                    Nama Model (Product) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLaptop.product}
                    onChange={(e) => setNewLaptop({ ...newLaptop, product: e.target.value })}
                    placeholder="Contoh: ZenBook 14"
                    className="neo-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                    Tipe Laptop
                  </label>
                  <select
                    value={newLaptop.typeName}
                    onChange={(e) => setNewLaptop({ ...newLaptop, typeName: e.target.value })}
                    className="neo-input w-full"
                  >
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                    RAM (GB) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newLaptop.ram}
                    onChange={(e) => setNewLaptop({ ...newLaptop, ram: e.target.value })}
                    className="neo-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                    Kapasitas Storage (GB) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newLaptop.storageGb}
                    onChange={(e) => setNewLaptop({ ...newLaptop, storageGb: e.target.value })}
                    className="neo-input w-full"
                  />
                </div>

                <div>
                  <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                    Berat (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newLaptop.weight}
                    onChange={(e) => setNewLaptop({ ...newLaptop, weight: e.target.value })}
                    className="neo-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                    Model CPU *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLaptop.cpu}
                    onChange={(e) => setNewLaptop({ ...newLaptop, cpu: e.target.value })}
                    placeholder="Contoh: Intel Core i5 2.5GHz"
                    className="neo-input w-full"
                  />
                </div>

                <div>
                  <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] block mb-1">
                    Harga (Euro €) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newLaptop.priceEuros}
                    onChange={(e) => setNewLaptop({ ...newLaptop, priceEuros: e.target.value })}
                    className="neo-input w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#171717]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="neo-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="neo-btn-primary px-5 py-2 text-xs font-bold"
                >
                  {submitting ? "Menyimpan..." : "Simpan Laptop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

