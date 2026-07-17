import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { changeOrderStatus } from "@/lib/order-service";
import { statusSchema } from "@/lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(["ADMIN", "STAFF"]);
    const { id } = await context.params;
    const body = statusSchema.parse(await request.json());
    const order = await changeOrderStatus(id, body, user);
    return ok(order, "Order status updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
