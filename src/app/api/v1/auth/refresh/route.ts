import { handleRouteError, ok } from "@/lib/api-response";
import { refreshSession } from "@/lib/auth";

export async function POST() {
  try {
    const user = await refreshSession();
    return ok(user, "Session refreshed");
  } catch (error) {
    return handleRouteError(error);
  }
}
