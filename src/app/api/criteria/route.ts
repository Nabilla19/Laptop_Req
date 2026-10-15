import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const criteria = await prisma.criteria.findMany({
      orderBy: { code: "asc" },
    });
    const presets = await prisma.weightPreset.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ criteria, presets });
  } catch (error) {
    console.error("GET /api/criteria error:", error);
    return NextResponse.json({ error: "Gagal mengambil data kriteria" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { criteria } = body as {
      criteria: { code: string; weight: number; name: string; attrType: string }[];
    };

    // Validasi total bobot
    const total = criteria.reduce((sum: number, c: { weight: number }) => sum + c.weight, 0);
    if (Math.abs(total - 1.0) > 0.001) {
      return NextResponse.json(
        { error: `Total bobot harus 100%. Saat ini: ${(total * 100).toFixed(2)}%` },
        { status: 400 }
      );
    }

    // Update semua kriteria dalam satu transaksi
    const updated = await prisma.$transaction(
      criteria.map((c) =>
        prisma.criteria.update({
          where: { code: c.code },
          data: { weight: c.weight, name: c.name, attrType: c.attrType },
        })
      )
    );

    return NextResponse.json({ criteria: updated });
  } catch (error) {
    console.error("PUT /api/criteria error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kriteria" }, { status: 500 });
  }
}
