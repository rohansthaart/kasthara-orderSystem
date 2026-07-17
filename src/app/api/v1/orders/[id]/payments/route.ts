import { handleRouteError, ok, fail } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addPayment } from "@/lib/order-service";
import { paymentSchema } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: { payments: { include: { receivedBy: { select: { id: true, name: true } } }, orderBy: { paidAt: "desc" } } },
    });
    if (!order) return fail("Order not found", 404);
    return ok(order.payments, "Payments retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(["ADMIN", "STAFF"]);
    const { id } = await context.params;
    const body = paymentSchema.parse(await request.json());
    const order = await addPayment(id, body, user);
    return ok(order, "Payment added successfully", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
