import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = process.env.DATABASE_URL;
const configuredPoolSize = Number.parseInt(process.env.DATABASE_POOL_SIZE ?? "3", 10);
const poolSize = Number.isSafeInteger(configuredPoolSize) && configuredPoolSize > 0
  ? configuredPoolSize
  : 3;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
    max: poolSize,
    min: 0,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Next.js can evaluate this module from multiple server bundles in one process.
// Cache in every environment so those bundles share one database pool.
globalForPrisma.prisma ??= prisma;
