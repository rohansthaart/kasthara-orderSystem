import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStageValue, PaymentStatusValue } from "@/lib/constants";

const stageTone: Partial<Record<OrderStageValue, string>> = {
  NEW: "border-blue-200 bg-blue-50 text-blue-800",
  CONFIRMED: "border-sky-200 bg-sky-50 text-sky-800",
  DESIGN_PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  DESIGN_SENT: "border-amber-200 bg-amber-50 text-amber-800",
  DESIGN_APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  IN_PRODUCTION: "border-indigo-200 bg-indigo-50 text-indigo-800",
  READY_TO_PACK: "border-violet-200 bg-violet-50 text-violet-800",
  PACKED: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
  PICKUP_READY: "border-cyan-200 bg-cyan-50 text-cyan-800",
  SHIPPED: "border-teal-200 bg-teal-50 text-teal-800",
  DELIVERED: "border-green-200 bg-green-50 text-green-800",
  ON_HOLD: "border-stone-300 bg-stone-100 text-stone-800",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
  RETURNED: "border-orange-200 bg-orange-50 text-orange-800",
};

const paymentTone: Record<PaymentStatusValue, string> = {
  UNPAID: "border-red-200 bg-red-50 text-red-800",
  PARTIALLY_PAID: "border-amber-200 bg-amber-50 text-amber-800",
  PAID: "border-green-200 bg-green-50 text-green-800",
  REFUNDED: "border-slate-300 bg-slate-100 text-slate-800",
};

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function OrderStageBadge({ stage, className }: { stage: OrderStageValue | string; className?: string }) {
  return <Badge className={cn(stageTone[stage as OrderStageValue] ?? "", className)}>{formatEnumLabel(stage)}</Badge>;
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatusValue | string; className?: string }) {
  return <Badge className={cn(paymentTone[status as PaymentStatusValue] ?? "", className)}>{formatEnumLabel(status)}</Badge>;
}
