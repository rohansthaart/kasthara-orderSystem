import { format } from "date-fns";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Clock3,
  CreditCard,
  Plus,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { DashboardBarChart, DashboardOrderTrend } from "@/components/dashboard-bar-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatEnumLabel } from "@/components/ui/status-badge";
import { getDashboardSummary } from "@/lib/dashboard-service";
import { asCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  const cards = summary.cards;
  const reportRange = `${format(summary.reportingPeriod.start, "d MMM")} - ${format(summary.reportingPeriod.end, "d MMM yyyy")}`;
  const todayLabel = format(summary.reportingPeriod.end, "EEEE, d MMMM");

  const attentionItems = [
    {
      label: "Overdue deliveries",
      helper: "Past the promised delivery date",
      value: cards.overdueDeliveries,
      href: "/queues",
      tone: cards.overdueDeliveries > 0 ? "critical" : "neutral",
    },
    {
      label: "Follow-ups today",
      helper: "Customers waiting for a response",
      value: cards.followUpsDueToday,
      href: "/queues",
      tone: cards.followUpsDueToday > 0 ? "warning" : "neutral",
    },
    {
      label: "Unpaid orders",
      helper: "No payment has been recorded",
      value: cards.unpaid,
      href: "/payments",
      tone: cards.unpaid > 0 ? "critical" : "neutral",
    },
    {
      label: "Partially paid",
      helper: "A balance is still outstanding",
      value: cards.partiallyPaid,
      href: "/payments",
      tone: cards.partiallyPaid > 0 ? "warning" : "neutral",
    },
  ];

  const workflowItems = [
    { label: "Waiting approval", helper: "Design sent", value: cards.designApproval, href: "/orders?orderStage=DESIGN_SENT" },
    { label: "In production", helper: "Being made", value: cards.inProduction, href: "/orders?orderStage=IN_PRODUCTION" },
    { label: "Ready to pack", helper: "Production complete", value: cards.readyToPack, href: "/orders?orderStage=READY_TO_PACK" },
    { label: "Ready to deliver", helper: "Packed or shipped", value: cards.readyForDelivery, href: "/queues" },
  ];

  const attentionTotal = attentionItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)]">
            <span className="h-2 w-2 rounded-full bg-[var(--success)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--success)_12%,transparent)]" />
            Live operations · {todayLabel}
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Keep today moving.</h1>
          <p className="mt-2 max-w-xl text-pretty text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
            Orders, cash flow, and the work most likely to slow the team down.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/queues">
              Open work queues
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/orders/new">
              <Plus className="h-4 w-4" />
              Create order
            </Link>
          </Button>
        </div>
      </header>

      <section aria-labelledby="today-heading" className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <article className="relative isolate overflow-hidden rounded-[1.75rem] bg-[var(--primary)] px-5 py-6 text-[var(--primary-foreground)] shadow-[0_24px_70px_-32px_color-mix(in_srgb,var(--primary)_85%,transparent)] sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-16 -top-28 -z-10 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-44 w-72 rounded-full bg-[#dcae67]/15 blur-3xl" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p id="today-heading" className="text-sm font-medium text-white/70">Today&apos;s pulse</p>
              <p className="mt-1 text-sm text-white/55">Activity recorded since midnight</p>
            </div>
            <span className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#bfe8c9]" />
              Live
            </span>
          </div>

          <div className="mt-9">
            <p className="text-sm text-white/65">Revenue booked today</p>
            <p className="mt-2 break-words text-4xl font-semibold tracking-[-0.05em] tabular-nums sm:text-5xl">
              {asCurrency(cards.revenueToday)}
            </p>
          </div>

          <div className="mt-9 grid divide-y divide-white/15 border-t border-white/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <PulseMetric icon={ClipboardList} label="Orders today" value={cards.ordersToday} />
            <PulseMetric icon={CreditCard} label="Payments received" value={asCurrency(cards.paymentsReceivedToday)} />
            <PulseMetric icon={CalendarDays} label="Orders this week" value={cards.ordersThisWeek} />
          </div>
        </article>

        <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-0 bg-transparent px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Needs attention</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Start here to prevent delays.</p>
            </div>
            <span className="min-w-10 rounded-lg bg-[#f3e6d6] px-2.5 py-2 text-center text-sm font-semibold tabular-nums text-[#89501a]">
              {attentionTotal}
            </span>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
            <div className="space-y-1">
              {attentionItems.map((item) => (
                <PriorityRow key={item.label} {...item} />
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="flow-heading" className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
          <CardHeader className="flex flex-col gap-4 border-0 bg-transparent px-5 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
            <div>
              <h2 id="flow-heading" className="text-lg font-semibold tracking-[-0.02em]">Production flow</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Open orders at each active stage.</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="w-fit rounded-lg text-[var(--primary)]">
              <Link href="/orders">
                All orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {workflowItems.map((item, index) => (
                <WorkflowTile key={item.label} step={index + 1} {...item} />
              ))}
            </div>
          </CardContent>
        </Card>

        <aside className="relative overflow-hidden rounded-[1.75rem] bg-[#efe8d9] p-5 text-[#29271f] shadow-[0_18px_50px_-34px_rgba(78,64,38,0.45)] sm:p-6">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[24px] border-white/25" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/65 text-[#725324]">
                <WalletCards className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-[#746c5d]">Active orders</span>
            </div>
            <p className="mt-6 text-sm text-[#746c5d]">Outstanding balance</p>
            <p className="mt-2 break-words text-3xl font-semibold tracking-[-0.04em] tabular-nums">
              {asCurrency(cards.outstandingBalance)}
            </p>
            <div className="mt-6 flex gap-5 border-t border-[#d8cdb9] pt-4 text-sm">
              <div>
                <span className="font-semibold tabular-nums">{cards.unpaid}</span>
                <span className="ml-1.5 text-[#746c5d]">unpaid</span>
              </div>
              <div>
                <span className="font-semibold tabular-nums">{cards.partiallyPaid}</span>
                <span className="ml-1.5 text-[#746c5d]">partial</span>
              </div>
            </div>
            <Link href="/payments" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#5b421e] outline-none transition-[gap,color] hover:gap-3 hover:text-[#382812] focus-visible:ring-2 focus-visible:ring-[#8c6a38]">
              Review payments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </section>

      <section aria-labelledby="operations-heading" className="space-y-4 pt-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="operations-heading" className="text-xl font-semibold tracking-[-0.03em]">30-day operations</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{reportRange} · Cancelled and returned orders excluded.</p>
          </div>
          <Badge className="w-fit rounded-md border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-medium text-[var(--muted-foreground)] shadow-none">
            Rolling report
          </Badge>
        </div>

        <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
          <CardHeader className="flex flex-col gap-3 border-0 bg-transparent px-5 pb-0 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
            <div>
              <h3 className="font-semibold">Order rhythm</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Daily active bookings across the reporting period.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <Clock3 className="h-4 w-4" />
              Updated now
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-3 pt-4 sm:px-4 sm:pb-4">
            <DashboardOrderTrend rows={summary.charts.dailyOrders} />
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-12">
          <SimpleChart
            className="xl:col-span-7"
            title="Product demand"
            helper="Gross sales by product type"
            rows={summary.charts.productPerformance.map((item) => ({
              label: formatLooseLabel(item.productType),
              value: Number(item._sum?.lineTotal ?? 0),
              meta: `${Number(item._sum?.quantity ?? 0)} sold`,
            }))}
            money
          />
          <SimpleChart
            className="xl:col-span-5"
            title="Payment collection"
            helper="Net collected by payment method"
            rows={summary.charts.paymentMethods.map((item) => ({
              label: formatEnumLabel(item.paymentMethod),
              value: item.value,
            }))}
            money
          />
          <SimpleChart
            className="xl:col-span-5"
            title="Active bookings"
            helper="Non-cancelled orders by staff"
            rows={summary.charts.staffBookings.map((item) => ({
              label: item.staffName,
              value: Number(item.count ?? 0),
            }))}
          />
          <SimpleChart
            className="xl:col-span-7"
            title="Fulfillment mix"
            helper="Active orders by delivery method"
            rows={summary.charts.deliveryDistribution.map((item) => ({
              label: formatEnumLabel(item.deliveryMethod),
              value: item.count,
            }))}
          />
          <SimpleChart
            className="xl:col-span-12"
            title="Order sources"
            helper="Where active orders came from"
            rows={summary.charts.sourceDistribution.map((item) => ({ label: item.sourceName, value: item.count }))}
          />
        </div>
      </section>
    </div>
  );
}

function PulseMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 py-4 sm:px-4 sm:py-5 sm:first:pl-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/75">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-white/55">{label}</p>
        <p className="mt-0.5 truncate text-lg font-semibold tabular-nums text-white">{value}</p>
      </div>
    </div>
  );
}

function PriorityRow({
  label,
  helper,
  value,
  href,
  tone,
}: {
  label: string;
  helper: string;
  value: number;
  href: string;
  tone: string;
}) {
  const indicatorClass =
    tone === "critical" ? "bg-[var(--danger)]" : tone === "warning" ? "bg-[var(--warning)]" : "bg-[var(--success)]";
  const valueClass =
    tone === "critical"
      ? "bg-red-50 text-red-800"
      : tone === "warning"
        ? "bg-amber-50 text-amber-800"
        : "bg-[var(--muted)] text-[var(--muted-foreground)]";

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${indicatorClass}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">{helper}</span>
      </span>
      <span className={`min-w-9 rounded-lg px-2 py-1.5 text-center text-sm font-semibold tabular-nums ${valueClass}`}>{value}</span>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function WorkflowTile({
  label,
  helper,
  value,
  href,
  step,
}: {
  label: string;
  helper: string;
  value: number;
  href: string;
  step: number;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl bg-[var(--surface-subtle)] p-4 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface)] text-xs font-semibold text-[var(--muted-foreground)] shadow-sm">
          {step}
        </span>
        <ArrowUpRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{value}</p>
      <p className="mt-2 truncate text-sm font-medium">{label}</p>
      <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{helper}</p>
    </Link>
  );
}

function SimpleChart({
  title,
  helper,
  rows,
  money,
  className,
  direction = "columns",
}: {
  title: string;
  helper: string;
  rows: Array<{ label: string; value: number; meta?: string }>;
  money?: boolean;
  className?: string;
  direction?: "rows" | "columns";
}) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <Card className={`overflow-hidden rounded-[1.75rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)] ${className ?? ""}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-0 bg-transparent px-5 pb-1 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{helper}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-[var(--muted-foreground)]">Total</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">{money ? asCurrency(total) : total}</p>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4 pt-3 sm:px-4">
        <DashboardBarChart rows={rows} money={money} direction={direction} />
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
