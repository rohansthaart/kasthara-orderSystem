import { clearAuthCookies } from "@/lib/auth";
import { ok } from "@/lib/api-response";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  await clearAuthCookies();
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html") && !accept.includes("application/json")) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }
  return ok({}, "Logged out successfully");
}
