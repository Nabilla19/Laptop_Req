import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreCPU } from "@/lib/data-parser";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const laptop = await prisma.laptop.findUnique({ where: { id } });
    if (!laptop) {
      return NextResponse.json({ error: "Laptop tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: laptop });
  } catch (error) {
    console.error("GET /api/laptops/[id] error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Hitung ulang skor CPU jika CPU berubah
    let cpuScore = body.cpuScore;
    let cpuScoreMethod = body.cpuScoreMethod;
    if (body.cpu !== undefined) {
      const result = scoreCPU(body.cpu);
      cpuScore = result.score;
      cpuScoreMethod = result.method;
    }

    const laptop = await prisma.laptop.update({
      where: { id },
      data: {
        company: body.company,
        product: body.product,
        typeName: body.typeName ?? null,
        inches: body.inches !== undefined ? parseFloat(body.inches) : undefined,
        screenResolution: body.screenResolution ?? null,
        cpu: body.cpu ?? null,
        ram: body.ram !== undefined ? parseInt(body.ram) : undefined,
        memory: body.memory ?? null,
        storageGb: body.storageGb !== undefined ? parseInt(body.storageGb) : undefined,
        storageTypes: body.storageTypes ?? undefined,
        gpu: body.gpu ?? null,
        opSys: body.opSys ?? null,
        weight: body.weight !== undefined ? parseFloat(body.weight) : undefined,
        priceEuros: body.priceEuros !== undefined ? parseFloat(body.priceEuros) : undefined,
        cpuScore,
        cpuScoreMethod,
      },
    });

    return NextResponse.json({ data: laptop });
  } catch (error) {
    console.error("PUT /api/laptops/[id] error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.laptop.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/laptops/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}
