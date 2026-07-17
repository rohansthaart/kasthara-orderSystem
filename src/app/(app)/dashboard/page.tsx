import Link from "next/link";
import { AlertTriangle, ArrowRight, ClipboardList, CreditCard, PackageCheck, WalletCards } from "lucide-react";
import { getDashboardSummary } from "@/lib/dashboard-service";
import { asCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardBarChart } from "@/components/dashboard-bar-chart";
import { formatEnumLabel } from "@/components/ui/status-badge";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  const cards = summary.cards;
  const attentionItems = [
    {
      label: "Overdue deliveries",
      value: cards.overdueDeliveries,
      href: "/queues",
      tone: cards.overdueDeliveries > 0 ? "critical" : "neutral",
    },
    {
      label: "Follow-ups today",
      value: cards.followUpsDueToday,
      href: "/queues",
      tone: cards.followUpsDueToday > 0 ? "warning" : "neutral",
    },
    {
      label: "Unpaid orders",
      value: cards.unpaid,
      href: "/payments",
      tone: cards.unpaid > 0 ? "critical" : "neutral",
    },
    {
      label: "Partially paid",
      value: cards.partiallyPaid,
      href: "/payments",
      tone: cards.partiallyPaid > 0 ? "warning" : "neutral",
    },
  ];

  const workflowItems = [
    { label: "Waiting approval", value: cards.designApproval, href: "/orders?orderStage=DESIGN_SENT" },
    { label: "In production", value: cards.inProduction, href: "/orders?orderStage=IN_PRODUCTION" },
    { label: "Ready to pack", value: cards.readyToPack, href: "/orders?orderStage=READY_TO_PACK" },
    { label: "Ready for delivery", value: cards.readyForDelivery, href: "/queues" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Today&apos;s orders, payments, and production pressure in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/queues">Open queues</Link>
          </Button>
          <Button asChild>
            <Link href="/orders/new">Create order</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Today</h2>
              <p className="text-sm text-[var(--muted-foreground)]">New work and cash collected since midnight.</p>
            </div>
            <Badge className="w-fit border-green-200 bg-green-50 text-green-800">Live</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={ClipboardList} label="Orders today" value={cards.ordersToday} href="/orders" />
            <MetricCard icon={PackageCheck} label="This week" value={cards.ordersThisWeek} href="/orders" />
            <MetricCard icon={WalletCards} label="Revenue today" value={asCurrency(cards.revenueToday)} href="/orders" />
            <MetricCard icon={CreditCard} label="Payments today" value={asCurrency(cards.paymentsReceivedToday)} href="/payments" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="font-semibold">Needs attention</h2>
            <p className="text-sm text-[var(--muted-foreground)]">The work most likely to block delivery or collection.</p>
          </CardHeader>
          <CardContent className="divide-y divide-[var(--border)] p-0">
            {attentionItems.map((item) => (
              <PriorityRow key={item.label} {...item} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Production flow</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Counts by the stages staff need to act on.</p>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href="/orders">View orders</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {workflowItems.map((item) => (
              <WorkflowTile key={item.label} {...item} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Payment exposure</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Outstanding customer balance across active orders.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Outstanding balance</p>
              <p className="mt-1 text-3xl font-semibold">{asCurrency(cards.outstandingBalance)}</p>
            </div>
            <Button asChild className="w-full" variant="secondary">
              <Link href="/payments">Collect payments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SimpleChart
          title="Product performance"
          helper="Revenue by product type"
          rows={summary.charts.productPerformance.map((item) => ({
            label: formatLooseLabel(item.productType),
            value: Number(item._sum?.lineTotal ?? 0),
            meta: `${Number(item._sum?.quantity ?? 0)} sold`,
          }))}
          money
        />
        <SimpleChart
          title="Payment methods"
          helper="Collected amount by method"
          rows={summary.charts.paymentMethods.map((item) => ({
            label: formatEnumLabel(item.paymentMethod),
            value: Number(item._sum?.amount ?? 0),
          }))}
          money
        />
        <SimpleChart
          title="Staff bookings"
          helper="Orders created by staff"
          rows={summary.charts.staffBookings.map((item) => ({
            label: item.staffName,
            value: Number(item.count ?? 0),
          }))}
        />
        <SimpleChart
          title="Delivery methods"
          helper="Orders by fulfillment path"
          rows={summary.charts.deliveryDistribution.map((item) => ({
            label: formatEnumLabel(item.deliveryMethod),
            value: Number(item._count ?? 0),
          }))}
        />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="group rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-4 transition-colors hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
        <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-4 text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Link>
  );
}

function PriorityRow({ label, value, href, tone }: { label: string; value: number; href: string; tone: string }) {
  const toneClass =
    tone === "critical"
      ? "border-red-200 bg-red-50 text-red-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]";

  return (
    <Link href={href} className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
      <div className="flex min-w-0 items-center gap-3">
        <AlertTriangle className={tone === "neutral" ? "h-4 w-4 text-[var(--muted-foreground)]" : "h-4 w-4 text-[var(--warning)]"} />
        <span className="truncate text-sm font-medium">{label}</span>
      </div>
      <Badge className={toneClass}>{value}</Badge>
    </Link>
  );
}

function WorkflowTile({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] p-4 transition-colors hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Open matching orders</p>
      </div>
      <span className="text-2xl font-semibold">{value}</span>
    </Link>
  );
}

function SimpleChart({ title, helper, rows, money }: { title: string; helper: string; rows: Array<{ label: string; value: number; meta?: string }>; money?: boolean }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{helper}</p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-right">
          <p className="text-xs text-[var(--muted-foreground)]">Total</p>
          <p className="text-sm font-semibold">{money ? asCurrency(total) : total}</p>
        </div>
      </CardHeader>
      <CardContent>
        <DashboardBarChart rows={rows} money={money} />
      </CardContent>
    </Card>
  );
}

function formatLooseLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
