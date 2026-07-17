import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: "asc" },
    });
    return ok(users, "Users retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const body = userSchema.required({ password: true }).parse(await request.json());
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role,
        isActive: body.isActive,
        passwordHash: await hashPassword(body.password),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return ok(user, "User created successfully", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
