import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { createOrder, listOrders } from "@/lib/order-service";
import { orderCreateSchema, orderQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const url = new URL(request.url);
    const query = orderQuerySchema.parse(Object.fromEntries(url.searchParams));
    const result = await listOrders(query);
    return ok(result, "Orders retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "STAFF"]);
    const body = orderCreateSchema.parse(await request.json());
    const order = await createOrder(body, user);
    return ok(order, "Order created successfully", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
