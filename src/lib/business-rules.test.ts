import { describe, expect, it } from "vitest";
import { buildOrderNumber } from "./order-number";
import { normalizeNepalPhone } from "./phone";
import { calculateAmountPaid, calculatePaymentStatus, calculateRemainingBalance, calculateTotalPrice } from "./payments";
import { customerPhoneQrValue, orderQrValue, parseOrderQrValue } from "./qr";
import { mmToDots, normaliseLabelSettings } from "./label-settings";
import { mapLegacyStage, previewImport } from "./excel-service";
import ExcelJS from "exceljs";

describe("Kasthara business rules", () => {
  it("generates readable order numbers", () => {
    expect(buildOrderNumber(new Date("2026-07-14T10:15:00+05:45"), 12)).toBe("KAS-260714-012");
  });

  it("normalizes Nepal phone numbers", () => {
    expect(normalizeNepalPhone("+977 980-123-4567")).toBe("9801234567");
    expect(normalizeNepalPhone("9779701234567")).toBe("9701234567");
  });

  it("calculates total, paid amount, balance, and payment status", () => {
    const total = calculateTotalPrice({ subtotal: 1500, discount: 100, deliveryCharge: 150 });
    const paid = calculateAmountPaid([{ amount: 500, paymentType: "ADVANCE" }, { amount: 200, paymentType: "ADDITIONAL" }]);
    expect(total).toBe(1550);
    expect(paid).toBe(700);
    expect(calculateRemainingBalance(total, paid)).toBe(850);
    expect(calculatePaymentStatus({ totalPrice: total, amountPaid: paid })).toBe("PARTIALLY_PAID");
    expect(calculatePaymentStatus({ totalPrice: total, amountPaid: 0 })).toBe("UNPAID");
    expect(calculatePaymentStatus({ totalPrice: total, amountPaid: 1550 })).toBe("PAID");
    expect(calculatePaymentStatus({ totalPrice: 0, amountPaid: 0 })).toBe("PAID");
  });

  it("keeps QR values free from customer personal information", () => {
    const value = orderQrValue("KAS-260714-012");
    expect(value).toBe("KASORDER:KAS-260714-012");
    expect(parseOrderQrValue(value)).toBe("KAS-260714-012");
    expect(value).not.toContain("980");
  });

  it("creates a compact direct-call QR value for delivery", () => {
    expect(customerPhoneQrValue("+977 980-123-4567")).toBe("tel:+9779801234567");
  });

  it("converts saved label dimensions to printer dots", () => {
    expect(mmToDots(48, 203)).toBe(384);
    expect(mmToDots(30, 203)).toBe(240);
    expect(normaliseLabelSettings({ widthMm: 60, heightMm: 40, dpi: 300 })).toMatchObject({ widthMm: 60, heightMm: 40, dpi: 300 });
  });

  it("maps legacy statuses", () => {
    expect(mapLegacyStage("Production")).toBe("IN_PRODUCTION");
    expect(mapLegacyStage("delivered")).toBe("DELIVERED");
  });

  it("validates Excel import rows", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Orders");
    sheet.addRow(["Order ID", "Customer Name", "Phone Number", "Total Price (NPR)", "Order Status"]);
    sheet.addRow(["OLD-1", "Mina", "+977 9801234567", "1200", "Packed"]);
    sheet.addRow(["OLD-1", "", "123", "", "Mystery"]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const preview = await previewImport(buffer);
    expect(preview[0].errors).toEqual([]);
    expect(preview[1].errors.length).toBeGreaterThan(0);
  });
});
