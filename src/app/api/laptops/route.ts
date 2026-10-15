import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? "";
    const company = searchParams.get("company") ?? "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const typeName = searchParams.get("typeName") ?? "";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { company: { contains: search, mode: "insensitive" } },
        { product: { contains: search, mode: "insensitive" } },
        { cpu: { contains: search, mode: "insensitive" } },
      ];
    }

    if (company) {
      where.company = { equals: company, mode: "insensitive" };
    }

    if (typeName) {
      where.typeName = { equals: typeName, mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      where.priceEuros = {};
      if (minPrice) (where.priceEuros as Record<string, number>).gte = parseFloat(minPrice);
      if (maxPrice) (where.priceEuros as Record<string, number>).lte = parseFloat(maxPrice);
    }

    const [laptops, total] = await Promise.all([
      prisma.laptop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { priceEuros: "asc" },
      }),
      prisma.laptop.count({ where }),
    ]);

    return NextResponse.json({
      data: laptops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/laptops error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data laptop" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const laptop = await prisma.laptop.create({
      data: {
        company: body.company,
        product: body.product,
        typeName: body.typeName ?? null,
        inches: body.inches ?? null,
        screenResolution: body.screenResolution ?? null,
        cpu: body.cpu ?? null,
        ram: parseInt(body.ram),
        memory: body.memory ?? null,
        storageGb: parseInt(body.storageGb),
        storageTypes: body.storageTypes ?? "[]",
        gpu: body.gpu ?? null,
        opSys: body.opSys ?? null,
        weight: parseFloat(body.weight),
        priceEuros: parseFloat(body.priceEuros),
        cpuScore: body.cpuScore ?? null,
        cpuScoreMethod: body.cpuScoreMethod ?? null,
        isDemo: false,
      },
    });

    return NextResponse.json({ data: laptop }, { status: 201 });
  } catch (error) {
    console.error("POST /api/laptops error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data laptop" },
      { status: 500 }
    );
  }
}
