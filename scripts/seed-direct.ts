/**
 * Script seed langsung — jalankan dengan:
 * node --experimental-strip-types scripts/seed-direct.ts
 * atau:
 * npx ts-node scripts/seed-direct.ts
 *
 * Tidak memerlukan dev server. Membaca CSV langsung dari filesystem.
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const DEFAULT_CRITERIA = [
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
    extractRule: "Diekstrak dari kolom Cpu menggunakan aturan heuristik berdasarkan vendor dan model.",
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
    extractRule: "Diekstrak dari kolom Memory. HDD dan SSD digabung secara kapasitas.",
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

const WEIGHT_PRESETS = {
  kuliah_umum: {
    label: "Kuliah Umum",
    description: "Cocok untuk mahasiswa yang menggunakan laptop untuk browsing, dokumen, dan presentasi.",
    weights: { C1: 0.35, C2: 0.20, C3: 0.20, C4: 0.15, C5: 0.10 },
  },
  pemrograman: {
    label: "Pemrograman",
    description: "Fokus pada performa prosesor dan RAM yang besar untuk menjalankan IDE.",
    weights: { C1: 0.20, C2: 0.35, C3: 0.30, C4: 0.10, C5: 0.05 },
  },
  desain_grafis: {
    label: "Desain Grafis",
    description: "Membutuhkan RAM besar dan penyimpanan yang luas untuk file proyek desain.",
    weights: { C1: 0.15, C2: 0.30, C3: 0.25, C4: 0.20, C5: 0.10 },
  },
  gaming: {
    label: "Gaming",
    description: "Prioritas pada performa CPU tinggi dan penyimpanan besar.",
    weights: { C1: 0.10, C2: 0.40, C3: 0.25, C4: 0.20, C5: 0.05 },
  },
  mobilitas_tinggi: {
    label: "Mobilitas Tinggi",
    description: "Berat laptop menjadi prioritas utama untuk mahasiswa yang sering bepergian.",
    weights: { C1: 0.30, C2: 0.15, C3: 0.15, C4: 0.10, C5: 0.30 },
  },
};

// Parser sederhana untuk RAM (GB)
function parseRam(val: string): number {
  const m = val?.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

// Parser sederhana untuk berat (kg)
function parseWeight(val: string): number {
  const m = val?.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

// Parser sederhana untuk storage (GB)
function parseStorage(val: string): number {
  if (!val) return 0;
  let total = 0;
  const parts = val.split("+").map((s) => s.trim());
  for (const part of parts) {
    const tb = part.match(/([\d.]+)\s*TB/i);
    const gb = part.match(/([\d.]+)\s*GB/i);
    if (tb) total += parseFloat(tb[1]) * 1000;
    else if (gb) total += parseFloat(gb[1]);
  }
  return Math.round(total) || 0;
}

// Heuristik skor CPU
function getCpuScore(cpu: string): number {
  if (!cpu) return 50;
  const c = cpu.toLowerCase();
  if (c.includes("i9") || c.includes("xeon")) return 95;
  if (c.includes("i7") && c.includes("hq")) return 85;
  if (c.includes("i7") && c.includes("u")) return 78;
  if (c.includes("i7")) return 82;
  if (c.includes("i5") && c.includes("hq")) return 72;
  if (c.includes("i5") && c.includes("u")) return 65;
  if (c.includes("i5")) return 68;
  if (c.includes("i3")) return 48;
  if (c.includes("ryzen 7") || c.includes("ryzen7")) return 80;
  if (c.includes("ryzen 5") || c.includes("ryzen5")) return 65;
  if (c.includes("ryzen 3") || c.includes("ryzen3")) return 48;
  if (c.includes("pentium") || c.includes("celeron")) return 30;
  if (c.includes("m3") || c.includes("m2") || c.includes("m1")) return 90;
  return 50;
}

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Seed kriteria
  console.log("📋 Seeding criteria...");
  for (const c of DEFAULT_CRITERIA) {
    await prisma.criteria.upsert({
      where: { code: c.code },
      update: { name: c.name, weight: c.weight, attrType: c.attrType, description: c.description, extractRule: c.extractRule },
      create: { code: c.code, name: c.name, weight: c.weight, attrType: c.attrType, description: c.description, extractRule: c.extractRule },
    });
    console.log(`  ✓ ${c.code} — ${c.name}`);
  }

  // 2. Seed presets
  console.log("⚖️  Seeding weight presets...");
  for (const [key, preset] of Object.entries(WEIGHT_PRESETS)) {
    await prisma.weightPreset.upsert({
      where: { name: key },
      update: { label: preset.label, description: preset.description, weights: JSON.stringify(preset.weights) },
      create: { name: key, label: preset.label, description: preset.description, weights: JSON.stringify(preset.weights) },
    });
    console.log(`  ✓ ${key} — ${preset.label}`);
  }

  // 3. Seed laptops dari CSV
  const csvPath = join(process.cwd(), "public", "laptop_price.csv");
  console.log(`💻 Reading CSV from ${csvPath}...`);
  const csvText = readFileSync(csvPath, "utf-8");

  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  console.log(`📊 Total rows: ${data.length}`);

  const batchId = `seed-script-${Date.now()}`;
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of data) {
    const laptopId = row["laptop_ID"]?.trim() || null;
    const company = row["Company"]?.trim() || "";
    const product = row["Product"]?.trim() || "";
    const typeName = row["TypeName"]?.trim() || null;
    const inchesStr = row["Inches"]?.trim();
    const inches = inchesStr ? parseFloat(inchesStr) : null;
    const screenResolution = row["ScreenResolution"]?.trim() || null;
    const cpu = row["Cpu"]?.trim() || "";
    const ramStr = row["Ram"]?.trim() || "0GB";
    const ram = parseRam(ramStr);
    const memory = row["Memory"]?.trim() || null;
    const storageGb = parseStorage(memory || "");
    const gpu = row["Gpu"]?.trim() || null;
    const opSys = row["OpSys"]?.trim() || null;
    const weightStr = row["Weight"]?.trim() || "0kg";
    const weight = parseWeight(weightStr);
    const priceStr = row["Price_euros"]?.trim().replace(",", ".");
    const priceEuros = priceStr ? parseFloat(priceStr) : 0;
    const cpuScore = getCpuScore(cpu);

    if (!company || !product || ram === 0 || priceEuros === 0) {
      failed++;
      continue;
    }

    try {
      if (laptopId) {
        await prisma.laptop.upsert({
          where: { laptopId },
          update: { company, product, typeName, inches, screenResolution, cpu, ram, memory, storageGb, gpu, opSys, weight, priceEuros, cpuScore, cpuScoreMethod: "heuristic", importBatchId: batchId },
          create: { laptopId, company, product, typeName, inches, screenResolution, cpu, ram, memory, storageGb, gpu, opSys, weight, priceEuros, cpuScore, cpuScoreMethod: "heuristic", importBatchId: batchId },
        });
      } else {
        await prisma.laptop.create({
          data: { laptopId: null, company, product, typeName, inches, screenResolution, cpu, ram, memory, storageGb, gpu, opSys, weight, priceEuros, cpuScore, cpuScoreMethod: "heuristic", importBatchId: batchId },
        });
      }
      imported++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Unique constraint")) {
        skipped++;
      } else {
        console.error(`  ✗ Failed: ${company} ${product} — ${msg}`);
        failed++;
      }
    }
  }

  await prisma.importBatch.create({
    data: { id: batchId, filename: "laptop_price.csv", totalRows: data.length, imported, failed, skipped, failedRows: null },
  });

  console.log(`\n✅ Seed complete!`);
  console.log(`   Imported : ${imported}`);
  console.log(`   Skipped  : ${skipped} (duplicates)`);
  console.log(`   Failed   : ${failed}`);
  console.log(`   Batch ID : ${batchId}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
