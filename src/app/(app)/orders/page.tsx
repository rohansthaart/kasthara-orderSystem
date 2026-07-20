import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  PackageOpen,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderBulkLabels } from "@/components/order-bulk-labels";
import { StatusQuickActions } from "@/components/status-quick-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { OrderStageBadge, PaymentStatusBadge, formatEnumLabel } from "@/components/ui/status-badge";
import { Table, Td, Th } from "@/components/ui/table";
import { listOrders } from "@/lib/order-service";
import { asCurrency } from "@/lib/utils";
import { orderQuerySchema } from "@/lib/validation";

type OrdersSearchParams = Record<string, string | undefined>;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<OrdersSearchParams> }) {
  const params = await searchParams;
  const query = orderQuerySchema.parse(params);
  const result = await listOrders(query);
  if (result.pagination.total > 0 && query.page > result.pagination.pageCount) {
    redirect(buildOrdersHref(params, result.pagination.pageCount));
  }
  const activeFilterCount = [query.search, query.orderStage, query.paymentStatus].filter(Boolean).length;
  const firstResult = result.pagination.total === 0 ? 0 : (result.pagination.page - 1) * result.pagination.pageSize + 1;
  const lastResult = Math.min(result.pagination.page * result.pagination.pageSize, result.pagination.total);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)]">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            Order operations
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Find and move orders.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
            Search customers, check payment exposure, and move production forward from one view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" className="rounded-xl">
            <a href="/api/v1/export/orders">
              <Download className="h-4 w-4" />
              Export XLSX
            </a>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/orders/new">
              <Plus className="h-4 w-4" />
              New order
            </Link>
          </Button>
        </div>
      </header>

      <section aria-label="Order filters" className="rounded-[1.5rem] bg-[var(--surface)] p-3 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)] sm:p-4">
        <form className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_130px_auto]">
          <label className="relative block">
            <span className="sr-only">Search orders</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              name="search"
              defaultValue={query.search}
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] pl-10 pr-3 text-sm transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Order, customer, phone, or address"
            />
          </label>
          <label>
            <span className="sr-only">Order stage</span>
            <Select name="orderStage" defaultValue={query.orderStage ?? ""} className="rounded-xl bg-[var(--surface-subtle)]">
              <option value="">All stages</option>
              {[
                "NEW",
                "CONFIRMED",
                "DESIGN_PENDING",
                "DESIGN_SENT",
                "DESIGN_APPROVED",
                "IN_PRODUCTION",
                "READY_TO_PACK",
                "PACKED",
                "PICKUP_READY",
                "SHIPPED",
                "DELIVERED",
                "ON_HOLD",
                "CANCELLED",
                "RETURNED",
              ].map((stage) => (
                <option key={stage} value={stage}>{formatEnumLabel(stage)}</option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">Payment status</span>
            <Select name="paymentStatus" defaultValue={query.paymentStatus ?? ""} className="rounded-xl bg-[var(--surface-subtle)]">
              <option value="">All payments</option>
              {["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"].map((status) => (
                <option key={status} value={status}>{formatEnumLabel(status)}</option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">Sort orders by</span>
            <Select name="sortBy" defaultValue={query.sortBy} className="rounded-xl bg-[var(--surface-subtle)]">
              <option value="orderDate">Newest orders</option>
              <option value="requiredDeliveryAt">Delivery date</option>
              <option value="totalPrice">Order value</option>
              <option value="remainingBalance">Balance due</option>
            </Select>
          </label>
          <label>
            <span className="sr-only">Sort direction</span>
            <Select name="sortDir" defaultValue={query.sortDir} className="rounded-xl bg-[var(--surface-subtle)]">
              <option value="desc">High to low</option>
              <option value="asc">Low to high</option>
            </Select>
          </label>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" className="flex-1 rounded-xl">
              <Filter className="h-4 w-4" />
              Apply
            </Button>
            {activeFilterCount > 0 ? (
              <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-xl" title="Clear filters">
                <Link href="/orders" aria-label="Clear filters"><X className="h-4 w-4" /></Link>
              </Button>
            ) : null}
          </div>
        </form>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-[var(--muted-foreground)]">
          <p>{activeFilterCount ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}` : "Showing all active and historical orders"}</p>
          <p className="tabular-nums">{result.pagination.total} total</p>
        </div>
      </section>

      {result.data.length === 0 ? (
        <OrdersEmptyState filtered={activeFilterCount > 0} />
      ) : (
        <OrderBulkLabels>
          <div className="space-y-3 lg:hidden">
            {result.data.map((order) => (
              <article key={order.id} className="rounded-[1.25rem] bg-[var(--surface)] p-4 shadow-[0_14px_40px_-32px_rgba(41,62,43,0.55)]">
                <div className="flex items-start gap-3">
                  <input
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                    type="checkbox"
                    name="orderId"
                    value={order.id}
                    aria-label={`Select ${order.orderNumber}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link className="font-semibold tracking-[-0.01em] underline-offset-2 hover:underline" href={`/orders/${order.id}`}>{order.orderNumber}</Link>
                        <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]">{order.customer.name} · {order.customer.primaryPhone}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-[var(--muted-foreground)]">Balance</p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums">{asCurrency(Number(order.remainingBalance))}</p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-5">{order.items.map((item) => `${item.productNameSnapshot} ×${item.quantity}`).join(", ")}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <OrderStageBadge stage={order.orderStage} />
                      <PaymentStatusBadge status={order.paymentStatus} />
                      <span className="text-xs text-[var(--muted-foreground)]">{formatEnumLabel(order.deliveryMethod)}</span>
                    </div>
                    <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                      <StatusQuickActions orderId={order.id} currentStage={order.orderStage} compact />
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <Link className="font-medium text-[var(--primary)]" href={`/labels/${order.id}`}>Prepare label</Link>
                        <Link className="inline-flex items-center gap-1 font-medium text-[var(--primary)]" href={`/orders/${order.id}`}>
                          Open order <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Card className="hidden overflow-hidden rounded-[1.5rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)] lg:block">
            <CardContent className="max-h-[calc(100dvh-13rem)] overflow-auto p-0">
              <Table>
                <thead>
                  <tr>
                    <Th className="sticky top-0 z-10 w-12 bg-[var(--surface-subtle)]"><span className="sr-only">Select</span></Th>
                    <Th className="sticky top-0 z-10 min-w-56 bg-[var(--surface-subtle)]">Order and customer</Th>
                    <Th className="sticky top-0 z-10 min-w-48 bg-[var(--surface-subtle)]">Product</Th>
                    <Th className="sticky top-0 z-10 min-w-44 bg-[var(--surface-subtle)]">Financials</Th>
                    <Th className="sticky top-0 z-10 min-w-40 bg-[var(--surface-subtle)]">Status</Th>
                    <Th className="sticky top-0 z-10 min-w-72 bg-[var(--surface-subtle)]">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((order) => (
                    <tr key={order.id} className="group transition-colors hover:bg-[var(--surface-subtle)]">
                      <Td>
                        <input className="h-4 w-4 accent-[var(--primary)]" type="checkbox" name="orderId" value={order.id} aria-label={`Select ${order.orderNumber}`} />
                      </Td>
                      <Td>
                        <Link className="font-semibold tracking-[-0.01em] underline-offset-2 hover:text-[var(--primary)] hover:underline" href={`/orders/${order.id}`}>{order.orderNumber}</Link>
                        <p className="mt-1 font-medium">{order.customer.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{order.customer.primaryPhone} · {order.orderDate.toLocaleDateString()}</p>
                      </Td>
                      <Td>
                        <p className="line-clamp-2 max-w-72 leading-5">{order.items.map((item) => `${item.productNameSnapshot} ×${item.quantity}`).join(", ")}</p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatEnumLabel(order.deliveryMethod)}</p>
                      </Td>
                      <Td>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs tabular-nums">
                          <dt className="text-[var(--muted-foreground)]">Total</dt><dd className="text-right font-medium">{asCurrency(Number(order.totalPrice))}</dd>
                          <dt className="text-[var(--muted-foreground)]">Paid</dt><dd className="text-right font-medium text-[var(--success)]">{asCurrency(Number(order.amountPaid))}</dd>
                          <dt className="text-[var(--muted-foreground)]">Due</dt><dd className="text-right font-semibold">{asCurrency(Number(order.remainingBalance))}</dd>
                        </dl>
                      </Td>
                      <Td>
                        <div className="flex flex-col items-start gap-2">
                          <OrderStageBadge stage={order.orderStage} />
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                      </Td>
                      <Td>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                          <StatusQuickActions orderId={order.id} currentStage={order.orderStage} />
                          <div className="flex flex-col gap-2 pt-1 text-sm">
                            <Link className="font-medium text-[var(--primary)]" href={`/labels/${order.id}`}>Label</Link>
                            <Link className="font-medium text-[var(--primary)]" href={`/orders/${order.id}`}>Open</Link>
                          </div>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </OrderBulkLabels>
      )}

      {result.pagination.total > 0 ? (
        <nav aria-label="Order pagination" className="flex flex-col gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3 shadow-[0_14px_40px_-34px_rgba(41,62,43,0.45)] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            Showing <span className="font-medium tabular-nums text-[var(--foreground)]">{firstResult}–{lastResult}</span> of <span className="font-medium tabular-nums text-[var(--foreground)]">{result.pagination.total}</span>
          </p>
          <div className="flex items-center gap-2">
            {result.pagination.page > 1 ? (
              <Button asChild variant="secondary" size="sm" className="rounded-lg">
                <Link href={buildOrdersHref(params, result.pagination.page - 1)}><ChevronLeft className="h-4 w-4" />Previous</Link>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="rounded-lg" disabled><ChevronLeft className="h-4 w-4" />Previous</Button>
            )}
            <span className="min-w-20 text-center text-sm font-medium tabular-nums">{result.pagination.page} / {Math.max(1, result.pagination.pageCount)}</span>
            {result.pagination.page < result.pagination.pageCount ? (
              <Button asChild variant="secondary" size="sm" className="rounded-lg">
                <Link href={buildOrdersHref(params, result.pagination.page + 1)}>Next<ChevronRight className="h-4 w-4" /></Link>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="rounded-lg" disabled>Next<ChevronRight className="h-4 w-4" /></Button>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function OrdersEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-[1.75rem] bg-[var(--surface)] px-6 py-12 text-center shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--primary)]">
        <PackageOpen className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">{filtered ? "No matching orders" : "No orders yet"}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
        {filtered ? "Try a broader search or clear the current filters." : "Create the first order to start production and payment tracking."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {filtered ? <Button asChild variant="secondary"><Link href="/orders">Clear filters</Link></Button> : null}
        <Button asChild><Link href="/orders/new"><Plus className="h-4 w-4" />New order</Link></Button>
      </div>
    </section>
  );
}

function buildOrdersHref(params: OrdersSearchParams, page: number) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && key !== "page") next.set(key, value);
  }
  next.set("page", String(page));
  return `/orders?${next.toString()}`;
}
