import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalLaptops,
      totalBrands,
      totalCriteria,
      totalPresets,
      totalHistory,
      latestHistory,
    ] = await Promise.all([
      prisma.laptop.count(),
      prisma.laptop.findMany({
        select: { company: true },
        distinct: ["company"],
      }),
      prisma.criteria.count(),
      prisma.weightPreset.count(),
      prisma.recommendationHistory.count(),
      prisma.recommendationHistory.findMany({
        take: 5,
        orderBy: { calculatedAt: "desc" },
        include: {
          items: {
            take: 1,
            orderBy: { rank: "asc" },
            include: { laptop: { select: { company: true, product: true } } },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalLaptops,
      totalBrands: totalBrands.length,
      totalCriteria,
      totalPresets,
      totalHistory,
      latestHistory,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil statistik" },
      { status: 500 }
    );
  }
}
