import Link from "next/link";
import { listOrders } from "@/lib/order-service";
import { orderQuerySchema } from "@/lib/validation";
import { asCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, Td, Th } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { OrderStageBadge, PaymentStatusBadge, formatEnumLabel } from "@/components/ui/status-badge";
import { StatusQuickActions } from "@/components/status-quick-actions";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const query = orderQuerySchema.parse(params);
  const result = await listOrders(query);
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Search by order number, phone, last four digits, name, or address.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><a href="/api/v1/export/orders">Export XLSX</a></Button>
          <Button asChild><Link href="/orders/new">New order</Link></Button>
        </div>
      </div>
      <form className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 md:grid-cols-[1fr_180px_180px_auto_auto]">
        <input name="search" defaultValue={query.search} className="h-11 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" placeholder="Search orders..." />
        <Select name="orderStage" defaultValue={query.orderStage ?? ""}>
          <option value="">All stages</option>
          {["NEW", "CONFIRMED", "DESIGN_PENDING", "IN_PRODUCTION", "READY_TO_PACK", "PACKED", "PICKUP_READY", "SHIPPED", "DELIVERED", "CANCELLED"].map((stage) => <option key={stage} value={stage}>{formatEnumLabel(stage)}</option>)}
        </Select>
        <Select name="paymentStatus" defaultValue={query.paymentStatus ?? ""}>
          <option value="">All payments</option>
          {["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"].map((status) => <option key={status} value={status}>{formatEnumLabel(status)}</option>)}
        </Select>
        <Button type="submit" variant="secondary">Filter</Button>
        <Button asChild variant="ghost"><Link href="/orders">Reset</Link></Button>
      </form>
      {result.data.length === 0 ? (
        <EmptyState title="No orders found" body="Create a new order or relax the current filters." />
      ) : (
        <>
          <div className="space-y-3 lg:hidden">
            {result.data.map((order) => (
              <Card key={order.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link className="font-semibold underline-offset-2 hover:underline" href={`/orders/${order.id}`}>{order.orderNumber}</Link>
                      <p className="truncate text-sm text-[var(--muted-foreground)]">{order.customer.name} / {order.customer.primaryPhone}</p>
                    </div>
                    <strong className="shrink-0 text-sm">{asCurrency(Number(order.remainingBalance))}</strong>
                  </div>
                  <p className="line-clamp-2 text-sm">{order.items.map((item) => `${item.productNameSnapshot} x${item.quantity}`).join(", ")}</p>
                  <div className="flex flex-wrap gap-2">
                    <OrderStageBadge stage={order.orderStage} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <span className="text-xs text-[var(--muted-foreground)]">{formatEnumLabel(order.deliveryMethod)}</span>
                  </div>
                  <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-3">
                    <StatusQuickActions orderId={order.id} currentStage={order.orderStage} compact />
                    <div className="flex gap-3 text-sm">
                      <Link className="font-medium text-[var(--primary)]" href={`/labels/${order.id}`}>Label</Link>
                      <Link className="font-medium text-[var(--primary)]" href={`/orders/${order.id}`}>Open order</Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="hidden lg:block">
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <thead>
                  <tr>
                    <Th>Order</Th><Th>Customer</Th><Th>Products</Th><Th>Total</Th><Th>Paid</Th><Th>Balance</Th><Th>Stage</Th><Th>Payment</Th><Th>Delivery</Th><Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((order) => (
                    <tr key={order.id} className="hover:bg-[var(--surface-subtle)]">
                      <Td><Link className="font-semibold underline-offset-2 hover:underline" href={`/orders/${order.id}`}>{order.orderNumber}</Link><p className="text-xs text-[var(--muted-foreground)]">{order.orderDate.toLocaleDateString()}</p></Td>
                      <Td>{order.customer.name}<p className="text-xs text-[var(--muted-foreground)]">{order.customer.primaryPhone}</p></Td>
                      <Td>{order.items.map((item) => `${item.productNameSnapshot} x${item.quantity}`).join(", ")}</Td>
                      <Td>{asCurrency(Number(order.totalPrice))}</Td>
                      <Td>{asCurrency(Number(order.amountPaid))}</Td>
                      <Td>{asCurrency(Number(order.remainingBalance))}</Td>
                      <Td><OrderStageBadge stage={order.orderStage} /></Td>
                      <Td><PaymentStatusBadge status={order.paymentStatus} /></Td>
                      <Td>{formatEnumLabel(order.deliveryMethod)}</Td>
                      <Td>
                        <div className="flex min-w-72 items-start gap-3">
                          <StatusQuickActions orderId={order.id} currentStage={order.orderStage} compact />
                          <div className="flex gap-2 pt-1">
                            <Link className="text-sm font-medium text-[var(--primary)]" href={`/labels/${order.id}`}>Label</Link>
                            <Link className="text-sm font-medium text-[var(--primary)]" href={`/orders/${order.id}`}>Open</Link>
                          </div>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
      <p className="text-sm text-[var(--muted-foreground)]">Showing {result.pagination.pageSize} per page. Total: {result.pagination.total}</p>
    </div>
  );
}
