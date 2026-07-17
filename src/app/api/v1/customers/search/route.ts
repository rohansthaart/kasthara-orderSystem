import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeNepalPhone } from "@/lib/phone";

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const normalized = normalizeNepalPhone(q);
    const clauses: Array<Record<string, unknown>> = [
      { name: { contains: q, mode: "insensitive" as const } },
      { normalizedPhone: { contains: normalized } },
    ];
    if (normalized.length >= 4) clauses.push({ normalizedPhone: { endsWith: normalized.slice(-4) } });
    const customers = await prisma.customer.findMany({
      where: {
        OR: clauses,
      },
      include: {
        orders: {
          select: { id: true, orderNumber: true, orderDate: true, totalPrice: true, orderStage: true },
          orderBy: { orderDate: "desc" },
          take: 5,
        },
      },
      take: 10,
    });
    return ok(customers, "Customers retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
