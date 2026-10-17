"use client";

import { useState } from "react";
import { WEIGHT_PRESETS, CRITERIA_NAMES, formatEuro } from "@/lib/constants";

type PresetKey = keyof typeof WEIGHT_PRESETS;

interface RecommendationResult {
  rank: number;
  sawScore: number;
  id: string;
  company: string;
  product: string;
  rawValues: Record<string, number>;
  normalizedValues: Record<string, number>;
  weightedValues: Record<string, number>;
}

interface CriteriaConfigItem {
  code: string;
  weight: number;
  attrType: "benefit" | "cost";
}

interface RecommendationResponse {
  historyId: string;
  calculatedAt: string;
  totalAlternatives: number;
  filtered: number;
  topN: number;
  weightsUsed: Record<string, number>;
  maxValues: Record<string, number>;
  minValues: Record<string, number>;
  criteriaConfig: CriteriaConfigItem[];
  results: RecommendationResult[];
}

const PRESET_ICONS: Record<string, string> = {
  kuliah_umum: "🎓",
  pemrograman: "💻",
  desain_grafis: "🎨",
  gaming: "🎮",
  mobilitas_tinggi: "✈️",
};

const CRITERIA_UNITS: Record<string, string> = {
  C1: "€",
  C2: "/100",
  C3: "GB",
  C4: "GB",
  C5: "kg",
};

export default function RecommendationPage() {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | "custom">("kuliah_umum");
  const [budgetMax, setBudgetMax] = useState<string>("");
  const [topN, setTopN] = useState<number>(10);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({
    C1: 0.30, C2: 0.25, C3: 0.20, C4: 0.15, C5: 0.10,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCalcDetail, setShowCalcDetail] = useState(false);

  const currentWeights =
    selectedPreset === "custom"
      ? customWeights
      : { ...WEIGHT_PRESETS[selectedPreset as PresetKey].weights };

  const totalWeight = Object.values(currentWeights).reduce((s, v) => s + v, 0);
  const weightValid = Math.abs(totalWeight - 1.0) < 0.001;

  const handlePresetSelect = (preset: PresetKey | "custom") => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      setCustomWeights({ ...WEIGHT_PRESETS[preset].weights });
    }
  };

  const handleWeightChange = (code: string, val: number) => {
    setCustomWeights((prev) => ({ ...prev, [code]: val }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetMax: budgetMax ? parseFloat(budgetMax) : null,
          usageType: selectedPreset !== "custom" ? selectedPreset : null,
          customWeights: currentWeights,
          topN,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Terjadi kesalahan");
      setResult(data);
      setShowCalcDetail(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 0.75) return "text-emerald-600";
    if (score >= 0.55) return "text-amber-600";
    return "text-red-500";
  };

  const rankBadge = (rank: number) => {
    if (rank === 1) return "bg-amber-400 text-amber-900";
    if (rank === 2) return "bg-slate-300 text-slate-800";
    if (rank === 3) return "bg-orange-300 text-orange-900";
    return "bg-slate-100 text-slate-600";
  };

  const codes = ["C1", "C2", "C3", "C4", "C5"];

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
          Kalkulasi SAW
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Rekomendasi Laptop</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pilih profil kebutuhan dan anggaran, lalu sistem akan meranking laptop terbaik untukmu
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Config Panel */}
        <div className="lg:col-span-1 space-y-5">
          {/* Preset Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Profil Penggunaan</h2>
            <div className="space-y-2">
              {(Object.keys(WEIGHT_PRESETS) as PresetKey[]).map((key) => {
                const preset = WEIGHT_PRESETS[key];
                const isActive = selectedPreset === key;
                return (
                  <button
                    key={key}
                    onClick={() => handlePresetSelect(key)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{PRESET_ICONS[key]}</span>
                      <div>
                        <p className="font-semibold">{preset.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                          {preset.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => handlePresetSelect("custom")}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                  selectedPreset === "custom"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">⚙️</span>
                  <div>
                    <p className="font-semibold">Custom</p>
                    <p className="text-xs text-slate-500 mt-0.5">Atur bobot kriteria secara manual</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Weight Sliders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800">Bobot Kriteria</h2>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  weightValid
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {(totalWeight * 100).toFixed(0)}%
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(currentWeights).map(([code, weight]) => (
                <div key={code}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 font-medium">
                      {code} · {CRITERIA_NAMES[code]}
                    </span>
                    <span className="text-xs font-bold text-indigo-600">
                      {(weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={weight}
                    disabled={selectedPreset !== "custom"}
                    onChange={(e) => handleWeightChange(code, parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 disabled:opacity-50 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Budget & TopN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Parameter Pencarian</h2>
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1.5">
                Budget Maksimal (€) — kosongkan untuk semua harga
              </label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Contoh: 1000"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1.5">
                Tampilkan Top {topN} Laptop
              </label>
              <select
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    Top {n}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCalculate}
              disabled={loading || !weightValid}
              className="w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Menghitung...
                </span>
              ) : (
                "✦ Hitung Rekomendasi"
              )}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5">
              <p className="text-sm text-red-700 font-medium">⚠ {error}</p>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-4">✦</div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Siap Menghitung</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Pilih profil penggunaan dan atur parameter di sebelah kiri, lalu klik tombol{" "}
                <strong>Hitung Rekomendasi</strong> untuk melihat hasil ranking SAW.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
              <svg className="w-10 h-10 animate-spin text-indigo-600 mb-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
              </svg>
              <p className="text-sm text-slate-500 font-medium">Menjalankan kalkulasi SAW...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="bg-indigo-600 rounded-2xl p-5 text-white grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-indigo-200 text-xs font-medium mb-1">Total Alternatif</p>
                  <p className="text-2xl font-bold">{result.totalAlternatives.toLocaleString()}</p>
                </div>
                <div className="text-center border-x border-indigo-500">
                  <p className="text-indigo-200 text-xs font-medium mb-1">Setelah Filter</p>
                  <p className="text-2xl font-bold">{result.filtered.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-indigo-200 text-xs font-medium mb-1">Ditampilkan</p>
                  <p className="text-2xl font-bold">{result.topN}</p>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Hasil Ranking SAW</h3>
                  <span className="text-xs text-slate-400">
                    ID Riwayat: {result.historyId.slice(-8)}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {result.results.map((item) => (
                    <div key={item.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Rank */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankBadge(item.rank)}`}
                        >
                          {item.rank}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-slate-800 text-sm truncate">
                              {item.company} {item.product}
                            </p>
                          </div>
                          {/* Specs row */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-medium">
                              RAM {item.rawValues.C3}GB
                            </span>
                            <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg font-medium">
                              CPU {item.rawValues.C2}/100
                            </span>
                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">
                              {item.rawValues.C5}kg
                            </span>
                            <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg font-medium">
                              {item.rawValues.C4}GB Storage
                            </span>
                          </div>
                          {/* Score bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${item.sawScore * 100}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${scoreColor(item.sawScore)}`}>
                              {(item.sawScore * 100).toFixed(1)}
                            </span>
                          </div>
                        </div>
                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-800 text-sm">
                            {formatEuro(item.rawValues.C1)}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">Skor SAW</p>
                          <p className={`text-sm font-bold ${scoreColor(item.sawScore)}`}>
                            {item.sawScore.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight breakdown */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
                  Bobot yang Digunakan
                </h3>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(result.weightsUsed).map(([code, weight]) => (
                    <div key={code} className="text-center">
                      <div className="text-lg font-bold text-indigo-600">
                        {(weight * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{CRITERIA_NAMES[code]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ================================================================
                  PENJELASAN RUMUS & LANGKAH KALKULASI SAW
                  ================================================================ */}
              <div className="mt-2">
                <button
                  onClick={() => setShowCalcDetail(!showCalcDetail)}
                  className="w-full text-left bg-slate-800 text-white rounded-2xl px-5 py-4 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold">📐 Penjelasan Rumus &amp; Langkah Kalkulasi SAW</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Lihat detail matriks keputusan, normalisasi, dan perhitungan skor
                      </p>
                    </div>
                    <span className="text-lg">{showCalcDetail ? "▲" : "▼"}</span>
                  </div>
                </button>
              </div>

              {showCalcDetail && (
                <div className="space-y-5">
                  {/* ─── Langkah 1: Penjelasan Rumus ───────────────────────── */}
                  <div className="bg-slate-900 rounded-2xl p-6 text-white">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                      Rumus Metode SAW (Simple Additive Weighting)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-2 font-semibold">Normalisasi — Benefit</p>
                        <p className="text-emerald-400 font-mono text-lg font-bold text-center py-2">
                          r<sub>ij</sub> = x<sub>ij</sub> / max(x<sub>j</sub>)
                        </p>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                          Untuk kriteria benefit (semakin tinggi semakin baik): nilai dibagi dengan nilai maksimum kolom tersebut.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {result.criteriaConfig
                            .filter((c) => c.attrType === "benefit")
                            .map((c) => (
                              <span key={c.code} className="text-[10px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded">
                                {c.code} ({CRITERIA_NAMES[c.code]})
                              </span>
                            ))}
                        </div>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-2 font-semibold">Normalisasi — Cost</p>
                        <p className="text-amber-400 font-mono text-lg font-bold text-center py-2">
                          r<sub>ij</sub> = min(x<sub>j</sub>) / x<sub>ij</sub>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                          Untuk kriteria cost (semakin rendah semakin baik): nilai minimum kolom dibagi dengan nilai tersebut.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {result.criteriaConfig
                            .filter((c) => c.attrType === "cost")
                            .map((c) => (
                              <span key={c.code} className="text-[10px] bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded">
                                {c.code} ({CRITERIA_NAMES[c.code]})
                              </span>
                            ))}
                        </div>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wide mb-2 font-semibold">Skor Akhir SAW</p>
                        <p className="text-indigo-400 font-mono text-lg font-bold text-center py-2">
                          V<sub>i</sub> = Σ(w<sub>j</sub> × r<sub>ij</sub>)
                        </p>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                          Skor akhir = jumlah dari (bobot kriteria × nilai normalisasi) untuk semua kriteria. Ranking berdasarkan V<sub>i</sub> tertinggi.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 text-[11px] text-slate-500 border-t border-slate-700 pt-3">
                      <strong className="text-slate-400">Keterangan:</strong>{" "}
                      x<sub>ij</sub> = nilai asli laptop i pada kriteria j &nbsp;|&nbsp;
                      r<sub>ij</sub> = nilai normalisasi &nbsp;|&nbsp;
                      w<sub>j</sub> = bobot kriteria j &nbsp;|&nbsp;
                      V<sub>i</sub> = skor SAW laptop i
                    </div>
                  </div>

                  {/* ─── Langkah 2: Tabel Kriteria & Bobot ────────────────── */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                      Kriteria, Tipe, dan Bobot (w<sub>j</sub>)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Kode</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Nama Kriteria</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">Tipe</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">Bobot (w<sub>j</sub>)</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">Max</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">Min</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.criteriaConfig.map((c) => (
                            <tr key={c.code} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg">{c.code}</span>
                              </td>
                              <td className="px-3 py-2 text-slate-700 font-medium text-xs">{CRITERIA_NAMES[c.code]}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                  c.attrType === "benefit" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                  {c.attrType === "benefit" ? "Benefit ↑" : "Cost ↓"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-indigo-600 text-sm">
                                {(c.weight * 100).toFixed(0)}%
                              </td>
                              <td className="px-3 py-2 text-center text-xs text-slate-600 font-mono">
                                {result.maxValues[c.code]?.toFixed(2)}{CRITERIA_UNITS[c.code] && ` ${CRITERIA_UNITS[c.code]}`}
                              </td>
                              <td className="px-3 py-2 text-center text-xs text-slate-600 font-mono">
                                {result.minValues[c.code]?.toFixed(2)}{CRITERIA_UNITS[c.code] && ` ${CRITERIA_UNITS[c.code]}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ─── Langkah 3: Matriks Keputusan (Nilai Asli) ─────────── */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                      Matriks Keputusan (x<sub>ij</sub>) — Nilai Asli
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-4 ml-8">
                      Nilai mentah dari setiap laptop untuk setiap kriteria.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">#</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Laptop</th>
                            {codes.map((c) => (
                              <th key={c} className="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                                {c}<br />
                                <span className="text-[10px] text-slate-400 font-normal">{CRITERIA_NAMES[c]}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.results.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${rankBadge(item.rank)}`}>
                                  {item.rank}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs font-medium text-slate-800 max-w-[150px] truncate">
                                {item.company} {item.product}
                              </td>
                              {codes.map((c) => (
                                <td key={c} className="px-3 py-2 text-center text-xs text-slate-700 font-mono">
                                  {item.rawValues[c]?.toFixed(2)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ─── Langkah 4: Matriks Normalisasi (r_ij) ──────────── */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">4</span>
                      Matriks Normalisasi (r<sub>ij</sub>)
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-4 ml-8">
                      Benefit: r<sub>ij</sub> = x<sub>ij</sub> / max(x<sub>j</sub>) &nbsp;|&nbsp; Cost: r<sub>ij</sub> = min(x<sub>j</sub>) / x<sub>ij</sub>
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">#</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Laptop</th>
                            {codes.map((c) => (
                              <th key={c} className="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                                r<sub>{c}</sub>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.results.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${rankBadge(item.rank)}`}>
                                  {item.rank}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs font-medium text-slate-800 max-w-[150px] truncate">
                                {item.company} {item.product}
                              </td>
                              {codes.map((c) => {
                                const val = item.normalizedValues[c] ?? 0;
                                return (
                                  <td key={c} className="px-3 py-2 text-center">
                                    <span className={`text-xs font-mono font-medium ${
                                      val >= 0.8 ? "text-emerald-600" : val >= 0.5 ? "text-amber-600" : "text-red-500"
                                    }`}>
                                      {val.toFixed(4)}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ─── Langkah 5: Nilai Terbobot (w_j × r_ij) ────────── */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">5</span>
                      Nilai Terbobot (w<sub>j</sub> × r<sub>ij</sub>)
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-4 ml-8">
                      Setiap nilai normalisasi dikalikan dengan bobot kriteria masing-masing.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">#</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Laptop</th>
                            {codes.map((c) => (
                              <th key={c} className="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                                w<sub>{c}</sub>×r<sub>{c}</sub>
                              </th>
                            ))}
                            <th className="px-3 py-2 text-center text-xs font-bold text-indigo-600 bg-indigo-50">
                              V<sub>i</sub> (Skor)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.results.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${rankBadge(item.rank)}`}>
                                  {item.rank}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs font-medium text-slate-800 max-w-[150px] truncate">
                                {item.company} {item.product}
                              </td>
                              {codes.map((c) => (
                                <td key={c} className="px-3 py-2 text-center text-xs text-slate-600 font-mono">
                                  {(item.weightedValues[c] ?? 0).toFixed(4)}
                                </td>
                              ))}
                              <td className="px-3 py-2 text-center bg-indigo-50">
                                <span className={`text-sm font-bold ${scoreColor(item.sawScore)}`}>
                                  {item.sawScore.toFixed(4)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ─── Langkah 6: Contoh Perhitungan Manual ─────────────── */}
                  {result.results.length > 0 && (
                    <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-5">
                      <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">6</span>
                        Contoh Perhitungan — Peringkat 1: {result.results[0].company} {result.results[0].product}
                      </h3>
                      <div className="space-y-3 text-xs text-slate-700 font-mono bg-white rounded-xl p-4 border border-indigo-100">
                        {codes.map((c) => {
                          const item = result.results[0];
                          const config = result.criteriaConfig.find((cc) => cc.code === c);
                          const isBenefit = config?.attrType === "benefit";
                          const raw = item.rawValues[c];
                          const norm = item.normalizedValues[c];
                          const weighted = item.weightedValues[c];
                          const maxVal = result.maxValues[c];
                          const minVal = result.minValues[c];
                          const weight = result.weightsUsed[c];

                          return (
                            <div key={c} className="border-b border-slate-100 pb-2 last:border-0">
                              <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1 font-sans font-semibold">
                                {c} — {CRITERIA_NAMES[c]} ({config?.attrType})
                              </p>
                              {isBenefit ? (
                                <p>
                                  r<sub>{c}</sub> = x / max = {raw?.toFixed(2)} / {maxVal?.toFixed(2)} ={" "}
                                  <strong className="text-emerald-600">{norm?.toFixed(4)}</strong>
                                </p>
                              ) : (
                                <p>
                                  r<sub>{c}</sub> = min / x = {minVal?.toFixed(2)} / {raw?.toFixed(2)} ={" "}
                                  <strong className="text-amber-600">{norm?.toFixed(4)}</strong>
                                </p>
                              )}
                              <p className="text-slate-500">
                                w<sub>{c}</sub> × r<sub>{c}</sub> = {weight?.toFixed(2)} × {norm?.toFixed(4)} ={" "}
                                <strong className="text-indigo-600">{weighted?.toFixed(4)}</strong>
                              </p>
                            </div>
                          );
                        })}
                        <div className="pt-2 border-t border-indigo-200">
                          <p className="text-sm">
                            <strong className="text-indigo-700">
                              V<sub>1</sub> = {codes
                                .map((c) => result.results[0].weightedValues[c]?.toFixed(4))
                                .join(" + ")}{" "}
                              = {result.results[0].sawScore.toFixed(4)}
                            </strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
