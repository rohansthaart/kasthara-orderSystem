import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { getTodayWorkQueues } from "@/lib/dashboard-service";

export async function GET() {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const queues = await getTodayWorkQueues();
    return ok(queues, "Today work queues retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
