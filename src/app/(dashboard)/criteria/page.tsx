"use client";

import { useState, useEffect, useCallback } from "react";
import { WEIGHT_PRESETS, DEFAULT_CRITERIA } from "@/lib/constants";

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
  benefit: "Benefit (↑ lebih baik)",
  cost: "Cost (↓ lebih baik)",
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
      setSuccessMsg("Bobot kriteria berhasil disimpan!");
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
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
            Konfigurasi
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Kriteria SAW</h1>
          <p className="text-sm text-slate-500 mt-1">
            Atur bobot 5 kriteria yang menentukan ranking laptop
          </p>
        </div>
        {dirty && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !weightValid}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠ {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
          ✓ {successMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <svg className="w-8 h-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
          </svg>
        </div>
      ) : criteria.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-700 font-medium mb-2">Kriteria belum ada di database</p>
          <p className="text-sm text-amber-600">
            Jalankan seed terlebih dahulu melalui{" "}
            <code className="bg-amber-100 px-1 rounded">POST /api/seed</code> untuk mengisi data awal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Criteria Cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Total weight indicator */}
            <div
              className={`rounded-xl px-5 py-3 flex items-center gap-3 ${
                weightValid
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${weightValid ? "bg-emerald-500" : "bg-red-500"}`}
              />
              <p className="text-sm font-medium">
                Total bobot:{" "}
                <strong className={weightValid ? "text-emerald-700" : "text-red-600"}>
                  {(totalWeight * 100).toFixed(1)}%
                </strong>
                {!weightValid && " — Harus tepat 100%"}
              </p>
              {/* Visual bar */}
              <div className="flex-1 h-2 bg-white rounded-full overflow-hidden ml-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    weightValid ? "bg-emerald-500" : totalWeight > 1 ? "bg-red-500" : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(totalWeight * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Criteria cards */}
            {criteria.map((c) => {
              const w = editWeights[c.code] ?? c.weight;
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg">
                          {c.code}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            c.attrType === "benefit"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {ATTR_TYPE_LABELS[c.attrType]}
                        </span>
                      </div>
                      {c.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {c.description}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-indigo-600 ml-4">
                      {(w * 100).toFixed(0)}%
                    </span>
                  </div>
                  {/* Slider */}
                  <div className="mt-3">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={w}
                      onChange={(e) => handleWeightChange(c.code, parseFloat(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  {c.extractRule && (
                    <p className="text-[11px] text-slate-400 mt-2 italic border-t border-slate-100 pt-2">
                      📐 {c.extractRule}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Presets Panel */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-3">Preset Bobot</h2>
              <p className="text-xs text-slate-500 mb-4">
                Klik preset untuk mengisi bobot secara otomatis sesuai profil kebutuhan.
              </p>
              <div className="space-y-2">
                {(Object.entries(WEIGHT_PRESETS) as [string, typeof WEIGHT_PRESETS[keyof typeof WEIGHT_PRESETS]][]).map(
                  ([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => applyPreset({ ...preset.weights })}
                      className="w-full text-left px-3 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                    >
                      <p className="text-sm font-semibold text-slate-700">{preset.label}</p>
                      <div className="flex gap-1 mt-1.5">
                        {Object.entries(preset.weights).map(([code, w]) => (
                          <div key={code} className="flex flex-col items-center">
                            <div className="text-[10px] text-slate-400">{code}</div>
                            <div
                              className="w-8 rounded-sm bg-indigo-400 mt-0.5"
                              style={{ height: `${w * 40}px` }}
                            />
                          </div>
                        ))}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Penjelasan formula */}
            <div className="bg-slate-800 rounded-2xl p-5 text-white">
              <h3 className="text-sm font-bold mb-3">Formula SAW</h3>
              <div className="space-y-2 text-xs text-slate-300 font-mono">
                <p>Benefit: r_ij = x_ij / max(x_j)</p>
                <p>Cost: r_ij = min(x_j) / x_ij</p>
                <p className="border-t border-slate-700 pt-2 mt-2 text-slate-200">
                  V_i = Σ(w_j × r_ij)
                </p>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                w_j = bobot kriteria j<br />
                r_ij = nilai normalisasi<br />
                V_i = skor SAW laptop ke-i
              </p>
            </div>

            {presets.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
                  Preset Tersimpan di DB
                </h3>
                <div className="space-y-1.5">
                  {presets.map((p) => {
                    const weights = JSON.parse(p.weights) as Record<string, number>;
                    return (
                      <div key={p.id} className="flex items-center justify-between">
                        <span className="text-xs text-slate-700 font-medium">{p.label}</span>
                        <div className="flex gap-1">
                          {Object.entries(weights).map(([code, w]) => (
                            <span key={code} className="text-[10px] text-slate-400">
                              {(w * 100).toFixed(0)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info: Default criteria (if DB empty, show defaults) */}
      {criteria.length === 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Default Kriteria (Belum di-seed)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {DEFAULT_CRITERIA.map((c) => (
              <div key={c.code} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xs font-bold text-indigo-600 mb-1">{c.code}</div>
                <div className="text-sm font-bold text-slate-800">{(c.weight * 100).toFixed(0)}%</div>
                <div className="text-[11px] text-slate-500 mt-1">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
