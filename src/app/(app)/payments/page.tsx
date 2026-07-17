import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { asCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PaymentsPage() {
  const orders = await prisma.order.findMany({
    where: { paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] }, orderStage: { notIn: ["CANCELLED", "RETURNED"] } },
    include: { customer: true, items: true },
    orderBy: { remainingBalance: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Outstanding payments</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Orders that still need customer collection or final payment.</p>
      </div>
      <div className="grid gap-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link className="font-semibold hover:underline" href={`/orders/${order.id}`}>{order.orderNumber}</Link>
                <p className="text-sm text-[var(--muted-foreground)]">{order.customer.name} - {order.customer.primaryPhone}</p>
                <p className="text-sm">{order.items.map((item) => item.productNameSnapshot).join(", ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{order.paymentStatus}</Badge>
                <strong>{asCurrency(Number(order.remainingBalance))}</strong>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
