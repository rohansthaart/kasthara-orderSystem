export function orderQrValue(orderNumber: string) {
  return `KASORDER:${orderNumber}`;
}

export function parseOrderQrValue(value: string) {
  return value.startsWith("KASORDER:") ? value.replace("KASORDER:", "") : null;
}
