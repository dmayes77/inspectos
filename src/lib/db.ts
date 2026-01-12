import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Create connection pool
const pool = globalForPrisma.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

// Tenant-aware query helper
export function withTenant(companyId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, model }) {
          // Models that require tenant filtering
          const tenantModels = [
            "User",
            "Client",
            "Property",
            "Inspection",
            "Template",
            "Agreement",
            "Invite",
            "Service",
            "ServiceArea",
            "Booking",
            "Payment",
            "Payout",
            "TravelZone",
          ];

          if (tenantModels.includes(model)) {
            // Add companyId to where clause for reads
            if ("where" in args) {
              args.where = { ...args.where, companyId };
            }
            // Add companyId to data for creates
            if ("data" in args && typeof args.data === "object") {
              args.data = { ...args.data, companyId };
            }
          }

          return query(args);
        },
      },
    },
  });
}
