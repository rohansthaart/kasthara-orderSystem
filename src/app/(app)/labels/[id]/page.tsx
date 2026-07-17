import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/order-service";
import { orderQrValue } from "@/lib/qr";
import { asCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PrintLogger } from "./print-logger";

export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();
  const qr = await QRCode.toDataURL(orderQrValue(order.orderNumber), { margin: 1, width: 120 });
  const productSummary = order.items.map((item) => `${item.productNameSnapshot} x${item.quantity}`).join(", ");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Label preview</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Optimized for 60 mm x 40 mm thermal labels at 203 DPI.</p>
        </div>
        <PrintLogger orderId={order.id} />
      </div>
      <div className="flex justify-center rounded-lg border border-[var(--border)] bg-white p-6 print:border-0 print:p-0">
        <section className="label-sheet relative bg-white text-black" style={{ width: "60mm", height: "40mm", padding: "2mm" }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold leading-none">Kasthara</p>
              <p className="text-[8px] leading-tight">{order.orderNumber}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Order QR code" className="h-[18mm] w-[18mm]" />
          </div>
          <div className="mt-1 space-y-[1px] text-[8px] leading-tight">
            <p className="font-bold">{order.customer.name}</p>
            <p>{order.customer.primaryPhone}</p>
            <p>Balance: {asCurrency(Number(order.remainingBalance))}</p>
            <p className="line-clamp-2">{productSummary}</p>
            <p>{order.deliveryMethod}: {order.deliveryAddress ?? order.pickupLocation ?? ""}</p>
            {order.requiredDeliveryAt ? <p>Need by: {order.requiredDeliveryAt.toLocaleString()}</p> : null}
            {order.specialNotes ? <p className="font-semibold">Note: {order.specialNotes.slice(0, 56)}</p> : null}
          </div>
        </section>
      </div>
      <div className="no-print flex justify-center">
        <Button variant="secondary" asChild><a href={`/orders/${order.id}`}>Back to order</a></Button>
      </div>
    </div>
  );
}
