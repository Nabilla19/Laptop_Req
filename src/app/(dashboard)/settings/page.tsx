"use client";

import { useState } from "react";
import {
  Settings,
  Sprout,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Paperclip,
  Upload,
} from "lucide-react";

type SeedStatus = "idle" | "loading" | "success" | "error";

interface SeedResult {
  message: string;
  summary: { totalRows: number; imported: number; skipped: number; failed: number };
  batchId: string;
}

export default function SettingsPage() {
  const [seedStatus, setSeedStatus] = useState<SeedStatus>("idle");
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<SeedStatus>("idle");
  const [importResult, setImportResult] = useState<SeedResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeedStatus("loading");
    setSeedResult(null);
    setSeedError(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Seed database gagal");
      setSeedResult(data);
      setSeedStatus("success");
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Seed database gagal");
      setSeedStatus("error");
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportStatus("loading");
    setImportResult(null);
    setImportError(null);
    try {
      const form = new FormData();
      form.append("file", importFile);
      const res = await fetch("/api/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import file gagal");
      setImportResult(data);
      setImportStatus("success");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import file gagal");
      setImportStatus("error");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[10px] shadow-[6px_6px_0px_#171717] p-6 md:p-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F4D35E] border border-[#171717] rounded-[4px] font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">
            <Settings size={14} strokeWidth={2.5} /> Konfigurasi Sistem
          </div>
          <h1 className="font-['Space_Grotesk',sans-serif] text-2xl md:text-3xl font-extrabold text-[#171717] uppercase tracking-tight">
            Pengaturan &amp; Manajemen Data
          </h1>
          <p className="font-['Inter',sans-serif] text-xs md:text-sm text-[#666666] mt-1 max-w-2xl">
            Inisialisasi dataset laptop melalui seed otomatis, upload file CSV eksternal, dan kelola konfigurasi sistem pendukung keputusan.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Seed Database Section */}
        <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-[#F4D35E] border-2 border-[#171717] rounded-[6px] shadow-[2px_2px_0px_#171717] flex items-center justify-center shrink-0 text-[#171717]">
              <Sprout size={22} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-[#171717] mb-1">
                Seed Database Otomatis
              </h2>
              <p className="font-['Inter',sans-serif] text-xs text-[#666666] leading-relaxed mb-4">
                Membaca file dataset bawaan <code className="bg-[#EAE8E1] px-1.5 py-0.5 border border-[#171717] rounded font-mono text-[11px]">public/laptop_price.csv</code> dan menginisialisasi tabel laptop, kriteria SAW, serta preset profil ke database Neon PostgreSQL. Operasi ini bersifat <strong>idempotent</strong> (aman dijalankan berulang).
              </p>

              {seedStatus === "success" && seedResult && (
                <div className="mb-4 bg-[#B8E0D2] border-2 border-[#171717] rounded-[6px] shadow-[3px_3px_0px_#171717] p-4">
                  <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] mb-2 flex items-center gap-1.5">
                    <Check size={14} strokeWidth={3} className="text-[#171717]" />
                    <span>{seedResult.message}</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-['Space_Grotesk',sans-serif]">
                    {[
                      { label: "Total Baris", value: seedResult.summary.totalRows },
                      { label: "Berhasil Diimpor", value: seedResult.summary.imported },
                      { label: "Dilewati", value: seedResult.summary.skipped },
                      { label: "Gagal", value: seedResult.summary.failed },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#FFFFFF] border border-[#171717] rounded-[4px] p-2 text-center">
                        <div className="text-base font-black text-[#171717]">{s.value.toLocaleString()}</div>
                        <div className="text-[10px] text-[#666666] font-bold uppercase">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#171717]/80 mt-2 font-mono">Batch ID: {seedResult.batchId}</p>
                </div>
              )}

              {seedStatus === "error" && seedError && (
                <div className="mb-4 bg-[#FF9B85] border-2 border-[#171717] rounded-[6px] shadow-[3px_3px_0px_#171717] p-3 text-xs font-bold text-[#171717] flex items-center gap-2">
                  <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
                  <span>{seedError}</span>
                </div>
              )}

              <button
                onClick={handleSeed}
                disabled={seedStatus === "loading"}
                className="neo-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2"
              >
                {seedStatus === "loading" ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menjalankan Seed Database...</span>
                  </>
                ) : (
                  <>
                    <Sprout size={14} />
                    <span>Jalankan Seed Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Manual CSV Import Section */}
        <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-[#B8E0D2] border-2 border-[#171717] rounded-[6px] shadow-[2px_2px_0px_#171717] flex items-center justify-center shrink-0 text-[#171717]">
              <FileSpreadsheet size={22} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-[#171717] mb-1">
                Import File Dataset CSV Kustom
              </h2>
              <p className="font-['Inter',sans-serif] text-xs text-[#666666] leading-relaxed mb-4">
                Unggah file CSV baru untuk menambahkan atau memperbarui katalog alternatif laptop. File harus berekstensi <code className="bg-[#EAE8E1] px-1.5 py-0.5 border border-[#171717] rounded font-mono text-[11px]">.csv</code> (maksimal 10 MB) dengan kolom:{" "}
                <code className="text-[11px] font-bold">Company, Product, Ram, Memory, Weight, Price_euros</code>.
              </p>

              {importStatus === "success" && importResult && (
                <div className="mb-4 bg-[#B8E0D2] border-2 border-[#171717] rounded-[6px] shadow-[3px_3px_0px_#171717] p-4">
                  <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] mb-2 flex items-center gap-1.5">
                    <Check size={14} strokeWidth={3} className="text-[#171717]" />
                    <span>{importResult.message}</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-['Space_Grotesk',sans-serif]">
                    {[
                      { label: "Total Baris", value: importResult.summary.totalRows },
                      { label: "Berhasil Diimpor", value: importResult.summary.imported },
                      { label: "Dilewati", value: importResult.summary.skipped },
                      { label: "Gagal", value: importResult.summary.failed },
                    ].map((s) => (
                      <div key={s.label} className="bg-[#FFFFFF] border border-[#171717] rounded-[4px] p-2 text-center">
                        <div className="text-base font-black text-[#171717]">{s.value.toLocaleString()}</div>
                        <div className="text-[10px] text-[#666666] font-bold uppercase">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importStatus === "error" && importError && (
                <div className="mb-4 bg-[#FF9B85] border-2 border-[#171717] rounded-[6px] shadow-[3px_3px_0px_#171717] p-3 text-xs font-bold text-[#171717] flex items-center gap-2">
                  <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      setImportFile(e.target.files?.[0] ?? null);
                      setImportStatus("idle");
                      setImportResult(null);
                      setImportError(null);
                    }}
                  />
                  <span className="neo-btn-secondary px-4 py-2.5 text-xs inline-flex items-center gap-2 cursor-pointer">
                    <Paperclip size={14} />
                    <span>{importFile ? importFile.name : "Pilih Berkas CSV..."}</span>
                  </span>
                </label>

                {importFile && (
                  <button
                    onClick={handleImport}
                    disabled={importStatus === "loading"}
                    className="neo-btn-accent px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2"
                  >
                    {importStatus === "loading" ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
                        <span>Mengimpor Data...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Upload &amp; Mulai Import</span>
                      </>
                    )}
                  </button>
                )}

                {importFile && (
                  <span className="text-xs font-mono font-medium text-[#666666]">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* API Endpoints & Tech Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* API Endpoints */}
          <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
            <h3 className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">
              Daftar REST API Endpoints
            </h3>
            <div className="space-y-2">
              {[
                { method: "GET", path: "/api/laptops", desc: "Katalog laptop & paginasi" },
                { method: "POST", path: "/api/laptops", desc: "Tambah unit laptop baru" },
                { method: "GET", path: "/api/criteria", desc: "Kriteria & preset bobot" },
                { method: "PUT", path: "/api/criteria", desc: "Update bobot kriteria" },
                { method: "POST", path: "/api/recommendation", desc: "Kalkulasi ranking SAW" },
                { method: "GET", path: "/api/history", desc: "Arsip log riwayat" },
                { method: "POST", path: "/api/import", desc: "Impor file CSV eksternal" },
                { method: "POST", path: "/api/seed", desc: "Seed dari berkas lokal" },
                { method: "GET", path: "/api/stats", desc: "Statistik metrik sistem" },
              ].map((ep) => (
                <div key={ep.path} className="flex items-center gap-2 text-xs">
                  <span
                    className={`font-['Space_Grotesk',sans-serif] text-[10px] font-bold px-1.5 py-0.5 border border-[#171717] rounded-[3px] ${
                      ep.method === "GET"
                        ? "bg-[#F4D35E] text-[#171717]"
                        : ep.method === "POST"
                        ? "bg-[#B8E0D2] text-[#171717]"
                        : ep.method === "PUT"
                        ? "bg-[#C9B8F5] text-[#171717]"
                        : "bg-[#FF9B85] text-[#171717]"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="text-[11px] font-mono text-[#171717] font-semibold">{ep.path}</code>
                  <span className="text-[11px] text-[#666666] ml-auto">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Specs */}
          <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
            <h3 className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">
              Arsitektur &amp; Teknologi
            </h3>
            <div className="space-y-2">
              {[
                { name: "Next.js 16 (App Router)", desc: "React Server & Client Components" },
                { name: "Prisma ORM 7", desc: "Type-safe database mapping" },
                { name: "PostgreSQL (Neon Serverless)", desc: "Relational cloud storage" },
                { name: "TailwindCSS v4", desc: "Design tokens & utility styling" },
                { name: "Neo-Brutalism Light Theme", desc: "High contrast & hard shadows" },
                { name: "Space Grotesk + Inter", desc: "Typography hierarchy" },
              ].map((t) => (
                <div key={t.name} className="flex items-center justify-between text-xs py-1 border-b border-[#EAE8E1] last:border-0">
                  <span className="font-['Space_Grotesk',sans-serif] font-bold text-[#171717]">{t.name}</span>
                  <span className="font-['Inter',sans-serif] text-[11px] text-[#666666]">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* About Card */}
        <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-6">
          <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] uppercase tracking-wide mb-2">
            Tentang Aplikasi SPK Rekomendasi Laptop
          </h3>
          <p className="font-['Inter',sans-serif] text-xs text-[#666666] leading-relaxed">
            Sistem Pendukung Keputusan (SPK) pemilihan laptop ini dirancang untuk memudahkan mahasiswa, pekerja profesional, gamer, maupun desainer dalam menentukan pilihan laptop paling optimal. Dengan memanfaatkan metode <strong>Simple Additive Weighting (SAW)</strong>, sistem menormalisasi atribut matriks keputusan berdasarkan karakteristik benefit dan cost, kemudian menjumlahkan skor terbobot untuk menghasilkan rekomendasi objektif dan transparan.
          </p>
        </div>
      </div>
    </div>
  );
}
