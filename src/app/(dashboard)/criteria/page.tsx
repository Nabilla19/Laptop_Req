"use client";

import { useState, useEffect, useCallback } from "react";
import { WEIGHT_PRESETS, DEFAULT_CRITERIA } from "@/lib/constants";
import { SlidersHorizontal, AlertTriangle, CheckCircle2, ArrowRight, Check } from "lucide-react";

interface CriteriaRow {
  id: string;
  code: string;
  name: string;
  weight: number;
  attrType: string;
  description: string | null;
  extractRule: string | null;
}

interface PresetRow {
  id: string;
  name: string;
  label: string;
  description: string | null;
  weights: string;
}

const ATTR_TYPE_LABELS: Record<string, string> = {
  benefit: "Benefit (↑ Lebih Tinggi Lebih Baik)",
  cost: "Cost (↓ Lebih Rendah Lebih Baik)",
};

export default function CriteriaPage() {
  const [criteria, setCriteria] = useState<CriteriaRow[]>([]);
  const [presets, setPresets] = useState<PresetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editWeights, setEditWeights] = useState<Record<string, number>>({});
  const [dirty, setDirty] = useState(false);

  const fetchCriteria = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/criteria");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat kriteria");
      setCriteria(data.criteria ?? []);
      setPresets(data.presets ?? []);
      const weights: Record<string, number> = {};
      (data.criteria ?? []).forEach((c: CriteriaRow) => {
        weights[c.code] = c.weight;
      });
      setEditWeights(weights);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  const totalWeight = Object.values(editWeights).reduce((s, v) => s + v, 0);
  const weightValid = Math.abs(totalWeight - 1.0) < 0.001;

  const handleWeightChange = (code: string, val: number) => {
    setEditWeights((prev) => ({ ...prev, [code]: val }));
    setDirty(true);
  };

  const applyPreset = (presetWeights: Record<string, number>) => {
    setEditWeights((prev) => {
      const next = { ...prev };
      Object.entries(presetWeights).forEach(([code, w]) => {
        next[code] = w;
      });
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload = criteria.map((c) => ({
        code: c.code,
        name: c.name,
        attrType: c.attrType,
        weight: editWeights[c.code] ?? c.weight,
      }));
      const res = await fetch("/api/criteria", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
      setSuccessMsg("Bobot kriteria berhasil diperbarui dan disimpan!");
      setDirty(false);
      fetchCriteria();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const weights: Record<string, number> = {};
    criteria.forEach((c) => {
      weights[c.code] = c.weight;
    });
    setEditWeights(weights);
    setDirty(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[10px] shadow-[6px_6px_0px_#171717] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F4D35E] border border-[#171717] rounded-[4px] font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#171717] mb-2">
              <SlidersHorizontal size={12} strokeWidth={2.5} /> Parameter SAW
            </div>
            <h1 className="font-['Space_Grotesk',sans-serif] text-2xl md:text-3xl font-extrabold text-[#171717] uppercase tracking-tight">
              Kriteria &amp; Bobot Preferensi
            </h1>
            <p className="font-['Inter',sans-serif] text-xs md:text-sm text-[#666666] mt-1 max-w-2xl">
              Atur persentase bobot 5 kriteria utama (C1 s/d C5). Total penjumlahan seluruh bobot kriteria harus tepat bernilai 100% (1.0).
            </p>
          </div>

          {dirty && (
            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <button
                onClick={handleReset}
                className="neo-btn-secondary px-4 py-2.5 text-xs font-bold"
              >
                Reset Perubahan
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !weightValid}
                className="neo-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2"
              >
                {saving ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Check size={14} strokeWidth={2.5} /> Simpan Bobot
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-[#FF9B85] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-4 text-xs font-bold text-[#171717] flex items-center gap-3">
          <AlertTriangle size={16} strokeWidth={2.5} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-[#B8E0D2] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-4 text-xs font-bold text-[#171717] flex items-center gap-3">
          <CheckCircle2 size={16} strokeWidth={2.5} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-12 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#171717] border-t-[#F4D35E] rounded-full animate-spin mb-3" />
          <p className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717]">
            Memuat konfigurasi kriteria...
          </p>
        </div>
      ) : criteria.length === 0 ? (
        <div className="bg-[#F4D35E] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-8 text-center">
          <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#171717] mb-2">
            Kriteria Belum Tersedia di Database
          </h3>
          <p className="font-['Inter',sans-serif] text-xs text-[#171717] mb-4">
            Silakan lakukan proses seed database melalui menu Pengaturan untuk menginisialisasi kriteria default dan preset.
          </p>
          <a
            href="/settings"
            className="neo-btn-primary px-5 py-2.5 text-xs inline-flex items-center gap-2"
          >
            Buka Pengaturan Seed <ArrowRight size={14} />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Criteria Weights */}
          <div className="lg:col-span-2 space-y-4">
            {/* Total Weight Status Card */}
            <div
              className={`border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                weightValid ? "bg-[#B8E0D2]" : "bg-[#FF9B85]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#FFFFFF] border-2 border-[#171717] rounded-full flex items-center justify-center font-bold text-xs text-[#171717]">
                  {weightValid ? <Check size={14} strokeWidth={3} /> : "!"}
                </div>
                <div>
                  <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold uppercase tracking-wider text-[#171717]">
                    Total Bobot Terkini
                  </p>
                  <p className="font-['Space_Grotesk',sans-serif] text-xl font-extrabold text-[#171717]">
                    {(totalWeight * 100).toFixed(1)}%{" "}
                    <span className="text-xs font-bold font-['Inter',sans-serif]">
                      {weightValid ? "(Valid 100%)" : "— Wajib tepat 100%!"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full sm:w-48 h-3.5 bg-[#FFFFFF] border-2 border-[#171717] rounded-[4px] overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    weightValid ? "bg-[#171717]" : totalWeight > 1 ? "bg-[#171717]" : "bg-[#F4D35E]"
                  }`}
                  style={{ width: `${Math.min(totalWeight * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Individual Criteria Cards */}
            {criteria.map((c) => {
              const w = editWeights[c.code] ?? c.weight;
              const isCost = c.attrType === "cost";

              return (
                <div
                  key={c.id}
                  className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-['Space_Grotesk',sans-serif] text-xs font-bold px-2 py-0.5 bg-[#F4D35E] border border-[#171717] rounded-[4px]">
                          {c.code}
                        </span>
                        <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-sm text-[#171717]">
                          {c.name}
                        </h3>
                        <span
                          className={`font-['Space_Grotesk',sans-serif] text-[10px] font-bold px-2 py-0.5 border border-[#171717] rounded-[4px] ${
                            isCost ? "bg-[#FF9B85] text-[#171717]" : "bg-[#B8E0D2] text-[#171717]"
                          }`}
                        >
                          {ATTR_TYPE_LABELS[c.attrType] ?? c.attrType}
                        </span>
                      </div>
                      {c.description && (
                        <p className="font-['Inter',sans-serif] text-xs text-[#666666] leading-relaxed">
                          {c.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-['Space_Grotesk',sans-serif] text-2xl font-black text-[#171717]">
                        {(w * 100).toFixed(0)}%
                      </div>
                      <span className="font-['Inter',sans-serif] text-[10px] text-[#666666] font-medium">
                        {(w).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="mt-4 pt-3 border-t border-[#EAE8E1]">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={w}
                        onChange={(e) => handleWeightChange(c.code, parseFloat(e.target.value))}
                        className="w-full h-2 bg-[#EAE8E1] border border-[#171717] rounded-[4px] cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between font-['Space_Grotesk',sans-serif] text-[10px] font-bold text-[#666666] mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {c.extractRule && (
                    <div className="mt-3 pt-2 border-t border-[#EAE8E1] flex items-center gap-2 text-[11px] text-[#666666]">
                      <span className="font-bold text-[#171717]">Metode Ekstraksi:</span>
                      <code>{c.extractRule}</code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Presets & Formula */}
          <div className="space-y-5">
            {/* Presets Card */}
            <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] uppercase tracking-wide">
                  Preset Bobot Profil
                </h2>
                <span className="neo-badge bg-[#F4D35E] text-[#171717]">Otomatis</span>
              </div>
              <p className="font-['Inter',sans-serif] text-xs text-[#666666] mb-4">
                Klik preset profil untuk menerapkan kombinasi bobot siap pakai:
              </p>

              <div className="space-y-2.5">
                {(
                  Object.entries(WEIGHT_PRESETS) as [
                    string,
                    (typeof WEIGHT_PRESETS)[keyof typeof WEIGHT_PRESETS]
                  ][]
                ).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset({ ...preset.weights })}
                    className="w-full text-left p-3 rounded-[6px] border-2 border-[#171717] bg-[#F8F7F2] hover:bg-[#F4D35E] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#171717] active:shadow-none transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-['Space_Grotesk',sans-serif] text-xs font-bold text-[#171717]">
                        {preset.label}
                      </p>
                      <span className="text-[10px] font-bold font-['Space_Grotesk',sans-serif] group-hover:translate-x-0.5 transition-transform">
                        Terapkan →
                      </span>
                    </div>
                    {preset.description && (
                      <p className="font-['Inter',sans-serif] text-[11px] text-[#666666] line-clamp-1 mb-2">
                        {preset.description}
                      </p>
                    )}
                    {/* Mini Weight Bars */}
                    <div className="grid grid-cols-5 gap-1 pt-1.5 border-t border-[#D6D3CB]">
                      {Object.entries(preset.weights).map(([code, w]) => (
                        <div key={code} className="text-center">
                          <span className="font-['Space_Grotesk',sans-serif] text-[9px] font-bold text-[#171717]">
                            {code}
                          </span>
                          <div className="h-1 bg-[#D6D3CB] border border-[#171717] rounded-sm mt-0.5 overflow-hidden">
                            <div
                              className="h-full bg-[#171717]"
                              style={{ width: `${w * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-[#666666] font-mono">
                            {(w * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Formula Reference Card */}
            <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 bg-[#F4D35E] border border-[#171717] rounded-[3px] flex items-center justify-center font-bold text-xs">
                  ∑
                </span>
                <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] uppercase tracking-wide">
                  Formula Matematis SAW
                </h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="bg-[#F8F7F2] border border-[#171717] rounded-[4px] p-2.5">
                  <p className="text-[10px] font-bold text-[#666666] font-['Space_Grotesk',sans-serif] uppercase mb-0.5">
                    Kriteria Benefit
                  </p>
                  <p className="text-[#171717] font-bold">r_ij = x_ij / max(x_j)</p>
                </div>

                <div className="bg-[#F8F7F2] border border-[#171717] rounded-[4px] p-2.5">
                  <p className="text-[10px] font-bold text-[#666666] font-['Space_Grotesk',sans-serif] uppercase mb-0.5">
                    Kriteria Cost
                  </p>
                  <p className="text-[#171717] font-bold">r_ij = min(x_j) / x_ij</p>
                </div>

                <div className="bg-[#F4D35E] border border-[#171717] rounded-[4px] p-2.5">
                  <p className="text-[10px] font-bold text-[#171717] font-['Space_Grotesk',sans-serif] uppercase mb-0.5">
                    Skor Akhir (Preferensi)
                  </p>
                  <p className="text-[#171717] font-bold">V_i = ∑ (w_j × r_ij)</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#EAE8E1] text-[11px] text-[#666666] leading-relaxed">
                <p>
                  <strong>w_j:</strong> bobot kriteria ke-j <br />
                  <strong>r_ij:</strong> nilai matriks ternormalisasi <br />
                  <strong>V_i:</strong> nilai preferensi alternatif laptop ke-i
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Display if criteria table not seeded */}
      {criteria.length === 0 && (
        <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-[8px] shadow-[4px_4px_0px_#171717] p-6">
          <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#171717] mb-3">
            Referensi Kriteria Default Sistem
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {DEFAULT_CRITERIA.map((c) => (
              <div
                key={c.code}
                className="bg-[#F8F7F2] border-2 border-[#171717] rounded-[6px] p-3 text-center"
              >
                <div className="font-['Space_Grotesk',sans-serif] text-xs font-bold px-2 py-0.5 bg-[#F4D35E] border border-[#171717] rounded-[4px] inline-block mb-1.5">
                  {c.code}
                </div>
                <div className="font-['Space_Grotesk',sans-serif] text-base font-extrabold text-[#171717]">
                  {(c.weight * 100).toFixed(0)}%
                </div>
                <div className="text-[11px] text-[#666666] mt-1 font-medium">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
