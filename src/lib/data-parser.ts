/**
 * Modul Parsing dan Normalisasi Data Dataset Laptop
 *
 * Mengubah data mentah CSV/Excel menjadi struktur internal yang bersih.
 * Setiap fungsi berdiri sendiri dan dapat diuji secara independen.
 */

export interface RawLaptopRow {
  laptop_ID?: string | number;
  Company?: string;
  Product?: string;
  TypeName?: string;
  Inches?: string | number;
  ScreenResolution?: string;
  Cpu?: string;
  Ram?: string | number;
  Memory?: string;
  Gpu?: string;
  OpSys?: string;
  Weight?: string | number;
  Price_euros?: string | number;
  [key: string]: string | number | undefined;
}

export interface ParsedLaptop {
  laptopId: string | null;
  company: string;
  product: string;
  typeName: string | null;
  inches: number | null;
  screenResolution: string | null;
  cpu: string | null;
  ram: number; // dalam GB
  memory: string | null; // nilai asli
  storageGb: number; // total GB
  storageTypes: string; // JSON detail
  gpu: string | null;
  opSys: string | null;
  weight: number; // dalam kg
  priceEuros: number;
  cpuScore: number;
  cpuScoreMethod: "benchmark" | "heuristic" | "unknown";
}

export interface ParseResult {
  success: boolean;
  data: ParsedLaptop | null;
  errors: string[];
  rowIndex: number;
}

// =========================================================================
// RAM Parser
// =========================================================================

/**
 * Ekstrak nilai RAM dalam GB dari string seperti "8GB", "16 GB", "8"
 */
export function parseRam(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const str = String(raw).trim().toUpperCase().replace(/\s+/g, "");
  const match = str.match(/^(\d+(?:\.\d+)?)\s*GB?$/);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? null : val;
  }
  const numOnly = parseFloat(str);
  if (!isNaN(numOnly) && numOnly > 0 && numOnly <= 1024) return numOnly;
  return null;
}

// =========================================================================
// Weight Parser
// =========================================================================

/**
 * Ekstrak berat dalam kg dari string seperti "1.37kg", "2.5 kg", "1370g"
 */
export function parseWeight(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const str = String(raw).trim().toLowerCase().replace(/\s+/g, "");

  // Format: "1.37kg" atau "1.37 kg"
  const kgMatch = str.match(/^(\d+(?:\.\d+)?)\s*kg$/);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    return isNaN(val) ? null : val;
  }

  // Format: "1370g"
  const gMatch = str.match(/^(\d+(?:\.\d+)?)\s*g$/);
  if (gMatch) {
    const val = parseFloat(gMatch[1]) / 1000;
    return isNaN(val) ? null : val;
  }

  // Format: angka saja (asumsi kg jika < 30, asumsi gram jika >= 500)
  const numOnly = parseFloat(str);
  if (!isNaN(numOnly)) {
    if (numOnly >= 0.5 && numOnly <= 30) return numOnly;
    if (numOnly >= 500 && numOnly <= 30000) return numOnly / 1000;
  }

  return null;
}

// =========================================================================
// Storage Parser
// =========================================================================

export interface StorageDetail {
  capacityGb: number;
  type: string; // SSD | HDD | Flash | eMMC | Unknown
  originalText: string;
}

/**
 * Parse satu segmen penyimpanan seperti "256GB SSD", "1TB HDD", "128GB Flash Storage"
 */
function parseStorageSegment(segment: string): StorageDetail | null {
  const s = segment.trim().toUpperCase();

  // Ekstrak kapasitas
  const capMatch = s.match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)/);
  if (!capMatch) return null;

  let capacityGb = parseFloat(capMatch[1]);
  if (capMatch[2] === "TB") capacityGb *= 1024;
  if (capMatch[2] === "MB") capacityGb /= 1024;

  // Deteksi tipe media
  let type = "Unknown";
  if (s.includes("SSD")) type = "SSD";
  else if (s.includes("HDD") || s.includes("HARD DISK")) type = "HDD";
  else if (s.includes("FLASH") || s.includes("FLASH STORAGE")) type = "Flash";
  else if (s.includes("EMMC")) type = "eMMC";
  else if (s.includes("HYBRID")) type = "Hybrid";

  return { capacityGb, type, originalText: segment.trim() };
}

/**
 * Parse kolom Memory, termasuk kombinasi "128GB SSD + 1TB HDD"
 * Mengembalikan total kapasitas GB dan detail per komponen.
 *
 * CATATAN: Total GB hanya untuk keperluan kriteria kapasitas.
 * HDD dan SSD memiliki karakteristik berbeda yang tidak dicerminkan oleh total ini.
 */
export function parseStorage(raw: string | undefined): {
  storageGb: number;
  storageTypes: string; // JSON
} | null {
  if (!raw || raw.trim() === "") return null;

  const segments = raw.split(/\+|and/i).map((s) => s.trim());
  const details: StorageDetail[] = [];

  for (const seg of segments) {
    const parsed = parseStorageSegment(seg);
    if (parsed) details.push(parsed);
  }

  if (details.length === 0) return null;

  const storageGb = details.reduce((sum, d) => sum + d.capacityGb, 0);
  return {
    storageGb: Math.round(storageGb),
    storageTypes: JSON.stringify(details),
  };
}

// =========================================================================
// CPU Scorer
// =========================================================================

/**
 * Tabel skor heuristik CPU.
 * CATATAN: Ini BUKAN benchmark resmi. Ini adalah estimasi berbasis pengetahuan umum
 * mengenai generasi dan kelas prosesor. Label "heuristic" akan ditampilkan di UI.
 */
const CPU_SCORE_RULES: {
  pattern: RegExp;
  score: number;
  reason: string;
}[] = [
  // Intel Core Ultra (Generasi 1 & 2 - terbaru di dataset Kaggle 2017 tidak ada, tapi handle jika ada)
  { pattern: /core\s+ultra\s+9/i, score: 98, reason: "Intel Core Ultra 9" },
  { pattern: /core\s+ultra\s+7/i, score: 93, reason: "Intel Core Ultra 7" },
  { pattern: /core\s+ultra\s+5/i, score: 85, reason: "Intel Core Ultra 5" },

  // Intel Core i9
  { pattern: /i9[-\s]?\d{4,5}[a-z]*/i, score: 95, reason: "Intel Core i9" },

  // Intel Core i7 - generasi 8+
  { pattern: /i7[-\s]?[89]\d{3}[a-z]*/i, score: 85, reason: "Intel Core i7 Gen 8-9" },
  { pattern: /i7[-\s]?[67]\d{3}[a-z]*/i, score: 80, reason: "Intel Core i7 Gen 6-7" },
  { pattern: /i7[-\s]?\d{4,5}[a-z]*/i, score: 78, reason: "Intel Core i7" },
  { pattern: /core\s+i7\s+\d+\.\d+ghz/i, score: 78, reason: "Intel Core i7" },

  // Intel Core i5 - generasi 8+
  { pattern: /i5[-\s]?[89]\d{3}[a-z]*/i, score: 70, reason: "Intel Core i5 Gen 8-9" },
  { pattern: /i5[-\s]?[67]\d{3}[a-z]*/i, score: 65, reason: "Intel Core i5 Gen 6-7" },
  { pattern: /i5[-\s]?\d{4,5}[a-z]*/i, score: 63, reason: "Intel Core i5" },
  { pattern: /core\s+i5\s+\d+\.\d+ghz/i, score: 63, reason: "Intel Core i5" },

  // Intel Core i3
  { pattern: /i3[-\s]?[89]\d{3}[a-z]*/i, score: 52, reason: "Intel Core i3 Gen 8-9" },
  { pattern: /i3[-\s]?\d{4,5}[a-z]*/i, score: 48, reason: "Intel Core i3" },
  { pattern: /core\s+i3\s+\d+\.\d+ghz/i, score: 48, reason: "Intel Core i3" },

  // Intel Pentium / Celeron
  { pattern: /pentium\s+(n|j)\d{4}/i, score: 30, reason: "Intel Pentium N/J Series" },
  { pattern: /pentium/i, score: 32, reason: "Intel Pentium" },
  { pattern: /celeron\s+(n|j)\d{4}/i, score: 22, reason: "Intel Celeron N/J" },
  { pattern: /celeron/i, score: 25, reason: "Intel Celeron" },

  // Intel Atom / Core M
  { pattern: /atom/i, score: 18, reason: "Intel Atom" },
  { pattern: /core\s+m\d/i, score: 40, reason: "Intel Core M" },

  // AMD Ryzen 9
  { pattern: /ryzen\s+9\s+\d{4}/i, score: 96, reason: "AMD Ryzen 9" },
  // AMD Ryzen 7
  { pattern: /ryzen\s+7\s+\d{4}/i, score: 84, reason: "AMD Ryzen 7" },
  // AMD Ryzen 5
  { pattern: /ryzen\s+5\s+\d{4}/i, score: 68, reason: "AMD Ryzen 5" },
  // AMD Ryzen 3
  { pattern: /ryzen\s+3\s+\d{4}/i, score: 50, reason: "AMD Ryzen 3" },
  // AMD A-series / E-series
  { pattern: /amd\s+a\d{1,2}[-\s]?\d{4}/i, score: 38, reason: "AMD A-Series APU" },
  { pattern: /amd\s+e\d[-\s]?\d{4}/i, score: 25, reason: "AMD E-Series" },
  { pattern: /amd\s+fx/i, score: 45, reason: "AMD FX" },

  // Apple M-series
  { pattern: /apple\s+m3\s+pro/i, score: 97, reason: "Apple M3 Pro" },
  { pattern: /apple\s+m3\s+max/i, score: 99, reason: "Apple M3 Max" },
  { pattern: /apple\s+m3/i, score: 94, reason: "Apple M3" },
  { pattern: /apple\s+m2\s+pro/i, score: 95, reason: "Apple M2 Pro" },
  { pattern: /apple\s+m2\s+max/i, score: 98, reason: "Apple M2 Max" },
  { pattern: /apple\s+m2/i, score: 92, reason: "Apple M2" },
  { pattern: /apple\s+m1\s+pro/i, score: 90, reason: "Apple M1 Pro" },
  { pattern: /apple\s+m1\s+max/i, score: 93, reason: "Apple M1 Max" },
  { pattern: /apple\s+m1/i, score: 87, reason: "Apple M1" },

  // Qualcomm Snapdragon
  { pattern: /snapdragon\s+8cx/i, score: 70, reason: "Qualcomm Snapdragon 8cx" },
  { pattern: /snapdragon/i, score: 55, reason: "Qualcomm Snapdragon" },
];

export interface CPUScoreResult {
  score: number;
  method: "heuristic" | "unknown";
  reason: string;
}

/**
 * Hitung skor performa CPU dari string nama CPU.
 * Hasil adalah estimasi heuristik, BUKAN benchmark resmi.
 */
export function scoreCPU(cpuString: string | null | undefined): CPUScoreResult {
  if (!cpuString || cpuString.trim() === "") {
    return { score: 0, method: "unknown", reason: "CPU tidak diketahui" };
  }

  for (const rule of CPU_SCORE_RULES) {
    if (rule.pattern.test(cpuString)) {
      return {
        score: rule.score,
        method: "heuristic",
        reason: `Estimasi heuristik: ${rule.reason}`,
      };
    }
  }

  // Jika tidak ada aturan yang cocok
  return {
    score: 0,
    method: "unknown",
    reason: `CPU tidak dikenali: "${cpuString}". Perlu pemeriksaan manual.`,
  };
}

// =========================================================================
// Price Parser
// =========================================================================

/**
 * Parse harga dalam euro. Tangani format "1,234.56" dan "1234.56"
 */
export function parsePrice(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const str = String(raw).replace(/,/g, ".").replace(/[^0-9.]/g, "");
  // Jika ada beberapa titik, ambil yang terakhir sebagai desimal
  const parts = str.split(".");
  let cleaned = str;
  if (parts.length > 2) {
    cleaned = parts.slice(0, -1).join("") + "." + parts[parts.length - 1];
  }
  const val = parseFloat(cleaned);
  return isNaN(val) || val <= 0 ? null : val;
}

// =========================================================================
// Inches Parser
// =========================================================================
export function parseInches(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const val = parseFloat(String(raw).replace(",", "."));
  return isNaN(val) || val <= 0 || val > 100 ? null : val;
}

// =========================================================================
// Row Parser
// =========================================================================

/**
 * Parse satu baris data mentah CSV menjadi ParsedLaptop.
 */
export function parseLaptopRow(
  row: RawLaptopRow,
  rowIndex: number
): ParseResult {
  const errors: string[] = [];

  // Ambil nilai string
  const company = String(row.Company ?? "").trim();
  const product = String(row.Product ?? "").trim();

  if (!company) errors.push("Kolom Company kosong");
  if (!product) errors.push("Kolom Product kosong");

  // RAM
  const ram = parseRam(row.Ram);
  if (ram === null) errors.push(`Nilai RAM tidak valid: "${row.Ram}"`);

  // Weight
  const weight = parseWeight(row.Weight);
  if (weight === null) errors.push(`Nilai Weight tidak valid: "${row.Weight}"`);

  // Price
  const priceEuros = parsePrice(row.Price_euros);
  if (priceEuros === null)
    errors.push(`Nilai Price_euros tidak valid: "${row.Price_euros}"`);

  // Storage
  const storageResult = parseStorage(String(row.Memory ?? ""));
  if (storageResult === null)
    errors.push(`Nilai Memory tidak dapat diparsing: "${row.Memory}"`);

  if (errors.length > 0) {
    return { success: false, data: null, errors, rowIndex };
  }

  // CPU Score
  const cpuStr = String(row.Cpu ?? "").trim();
  const cpuResult = scoreCPU(cpuStr);

  const laptopId = row.laptop_ID !== undefined ? String(row.laptop_ID).trim() : null;

  const data: ParsedLaptop = {
    laptopId: laptopId || null,
    company,
    product,
    typeName: String(row.TypeName ?? "").trim() || null,
    inches: parseInches(row.Inches),
    screenResolution: String(row.ScreenResolution ?? "").trim() || null,
    cpu: cpuStr || null,
    ram: ram!,
    memory: String(row.Memory ?? "").trim() || null,
    storageGb: storageResult!.storageGb,
    storageTypes: storageResult!.storageTypes,
    gpu: String(row.Gpu ?? "").trim() || null,
    opSys: String(row.OpSys ?? "").trim() || null,
    weight: weight!,
    priceEuros: priceEuros!,
    cpuScore: cpuResult.score,
    cpuScoreMethod: cpuResult.method,
  };

  return { success: true, data, errors: [], rowIndex };
}

/**
 * Parse seluruh dataset
 */
export function parseDataset(rows: RawLaptopRow[]): {
  parsed: ParsedLaptop[];
  failed: ParseResult[];
  total: number;
} {
  const parsed: ParsedLaptop[] = [];
  const failed: ParseResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = parseLaptopRow(rows[i], i + 2); // +2 karena baris 1 = header
    if (result.success && result.data) {
      parsed.push(result.data);
    } else {
      failed.push(result);
    }
  }

  return { parsed, failed, total: rows.length };
}
