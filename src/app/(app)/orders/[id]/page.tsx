import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Printer } from "lucide-react";
import { getOrderById } from "@/lib/order-service";
import { asCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStageBadge, PaymentStatusBadge, formatEnumLabel } from "@/components/ui/status-badge";
import { PaymentForm } from "./payment-form";
import { StatusForm } from "./status-form";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Booked by {order.bookedBy.name} on {order.orderDate.toLocaleString()}</p>
          <div className="mt-2 flex flex-wrap gap-2"><OrderStageBadge stage={order.orderStage} /><PaymentStatusBadge status={order.paymentStatus} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary"><a href={`tel:${order.customer.primaryPhone}`}><Phone className="h-4 w-4" /> Call</a></Button>
          <Button asChild variant="secondary"><Link href={`/labels/${order.id}`}><Printer className="h-4 w-4" /> Label</Link></Button>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader><h2 className="font-semibold">Customer</h2></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Info label="Name" value={order.customer.name} />
              <Info label="Phone" value={order.customer.primaryPhone} />
              <Info label="Alternative phone" value={order.customer.alternativePhone ?? "-"} />
              <Info label="Delivery" value={order.deliveryAddress ?? order.pickupLocation ?? "-"} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Items</h2></CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-md border border-[var(--border)] p-3">
                  <div className="flex justify-between gap-3"><strong>{item.productNameSnapshot}</strong><span>{asCurrency(Number(item.lineTotal))}</span></div>
                  <p className="text-sm text-[var(--muted-foreground)]">{item.productType} x{item.quantity} at {asCurrency(Number(item.unitPrice))}</p>
                  {item.personalizationNotes ? <p className="mt-2 text-sm">{item.personalizationNotes}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Timeline</h2></CardHeader>
            <CardContent className="divide-y divide-[var(--border)] p-0">
              {order.statusHistory.map((item) => (
                <div key={item.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div>
                    <p className="text-sm font-medium">{formatEnumLabel(item.previousStatus ?? "START")} to {formatEnumLabel(item.newStatus)}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{item.changedBy.name} at {item.createdAt.toLocaleString()}</p>
                  </div>
                  {item.notes ? <p className="text-sm">{item.notes}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Audit history</h2></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.auditLogs.map((item) => <p key={item.id}>{item.createdAt.toLocaleString()} - {item.action} - {item.user?.name ?? "System"}</p>)}
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <StatusForm orderId={order.id} currentStage={order.orderStage} />
          <PaymentForm orderId={order.id} />
          <Card>
            <CardHeader><h2 className="font-semibold">Price breakdown</h2></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Line label="Subtotal" value={asCurrency(Number(order.subtotal))} />
              <Line label="Discount" value={asCurrency(Number(order.discount))} />
              <Line label="Delivery" value={asCurrency(Number(order.deliveryCharge))} />
              <Line label="Total" value={asCurrency(Number(order.totalPrice))} />
              <Line label="Paid" value={asCurrency(Number(order.amountPaid))} />
              <Line label="Remaining" value={asCurrency(Number(order.remainingBalance))} strong />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Payments</h2></CardHeader>
            <CardContent className="space-y-3">
              {order.payments.map((payment) => (
                <div key={payment.id} className="rounded-md border border-[var(--border)] p-3 text-sm">
                  <div className="flex justify-between"><strong>{asCurrency(Number(payment.amount))}</strong><span>{payment.paymentType}</span></div>
                  <p className="text-[var(--muted-foreground)]">{payment.paymentMethod} by {payment.receivedBy.name}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">Print history</h2></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.printLogs.length === 0 ? <p className="text-[var(--muted-foreground)]">No print logs yet.</p> : null}
              {order.printLogs.map((item) => <p key={item.id}>{item.printType} copy {item.copyNumber} by {item.printedBy.name}</p>)}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-[var(--muted-foreground)]">{label}</p><p className="font-medium">{value}</p></div>;
}
function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex justify-between gap-3"><span>{label}</span><span className={strong ? "font-semibold" : ""}>{value}</span></div>;
}
