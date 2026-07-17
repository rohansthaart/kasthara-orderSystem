import { handleRouteError, ok, fail } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { changeOrderStatus, getOrderById } from "@/lib/order-service";
import { orderUpdateSchema } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const { id } = await context.params;
    const order = await getOrderById(id);
    if (!order) return fail("Order not found", 404);
    return ok(order, "Order retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(["ADMIN", "STAFF"]);
    const { id } = await context.params;
    const body = orderUpdateSchema.parse(await request.json());
    if (body.orderStage) {
      const order = await changeOrderStatus(id, { orderStage: body.orderStage }, user);
      return ok(order, "Order updated successfully");
    }
    return fail("This endpoint currently supports status updates. Use focused endpoints for payments and cancellation.", 400);
  } catch (error) {
    return handleRouteError(error);
  }
}
