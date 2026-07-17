import Link from "next/link";
import { listOrders } from "@/lib/order-service";
import { orderQuerySchema } from "@/lib/validation";
import { asCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, Td, Th } from "@/components/ui/table";

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
      <form className="grid gap-2 rounded-lg border border-[var(--border)] bg-white p-3 md:grid-cols-[1fr_180px_180px_120px]">
        <input name="search" defaultValue={query.search} className="h-11 rounded-md border border-[var(--border)] px-3 text-sm" placeholder="Search orders..." />
        <select name="orderStage" defaultValue={query.orderStage ?? ""} className="h-11 rounded-md border border-[var(--border)] px-3 text-sm">
          <option value="">All stages</option>
          {["NEW", "CONFIRMED", "DESIGN_PENDING", "IN_PRODUCTION", "READY_TO_PACK", "PACKED", "PICKUP_READY", "SHIPPED", "DELIVERED", "CANCELLED"].map((stage) => <option key={stage} value={stage}>{stage}</option>)}
        </select>
        <select name="paymentStatus" defaultValue={query.paymentStatus ?? ""} className="h-11 rounded-md border border-[var(--border)] px-3 text-sm">
          <option value="">All payments</option>
          {["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      {result.data.length === 0 ? (
        <EmptyState title="No orders found" body="Create a new order or relax the current filters." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead>
                <tr>
                  <Th>Order</Th><Th>Customer</Th><Th>Products</Th><Th>Total</Th><Th>Paid</Th><Th>Balance</Th><Th>Stage</Th><Th>Payment</Th><Th>Delivery</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((order) => (
                  <tr key={order.id}>
                    <Td><Link className="font-semibold underline-offset-2 hover:underline" href={`/orders/${order.id}`}>{order.orderNumber}</Link><p className="text-xs text-[var(--muted-foreground)]">{order.orderDate.toLocaleDateString()}</p></Td>
                    <Td>{order.customer.name}<p className="text-xs text-[var(--muted-foreground)]">{order.customer.primaryPhone}</p></Td>
                    <Td>{order.items.map((item) => `${item.productNameSnapshot} x${item.quantity}`).join(", ")}</Td>
                    <Td>{asCurrency(Number(order.totalPrice))}</Td>
                    <Td>{asCurrency(Number(order.amountPaid))}</Td>
                    <Td>{asCurrency(Number(order.remainingBalance))}</Td>
                    <Td><Badge>{order.orderStage}</Badge></Td>
                    <Td><Badge>{order.paymentStatus}</Badge></Td>
                    <Td>{order.deliveryMethod}</Td>
                    <Td className="space-x-2">
                      <Link className="text-sm font-medium text-[var(--primary)]" href={`/labels/${order.id}`}>Label</Link>
                      <Link className="text-sm font-medium text-[var(--primary)]" href={`/orders/${order.id}`}>Open</Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}
      <p className="text-sm text-[var(--muted-foreground)]">Showing {result.pagination.pageSize} per page. Total: {result.pagination.total}</p>
    </div>
  );
}
