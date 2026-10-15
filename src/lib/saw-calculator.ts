/**
 * Modul Kalkulasi SAW (Simple Additive Weighting)
 *
 * Implementasi murni tanpa side-effect UI.
 * Dapat diuji secara independen.
 */

export interface CriteriaConfig {
  code: string;
  weight: number; // 0.0 - 1.0, total semua kriteria harus = 1
  attrType: "benefit" | "cost";
}

export interface LaptopValues {
  id: string;
  company: string;
  product: string;
  priceEuros: number;   // C1 - Cost
  cpuScore: number;     // C2 - Benefit (0-100)
  ram: number;          // C3 - Benefit (GB)
  storageGb: number;    // C4 - Benefit (GB)
  weight: number;       // C5 - Cost (kg)
}

export interface NormalizedRow {
  id: string;
  company: string;
  product: string;
  rawValues: Record<string, number>;
  normalizedValues: Record<string, number>;
  weightedValues: Record<string, number>;
  sawScore: number;
  rank: number;
}

export interface SAWResult {
  alternatives: NormalizedRow[];
  decisionMatrix: Record<string, Record<string, number>>;
  normalizedMatrix: Record<string, Record<string, number>>;
  maxValues: Record<string, number>;
  minValues: Record<string, number>;
  weightsUsed: Record<string, number>;
  criteriaConfig: CriteriaConfig[];
  totalAlternatives: number;
}

/**
 * Validasi total bobot harus sama dengan 1.0 (toleransi floating point)
 */
export function validateWeights(criteria: CriteriaConfig[]): {
  valid: boolean;
  total: number;
  message: string;
} {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  const valid = Math.abs(total - 1.0) < 0.001;
  return {
    valid,
    total,
    message: valid
      ? "Bobot valid"
      : `Total bobot ${(total * 100).toFixed(2)}% (harus 100%)`,
  };
}

/**
 * Mapping kolom dataset ke kriteria SAW
 */
export function mapLaptopToValues(laptop: LaptopValues): Record<string, number> {
  return {
    C1: laptop.priceEuros,
    C2: laptop.cpuScore,
    C3: laptop.ram,
    C4: laptop.storageGb,
    C5: laptop.weight,
  };
}

/**
 * Hitung matriks normalisasi
 * Benefit: r_ij = x_ij / max(x_j)
 * Cost:    r_ij = min(x_j) / x_ij
 */
export function normalizeMatrix(
  laptops: LaptopValues[],
  criteria: CriteriaConfig[]
): {
  normalizedMatrix: Record<string, Record<string, number>>;
  decisionMatrix: Record<string, Record<string, number>>;
  maxValues: Record<string, number>;
  minValues: Record<string, number>;
} {
  if (laptops.length === 0) {
    return {
      normalizedMatrix: {},
      decisionMatrix: {},
      maxValues: {},
      minValues: {},
    };
  }

  // Bangun matriks keputusan
  const decisionMatrix: Record<string, Record<string, number>> = {};
  for (const laptop of laptops) {
    decisionMatrix[laptop.id] = mapLaptopToValues(laptop);
  }

  // Hitung max dan min per kriteria
  const maxValues: Record<string, number> = {};
  const minValues: Record<string, number> = {};

  for (const c of criteria) {
    const values = laptops.map((l) => decisionMatrix[l.id][c.code]);
    maxValues[c.code] = Math.max(...values);
    minValues[c.code] = Math.min(...values);
  }

  // Normalisasi
  const normalizedMatrix: Record<string, Record<string, number>> = {};
  for (const laptop of laptops) {
    normalizedMatrix[laptop.id] = {};
    for (const c of criteria) {
      const xij = decisionMatrix[laptop.id][c.code];
      const max = maxValues[c.code];
      const min = minValues[c.code];

      let rij: number;
      if (c.attrType === "benefit") {
        // Hindari pembagian nol
        rij = max === 0 ? 0 : xij / max;
      } else {
        // Cost: min / xij — hindari pembagian nol
        rij = xij === 0 ? 0 : min / xij;
      }

      normalizedMatrix[laptop.id][c.code] = rij;
    }
  }

  return { normalizedMatrix, decisionMatrix, maxValues, minValues };
}

/**
 * Hitung skor SAW:  V_i = Σ(w_j × r_ij)
 */
export function calculateSAWScores(
  laptops: LaptopValues[],
  criteria: CriteriaConfig[]
): SAWResult {
  const validation = validateWeights(criteria);
  if (!validation.valid) {
    throw new Error(`Bobot tidak valid: ${validation.message}`);
  }

  const { normalizedMatrix, decisionMatrix, maxValues, minValues } =
    normalizeMatrix(laptops, criteria);

  const weightsUsed: Record<string, number> = {};
  for (const c of criteria) {
    weightsUsed[c.code] = c.weight;
  }

  const rows: NormalizedRow[] = laptops.map((laptop) => {
    const rawValues = decisionMatrix[laptop.id];
    const normalizedValues = normalizedMatrix[laptop.id];

    const weightedValues: Record<string, number> = {};
    let sawScore = 0;

    for (const c of criteria) {
      const weighted = c.weight * normalizedValues[c.code];
      weightedValues[c.code] = weighted;
      sawScore += weighted;
    }

    return {
      id: laptop.id,
      company: laptop.company,
      product: laptop.product,
      rawValues,
      normalizedValues,
      weightedValues,
      sawScore,
      rank: 0, // akan diisi setelah sorting
    };
  });

  // Urutkan dari skor tertinggi, tangani skor yang sama dengan nama produk
  rows.sort((a, b) => {
    if (Math.abs(b.sawScore - a.sawScore) > 1e-10) {
      return b.sawScore - a.sawScore;
    }
    return a.product.localeCompare(b.product);
  });

  // Assign rank
  rows.forEach((row, idx) => {
    row.rank = idx + 1;
  });

  return {
    alternatives: rows,
    decisionMatrix,
    normalizedMatrix,
    maxValues,
    minValues,
    weightsUsed,
    criteriaConfig: criteria,
    totalAlternatives: laptops.length,
  };
}

/**
 * Filter laptop berdasarkan anggaran maksimal (dalam euro)
 */
export function filterByBudget(
  laptops: LaptopValues[],
  maxBudgetEuros: number | null
): LaptopValues[] {
  if (maxBudgetEuros === null || maxBudgetEuros <= 0) return laptops;
  return laptops.filter((l) => l.priceEuros <= maxBudgetEuros);
}

/**
 * Penjelasan tekstual mengapa laptop mendapat peringkat tersebut
 */
export function generateExplanation(
  row: NormalizedRow,
  criteria: CriteriaConfig[],
  rank: number,
  total: number
): string {
  const criteriaNames: Record<string, string> = {
    C1: "harga",
    C2: "performa prosesor",
    C3: "kapasitas RAM",
    C4: "kapasitas penyimpanan",
    C5: "berat",
  };

  const topContributors = criteria
    .map((c) => ({
      code: c.code,
      name: criteriaNames[c.code] ?? c.code,
      contribution: row.weightedValues[c.code] ?? 0,
      normalized: row.normalizedValues[c.code] ?? 0,
    }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 2);

  const contribText = topContributors
    .map(
      (c) =>
        `${c.name} (kontribusi ${(c.contribution * 100).toFixed(1)}%)`
    )
    .join(" dan ");

  return `Laptop ini berada di peringkat ${rank} dari ${total} alternatif dengan skor SAW ${row.sawScore.toFixed(4)}. Kontributor terbesar adalah ${contribText}.`;
}
