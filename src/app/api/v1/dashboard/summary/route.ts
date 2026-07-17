import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard-service";

export async function GET() {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const summary = await getDashboardSummary();
    return ok(summary, "Dashboard summary retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
