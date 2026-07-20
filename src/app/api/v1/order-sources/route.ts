import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderSourceSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    return ok(await prisma.orderSource.findMany({ orderBy: { name: "asc" } }), "Order sources retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const source = await prisma.orderSource.create({ data: orderSourceSchema.parse(await request.json()) });
    return ok(source, "Order source created successfully", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
