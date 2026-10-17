/**
 * GET /api/history
 * Ambil daftar riwayat rekomendasi dengan detail item.
 *
 * GET /api/history/[id]
 * Ambil satu riwayat lengkap berdasarkan ID.
 *
 * DELETE /api/history/[id]
 * Hapus satu riwayat (cascade delete items).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
            take: 5,
            orderBy: { rank: "asc" },
            include: {
              laptop: {
                select: {
                  company: true,
                  product: true,
                  priceEuros: true,
                  ram: true,
                  weight: true,
                  cpuScore: true,
                },
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
    console.error("GET /api/history error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat rekomendasi" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Parameter 'id' diperlukan" },
        { status: 400 }
      );
    }

    await prisma.recommendationHistory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/history error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus riwayat" },
      { status: 500 }
    );
  }
}
