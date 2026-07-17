import { prisma } from "@/lib/prisma";
import { handleRouteError, ok, fail } from "@/lib/api-response";
import { loginSchema } from "@/lib/validation";
import { setAuthCookies, verifyPassword, type SessionUser } from "@/lib/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "local";
    const current = attempts.get(ip);
    if (current && current.count >= 8 && current.resetAt > Date.now()) {
      return fail("Too many login attempts. Try again shortly.", 429);
    }
    const body = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.isActive || !(await verifyPassword(body.password, user.passwordHash))) {
      const next = current && current.resetAt > Date.now() ? current : { count: 0, resetAt: Date.now() + 10 * 60 * 1000 };
      attempts.set(ip, { count: next.count + 1, resetAt: next.resetAt });
      return fail("Invalid email or password", 401);
    }
    attempts.delete(ip);
    const sessionUser: SessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    await setAuthCookies(sessionUser, user.refreshTokenVersion);
    return ok(sessionUser, "Logged in successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
