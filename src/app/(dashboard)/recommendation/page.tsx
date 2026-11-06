"use client";

import { useState } from "react";
import { WEIGHT_PRESETS, CRITERIA_NAMES, formatEuro } from "@/lib/constants";
import {
  Star,
  SlidersHorizontal,
  AlertTriangle,
  Sparkles,
  Calculator,
  ChevronUp,
  ChevronDown,
  Check,
  GraduationCap,
  Laptop,
  Palette,
  Gamepad2,
  Plane,
  Coins,
  ListOrdered,
  RotateCcw,
} from "lucide-react";

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

const PRESET_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  kuliah_umum: GraduationCap,
  pemrograman: Laptop,
  desain_grafis: Palette,
  gaming: Gamepad2,
  mobilitas_tinggi: Plane,
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
    C1: 0.30,
    C2: 0.25,
    C3: 0.20,
    C4: 0.15,
    C5: 0.10,
  });
  const [showWeightSliders, setShowWeightSliders] = useState(false);
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
    } else {
      setShowWeightSliders(true);
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
          budgetMax: budgetMax ? parseFloat(budgetMax) / 17000 : null,
          usageType: selectedPreset !== "custom" ? selectedPreset : null,
          customWeights: currentWeights,
          topN,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Terjadi kesalahan saat memproses rekomendasi");
      setResult(data);
      setShowCalcDetail(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const codes = ["C1", "C2", "C3", "C4", "C5"];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[10px] shadow-[6px_6px_0px_#171717] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F4D35E] border border-[#171717] rounded-[4px] font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">
              <Star size={14} fill="#F4D35E" stroke="#171717" /> Algoritma SAW
            </div>
            <h1 className="font-['Space_Grotesk',sans-serif] text-2xl md:text-3xl font-extrabold text-[#171717] uppercase tracking-tight">
              Kalkulasi Rekomendasi Laptop
            </h1>
            <p className="font-['Inter',sans-serif] text-xs md:text-sm text-[#666666] mt-1 max-w-3xl">
              Pilih profil skenario pemakaian, tentukan batasan anggaran, lalu jalankan perankingan SAW untuk mendapatkan alternatif laptop terbaik secara transparan.
            </p>
          </div>
        </div>
      </div>

      {/* Main Control Panel (Form Input & Configuration At Top) */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[6px_6px_0px_#171717] p-5 md:p-6 space-y-6">
        {/* Step 1: Preset Profiles */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-['Space_Grotesk',sans-serif] text-xs md:text-sm font-bold text-[#171717] uppercase tracking-wide flex items-center gap-2">
              <span className="w-5 h-5 bg-[#F4D35E] border border-[#171717] rounded-full flex items-center justify-center text-xs font-black">
                1
              </span>
              Pilih Profil Penggunaan
            </h2>
            <span className="text-[11px] font-['Inter',sans-serif] text-[#666666]">
              {selectedPreset === "custom"
                ? "Mode Kustom Manual"
                : WEIGHT_PRESETS[selectedPreset as PresetKey]?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {(Object.keys(WEIGHT_PRESETS) as PresetKey[]).map((key) => {
              const preset = WEIGHT_PRESETS[key];
              const isActive = selectedPreset === key;
              const PresetIcon = PRESET_ICONS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetSelect(key)}
                  className={`p-3 rounded-[6px] border-2 border-[#171717] text-left transition-all flex flex-col justify-between min-h-[96px] ${
                    isActive
                      ? "bg-[#F4D35E] shadow-[3px_3px_0px_#171717] -translate-y-0.5"
                      : "bg-[#FFFFFF] hover:bg-[#EAE8E1] hover:translate-x-[1px] hover:translate-y-[1px]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    {PresetIcon && <PresetIcon size={20} strokeWidth={2.2} className="text-[#171717]" />}
                    {isActive && <Check size={14} strokeWidth={3} className="text-[#171717]" />}
                  </div>
                  <div>
                    <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] leading-snug">
                      {preset.label}
                    </p>
                    <p className="font-['Inter',sans-serif] text-[10px] text-[#666666] line-clamp-2 mt-0.5 leading-tight">
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Custom Option */}
            <button
              type="button"
              onClick={() => handlePresetSelect("custom")}
              className={`p-3 rounded-[6px] border-2 border-[#171717] text-left transition-all flex flex-col justify-between min-h-[96px] ${
                selectedPreset === "custom"
                  ? "bg-[#F4D35E] shadow-[3px_3px_0px_#171717] -translate-y-0.5"
                  : "bg-[#FFFFFF] hover:bg-[#EAE8E1] hover:translate-x-[1px] hover:translate-y-[1px]"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <SlidersHorizontal size={20} strokeWidth={2.2} className="text-[#171717]" />
                {selectedPreset === "custom" && <Check size={14} strokeWidth={3} className="text-[#171717]" />}
              </div>
              <div>
                <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] leading-snug">
                  Kustom Manual
                </p>
                <p className="font-['Inter',sans-serif] text-[10px] text-[#666666] line-clamp-2 mt-0.5 leading-tight">
                  Atur sendiri persentase bobot C1–C5
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Inputs & Execution Button (PROMINENT AT TOP) */}
        <div className="bg-[#F8F7F2] border-2 border-[#171717] rounded-[8px] p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-['Space_Grotesk',sans-serif] text-xs md:text-sm font-bold text-[#171717] uppercase tracking-wide flex items-center gap-2">
              <span className="w-5 h-5 bg-[#F4D35E] border border-[#171717] rounded-full flex items-center justify-center text-xs font-black">
                2
              </span>
              Filter Anggaran &amp; Jalankan Perhitungan
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
            {/* Budget Input */}
            <div className="lg:col-span-5">
              <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] flex items-center gap-1.5 mb-1.5">
                <Coins size={14} /> Batas Anggaran Maksimal (IDR)
              </label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Contoh: 15000000 (Kosong = Semua Harga)"
                className="neo-input w-full"
              />
              <span className="font-['Inter',sans-serif] text-[10px] text-[#666666] mt-1 block">
                Opsional: saring hanya laptop dalam batas dana Anda
              </span>
            </div>

            {/* Top N Selector */}
            <div className="lg:col-span-3">
              <label className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] flex items-center gap-1.5 mb-1.5">
                <ListOrdered size={14} /> Tampilkan Top
              </label>
              <select
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value))}
                className="neo-input w-full cursor-pointer"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} Laptop Terbaik
                  </option>
                ))}
              </select>
              <span className="font-['Inter',sans-serif] text-[10px] text-[#666666] mt-1 block">
                Jumlah laptop yang dirangking teratas
              </span>
            </div>

            {/* Calculate Button (CLEARLY VISIBLE, PROMINENT) */}
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={handleCalculate}
                disabled={loading || !weightValid}
                className="neo-btn-accent w-full py-3 px-4 text-xs md:text-sm font-extrabold uppercase tracking-wide inline-flex items-center justify-center gap-2 shadow-[4px_4px_0px_#171717] h-[46px]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#171717] border-t-transparent rounded-full animate-spin" />
                    <span>Menghitung SAW...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} strokeWidth={2.5} />
                    <span>Hitung Rekomendasi Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step 3: Current Criteria Weights Bar / Sliders Toggle */}
        <div className="border border-[#171717] rounded-[6px] p-3.5 bg-[#FFFFFF]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#EAE8E1]">
            <div className="flex items-center gap-2">
              <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] uppercase tracking-wide">
                Distribusi Bobot Kriteria
              </span>
              <span
                className={`font-['Space_Grotesk',sans-serif] text-[11px] font-bold px-2 py-0.5 border border-[#171717] rounded-[4px] ${
                  weightValid ? "bg-[#B8E0D2] text-[#171717]" : "bg-[#FF9B85] text-[#171717]"
                }`}
              >
                Total: {(totalWeight * 100).toFixed(0)}% {weightValid ? "(Valid)" : "(Wajib 100%)"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowWeightSliders(!showWeightSliders)}
              className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717] hover:underline inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <SlidersHorizontal size={13} />
              <span>{showWeightSliders ? "Sembunyikan Slider Slider" : "Atur Slider Bobot Kustom"}</span>
              {showWeightSliders ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* 5 Criteria Preview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3">
            {codes.map((code) => {
              const w = currentWeights[code] ?? 0;
              const isCost = code === "C1" || code === "C5";
              return (
                <div
                  key={code}
                  className="bg-[#F8F7F2] border border-[#171717] rounded-[4px] p-2 text-center"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#666666] font-bold">
                    <span>{code}</span>
                    <span className={`px-1 rounded text-[9px] ${isCost ? "bg-[#FF9B85]" : "bg-[#B8E0D2]"}`}>
                      {isCost ? "Cost" : "Benefit"}
                    </span>
                  </div>
                  <div className="font-['Space_Grotesk',sans-serif] text-base font-black text-[#171717] my-0.5">
                    {(w * 100).toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-[#666666] truncate font-medium">
                    {CRITERIA_NAMES[code]}
                  </div>

                  {/* Sliders when expanded */}
                  {showWeightSliders && (
                    <div className="mt-2 pt-2 border-t border-[#D6D3CB]">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={customWeights[code]}
                        onChange={(e) => {
                          if (selectedPreset !== "custom") setSelectedPreset("custom");
                          handleWeightChange(code, parseFloat(e.target.value));
                        }}
                        className="w-full h-1.5 bg-[#FFFFFF] border border-[#171717] rounded cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-[#FF9B85] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-4 text-xs font-bold text-[#171717] flex items-center gap-3">
          <AlertTriangle size={18} strokeWidth={2.5} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {!result && !loading && !error && (
        <div className="bg-[#FFFFFF] border-2 border-dashed border-[#171717] rounded-[8px] p-8 md:p-12 text-center">
          <div className="w-14 h-14 bg-[#F4D35E] border-2 border-[#171717] rounded-[8px] shadow-[3px_3px_0px_#171717] flex items-center justify-center mx-auto mb-3">
            <Sparkles size={24} strokeWidth={2.5} className="text-[#171717]" />
          </div>
          <h3 className="font-['Space_Grotesk',sans-serif] text-base md:text-lg font-bold text-[#171717] mb-1">
            Siap Menghitung Rekomendasi SAW
          </h3>
          <p className="font-['Inter',sans-serif] text-xs text-[#666666] max-w-md mx-auto leading-relaxed">
            Pilih profil penggunaan dan batas anggaran di panel atas, lalu klik tombol{" "}
            <strong className="text-[#171717]">Hitung Rekomendasi Sekarang</strong> untuk memproses matriks keputusan dan skor preferensi.
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 border-4 border-[#171717] border-t-[#F4D35E] rounded-full animate-spin mb-4" />
          <h3 className="font-['Space_Grotesk',sans-serif] text-base font-bold text-[#171717]">
            Memproses Kalkulasi SAW...
          </h3>
          <p className="font-['Inter',sans-serif] text-xs text-[#666666] mt-1">
            Melakukan normalisasi matriks dan pembobotan kriteria untuk seluruh dataset alternatif
          </p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Summary Metric Header */}
          <div className="bg-[#F4D35E] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-4 md:p-5 grid grid-cols-3 gap-3 md:gap-4 text-center">
            <div>
              <p className="font-['Space_Grotesk',sans-serif] text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#171717]">
                Total Alternatif
              </p>
              <p className="font-['Space_Grotesk',sans-serif] text-xl md:text-2xl font-black text-[#171717]">
                {result.totalAlternatives.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="border-x-2 border-[#171717]">
              <p className="font-['Space_Grotesk',sans-serif] text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#171717]">
                Lolos Filter
              </p>
              <p className="font-['Space_Grotesk',sans-serif] text-xl md:text-2xl font-black text-[#171717]">
                {result.filtered.toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="font-['Space_Grotesk',sans-serif] text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#171717]">
                Peringkat Top
              </p>
              <p className="font-['Space_Grotesk',sans-serif] text-xl md:text-2xl font-black text-[#171717]">
                {result.results.length} Unit
              </p>
            </div>
          </div>

          {/* Ranking Results List */}
          <div className="space-y-3">
            <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] uppercase tracking-wide">
              Daftar Rekomendasi Teratas
            </h3>

            {result.results.map((item) => {
              const isTop1 = item.rank === 1;
              const isTop2 = item.rank === 2;
              const isTop3 = item.rank === 3;

              return (
                <div
                  key={item.id}
                  className={`border-2 border-[#171717] rounded-[8px] p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isTop1
                      ? "bg-[#FFFFFF] shadow-[6px_6px_0px_#171717] border-l-8 border-l-[#F4D35E]"
                      : isTop2
                      ? "bg-[#FFFFFF] shadow-[4px_4px_0px_#171717] border-l-8 border-l-[#B8E0D2]"
                      : isTop3
                      ? "bg-[#FFFFFF] shadow-[4px_4px_0px_#171717] border-l-8 border-l-[#FF9B85]"
                      : "bg-[#FFFFFF] shadow-[3px_3px_0px_#171717]"
                  }`}
                >
                  <div className="flex items-start md:items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-11 h-11 rounded-[6px] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center shrink-0 ${
                        isTop1
                          ? "bg-[#F4D35E]"
                          : isTop2
                          ? "bg-[#B8E0D2]"
                          : isTop3
                          ? "bg-[#FF9B85]"
                          : "bg-[#FFFFFF]"
                      }`}
                    >
                      <span className="font-['Space_Grotesk',sans-serif] text-sm font-black text-[#171717]">
                        #{item.rank}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-['Space_Grotesk',sans-serif] text-sm md:text-base font-bold text-[#171717] truncate">
                          {item.company} {item.product}
                        </h4>
                        {isTop1 && (
                          <span className="neo-badge bg-[#F4D35E] text-[#171717] text-[10px]">
                            Rekomendasi Utama
                          </span>
                        )}
                      </div>

                      {/* Specs */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
                        <span>RAM {item.rawValues.C3} GB</span>
                        <span>•</span>
                        <span>Storage {item.rawValues.C4} GB</span>
                        <span>•</span>
                        <span>CPU Score {item.rawValues.C2}/100</span>
                        <span>•</span>
                        <span>Berat {item.rawValues.C5} kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & SAW Score */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-[#EAE8E1] shrink-0">
                    <div className="text-left md:text-right">
                      <p className="font-['Space_Grotesk',sans-serif] text-sm md:text-base font-extrabold text-[#171717]">
                        {formatEuro(item.rawValues.C1)}
                      </p>
                      <span className="text-[10px] text-[#666666]">Estimasi Rupiah</span>
                    </div>

                    <div className="bg-[#171717] text-[#FFFFFF] border-2 border-[#171717] rounded-[6px] shadow-[2px_2px_0px_#F4D35E] px-3 py-1.5 text-center shrink-0">
                      <span className="text-[9px] uppercase tracking-wider block font-bold text-[#F4D35E]">
                        Skor SAW
                      </span>
                      <span className="font-['Space_Grotesk',sans-serif] text-sm font-black">
                        {item.sawScore.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toggle Detail Calculation Button */}
          <div>
            <button
              onClick={() => setShowCalcDetail(!showCalcDetail)}
              className="neo-btn-secondary w-full py-3.5 px-5 flex items-center justify-between text-left"
            >
              <div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] inline-flex items-center gap-2">
                  <Calculator size={16} strokeWidth={2.5} /> Penjelasan Rumus &amp; Matriks Langkah Kalkulasi SAW
                </h3>
                <p className="font-['Inter',sans-serif] text-xs text-[#666666] mt-0.5">
                  Klik untuk melihat rincian matriks keputusan, normalisasi, dan perhitungan manual ranking 1
                </p>
              </div>
              <div className="text-[#171717]">
                {showCalcDetail ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </button>
          </div>

          {/* Detailed Calculation Walkthrough Accordion Content */}
          {showCalcDetail && (
            <div className="space-y-5">
              {/* Step 1: Formula Explanation */}
              <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-6">
                <h4 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#F4D35E] border border-[#171717] rounded-full flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  Rumus Normalisasi &amp; Perhitungan Skor
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="bg-[#F8F7F2] border border-[#171717] rounded-[6px] p-3.5">
                    <span className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase text-[#666666] block mb-1">
                      Kriteria Benefit
                    </span>
                    <p className="font-bold text-sm text-[#171717]">
                      r_ij = x_ij / max(x_j)
                    </p>
                    <p className="text-[11px] text-[#666666] mt-2 font-sans">
                      Untuk kriteria benefit (C2 CPU, C3 RAM, C4 Storage): nilai alternatif dibagi nilai maksimum kolom.
                    </p>
                  </div>

                  <div className="bg-[#F8F7F2] border border-[#171717] rounded-[6px] p-3.5">
                    <span className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase text-[#666666] block mb-1">
                      Kriteria Cost
                    </span>
                    <p className="font-bold text-sm text-[#171717]">
                      r_ij = min(x_j) / x_ij
                    </p>
                    <p className="text-[11px] text-[#666666] mt-2 font-sans">
                      Untuk kriteria cost (C1 Harga, C5 Berat): nilai minimum kolom dibagi nilai alternatif tersebut.
                    </p>
                  </div>

                  <div className="bg-[#F8F7F2] border border-[#171717] rounded-[6px] p-3.5">
                    <span className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold uppercase text-[#666666] block mb-1">
                      Nilai Preferensi (V_i)
                    </span>
                    <p className="font-bold text-sm text-[#171717]">
                      V_i = ∑ (w_j × r_ij)
                    </p>
                    <p className="text-[11px] text-[#666666] mt-2 font-sans">
                      Skor preferensi diperoleh dengan menjumlahkan perkalian bobot kriteria dengan nilai ternormalisasi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Criteria Configuration Table */}
              <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
                <h4 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#F4D35E] border border-[#171717] rounded-full flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  Tabel Konfigurasi, Nilai Maksimum &amp; Nilai Minimum
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#171717] bg-[#F8F7F2]">
                        <th className="p-2.5 font-['Space_Grotesk',sans-serif] font-bold">Kode</th>
                        <th className="p-2.5 font-['Space_Grotesk',sans-serif] font-bold">Kriteria</th>
                        <th className="p-2.5 font-['Space_Grotesk',sans-serif] font-bold text-center">Tipe</th>
                        <th className="p-2.5 font-['Space_Grotesk',sans-serif] font-bold text-center">Bobot (w)</th>
                        <th className="p-2.5 font-['Space_Grotesk',sans-serif] font-bold text-center">Max Kolom</th>
                        <th className="p-2.5 font-['Space_Grotesk',sans-serif] font-bold text-center">Min Kolom</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-[#171717]">
                      {result.criteriaConfig.map((c) => (
                        <tr key={c.code} className="hover:bg-[#F8F7F2]">
                          <td className="p-2.5 font-bold">{c.code}</td>
                          <td className="p-2.5 font-medium">{CRITERIA_NAMES[c.code]}</td>
                          <td className="p-2.5 text-center">
                            <span className={`neo-badge ${c.attrType === "cost" ? "bg-[#FF9B85]" : "bg-[#B8E0D2]"}`}>
                              {c.attrType.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            {(c.weight * 100).toFixed(0)}%
                          </td>
                          <td className="p-2.5 text-center font-mono font-medium">
                            {result.maxValues[c.code]?.toFixed(2)} {CRITERIA_UNITS[c.code]}
                          </td>
                          <td className="p-2.5 text-center font-mono font-medium">
                            {result.minValues[c.code]?.toFixed(2)} {CRITERIA_UNITS[c.code]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 3: Raw Decision Matrix */}
              <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
                <h4 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] mb-1 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#F4D35E] border border-[#171717] rounded-full flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  Matriks Keputusan (x_ij) — Nilai Mentah Alternatif
                </h4>
                <p className="font-['Inter',sans-serif] text-[11px] text-[#666666] mb-3 ml-7">
                  Nilai asli dari setiap laptop untuk masing-masing kriteria C1 s/d C5.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#171717] bg-[#F8F7F2]">
                        <th className="p-2 font-['Space_Grotesk',sans-serif] font-bold">Rank</th>
                        <th className="p-2 font-['Space_Grotesk',sans-serif] font-bold">Laptop</th>
                        {codes.map((c) => (
                          <th key={c} className="p-2 font-['Space_Grotesk',sans-serif] font-bold text-center">
                            {c} ({CRITERIA_NAMES[c]})
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-[#171717]">
                      {result.results.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F8F7F2]">
                          <td className="p-2 font-bold">#{item.rank}</td>
                          <td className="p-2 font-medium max-w-[180px] truncate">
                            {item.company} {item.product}
                          </td>
                          {codes.map((c) => (
                            <td key={c} className="p-2 text-center font-mono">
                              {item.rawValues[c]?.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 4: Normalized Matrix */}
              <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
                <h4 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] mb-1 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#F4D35E] border border-[#171717] rounded-full flex items-center justify-center text-xs font-black">
                    4
                  </span>
                  Matriks Normalisasi (r_ij)
                </h4>
                <p className="font-['Inter',sans-serif] text-[11px] text-[#666666] mb-3 ml-7">
                  Benefit: r_ij = x_ij / max(x_j) &nbsp;|&nbsp; Cost: r_ij = min(x_j) / x_ij
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#171717] bg-[#F8F7F2]">
                        <th className="p-2 font-['Space_Grotesk',sans-serif] font-bold">Rank</th>
                        <th className="p-2 font-['Space_Grotesk',sans-serif] font-bold">Laptop</th>
                        {codes.map((c) => (
                          <th key={c} className="p-2 font-['Space_Grotesk',sans-serif] font-bold text-center">
                            r_{c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-[#171717]">
                      {result.results.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F8F7F2]">
                          <td className="p-2 font-bold">#{item.rank}</td>
                          <td className="p-2 font-medium max-w-[180px] truncate">
                            {item.company} {item.product}
                          </td>
                          {codes.map((c) => (
                            <td key={c} className="p-2 text-center font-mono font-bold">
                              {item.normalizedValues[c]?.toFixed(4)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 5: Weighted Matrix */}
              <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
                <h4 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] mb-1 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#F4D35E] border border-[#171717] rounded-full flex items-center justify-center text-xs font-black">
                    5
                  </span>
                  Nilai Terbobot (w_j × r_ij) &amp; Skor Akhir V_i
                </h4>
                <p className="font-['Inter',sans-serif] text-[11px] text-[#666666] mb-3 ml-7">
                  Setiap nilai ternormalisasi dikalikan dengan bobot kriteria w_j kemudian dijumlahkan.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#171717] bg-[#F8F7F2]">
                        <th className="p-2 font-['Space_Grotesk',sans-serif] font-bold">Rank</th>
                        <th className="p-2 font-['Space_Grotesk',sans-serif] font-bold">Laptop</th>
                        {codes.map((c) => (
                          <th key={c} className="p-2 font-['Space_Grotesk',sans-serif] font-bold text-center">
                            w_{c}×r_{c}
                          </th>
                        ))}
                        <th className="p-2 font-['Space_Grotesk',sans-serif] font-bold text-center bg-[#F4D35E]">
                          V_i (Skor)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-[#171717]">
                      {result.results.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F8F7F2]">
                          <td className="p-2 font-bold">#{item.rank}</td>
                          <td className="p-2 font-medium max-w-[180px] truncate">
                            {item.company} {item.product}
                          </td>
                          {codes.map((c) => (
                            <td key={c} className="p-2 text-center font-mono">
                              {item.weightedValues[c]?.toFixed(4)}
                            </td>
                          ))}
                          <td className="p-2 text-center font-mono font-bold bg-[#F4D35E]/30">
                            {item.sawScore.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 6: Detailed Breakdown for Rank 1 */}
              {result.results.length > 0 && (
                <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
                  <h4 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#F4D35E] border border-[#171717] rounded-full flex items-center justify-center text-xs font-black">
                      6
                    </span>
                    Contoh Perhitungan Manual untuk Peringkat 1:{" "}
                    <span className="underline">
                      {result.results[0].company} {result.results[0].product}
                    </span>
                  </h4>

                  <div className="space-y-3 font-mono text-xs bg-[#F8F7F2] border border-[#171717] rounded-[6px] p-4">
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
                        <div key={c} className="border-b border-[#D6D3CB] pb-2 last:border-0">
                          <p className="font-['Space_Grotesk',sans-serif] text-[10px] font-bold text-[#666666] uppercase">
                            {c} — {CRITERIA_NAMES[c]} ({config?.attrType.toUpperCase()})
                          </p>
                          {isBenefit ? (
                            <p className="mt-0.5">
                              r_{c} = x / max = {raw?.toFixed(2)} / {maxVal?.toFixed(2)} ={" "}
                              <strong className="text-[#171717]">{norm?.toFixed(4)}</strong>
                            </p>
                          ) : (
                            <p className="mt-0.5">
                              r_{c} = min / x = {minVal?.toFixed(2)} / {raw?.toFixed(2)} ={" "}
                              <strong className="text-[#171717]">{norm?.toFixed(4)}</strong>
                            </p>
                          )}
                          <p className="text-[#666666]">
                            w_{c} × r_{c} = {weight?.toFixed(2)} × {norm?.toFixed(4)} ={" "}
                            <strong className="text-[#171717]">{weighted?.toFixed(4)}</strong>
                          </p>
                        </div>
                      );
                    })}

                    <div className="pt-2 border-t-2 border-[#171717] bg-[#F4D35E]/40 p-2.5 rounded-[4px]">
                      <p className="text-xs font-bold text-[#171717]">
                        V_1 ={" "}
                        {codes
                          .map((c) => result.results[0].weightedValues[c]?.toFixed(4))
                          .join(" + ")}{" "}
                        ={" "}
                        <span className="text-sm font-black underline">
                          {result.results[0].sawScore.toFixed(4)}
                        </span>
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
  );
}
