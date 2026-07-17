import { clearAuthCookies } from "@/lib/auth";
import { ok } from "@/lib/api-response";

export async function POST() {
  await clearAuthCookies();
  return ok({}, "Logged out successfully");
}
