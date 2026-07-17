import Link from "next/link";
import { getTodayWorkQueues } from "@/lib/dashboard-service";
import { asCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QueueStatusButton } from "./queue-status-button";

const labels: Record<string, string> = {
  followUpToday: "Follow up today",
  produceToday: "Produce today",
  packToday: "Pack today",
  deliverToday: "Deliver today",
  pickupReady: "Pickup ready",
  outstandingPayments: "Outstanding payments",
  overdueOrders: "Overdue orders",
};

const nextStage: Record<string, string> = {
  produceToday: "READY_TO_PACK",
  packToday: "PACKED",
  deliverToday: "DELIVERED",
  pickupReady: "DELIVERED",
};

export default async function QueuesPage() {
  const queues = await getTodayWorkQueues();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Today&apos;s work queues</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Fast updates without opening every order.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Object.entries(queues).map(([key, orders]) => (
          <Card key={key}>
            <CardHeader><h2 className="font-semibold">{labels[key]}</h2></CardHeader>
            <CardContent className="space-y-2">
              {orders.length === 0 ? <p className="text-sm text-[var(--muted-foreground)]">Nothing waiting here.</p> : null}
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] p-3">
                  <div className="min-w-0">
                    <Link className="font-semibold hover:underline" href={`/orders/${order.id}`}>{order.orderNumber}</Link>
                    <p className="truncate text-sm text-[var(--muted-foreground)]">{order.customer.name} - {order.customer.primaryPhone}</p>
                    <div className="mt-1 flex gap-2"><Badge>{order.orderStage}</Badge><Badge>{asCurrency(Number(order.remainingBalance))}</Badge></div>
                  </div>
                  {nextStage[key] ? <QueueStatusButton orderId={order.id} orderStage={nextStage[key]} /> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
