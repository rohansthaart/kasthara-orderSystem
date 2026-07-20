import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/order-service";
import { customerPhoneQrValue } from "@/lib/qr";
import { prisma } from "@/lib/prisma";
import { mmToDots, normaliseLabelSettings, qrSizeMm } from "@/lib/label-settings";
import { Button } from "@/components/ui/button";
import { OrderLabel } from "@/components/order-label";
import { PrintLogger } from "./print-logger";

export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, storedSettings] = await Promise.all([
    getOrderById(id),
    prisma.labelSetting.findFirst({ where: { isDefault: true } }),
  ]);
  if (!order) notFound();
  const settings = normaliseLabelSettings(storedSettings);
  const contactQr = await QRCode.toDataURL(customerPhoneQrValue(order.customer.primaryPhone), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: mmToDots(qrSizeMm(settings), settings.dpi),
    color: { dark: "#000000", light: "#ffffff" },
  });
  const productSummary = order.items.map((item) => `${item.productNameSnapshot} x${item.quantity}`).join(", ");
  return (
    <div className="label-print-page mx-auto max-w-3xl space-y-4">
      <style>{`@media print { @page { size: ${settings.widthMm}mm ${settings.heightMm}mm; margin: 0; } }`}</style>
      <div className="no-print flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Label preview</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{settings.widthMm} × {settings.heightMm} mm · {settings.dpi} DPI · one-tap customer call</p>
        </div>
        <PrintLogger orderId={order.id} />
      </div>
      <div className="label-preview-frame flex justify-center overflow-auto rounded-lg border border-[var(--border)] bg-white p-6 print:overflow-visible print:border-0 print:p-0">
        <OrderLabel
          settings={settings}
          contactQr={contactQr}
          orderNumber={order.orderNumber}
          customerName={order.customer.name}
          phone={order.customer.primaryPhone}
          balance={Number(order.remainingBalance)}
          productSummary={productSummary}
          deliveryMethod={order.deliveryMethod}
          deliveryLocation={order.deliveryAddress ?? order.pickupLocation ?? ""}
          requiredDeliveryAt={order.requiredDeliveryAt}
          specialNotes={order.specialNotes}
        />
      </div>
      <div className="no-print flex justify-center">
        <Button variant="secondary" asChild><a href={`/orders/${order.id}`}>Back to order</a></Button>
      </div>
    </div>
  );
}
