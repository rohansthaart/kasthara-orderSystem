import Link from "next/link";
import { AlertTriangle, ArrowRight, ClipboardCheck, CreditCard, PackageCheck, PhoneCall, Truck } from "lucide-react";
import { format } from "date-fns";
import { getTodayWorkQueues } from "@/lib/dashboard-service";
import { asCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStageBadge, PaymentStatusBadge } from "@/components/ui/status-badge";
import { StatusQuickActions } from "@/components/status-quick-actions";

type QueueKey = "overdueOrders" | "outstandingPayments" | "followUpToday" | "produceToday" | "packToday" | "deliverToday" | "pickupReady";

const queueMeta: Record<QueueKey, { title: string; description: string; icon: typeof AlertTriangle; tone: "urgent" | "attention" | "work" }> = {
  overdueOrders: { title: "Overdue", description: "Past the required delivery time", icon: AlertTriangle, tone: "urgent" },
  outstandingPayments: { title: "Payments to collect", description: "Orders with money still due", icon: CreditCard, tone: "attention" },
  followUpToday: { title: "Follow up", description: "Existing reminders due today", icon: PhoneCall, tone: "attention" },
  produceToday: { title: "In production", description: "Approved or currently being made", icon: PackageCheck, tone: "work" },
  packToday: { title: "Ready to pack", description: "Finished work waiting for packing", icon: ClipboardCheck, tone: "work" },
  deliverToday: { title: "Send out", description: "Delivery and courier orders ready to move", icon: Truck, tone: "work" },
  pickupReady: { title: "Ready for pickup", description: "Customers can collect these orders", icon: PackageCheck, tone: "work" },
};

export default async function QueuesPage() {
  const queues = await getTodayWorkQueues();
  const entries = (Object.entries(queues) as Array<[QueueKey, (typeof queues)[QueueKey]]>);
  const active = entries.filter(([, orders]) => orders.length > 0);
  const urgentCount = queues.overdueOrders.length + queues.outstandingPayments.length;
  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <header className="flex flex-col gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Work queues</h1><p className="mt-1 text-sm text-[var(--muted-foreground)]">Move orders forward, starting with anything that could delay a customer.</p></div>
        <div className="rounded-md bg-[var(--muted)] px-3 py-2 text-sm"><strong>{active.reduce((total, [, orders]) => total + orders.length, 0)}</strong> active items{urgentCount ? <span className="ml-2 text-[var(--danger)]">{urgentCount} need attention</span> : null}</div>
      </header>

      {active.length === 0 ? <EmptyState title="Nothing is waiting" body="New production, payment, and delivery work will appear here automatically." /> : null}

      {active.length > 0 ? <div className="grid gap-5 xl:grid-cols-2">
        {active.map(([key, orders]) => <QueueSection key={key} queueKey={key} orders={orders} />)}
      </div> : null}
    </div>
  );
}

function QueueSection({ queueKey, orders }: { queueKey: QueueKey; orders: Awaited<ReturnType<typeof getTodayWorkQueues>>[QueueKey] }) {
  const meta = queueMeta[queueKey];
  const Icon = meta.icon;
  const toneClass = meta.tone === "urgent" ? "text-[var(--danger)]" : meta.tone === "attention" ? "text-[var(--warning)]" : "text-[var(--primary)]";
  return <Card className="overflow-hidden"><CardHeader className="flex flex-row items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${toneClass}`} /><div><h2 className="font-semibold">{meta.title}</h2><p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{meta.description}</p></div></div><span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-sm font-semibold tabular-nums">{orders.length}</span></CardHeader><CardContent className="space-y-2">{orders.map((order) => <QueueOrder key={order.id} order={order} queueKey={queueKey} />)}</CardContent></Card>;
}

function QueueOrder({ order, queueKey }: { order: Awaited<ReturnType<typeof getTodayWorkQueues>>[QueueKey][number]; queueKey: QueueKey }) {
  const productSummary = order.items.map((item) => `${item.productNameSnapshot} ×${item.quantity}`).join(", ");
  const dueAt = queueKey === "followUpToday" ? order.followUpAt : order.requiredDeliveryAt;
  const paymentQueue = queueKey === "outstandingPayments";
  return <article className="grid gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><Link className="font-semibold underline-offset-2 hover:underline" href={`/orders/${order.id}`}>{order.orderNumber}</Link>{dueAt ? <span className={queueKey === "overdueOrders" ? "text-xs font-semibold text-[var(--danger)]" : "text-xs text-[var(--muted-foreground)]"}>{queueKey === "overdueOrders" ? "Due " : "By "}{format(dueAt, "d MMM, h:mm a")}</span> : null}</div><p className="mt-1 truncate text-sm text-[var(--muted-foreground)]">{order.customer.name} · {order.customer.primaryPhone}</p><p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">{productSummary}</p><div className="mt-2 flex flex-wrap items-center gap-2"><OrderStageBadge stage={order.orderStage} />{paymentQueue ? <PaymentStatusBadge status={order.paymentStatus} /> : null}{Number(order.remainingBalance) > 0 ? <span className="text-xs font-semibold">Due {asCurrency(Number(order.remainingBalance))}</span> : null}</div></div><div className="flex shrink-0 flex-col gap-2">{paymentQueue ? <Link className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium hover:bg-[var(--muted)]" href={`/orders/${order.id}`}>Record payment <ArrowRight className="h-4 w-4" /></Link> : <StatusQuickActions orderId={order.id} currentStage={order.orderStage} compact />}</div></article>;
}
