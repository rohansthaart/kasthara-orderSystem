import { prisma } from "@/lib/prisma";
import { NewOrderForm } from "./new-order-form";

export default async function NewOrderPage() {
  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">New order</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Fast entry for Facebook, Instagram, phone, and walk-in orders.</p>
      </div>
      <NewOrderForm products={products.map((product) => ({ id: product.id, name: product.name, productType: product.productType, defaultPrice: Number(product.defaultPrice) }))} />
    </div>
  );
}
