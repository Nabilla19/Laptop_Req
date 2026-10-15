/**
 * POST /api/import
 *
 * Menerima upload file CSV dari client (multipart/form-data),
 * mem-parsing, lalu memasukkan data laptop ke database.
 *
 * Field form: "file" — file CSV dengan struktur kolom dataset laptop.
 */

import { NextRequest } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import {
  parseDataset,
  type RawLaptopRow,
} from "@/lib/data-parser";

export async function POST(request: NextRequest) {
  try {
    // ─── 1. Baca multipart form data ─────────────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json(
        { error: "Request harus berformat multipart/form-data." },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "Field 'file' tidak ditemukan atau bukan file." },
        { status: 400 }
      );
    }

    // Validasi ekstensi
    const filename = file.name ?? "upload.csv";
    if (!filename.toLowerCase().endsWith(".csv")) {
      return Response.json(
        { error: "Hanya file .csv yang diterima." },
        { status: 400 }
      );
    }

    // Validasi ukuran file (maks 10 MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return Response.json(
        { error: "Ukuran file melebihi batas 10 MB." },
        { status: 400 }
      );
    }

    // ─── 2. Baca konten file sebagai teks ─────────────────────────────────────
    const csvText = await file.text();
    if (!csvText.trim()) {
      return Response.json(
        { error: "File CSV kosong." },
        { status: 400 }
      );
    }

    // ─── 3. Parse CSV ──────────────────────────────────────────────────────────
    const parseResult = Papa.parse<RawLaptopRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    if (parseResult.errors.length > 0) {
      console.warn("[import] Peringatan saat parsing CSV:", parseResult.errors);
    }

    // Validasi: pastikan ada kolom minimum yang diperlukan
    const headers = parseResult.meta.fields ?? [];
    const requiredColumns = ["Company", "Product", "Ram", "Memory", "Weight", "Price_euros"];
    const missingColumns = requiredColumns.filter(
      (col) => !headers.includes(col)
    );
    if (missingColumns.length > 0) {
      return Response.json(
        {
          error: `Kolom wajib tidak ditemukan: ${missingColumns.join(", ")}. Pastikan format CSV sesuai dengan dataset laptop.`,
          headers,
        },
        { status: 400 }
      );
    }

    const rawRows = parseResult.data as RawLaptopRow[];
    if (rawRows.length === 0) {
      return Response.json(
        { error: "File CSV tidak mengandung baris data (hanya header)." },
        { status: 400 }
      );
    }

    // ─── 4. Parse & validasi setiap baris ────────────────────────────────────
    const { parsed, failed, total } = parseDataset(rawRows);

    // ─── 5. Masukkan ke database ──────────────────────────────────────────────
    const batchId = `import-${Date.now()}`;
    let imported = 0;
    let skipped = 0;
    const failedRows: { rowIndex: number; errors: string[] }[] = [];

    // Baris yang gagal parsing
    for (const f of failed) {
      failedRows.push({ rowIndex: f.rowIndex, errors: f.errors });
    }

    // Insert baris yang valid
    for (const laptop of parsed) {
      try {
        if (laptop.laptopId) {
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
        const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
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

    // ─── 6. Catat ImportBatch ─────────────────────────────────────────────────
    await prisma.importBatch.create({
      data: {
        id: batchId,
        filename,
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
      filename,
      summary: {
        totalRows: total,
        imported,
        skipped,
        failed: failedRows.length,
      },
      failedRows: failedRows.slice(0, 20),
      message: `Import selesai. ${imported} laptop berhasil diimpor, ${skipped} dilewati (duplikat), ${failedRows.length} gagal dari total ${total} baris.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[import] Error tidak terduga:", err);
    return Response.json(
      { error: `Terjadi kesalahan internal: ${msg}` },
      { status: 500 }
    );
  }
}

// Info endpoint
export async function GET() {
  return Response.json({
    endpoint: "POST /api/import",
    description:
      "Upload file CSV laptop dataset. Kirim sebagai multipart/form-data dengan field 'file'.",
    requiredColumns: [
      "laptop_ID (opsional)",
      "Company",
      "Product",
      "TypeName",
      "Inches",
      "ScreenResolution",
      "Cpu",
      "Ram",
      "Memory",
      "Gpu",
      "OpSys",
      "Weight",
      "Price_euros",
    ],
    limits: {
      maxFileSize: "10 MB",
      format: ".csv",
    },
  });
}
