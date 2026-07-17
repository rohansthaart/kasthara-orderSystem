import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const products = await prisma.product.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
    return ok(products, "Products retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const body = productSchema.parse(await request.json());
    const product = await prisma.product.create({ data: body });
    return ok(product, "Product created successfully", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
