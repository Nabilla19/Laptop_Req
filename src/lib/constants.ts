/**
 * Konstanta dan utilitas umum
 */

// Preset bobot untuk berbagai kebutuhan pengguna
export const WEIGHT_PRESETS = {
  kuliah_umum: {
    label: "Kuliah Umum",
    description:
      "Cocok untuk mahasiswa yang menggunakan laptop untuk browsing, dokumen, dan presentasi. Harga dan mobilitas diutamakan.",
    weights: { C1: 0.35, C2: 0.20, C3: 0.20, C4: 0.15, C5: 0.10 },
  },
  pemrograman: {
    label: "Pemrograman",
    description:
      "Fokus pada performa prosesor dan RAM yang besar untuk menjalankan IDE, server lokal, dan kompilasi kode.",
    weights: { C1: 0.20, C2: 0.35, C3: 0.30, C4: 0.10, C5: 0.05 },
  },
  desain_grafis: {
    label: "Desain Grafis",
    description:
      "Membutuhkan RAM besar dan penyimpanan yang luas untuk file proyek desain. Performa prosesor juga penting.",
    weights: { C1: 0.15, C2: 0.30, C3: 0.25, C4: 0.20, C5: 0.10 },
  },
  gaming: {
    label: "Gaming",
    description:
      "Prioritas pada performa CPU tinggi dan penyimpanan besar. Harga biasanya lebih tinggi untuk segmen ini.",
    weights: { C1: 0.10, C2: 0.40, C3: 0.25, C4: 0.20, C5: 0.05 },
  },
  mobilitas_tinggi: {
    label: "Mobilitas Tinggi",
    description:
      "Berat laptop menjadi prioritas utama untuk mahasiswa yang sering bepergian. Harga tetap dipertimbangkan.",
    weights: { C1: 0.30, C2: 0.15, C3: 0.15, C4: 0.10, C5: 0.30 },
  },
} as const;

export type PresetKey = keyof typeof WEIGHT_PRESETS;

// Default kriteria SAW
export const DEFAULT_CRITERIA = [
  {
    code: "C1",
    name: "Harga Laptop",
    weight: 0.30,
    attrType: "cost" as const,
    description: "Harga laptop dalam Rupiah (dikonversi dari Euro). Semakin murah semakin baik.",
    extractRule: "Diambil dari kolom Price_euros dataset, dikonversi ke Rupiah (1 EUR ≈ Rp17.000).",
  },
  {
    code: "C2",
    name: "Performa Prosesor",
    weight: 0.25,
    attrType: "benefit" as const,
    description: "Skor performa CPU (0-100). Semakin tinggi semakin baik.",
    extractRule:
      "Diekstrak dari kolom Cpu menggunakan aturan heuristik berdasarkan vendor dan model. Bukan benchmark resmi.",
  },
  {
    code: "C3",
    name: "Kapasitas RAM",
    weight: 0.20,
    attrType: "benefit" as const,
    description: "Kapasitas RAM dalam GB. Semakin besar semakin baik.",
    extractRule: "Diekstrak dari kolom Ram. Format: '8GB' → 8.",
  },
  {
    code: "C4",
    name: "Kapasitas Penyimpanan",
    weight: 0.15,
    attrType: "benefit" as const,
    description: "Total kapasitas penyimpanan dalam GB. Semakin besar semakin baik.",
    extractRule:
      "Diekstrak dari kolom Memory. HDD dan SSD digabung secara kapasitas. Catatan: kecepatan media berbeda tidak dicerminkan di sini.",
  },
  {
    code: "C5",
    name: "Berat Laptop",
    weight: 0.10,
    attrType: "cost" as const,
    description: "Berat laptop dalam kg. Semakin ringan semakin baik.",
    extractRule: "Diekstrak dari kolom Weight. Format: '1.37kg' → 1.37.",
  },
];

// Kurs konversi Euro ke Rupiah (perkiraan)
export const EURO_TO_IDR = 17000;

// Konversi harga Euro ke Rupiah
export function euroToRupiah(euroValue: number): number {
  return Math.round(euroValue * EURO_TO_IDR);
}

// Format mata uang Rupiah
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Format harga Euro ke Rupiah (shortcut)
export function formatEuro(value: number): string {
  return formatRupiah(euroToRupiah(value));
}

// Format angka dengan koma
export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

// Nama kriteria
export const CRITERIA_NAMES: Record<string, string> = {
  C1: "Harga",
  C2: "Performa CPU",
  C3: "RAM",
  C4: "Penyimpanan",
  C5: "Berat",
};
