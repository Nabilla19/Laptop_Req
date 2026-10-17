/**
 * POST /api/seed
 *
 * Membaca file laptop_price.csv dari public/ via HTTP fetch
 * (kompatibel dengan Vercel serverless — tidak pakai readFileSync),
 * mem-parsing setiap baris, lalu memasukkan data ke database.
 *
 * Endpoint ini untuk setup awal / reset data.
 * Gunakan environment variable SEED_SECRET untuk proteksi minimal.
 */

import { NextRequest } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import {
  parseDataset,
  type RawLaptopRow,
} from "@/lib/data-parser";
import { DEFAULT_CRITERIA, WEIGHT_PRESETS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  // Proteksi minimal: cek secret di header atau query param
  const secret =
    request.headers.get("x-seed-secret") ??
    new URL(request.url).searchParams.get("secret");

  if (
    process.env.SEED_SECRET &&
    secret !== process.env.SEED_SECRET
  ) {
    return Response.json(
      { error: "Unauthorized: secret salah atau tidak diberikan." },
      { status: 401 }
    );
  }

  try {
    // ─── 1. Baca file CSV via HTTP fetch (works di Vercel & lokal) ────────────
    // Di Vercel, file di public/ bisa diakses via URL publik deployment.
    // Di Vercel, file public/ bisa diakses via URL.
    // Di lokal, kita derive base URL dari request URL itu sendiri.
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const csvUrl = `${baseUrl}/laptop_price.csv`;

    let csvText: string;
    try {
      // Coba via HTTP fetch dulu (works di semua environment)
      const csvRes = await fetch(csvUrl, { cache: "no-store" });
      if (!csvRes.ok) {
        throw new Error(`HTTP ${csvRes.status} dari ${csvUrl}`);
      }
      csvText = await csvRes.text();
    } catch (fetchErr) {
      // Fallback: baca langsung dari filesystem (hanya di Node.js / lokal)
      try {
        const { readFileSync } = await import("fs");
        const { join } = await import("path");
        const csvPath = join(process.cwd(), "public", "laptop_price.csv");
        csvText = readFileSync(csvPath, "utf-8");
      } catch {
        return Response.json(
          {
            error: `Gagal mengambil laptop_price.csv. HTTP: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}. Pastikan file ada di public/ dan NEXT_PUBLIC_BASE_URL diset di environment Vercel.`,
          },
          { status: 404 }
        );
      }
    }

    // ─── 2. Parse CSV ─────────────────────────────────────────────────────────
    const parseResult = Papa.parse<RawLaptopRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // biarkan string agar parser kita yang handle
    });

    if (parseResult.errors.length > 0) {
      console.warn("[seed] Peringatan saat parsing CSV:", parseResult.errors);
    }

    const rawRows = parseResult.data as RawLaptopRow[];

    // ─── 3. Parse & validasi setiap baris ────────────────────────────────────
    const { parsed, failed, total } = parseDataset(rawRows);

    // ─── 4. Seed Kriteria (upsert — aman dijalankan berulang) ─────────────────
    for (const criteria of DEFAULT_CRITERIA) {
      await prisma.criteria.upsert({
        where: { code: criteria.code },
        update: {
          name: criteria.name,
          weight: criteria.weight,
          attrType: criteria.attrType,
          description: criteria.description ?? null,
          extractRule: criteria.extractRule ?? null,
        },
        create: {
          code: criteria.code,
          name: criteria.name,
          weight: criteria.weight,
          attrType: criteria.attrType,
          description: criteria.description ?? null,
          extractRule: criteria.extractRule ?? null,
        },
      });
    }

    // ─── 5. Seed Weight Presets (upsert) ──────────────────────────────────────
    for (const [key, preset] of Object.entries(WEIGHT_PRESETS)) {
      await prisma.weightPreset.upsert({
        where: { name: key },
        update: {
          label: preset.label,
          description: preset.description,
          weights: JSON.stringify(preset.weights),
        },
        create: {
          name: key,
          label: preset.label,
          description: preset.description,
          weights: JSON.stringify(preset.weights),
        },
      });
    }

    // ─── 6. Masukkan data laptop ke database ─────────────────────────────────
    const batchId = `seed-${Date.now()}`;
    let imported = 0;
    let skipped = 0;
    const failedRows: { rowIndex: number; errors: string[] }[] = [];

    // Catat baris yang gagal parsing
    for (const f of failed) {
      failedRows.push({ rowIndex: f.rowIndex, errors: f.errors });
    }

    // Insert baris yang berhasil di-parse (gunakan upsert agar idempotent)
    for (const laptop of parsed) {
      try {
        if (laptop.laptopId) {
          // Jika laptop_ID ada, gunakan upsert berdasarkan laptopId
          await prisma.laptop.upsert({
            where: { laptopId: laptop.laptopId },
            update: {
              company: laptop.company,
              product: laptop.product,
              typeName: laptop.typeName,
              inches: laptop.inches,
              screenResolution: laptop.screenResolution,
              cpu: laptop.cpu,
              ram: laptop.ram,
              memory: laptop.memory,
              storageGb: laptop.storageGb,
              storageTypes: laptop.storageTypes,
              gpu: laptop.gpu,
              opSys: laptop.opSys,
              weight: laptop.weight,
              priceEuros: laptop.priceEuros,
              cpuScore: laptop.cpuScore,
              cpuScoreMethod: laptop.cpuScoreMethod,
              importBatchId: batchId,
            },
            create: {
              laptopId: laptop.laptopId,
              company: laptop.company,
              product: laptop.product,
              typeName: laptop.typeName,
              inches: laptop.inches,
              screenResolution: laptop.screenResolution,
              cpu: laptop.cpu,
              ram: laptop.ram,
              memory: laptop.memory,
              storageGb: laptop.storageGb,
              storageTypes: laptop.storageTypes,
              gpu: laptop.gpu,
              opSys: laptop.opSys,
              weight: laptop.weight,
              priceEuros: laptop.priceEuros,
              cpuScore: laptop.cpuScore,
              cpuScoreMethod: laptop.cpuScoreMethod,
              importBatchId: batchId,
            },
          });
        } else {
          // Tanpa laptopId: selalu buat baru
          await prisma.laptop.create({
            data: {
              laptopId: null,
              company: laptop.company,
              product: laptop.product,
              typeName: laptop.typeName,
              inches: laptop.inches,
              screenResolution: laptop.screenResolution,
              cpu: laptop.cpu,
              ram: laptop.ram,
              memory: laptop.memory,
              storageGb: laptop.storageGb,
              storageTypes: laptop.storageTypes,
              gpu: laptop.gpu,
              opSys: laptop.opSys,
              weight: laptop.weight,
              priceEuros: laptop.priceEuros,
              cpuScore: laptop.cpuScore,
              cpuScoreMethod: laptop.cpuScoreMethod,
              importBatchId: batchId,
            },
          });
        }
        imported++;
      } catch (dbErr) {
        const msg =
          dbErr instanceof Error ? dbErr.message : String(dbErr);
        // Jika unique constraint (sudah ada), hitung sebagai skipped
        if (msg.includes("Unique constraint")) {
          skipped++;
        } else {
          failedRows.push({
            rowIndex: -1,
            errors: [`DB error untuk laptop "${laptop.product}": ${msg}`],
          });
        }
      }
    }

    // ─── 7. Catat ImportBatch ─────────────────────────────────────────────────
    await prisma.importBatch.create({
      data: {
        id: batchId,
        filename: "laptop_price.csv",
        totalRows: total,
        imported,
        failed: failedRows.length,
        skipped,
        failedRows: failedRows.length > 0 ? JSON.stringify(failedRows) : null,
      },
    });

    return Response.json({
      success: true,
      batchId,
      summary: {
        totalRows: total,
        imported,
        skipped,
        failed: failedRows.length,
      },
      failedRows: failedRows.slice(0, 20), // tampilkan maks 20 baris gagal
      message: `Seed selesai. ${imported} laptop berhasil diimpor, ${skipped} dilewati (duplikat), ${failedRows.length} gagal dari total ${total} baris.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[seed] Error tidak terduga:", err);
    return Response.json(
      { error: `Terjadi kesalahan internal: ${msg}` },
      { status: 500 }
    );
  }
}

// Informasi endpoint
export async function GET() {
  return Response.json({
    endpoint: "POST /api/seed",
    description:
      "Membaca public/laptop_price.csv via HTTP dan memasukkan data ke database. Gunakan method POST untuk menjalankan seed.",
    note: "Jika SEED_SECRET diset di environment, kirim header 'x-seed-secret' atau query param '?secret=...'",
    howToSeed: "Set NEXT_PUBLIC_BASE_URL di Vercel environment variables dengan nilai URL deployment kamu (mis: https://spk-xxx.vercel.app)",
  });
}
