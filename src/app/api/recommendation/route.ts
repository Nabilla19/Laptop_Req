/**
 * POST /api/recommendation
 *
 * Jalankan kalkulasi SAW berdasarkan preferensi pengguna,
 * simpan hasilnya ke RecommendationHistory, dan kembalikan ranking.
 *
 * GET /api/recommendation
 * Ambil daftar history rekomendasi (ringkasan).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateSAWScores,
  filterByBudget,
  type CriteriaConfig,
  type LaptopValues,
} from "@/lib/saw-calculator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      budgetMax,
      usageType,
      screenPref,
      priorityPref,
      customWeights,
      topN = 10,
    } = body as {
      budgetMax?: number | null;
      usageType?: string | null;
      screenPref?: string | null;
      priorityPref?: string | null;
      customWeights?: Record<string, number> | null;
      topN?: number;
    };

    // ─── 1. Ambil kriteria aktif dari DB ───────────────────────────────────────
    const criteriaRows = await prisma.criteria.findMany({
      orderBy: { code: "asc" },
    });

    if (criteriaRows.length === 0) {
      return NextResponse.json(
        { error: "Kriteria belum diatur. Jalankan seed terlebih dahulu." },
        { status: 400 }
      );
    }

    // Jika ada custom weights dari request, override bobot dari DB
    const criteriaConfig: CriteriaConfig[] = criteriaRows.map((c) => ({
      code: c.code,
      weight: customWeights?.[c.code] ?? c.weight,
      attrType: c.attrType as "benefit" | "cost",
    }));

    // Validasi total bobot
    const totalWeight = criteriaConfig.reduce((sum, c) => sum + c.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      return NextResponse.json(
        {
          error: `Total bobot harus 100%. Saat ini: ${(totalWeight * 100).toFixed(2)}%`,
        },
        { status: 400 }
      );
    }

    // ─── 2. Ambil data laptop dari DB ─────────────────────────────────────────
    const laptopRows = await prisma.laptop.findMany({
      select: {
        id: true,
        company: true,
        product: true,
        priceEuros: true,
        cpuScore: true,
        ram: true,
        storageGb: true,
        weight: true,
      },
    });

    if (laptopRows.length === 0) {
      return NextResponse.json(
        { error: "Belum ada data laptop di database." },
        { status: 400 }
      );
    }

    const laptops: LaptopValues[] = laptopRows.map((l) => ({
      id: l.id,
      company: l.company,
      product: l.product,
      priceEuros: l.priceEuros,
      cpuScore: l.cpuScore ?? 0,
      ram: l.ram,
      storageGb: l.storageGb,
      weight: l.weight,
    }));

    // ─── 3. Filter anggaran ───────────────────────────────────────────────────
    const filtered = filterByBudget(laptops, budgetMax ?? null);

    if (filtered.length === 0) {
      return NextResponse.json(
        {
          error: `Tidak ada laptop dalam anggaran €${budgetMax}. Coba naikkan anggaran.`,
        },
        { status: 400 }
      );
    }

    // ─── 4. Hitung SAW ────────────────────────────────────────────────────────
    const result = calculateSAWScores(filtered, criteriaConfig);

    // Ambil top N
    const topAlternatives = result.alternatives.slice(0, Math.min(topN, result.alternatives.length));

    // ─── 5. Simpan ke history ─────────────────────────────────────────────────
    const weightsSnapshot = JSON.stringify(result.weightsUsed);

    const history = await prisma.recommendationHistory.create({
      data: {
        budgetMax: budgetMax ?? null,
        usageType: usageType ?? null,
        screenPref: screenPref ?? null,
        priorityPref: priorityPref ?? null,
        weightsUsed: weightsSnapshot,
        totalAlternatives: result.totalAlternatives,
        presetUsed: usageType ?? null,
        items: {
          create: topAlternatives.map((alt) => ({
            laptopId: alt.id,
            rank: alt.rank,
            sawScore: alt.sawScore,
            normalizedMatrix: JSON.stringify(alt.normalizedValues),
            weightedValues: JSON.stringify(alt.weightedValues),
            rawValues: JSON.stringify(alt.rawValues),
          })),
        },
      },
      include: {
        items: {
          include: {
            laptop: true,
          },
          orderBy: { rank: "asc" },
        },
      },
    });

    return NextResponse.json({
      historyId: history.id,
      calculatedAt: history.calculatedAt,
      totalAlternatives: result.totalAlternatives,
      filtered: filtered.length,
      topN: topAlternatives.length,
      weightsUsed: result.weightsUsed,
      maxValues: result.maxValues,
      minValues: result.minValues,
      criteriaConfig: result.criteriaConfig,
      results: topAlternatives.map((alt) => ({
        rank: alt.rank,
        sawScore: alt.sawScore,
        id: alt.id,
        company: alt.company,
        product: alt.product,
        rawValues: alt.rawValues,
        normalizedValues: alt.normalizedValues,
        weightedValues: alt.weightedValues,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("POST /api/recommendation error:", msg, error);
    return NextResponse.json(
      { error: `Gagal menjalankan kalkulasi rekomendasi: ${msg}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const skip = (page - 1) * limit;

    const [histories, total] = await Promise.all([
      prisma.recommendationHistory.findMany({
        skip,
        take: limit,
        orderBy: { calculatedAt: "desc" },
        include: {
          items: {
            take: 3,
            orderBy: { rank: "asc" },
            include: {
              laptop: {
                select: { company: true, product: true, priceEuros: true },
              },
            },
          },
        },
      }),
      prisma.recommendationHistory.count(),
    ]);

    return NextResponse.json({
      data: histories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/recommendation error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data rekomendasi" },
      { status: 500 }
    );
  }
}
