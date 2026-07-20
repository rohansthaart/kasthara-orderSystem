import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewOrderForm } from "./new-order-form";

export default async function NewOrderPage() {
  const [products, sources, staffMembers, currentUser] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.orderSource.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getCurrentUser(),
  ]);
  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Link href="/orders" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Create a new order.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">Capture customer, product, fulfillment, and payment details in one pass.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm shadow-[0_14px_40px_-34px_rgba(41,62,43,0.5)]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 font-semibold text-[var(--danger)]">*</span>
          <span className="text-[var(--muted-foreground)]">Required fields</span>
        </div>
      </header>
      <NewOrderForm
        products={products.map((product) => ({ id: product.id, name: product.name, productType: product.productType, defaultPrice: Number(product.defaultPrice) }))}
        sources={sources.map((source) => ({ id: source.id, name: source.name }))}
        staffMembers={staffMembers}
        currentUserId={currentUser?.id ?? ""}
      />
    </div>
  );
}
