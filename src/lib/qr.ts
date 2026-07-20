import { normalizeNepalPhone } from "./phone";

export function orderQrValue(orderNumber: string) {
  return `KASORDER:${orderNumber}`;
}

export function parseOrderQrValue(value: string) {
  return value.startsWith("KASORDER:") ? value.replace("KASORDER:", "") : null;
}

export function customerPhoneQrValue(phone: string) {
  return `tel:+977${normalizeNepalPhone(phone)}`;
}
