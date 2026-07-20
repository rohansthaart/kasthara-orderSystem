import { prisma } from "@/lib/prisma";
import { normaliseLabelSettings } from "@/lib/label-settings";
import { SettingsForms } from "./settings-forms";

export default async function SettingsPage() {
  const [products, sources, labelSetting] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.orderSource.findMany({ orderBy: { name: "asc" } }),
    prisma.labelSetting.findFirst({ where: { isDefault: true } }),
  ]);
  return (
    <SettingsForms
      products={products.map((product) => ({ ...product, defaultPrice: Number(product.defaultPrice) }))}
      sources={sources}
      labelSettings={normaliseLabelSettings(labelSetting)}
    />
  );
}
