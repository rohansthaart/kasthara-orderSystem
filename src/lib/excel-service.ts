import ExcelJS from "exceljs";
import { ORDER_STAGES, PAYMENT_STATUSES } from "./constants";
import { sanitizeForSpreadsheet } from "./utils";
import { normalizeNepalPhone, isValidNepalPhone } from "./phone";

export type ImportPreviewRow = {
  rowNumber: number;
  data: Record<string, string | number | undefined>;
  errors: string[];
  warnings: string[];
};

const columns = [
  "Order ID",
  "Customer Name",
  "Phone Number",
  "Booking Received By",
  "Remaining Payment Received By",
  "Advance Paid (NPR)",
  "Additional Payment (NPR)",
  "Total Price (NPR)",
  "Remaining Balance (NPR)",
  "Product Type",
  "Special Notes",
  "Order Status",
  "Delivery Method",
  "Delivery Address / Pickup Location",
  "Production / Shipping Status",
  "Payment Status",
  "Follow-up / Delivery Time",
];

export async function previewImport(buffer: Buffer): Promise<ImportPreviewRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  const seenOrders = new Set<string>();
  const seenPhones = new Set<string>();
  const header = sheet.getRow(1).values as Array<string>;
  const headerIndexes = new Map<string, number>();
  header.forEach((value, index) => {
    if (typeof value === "string") headerIndexes.set(value.trim(), index);
  });

  const rows: ImportPreviewRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const data: Record<string, string | number | undefined> = {};
    const errors: string[] = [];
    const warnings: string[] = [];
    for (const column of columns) {
      const index = headerIndexes.get(column);
      const value = index ? row.getCell(index).value : undefined;
      data[column] = normalizeCell(value);
    }
    const orderId = String(data["Order ID"] ?? "").trim();
    const phone = String(data["Phone Number"] ?? "").trim();
    const normalizedPhone = normalizeNepalPhone(phone);
    if (!orderId) errors.push("Order ID is required");
    if (orderId && seenOrders.has(orderId)) errors.push("Duplicate order ID in file");
    if (!data["Customer Name"]) errors.push("Customer Name is required");
    if (!isValidNepalPhone(phone)) errors.push("Phone Number must be a valid Nepal mobile number");
    if (normalizedPhone && seenPhones.has(normalizedPhone)) warnings.push("Duplicate phone number in file");
    if (!data["Total Price (NPR)"]) errors.push("Total Price is required");
    if (!mapLegacyStage(String(data["Order Status"] ?? data["Production / Shipping Status"] ?? ""))) {
      warnings.push("Unknown status will import as NEW");
    }
    if (orderId) seenOrders.add(orderId);
    if (normalizedPhone) seenPhones.add(normalizedPhone);
    rows.push({ rowNumber, data, errors, warnings });
  });
  return rows;
}

export function mapLegacyStage(value: string) {
  const normalized = value.toUpperCase().replace(/[\s-]+/g, "_");
  if ((ORDER_STAGES as readonly string[]).includes(normalized)) return normalized;
  if (normalized.includes("PACK")) return "PACKED";
  if (normalized.includes("SHIP")) return "SHIPPED";
  if (normalized.includes("DELIVER")) return "DELIVERED";
  if (normalized.includes("DESIGN")) return "DESIGN_PENDING";
  if (normalized.includes("PRODUCTION")) return "IN_PRODUCTION";
  if (normalized.includes("CANCEL")) return "CANCELLED";
  if (!value) return "NEW";
  return null;
}

export function mapLegacyPaymentStatus(value: string) {
  const normalized = value.toUpperCase().replace(/[\s-]+/g, "_");
  if ((PAYMENT_STATUSES as readonly string[]).includes(normalized)) return normalized;
  if (normalized.includes("PART")) return "PARTIALLY_PAID";
  if (normalized.includes("PAID")) return "PAID";
  return "UNPAID";
}

export async function buildOrdersWorkbook(orders: Array<Record<string, unknown>>) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kasthara Order System";
  const sheet = workbook.addWorksheet("Orders");
  sheet.columns = [
    { header: "Order Number", key: "orderNumber", width: 18 },
    { header: "Order Date", key: "orderDate", width: 18 },
    { header: "Customer Name", key: "customerName", width: 24 },
    { header: "Phone Number", key: "phone", width: 16 },
    { header: "Booking Received By", key: "bookedBy", width: 22 },
    { header: "Advance Paid", key: "advancePaid", width: 14 },
    { header: "Additional Payments", key: "additionalPayments", width: 18 },
    { header: "Total Paid", key: "amountPaid", width: 14 },
    { header: "Final Payment Received By", key: "finalPaymentReceivedBy", width: 24 },
    { header: "Total Price", key: "totalPrice", width: 14 },
    { header: "Remaining Balance", key: "remainingBalance", width: 18 },
    { header: "Product Type", key: "productType", width: 22 },
    { header: "Order Stage", key: "orderStage", width: 18 },
    { header: "Payment Status", key: "paymentStatus", width: 18 },
    { header: "Delivery Method", key: "deliveryMethod", width: 16 },
    { header: "Delivery Address / Pickup Location", key: "deliveryAddress", width: 36 },
    { header: "Special Notes", key: "specialNotes", width: 36 },
  ];
  orders.forEach((order) => sheet.addRow(safeExportRow(order)));
  sheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}

function safeExportRow(order: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(order).map(([key, value]) => [key, sanitizeForSpreadsheet(value)]));
}

function normalizeCell(value: ExcelJS.CellValue) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object" && "text" in value) return value.text;
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}
