import { z } from "zod";
import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { createPrintLog } from "@/lib/order-service";

const printSchema = z.object({
  printerName: z.string().optional(),
  printType: z.enum(["LABEL", "BULK_LABEL", "REPRINT"]).default("LABEL"),
  copyNumber: z.coerce.number().int().positive().default(1),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole(["ADMIN", "STAFF"]);
    const { id } = await context.params;
    const body = printSchema.parse(await request.json());
    const log = await createPrintLog(id, user, body);
    return ok(log, "Print log recorded", { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
