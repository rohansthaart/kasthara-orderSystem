import { handleRouteError, ok, fail } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { changeOrderStatus, getOrderById, updateOrderDetails } from "@/lib/order-service";
import { orderEditSchema, orderUpdateSchema } from "@/lib/validation";

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
    const rawBody = await request.json();
    const body = orderUpdateSchema.parse(rawBody);
    if (body.orderStage) {
      const order = await changeOrderStatus(id, { orderStage: body.orderStage }, user);
      return ok(order, "Order updated successfully");
    }
    const order = await updateOrderDetails(id, orderEditSchema.parse(rawBody), user);
    return ok(order, "Order details updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
