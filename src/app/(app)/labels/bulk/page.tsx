import QRCode from "qrcode";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { customerPhoneQrValue } from "@/lib/qr";
import { mmToDots, normaliseLabelSettings, qrSizeMm } from "@/lib/label-settings";
import { Button } from "@/components/ui/button";
import { OrderLabel } from "@/components/order-label";
import { BulkLabelActions } from "./bulk-label-actions";

export default async function BulkLabelsPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const user = await getCurrentUser();
  if (!user) notFound();
  const { ids } = await searchParams;
  const selectedIds = [...new Set((ids ?? "").split(",").filter(Boolean))].slice(0, 100);
  if (!selectedIds.length) notFound();
  const [orders, storedSettings] = await Promise.all([
    prisma.order.findMany({ where: { id: { in: selectedIds } }, include: { customer: true, items: true }, orderBy: { orderDate: "asc" } }),
    prisma.labelSetting.findFirst({ where: { isDefault: true } }),
  ]);
  if (!orders.length) notFound();
  const settings = normaliseLabelSettings(storedSettings);
  const labels = await Promise.all(orders.map(async (order) => {
    const contactQr = await QRCode.toDataURL(customerPhoneQrValue(order.customer.primaryPhone), {
      errorCorrectionLevel: "M",
      margin: 1,
      width: mmToDots(qrSizeMm(settings), settings.dpi),
      color: { dark: "#000000", light: "#ffffff" },
    });
    return { order, contactQr };
  }));

  return (
    <div className="label-print-page mx-auto max-w-5xl space-y-4">
      <style>{`@media print { @page { size: ${settings.widthMm}mm ${settings.heightMm}mm; margin: 0; } }`}</style>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{labels.length} label{labels.length === 1 ? "" : "s"} ready</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{settings.widthMm} × {settings.heightMm} mm · {settings.dpi} DPI · direct-call QR</p>
        </div>
        <div className="flex gap-2"><Button asChild variant="secondary"><Link href="/orders">Back to orders</Link></Button><BulkLabelActions widthMm={settings.widthMm} heightMm={settings.heightMm} dpi={settings.dpi} /></div>
      </div>
      <div className="bulk-label-grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${settings.widthMm}mm, 1fr))` }}>
        {labels.map(({ order, contactQr }) => (
          <OrderLabel
            key={order.id}
            settings={settings}
            contactQr={contactQr}
            orderNumber={order.orderNumber}
            customerName={order.customer.name}
            phone={order.customer.primaryPhone}
            balance={Number(order.remainingBalance)}
            productSummary={order.items.map((item) => `${item.productNameSnapshot} x${item.quantity}`).join(", ")}
            deliveryMethod={order.deliveryMethod}
            deliveryLocation={order.deliveryAddress ?? order.pickupLocation ?? ""}
            requiredDeliveryAt={order.requiredDeliveryAt}
            specialNotes={order.specialNotes}
          />
        ))}
      </div>
    </div>
  );
}
