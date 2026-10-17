"use client";

import { useState } from "react";

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
      if (!res.ok) throw new Error(data.error ?? "Seed gagal");
      setSeedResult(data);
      setSeedStatus("success");
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Seed gagal");
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
      if (!res.ok) throw new Error(data.error ?? "Import gagal");
      setImportResult(data);
      setImportStatus("success");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import gagal");
      setImportStatus("error");
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
          Konfigurasi
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola data, seed database, dan impor dataset CSV
        </p>
      </div>

      <div className="space-y-6">
        {/* Seed Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-indigo-600 text-lg">🌱</span>
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-slate-800 mb-1">Seed Database</h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Baca file <code className="bg-slate-100 px-1 rounded">public/laptop_price.csv</code> dan
                masukkan data laptop, kriteria SAW, dan preset bobot ke database. Operasi ini{" "}
                <strong>idempotent</strong> — aman dijalankan berulang kali.
              </p>

              {seedStatus === "success" && seedResult && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-emerald-700 mb-2">✓ {seedResult.message}</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Total", value: seedResult.summary.totalRows },
                      { label: "Berhasil", value: seedResult.summary.imported },
                      { label: "Dilewati", value: seedResult.summary.skipped },
                      { label: "Gagal", value: seedResult.summary.failed },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="text-lg font-bold text-slate-700">{s.value.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Batch ID: {seedResult.batchId}</p>
                </div>
              )}

              {seedStatus === "error" && seedError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">⚠ {seedError}</p>
                </div>
              )}

              <button
                onClick={handleSeed}
                disabled={seedStatus === "loading"}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {seedStatus === "loading" ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    Seeding...
                  </span>
                ) : (
                  "Jalankan Seed"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Import CSV Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-emerald-600 text-lg">📂</span>
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-slate-800 mb-1">Import CSV</h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Upload file CSV laptop dataset secara manual. File harus berformat{" "}
                <code className="bg-slate-100 px-1 rounded">.csv</code> (maks 10 MB) dengan kolom:{" "}
                <code className="text-[11px]">Company, Product, Ram, Memory, Weight, Price_euros</code> (wajib).
              </p>

              {importStatus === "success" && importResult && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-emerald-700 mb-2">✓ {importResult.message}</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Total", value: importResult.summary.totalRows },
                      { label: "Berhasil", value: importResult.summary.imported },
                      { label: "Dilewati", value: importResult.summary.skipped },
                      { label: "Gagal", value: importResult.summary.failed },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="text-lg font-bold text-slate-700">{s.value.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importStatus === "error" && importError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">⚠ {importError}</p>
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
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                    📎 {importFile ? importFile.name : "Pilih File CSV"}
                  </span>
                </label>
                {importFile && (
                  <button
                    onClick={handleImport}
                    disabled={importStatus === "loading"}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {importStatus === "loading" ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                        </svg>
                        Mengimport...
                      </span>
                    ) : (
                      "Upload & Import"
                    )}
                  </button>
                )}
                {importFile && (
                  <span className="text-xs text-slate-400">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
              API Endpoints
            </h3>
            <div className="space-y-2">
              {[
                { method: "GET", path: "/api/laptops", desc: "Daftar laptop (paginasi)" },
                { method: "GET", path: "/api/criteria", desc: "Kriteria & preset bobot" },
                { method: "PUT", path: "/api/criteria", desc: "Update bobot kriteria" },
                { method: "POST", path: "/api/recommendation", desc: "Jalankan kalkulasi SAW" },
                { method: "GET", path: "/api/history", desc: "Riwayat rekomendasi" },
                { method: "POST", path: "/api/import", desc: "Import CSV laptop" },
                { method: "POST", path: "/api/seed", desc: "Seed dari public/laptop_price.csv" },
                { method: "GET", path: "/api/stats", desc: "Statistik ringkasan" },
              ].map((ep) => (
                <div key={ep.path} className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ep.method === "GET"
                        ? "bg-blue-100 text-blue-700"
                        : ep.method === "POST"
                        ? "bg-emerald-100 text-emerald-700"
                        : ep.method === "PUT"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="text-[11px] text-slate-600 font-mono">{ep.path}</code>
                  <span className="text-[11px] text-slate-400 ml-auto">{ep.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 text-white">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
              Tech Stack
            </h3>
            <div className="space-y-2">
              {[
                { name: "Next.js 16", desc: "App Router + API Routes" },
                { name: "Prisma ORM", desc: "Type-safe database access" },
                { name: "PostgreSQL (Neon)", desc: "Serverless database" },
                { name: "TailwindCSS v4", desc: "Utility-first styling" },
                { name: "PapaParse", desc: "CSV parsing library" },
                { name: "TypeScript", desc: "Static typing" },
              ].map((t) => (
                <div key={t.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{t.name}</span>
                  <span className="text-xs text-slate-400">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Tentang Aplikasi</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>SPK Laptop</strong> adalah Sistem Pendukung Keputusan untuk memilih laptop terbaik
            menggunakan metode <strong>Simple Additive Weighting (SAW)</strong>. Sistem ini mengevaluasi
            laptop berdasarkan 5 kriteria: Harga (C1), Performa CPU (C2), RAM (C3), Kapasitas Penyimpanan
            (C4), dan Berat (C5). Dataset bersumber dari Kaggle Laptop Price Dataset dengan 1.303 baris data.
          </p>
        </div>
      </div>
    </div>
  );
}
