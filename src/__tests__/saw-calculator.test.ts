/**
 * Unit Tests untuk Modul SAW Calculator dan Data Parser
 *
 * Jalankan dengan: npx jest
 * Dataset kecil diverifikasi secara manual.
 */

import {
  validateWeights,
  normalizeMatrix,
  calculateSAWScores,
  filterByBudget,
  type CriteriaConfig,
  type LaptopValues,
} from "../lib/saw-calculator";

import {
  parseRam,
  parseWeight,
  parseStorage,
  scoreCPU,
  parsePrice,
  parseLaptopRow,
} from "../lib/data-parser";

// =========================================================================
// Test Helpers
// =========================================================================

const DEFAULT_CRITERIA: CriteriaConfig[] = [
  { code: "C1", weight: 0.30, attrType: "cost" },
  { code: "C2", weight: 0.25, attrType: "benefit" },
  { code: "C3", weight: 0.20, attrType: "benefit" },
  { code: "C4", weight: 0.15, attrType: "benefit" },
  { code: "C5", weight: 0.10, attrType: "cost" },
];

const SAMPLE_LAPTOPS: LaptopValues[] = [
  { id: "A1", company: "Apple", product: "MacBook Air", priceEuros: 999, cpuScore: 78, ram: 8, storageGb: 128, weight: 1.35 },
  { id: "A2", company: "Dell", product: "XPS 13", priceEuros: 1200, cpuScore: 80, ram: 16, storageGb: 512, weight: 1.20 },
  { id: "A3", company: "Lenovo", product: "IdeaPad 320", priceEuros: 450, cpuScore: 48, ram: 4, storageGb: 500, weight: 2.20 },
];

// =========================================================================
// 1. Validasi Bobot
// =========================================================================

describe("validateWeights", () => {
  test("bobot valid saat total = 1.0", () => {
    const result = validateWeights(DEFAULT_CRITERIA);
    expect(result.valid).toBe(true);
  });

  test("bobot tidak valid saat total > 1.0", () => {
    const bad: CriteriaConfig[] = [
      { code: "C1", weight: 0.40, attrType: "cost" },
      { code: "C2", weight: 0.40, attrType: "benefit" },
      { code: "C3", weight: 0.40, attrType: "benefit" },
    ];
    const result = validateWeights(bad);
    expect(result.valid).toBe(false);
  });

  test("bobot tidak valid saat total < 1.0", () => {
    const bad: CriteriaConfig[] = [
      { code: "C1", weight: 0.20, attrType: "cost" },
      { code: "C2", weight: 0.20, attrType: "benefit" },
    ];
    const result = validateWeights(bad);
    expect(result.valid).toBe(false);
  });

  test("toleransi floating point", () => {
    // 0.1 + 0.2 + 0.7 bisa menghasilkan 0.9999999 karena floating point
    const criteria: CriteriaConfig[] = [
      { code: "C1", weight: 0.30, attrType: "cost" },
      { code: "C2", weight: 0.25, attrType: "benefit" },
      { code: "C3", weight: 0.20, attrType: "benefit" },
      { code: "C4", weight: 0.15, attrType: "benefit" },
      { code: "C5", weight: 0.10, attrType: "cost" },
    ];
    const result = validateWeights(criteria);
    expect(result.valid).toBe(true);
  });
});

// =========================================================================
// 2. Normalisasi Benefit
// =========================================================================

describe("normalizeMatrix - benefit", () => {
  test("normalisasi benefit: nilai tertinggi mendapat r = 1", () => {
    const { normalizedMatrix } = normalizeMatrix(SAMPLE_LAPTOPS, DEFAULT_CRITERIA);
    // RAM max = 16 (A2), jadi r A2 untuk C3 = 16/16 = 1
    expect(normalizedMatrix["A2"]["C3"]).toBeCloseTo(1.0, 5);
  });

  test("normalisasi benefit: nilai lain = xij / max", () => {
    const { normalizedMatrix } = normalizeMatrix(SAMPLE_LAPTOPS, DEFAULT_CRITERIA);
    // RAM A1 = 8, max = 16, r = 8/16 = 0.5
    expect(normalizedMatrix["A1"]["C3"]).toBeCloseTo(0.5, 5);
  });
});

// =========================================================================
// 3. Normalisasi Cost
// =========================================================================

describe("normalizeMatrix - cost", () => {
  test("normalisasi cost: nilai terendah mendapat r = 1", () => {
    const { normalizedMatrix } = normalizeMatrix(SAMPLE_LAPTOPS, DEFAULT_CRITERIA);
    // Harga min = 450 (A3), r A3 untuk C1 = 450/450 = 1
    expect(normalizedMatrix["A3"]["C1"]).toBeCloseTo(1.0, 5);
  });

  test("normalisasi cost: nilai lain = min / xij", () => {
    const { normalizedMatrix } = normalizeMatrix(SAMPLE_LAPTOPS, DEFAULT_CRITERIA);
    // Harga A1 = 999, min = 450, r = 450/999 ≈ 0.4505
    expect(normalizedMatrix["A1"]["C1"]).toBeCloseTo(450 / 999, 5);
  });
});

// =========================================================================
// 4. Skor Akhir SAW
// =========================================================================

describe("calculateSAWScores", () => {
  test("skor akhir harus antara 0 dan 1", () => {
    const result = calculateSAWScores(SAMPLE_LAPTOPS, DEFAULT_CRITERIA);
    for (const alt of result.alternatives) {
      expect(alt.sawScore).toBeGreaterThanOrEqual(0);
      expect(alt.sawScore).toBeLessThanOrEqual(1);
    }
  });

  test("ranking tidak boleh duplikat untuk nilai berbeda", () => {
    const result = calculateSAWScores(SAMPLE_LAPTOPS, DEFAULT_CRITERIA);
    const ranks = result.alternatives.map((a) => a.rank);
    const uniqueRanks = new Set(ranks);
    expect(uniqueRanks.size).toBe(ranks.length);
  });

  test("diurutkan dari skor tertinggi ke terendah", () => {
    const result = calculateSAWScores(SAMPLE_LAPTOPS, DEFAULT_CRITERIA);
    for (let i = 1; i < result.alternatives.length; i++) {
      expect(result.alternatives[i - 1].sawScore).toBeGreaterThanOrEqual(
        result.alternatives[i].sawScore
      );
    }
  });

  test("lempar error jika bobot tidak valid", () => {
    const badCriteria: CriteriaConfig[] = [
      { code: "C1", weight: 0.5, attrType: "cost" },
      { code: "C2", weight: 0.6, attrType: "benefit" },
    ];
    expect(() => calculateSAWScores(SAMPLE_LAPTOPS, badCriteria)).toThrow();
  });

  test("verifikasi manual skor A2 (Dell XPS 13)", () => {
    // Hitung manual:
    // C1 (cost, w=0.30): min=450, x=1200, r=450/1200=0.375, weighted=0.30*0.375=0.1125
    // C2 (benefit, w=0.25): max=80, x=80, r=80/80=1, weighted=0.25*1=0.25
    // C3 (benefit, w=0.20): max=16, x=16, r=1, weighted=0.20*1=0.20
    // C4 (benefit, w=0.15): max=512, x=512, r=1, weighted=0.15*1=0.15
    // C5 (cost, w=0.10): min=1.20, x=1.20, r=1, weighted=0.10*1=0.10
    // Total = 0.1125 + 0.25 + 0.20 + 0.15 + 0.10 = 0.8125

    const result = calculateSAWScores(SAMPLE_LAPTOPS, DEFAULT_CRITERIA);
    const a2 = result.alternatives.find((a) => a.id === "A2");
    expect(a2).toBeDefined();
    expect(a2!.sawScore).toBeCloseTo(0.8125, 4);
  });
});

// =========================================================================
// 5. Filter Anggaran
// =========================================================================

describe("filterByBudget", () => {
  test("filter anggaran membuang laptop di atas batas", () => {
    const filtered = filterByBudget(SAMPLE_LAPTOPS, 1000);
    expect(filtered.length).toBe(2); // A1 (999) dan A3 (450)
    expect(filtered.every((l) => l.priceEuros <= 1000)).toBe(true);
  });

  test("filter null tidak membuang apa pun", () => {
    const filtered = filterByBudget(SAMPLE_LAPTOPS, null);
    expect(filtered.length).toBe(SAMPLE_LAPTOPS.length);
  });

  test("filter 0 tidak membuang apa pun", () => {
    const filtered = filterByBudget(SAMPLE_LAPTOPS, 0);
    expect(filtered.length).toBe(SAMPLE_LAPTOPS.length);
  });

  test("filter yang sangat ketat mengembalikan array kosong", () => {
    const filtered = filterByBudget(SAMPLE_LAPTOPS, 100);
    expect(filtered.length).toBe(0);
  });
});

// =========================================================================
// 6. Parsing RAM
// =========================================================================

describe("parseRam", () => {
  test.each([
    ["8GB", 8],
    ["16 GB", 16],
    ["32GB", 32],
    ["4", 4],
    ["128GB", 128],
  ])('parseRam("%s") → %d', (input, expected) => {
    expect(parseRam(input)).toBe(expected);
  });

  test.each([["", null], [undefined, null], ["XGB", null], ["0GB", null]])(
    'parseRam("%s") → null',
    (input, expected) => {
      expect(parseRam(input)).toBe(expected);
    }
  );
});

// =========================================================================
// 7. Parsing Berat
// =========================================================================

describe("parseWeight", () => {
  test.each([
    ["1.37kg", 1.37],
    ["2.5 kg", 2.5],
    ["1370g", 1.37],
    ["2500g", 2.5],
    ["1.5", 1.5],
  ])('parseWeight("%s") → %d', (input, expected) => {
    expect(parseWeight(input)).toBeCloseTo(expected, 2);
  });

  test.each([["", null], [undefined, null], ["abc", null]])(
    'parseWeight("%s") → null',
    (input, expected) => {
      expect(parseWeight(input)).toBe(expected);
    }
  );
});

// =========================================================================
// 8. Parsing Penyimpanan
// =========================================================================

describe("parseStorage", () => {
  test.each([
    ["128GB SSD", 128],
    ["256GB SSD", 256],
    ["1TB HDD", 1024],
    ["128GB Flash Storage", 128],
    ["500GB HDD", 500],
    ["2TB HDD", 2048],
  ])('parseStorage("%s") → %d GB', (input, expectedGb) => {
    const result = parseStorage(input);
    expect(result).not.toBeNull();
    expect(result!.storageGb).toBe(expectedGb);
  });

  test("kombinasi SSD + HDD dihitung total", () => {
    const result = parseStorage("128GB SSD + 1TB HDD");
    expect(result).not.toBeNull();
    expect(result!.storageGb).toBe(1152); // 128 + 1024
  });

  test("string kosong mengembalikan null", () => {
    expect(parseStorage("")).toBeNull();
    expect(parseStorage(undefined)).toBeNull();
  });
});

// =========================================================================
// 9. Skor CPU
// =========================================================================

describe("scoreCPU", () => {
  test("Intel Core i7 mendapat skor lebih tinggi dari i5", () => {
    const i7 = scoreCPU("Intel Core i7 7500U 2.7GHz");
    const i5 = scoreCPU("Intel Core i5 7200U 2.5GHz");
    expect(i7.score).toBeGreaterThan(i5.score);
  });

  test("CPU tidak dikenali mengembalikan method unknown dan skor 0", () => {
    const result = scoreCPU("Kirin 9000S");
    expect(result.method).toBe("unknown");
    expect(result.score).toBe(0);
  });

  test("CPU null mengembalikan unknown", () => {
    const result = scoreCPU(null);
    expect(result.method).toBe("unknown");
  });

  test("semua CPU yang dikenali mengembalikan metode heuristic", () => {
    const cpus = [
      "Intel Core i7 8550U 1.8GHz",
      "AMD Ryzen 5 2500U",
      "Intel Core i5 2.3GHz",
    ];
    for (const cpu of cpus) {
      expect(scoreCPU(cpu).method).toBe("heuristic");
    }
  });
});

// =========================================================================
// 10. Ranking dengan skor sama
// =========================================================================

describe("ranking - skor sama", () => {
  test("dua laptop dengan skor identik mendapat rank berbeda", () => {
    // Buat dua laptop identik dalam semua nilai
    const identical: LaptopValues[] = [
      { id: "X1", company: "Brand", product: "ModelA", priceEuros: 1000, cpuScore: 70, ram: 8, storageGb: 256, weight: 1.5 },
      { id: "X2", company: "Brand", product: "ModelB", priceEuros: 1000, cpuScore: 70, ram: 8, storageGb: 256, weight: 1.5 },
    ];
    const result = calculateSAWScores(identical, DEFAULT_CRITERIA);
    const ranks = result.alternatives.map((a) => a.rank);
    expect(new Set(ranks).size).toBe(2);
  });
});

// =========================================================================
// 11. Dataset kosong dan invalid
// =========================================================================

describe("edge cases", () => {
  test("dataset kosong menghasilkan hasil kosong", () => {
    const result = calculateSAWScores([], DEFAULT_CRITERIA);
    expect(result.alternatives).toHaveLength(0);
    expect(result.totalAlternatives).toBe(0);
  });

  test("parseLaptopRow dengan data lengkap berhasil", () => {
    const row = {
      laptop_ID: "1",
      Company: "Apple",
      Product: "MacBook Pro",
      TypeName: "Ultrabook",
      Inches: "13.3",
      Cpu: "Intel Core i5 2.3GHz",
      Ram: "8GB",
      Memory: "128GB SSD",
      Weight: "1.37kg",
      Price_euros: "1399",
    };
    const result = parseLaptopRow(row, 2);
    expect(result.success).toBe(true);
    expect(result.data?.ram).toBe(8);
    expect(result.data?.weight).toBeCloseTo(1.37, 2);
    expect(result.data?.priceEuros).toBe(1399);
    expect(result.data?.storageGb).toBe(128);
  });

  test("parseLaptopRow tanpa harga gagal dengan error jelas", () => {
    const row = {
      Company: "Apple",
      Product: "MacBook",
      Ram: "8GB",
      Memory: "128GB SSD",
      Weight: "1.37kg",
      Price_euros: "",
    };
    const result = parseLaptopRow(row, 3);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
