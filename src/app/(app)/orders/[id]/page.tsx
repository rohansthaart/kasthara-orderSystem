import { format } from "date-fns";
import { ArrowLeft, Banknote, CalendarClock, MapPin, Phone, Printer, Truck, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OrderStageBadge, PaymentStatusBadge, formatEnumLabel } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { getOrderById } from "@/lib/order-service";
import { prisma } from "@/lib/prisma";
import { asCurrency } from "@/lib/utils";
import { OrderEditForm } from "./order-edit-form";
import { PaymentForm } from "./payment-form";
import { PaymentReceiverEditor } from "./payment-receiver-editor";
import { StatusForm } from "./status-form";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const [users, currentUser] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    getCurrentUser(),
  ]);

  const deliveryPlace = order.deliveryAddress ?? order.pickupLocation ?? "No delivery location recorded";
  const requiredAt = order.requiredDeliveryAt ? format(order.requiredDeliveryAt, "d MMM yyyy, h:mm a") : "No required time set";
  const editInitial = {
    quantity: order.items[0]?.quantity ?? order.quantity,
    unitPrice: Number(order.items[0]?.unitPrice ?? 0),
    discount: Number(order.discount),
    deliveryCharge: Number(order.deliveryCharge),
    deliveryMethod: order.deliveryMethod,
    deliveryAddress: order.deliveryAddress ?? "",
    pickupLocation: order.pickupLocation ?? "",
    requiredDeliveryAt: order.requiredDeliveryAt ? order.requiredDeliveryAt.toISOString().slice(0, 16) : "",
    specialNotes: order.specialNotes ?? "",
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <Link href="/orders" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]">
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{order.orderNumber}</h1>
            <OrderStageBadge stage={order.orderStage} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Booked by <span className="font-medium text-[var(--foreground)]">{order.bookedBy.name}</span> on {format(order.orderDate, "d MMM yyyy, h:mm a")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="rounded-xl">
            <a href={`tel:${order.customer.primaryPhone}`}><Phone className="h-4 w-4" />Call customer</a>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href={`/labels/${order.id}`}><Printer className="h-4 w-4" />Prepare label</Link>
          </Button>
        </div>
      </header>

      <section aria-label="Order summary" className="relative isolate overflow-hidden rounded-[1.75rem] bg-[var(--primary)] px-5 py-6 text-white shadow-[0_24px_70px_-34px_color-mix(in_srgb,var(--primary)_88%,transparent)] sm:px-7">
        <div className="pointer-events-none absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-white/15">
          <SummaryItem icon={UserRound} label="Customer" value={order.customer.name} helper={order.customer.primaryPhone} />
          <SummaryItem icon={CalendarClock} label="Required delivery" value={requiredAt} helper={formatEnumLabel(order.deliveryMethod)} />
          <SummaryItem icon={Banknote} label="Balance due" value={asCurrency(Number(order.remainingBalance))} helper={`${asCurrency(Number(order.amountPaid))} paid`} numeric />
          <SummaryItem icon={Truck} label="Fulfillment" value={formatEnumLabel(order.deliveryMethod)} helper={deliveryPlace} />
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <main className="space-y-5">
          <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
            <CardHeader className="border-0 bg-transparent px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
              <PanelHeading title="Customer and fulfillment" helper="Contact details and the handoff plan for this order." />
            </CardHeader>
            <CardContent className="grid gap-6 px-5 pb-6 pt-1 sm:px-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
                <Info label="Customer" value={order.customer.name} strong />
                <Info label="Primary phone" value={order.customer.primaryPhone} />
                <Info label="Alternative phone" value={order.customer.alternativePhone ?? "Not recorded"} />
                <Info label="Order source" value={order.source?.name ?? "Not recorded"} />
              </div>
              <div className="space-y-4 rounded-2xl bg-[var(--surface-subtle)] p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--primary)] shadow-sm"><MapPin className="h-4 w-4" /></div>
                  <div className="min-w-0"><p className="text-xs text-[var(--muted-foreground)]">{formatEnumLabel(order.deliveryMethod)}</p><p className="mt-1 text-sm font-medium leading-5">{deliveryPlace}</p></div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--primary)] shadow-sm"><CalendarClock className="h-4 w-4" /></div>
                  <div><p className="text-xs text-[var(--muted-foreground)]">Required delivery</p><p className="mt-1 text-sm font-medium">{requiredAt}</p></div>
                </div>
                {order.specialNotes ? <div className="border-t border-[var(--border)] pt-4 text-sm leading-6"><span className="font-medium">Team note: </span>{order.specialNotes}</div> : null}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
            <CardHeader className="border-0 bg-transparent px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
              <PanelHeading title="Order items" helper={`${order.items.length} line item${order.items.length === 1 ? "" : "s"} in this order.`} />
            </CardHeader>
            <CardContent className="space-y-2 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
              {order.items.map((item) => (
                <article key={item.id} className="flex flex-col justify-between gap-3 rounded-2xl bg-[var(--surface-subtle)] p-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.productNameSnapshot}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{formatEnumLabel(item.productType)} · {item.quantity} × {asCurrency(Number(item.unitPrice))}</p>
                    {item.personalizationNotes ? <p className="mt-3 max-w-2xl text-sm leading-6">{item.personalizationNotes}</p> : null}
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs text-[var(--muted-foreground)]">Line total</p>
                    <p className="mt-1 font-semibold tabular-nums">{asCurrency(Number(item.lineTotal))}</p>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
            <CardHeader className="border-0 bg-transparent px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
              <PanelHeading title="Recent activity" helper="The latest status changes on this order." />
            </CardHeader>
            <CardContent className="px-5 pb-6 pt-1 sm:px-6">
              {order.statusHistory.length ? (
                <ol className="space-y-0">
                  {order.statusHistory.slice(0, 6).map((item, index) => (
                    <li key={item.id} className="relative grid gap-1 pb-5 pl-8 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto]">
                      {index < Math.min(order.statusHistory.length, 6) - 1 ? <span className="absolute left-[7px] top-4 h-full w-px bg-[var(--border)]" /> : null}
                      <span className="absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-[var(--surface)] bg-[var(--primary)] shadow-[0_0_0_1px_var(--border)]" />
                      <div>
                        <p className="text-sm font-medium">{formatEnumLabel(item.previousStatus ?? "START")} to {formatEnumLabel(item.newStatus)}</p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.changedBy.name} · {format(item.createdAt, "d MMM yyyy, h:mm a")}</p>
                      </div>
                      {item.notes ? <p className="text-sm text-[var(--muted-foreground)]">{item.notes}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-2xl bg-[var(--surface-subtle)] p-4 text-sm text-[var(--muted-foreground)]">No status activity has been recorded yet.</p>
              )}
            </CardContent>
          </Card>

          <details className="group overflow-hidden rounded-[1.5rem] bg-[var(--surface)] shadow-[0_16px_44px_-34px_rgba(41,62,43,0.45)]">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium outline-none transition-colors hover:bg-[var(--surface-subtle)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]">
              Audit history and print log
              <span className="float-right text-[var(--muted-foreground)] transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="border-t border-[var(--border)] px-5 py-4 text-sm">
              <div className="space-y-2">
                {order.auditLogs.length ? order.auditLogs.map((item) => <p key={item.id}>{format(item.createdAt, "d MMM yyyy, h:mm a")} · {item.action} · {item.user?.name ?? "System"}</p>) : <p className="text-[var(--muted-foreground)]">No audit activity recorded.</p>}
                {order.printLogs.length ? <div className="border-t border-[var(--border)] pt-3 text-[var(--muted-foreground)]">{order.printLogs.map((item) => <p key={item.id}>{item.printType} copy {item.copyNumber} by {item.printedBy.name}</p>)}</div> : null}
              </div>
            </div>
          </details>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <StatusForm orderId={order.id} currentStage={order.orderStage} />

          <Card className="overflow-hidden rounded-[1.5rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
            <CardHeader className="border-0 bg-transparent px-5 pb-2 pt-5"><PanelHeading title="Payment summary" helper="Current order value and collection." compact /></CardHeader>
            <CardContent className="space-y-2 px-5 pb-5 pt-2 text-sm">
              <MoneyLine label="Subtotal" value={asCurrency(Number(order.subtotal))} />
              <MoneyLine label="Discount" value={asCurrency(Number(order.discount))} />
              <MoneyLine label="Delivery" value={asCurrency(Number(order.deliveryCharge))} />
              <div className="my-3 border-t border-[var(--border)]" />
              <MoneyLine label="Total" value={asCurrency(Number(order.totalPrice))} strong />
              <MoneyLine label="Paid" value={asCurrency(Number(order.amountPaid))} />
              <div className="mt-3 rounded-2xl bg-[var(--primary)] px-4 py-3 text-white"><MoneyLine label="Remaining" value={asCurrency(Number(order.remainingBalance))} strong inverted /></div>
            </CardContent>
          </Card>

          <PaymentForm orderId={order.id} remainingBalance={Number(order.remainingBalance)} staffMembers={users} currentUserId={currentUser?.id ?? ""} />

          <Card className="overflow-hidden rounded-[1.5rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
            <CardHeader className="border-0 bg-transparent px-5 pb-2 pt-5"><PanelHeading title="Payment history" helper={`${order.payments.length} payment${order.payments.length === 1 ? "" : "s"} recorded.`} compact /></CardHeader>
            <CardContent className="space-y-3 px-5 pb-5 pt-2">
              {order.payments.length ? order.payments.map((payment) => (
                <div key={payment.id} className="flex items-start justify-between gap-3 rounded-xl bg-[var(--surface-subtle)] p-3 text-sm">
                  <div className="min-w-0"><p className="font-medium">{formatEnumLabel(payment.paymentType)} · {formatEnumLabel(payment.paymentMethod)}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{payment.receivedBy.name} · {format(payment.paidAt, "d MMM, h:mm a")}</p></div>
                  <strong className="shrink-0 tabular-nums">{asCurrency(Number(payment.amount))}</strong>
                </div>
              )) : <p className="rounded-xl bg-[var(--surface-subtle)] p-4 text-sm text-[var(--muted-foreground)]">No payment recorded yet.</p>}
              <PaymentReceiverEditor orderId={order.id} payments={order.payments.map((payment) => ({ id: payment.id, paymentType: payment.paymentType, receivedByUserId: payment.receivedByUserId, receivedBy: payment.receivedBy }))} users={users} />
            </CardContent>
          </Card>

          <OrderEditForm orderId={order.id} initial={editInitial} />
        </aside>
      </div>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value, helper, numeric }: { icon: React.ElementType; label: string; value: string; helper: string; numeric?: boolean }) {
  return (
    <div className="flex min-w-0 gap-3 xl:px-5 xl:first:pl-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/75"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0"><p className="text-xs text-white/55">{label}</p><p className={`mt-1 truncate font-semibold ${numeric ? "tabular-nums" : ""}`}>{value}</p><p className="mt-1 truncate text-xs text-white/55">{helper}</p></div>
    </div>
  );
}

function PanelHeading({ title, helper, compact }: { title: string; helper: string; compact?: boolean }) {
  return <div><h2 className={compact ? "font-semibold" : "text-lg font-semibold tracking-[-0.02em]"}>{title}</h2><p className="mt-1 text-sm leading-5 text-[var(--muted-foreground)]">{helper}</p></div>;
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div><p className="text-xs text-[var(--muted-foreground)]">{label}</p><p className={`mt-1 text-sm ${strong ? "font-semibold" : "font-medium"}`}>{value}</p></div>;
}

function MoneyLine({ label, value, strong, inverted }: { label: string; value: string; strong?: boolean; inverted?: boolean }) {
  return <div className="flex justify-between gap-3"><span className={inverted ? "text-white/70" : "text-[var(--muted-foreground)]"}>{label}</span><span className={`${strong ? "font-semibold" : "font-medium"} tabular-nums`}>{value}</span></div>;
}
