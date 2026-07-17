import { z } from "zod";
import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { parseCustomerDetails } from "@/lib/customer-parser";

const schema = z.object({ text: z.string().min(1) });

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const body = schema.parse(await request.json());
    return ok(parseCustomerDetails(body.text), "Customer details detected");
  } catch (error) {
    return handleRouteError(error);
  }
}
