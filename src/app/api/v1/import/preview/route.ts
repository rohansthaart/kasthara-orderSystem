import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { previewImport } from "@/lib/excel-service";

export async function POST(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("XLSX file is required");
    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = await previewImport(buffer);
    return ok(preview, "Import preview generated");
  } catch (error) {
    return handleRouteError(error);
  }
}
