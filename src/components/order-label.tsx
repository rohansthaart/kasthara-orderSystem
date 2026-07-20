import type { CSSProperties } from "react";
import { asCurrency } from "@/lib/utils";
import { qrSizeMm, responsiveLabelFontSize, type LabelSettings } from "@/lib/label-settings";

type OrderLabelProps = {
  settings: LabelSettings;
  contactQr: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  balance: number;
  productSummary: string;
  deliveryMethod: string;
  deliveryLocation: string;
  requiredDeliveryAt?: Date | null;
  specialNotes?: string | null;
};

export function OrderLabel({ settings, contactQr, orderNumber, customerName, phone, balance, productSummary, deliveryMethod, deliveryLocation, requiredDeliveryAt, specialNotes }: OrderLabelProps) {
  const qrMm = qrSizeMm(settings);
  const meta = [
    settings.showRequiredAt && requiredDeliveryAt ? `Due ${formatLabelDate(requiredDeliveryAt)}` : undefined,
    settings.showNotes && specialNotes ? `Note: ${specialNotes}` : undefined,
  ].filter(Boolean).join(" · ");
  const style: CSSProperties = {
    width: `${settings.widthMm}mm`,
    height: `${settings.heightMm}mm`,
    padding: `${settings.marginMm}mm`,
    fontSize: `${responsiveLabelFontSize(settings)}px`,
    lineHeight: 1.1,
  };

  return (
    <section className="label-sheet relative box-border block overflow-hidden bg-white font-sans text-black" style={style} aria-label={`Label for ${orderNumber}`}>
      <div className="flex min-w-0 items-start justify-between gap-[1mm]">
        <div className="min-w-0 flex-1 space-y-[0.2em]">
          <p className="text-[0.85em] font-bold leading-none tracking-[0.04em]">KASTHARA</p>
          <p className="truncate text-[0.8em] font-semibold leading-tight">{orderNumber}</p>
          <p className="truncate pt-[0.25em] text-[1.05em] font-bold leading-tight">{customerName}</p>
          <p className="truncate text-[1.05em] font-bold leading-tight tabular-nums">{phone}</p>
          {settings.showBalance ? <p className="truncate text-[0.85em] font-bold leading-tight">Balance: {asCurrency(balance)}</p> : null}
        </div>
        <div className="shrink-0 text-center" style={{ width: `${qrMm}mm` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={contactQr} alt="Scan to call customer" className="block w-full" style={{ width: `${qrMm}mm`, height: `${qrMm}mm` }} />
          <p className="mt-[0.2mm] whitespace-nowrap text-[0.62em] font-bold leading-none">SCAN TO CALL</p>
        </div>
      </div>

      <div className="mt-[0.5em] space-y-[0.15em] overflow-hidden border-t border-black pt-[0.35em] text-[0.8em] leading-tight">
        <p className="truncate font-semibold">{productSummary}</p>
        {settings.showAddress ? <p className="truncate"><span className="font-semibold">{formatMethod(deliveryMethod)}</span> {deliveryLocation}</p> : null}
        {meta ? <p className="truncate text-[0.9em] font-semibold">{meta}</p> : null}
      </div>
    </section>
  );
}

function formatLabelDate(value: Date) {
  return value.toLocaleString("en-NP", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatMethod(value: string) {
  return `${value.charAt(0)}${value.slice(1).toLowerCase()}:`;
}
