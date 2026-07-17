import { handleRouteError, ok, fail } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { id } = await context.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { orders: { include: { items: true }, orderBy: { orderDate: "desc" } } },
    });
    if (!customer) return fail("Customer not found", 404);
    return ok(customer, "Customer retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
