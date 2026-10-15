import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Untuk Neon: gunakan DIRECT_URL agar Prisma CLI (migrate/generate)
    // terhubung langsung tanpa pooler.
    // Saat runtime (API routes), PrismaClient di src/lib/prisma.ts
    // akan memakai DATABASE_URL (pooled) yang diteruskan via constructor.
    url: env("DIRECT_URL"),
  },
});
