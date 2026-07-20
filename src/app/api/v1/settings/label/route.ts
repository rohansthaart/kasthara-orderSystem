import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { labelSettingSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const setting = await prisma.labelSetting.findFirst({ where: { isDefault: true } });
    return ok(setting, "Label settings retrieved successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireRole(["ADMIN"]);
    const body = labelSettingSchema.parse(await request.json());
    const existing = await prisma.labelSetting.findFirst({ where: { isDefault: true } });
    const setting = existing
      ? await prisma.labelSetting.update({ where: { id: existing.id }, data: body })
      : await prisma.labelSetting.create({ data: { name: "Default", isDefault: true, ...body } });
    return ok(setting, "Label settings saved");
  } catch (error) {
    return handleRouteError(error);
  }
}
