export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE ?? "Asia/Kathmandu";
export const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY ?? "NPR";

export const ORDER_STAGES = [
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
] as const;

export const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"] as const;
export const PAYMENT_TYPES = [
  "ADVANCE",
  "ADDITIONAL",
  "FINAL_PAYMENT",
  "DELIVERY_COLLECTION",
  "REFUND",
  "ADJUSTMENT",
] as const;
export const PAYMENT_METHODS = [
  "CASH",
  "ESEWA",
  "KHALTI",
  "FONEPAY",
  "BANK_TRANSFER",
  "COD",
  "OTHER",
] as const;
export const DELIVERY_METHODS = ["PICKUP", "DELIVERY", "COURIER"] as const;

export type OrderStageValue = (typeof ORDER_STAGES)[number];
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];
export type PaymentTypeValue = (typeof PAYMENT_TYPES)[number];
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];
export type DeliveryMethodValue = (typeof DELIVERY_METHODS)[number];
