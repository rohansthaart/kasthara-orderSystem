import Link from "next/link";
import { getDashboardSummary } from "@/lib/dashboard-service";
import { asCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const cardLabels: Record<string, string> = {
  ordersToday: "Orders today",
  ordersThisWeek: "Orders this week",
  revenueToday: "Revenue today",
  paymentsReceivedToday: "Payments today",
  outstandingBalance: "Outstanding balance",
  designApproval: "Waiting approval",
  inProduction: "In production",
  readyToPack: "Ready to pack",
  readyForDelivery: "Ready for delivery",
  overdueDeliveries: "Overdue deliveries",
  followUpsDueToday: "Follow-ups today",
  unpaid: "Unpaid orders",
  partiallyPaid: "Partially paid",
};

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Live order, payment, production, and delivery signals.</p>
        </div>
        <Button asChild>
          <Link href="/orders/new">Create order</Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(summary.cards).map(([key, value]) => (
          <Card key={key}>
            <CardContent>
              <p className="text-sm text-[var(--muted-foreground)]">{cardLabels[key] ?? key}</p>
              <p className="mt-2 text-2xl font-semibold">
                {key.toLowerCase().includes("revenue") || key.toLowerCase().includes("payment") || key.toLowerCase().includes("balance")
                  ? asCurrency(value)
                  : value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <SimpleChart title="Product performance" rows={summary.charts.productPerformance.map((item) => ({ label: item.productType, value: Number(item._sum?.lineTotal ?? 0) }))} money />
        <SimpleChart title="Payment methods" rows={summary.charts.paymentMethods.map((item) => ({ label: item.paymentMethod, value: Number(item._sum?.amount ?? 0) }))} money />
        <SimpleChart title="Staff bookings" rows={summary.charts.staffBookings.map((item) => ({ label: item.bookedByUserId.slice(-6), value: Number(item._count ?? 0) }))} />
        <SimpleChart title="Delivery methods" rows={summary.charts.deliveryDistribution.map((item) => ({ label: item.deliveryMethod, value: Number(item._count ?? 0) }))} />
      </div>
    </div>
  );
}

function SimpleChart({ title, rows, money }: { title: string; rows: Array<{ label: string; value: number }>; money?: boolean }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">{title}</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? <p className="text-sm text-[var(--muted-foreground)]">No data yet.</p> : null}
        {rows.map((row) => (
          <div key={row.label} className="space-y-1">
            <div className="flex justify-between gap-3 text-sm">
              <span>{row.label}</span>
              <span className="font-medium">{money ? asCurrency(row.value) : row.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
