import { handleRouteError, ok, fail } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { getOrderByNumber } from "@/lib/order-service";

export async function GET(_request: Request, context: { params: Promise<{ orderNumber: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { orderNumber } = await context.params;
    const order = await getOrderByNumber(decodeURIComponent(orderNumber));
    if (!order) return fail("Order not found", 404);
    return ok(order, "Order retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
