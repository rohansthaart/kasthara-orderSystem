import { z } from "zod";
import { handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeNepalPhone } from "@/lib/phone";
import { getNextOrderNumber } from "@/lib/order-service";
import { calculateAmountPaid, calculatePaymentStatus, calculateRemainingBalance } from "@/lib/payments";
import { mapLegacyPaymentStatus, mapLegacyStage } from "@/lib/excel-service";
import type { OrderStageValue, PaymentStatusValue } from "@/lib/constants";

const rowSchema = z.object({
  rowNumber: z.number(),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.undefined()])),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

const schema = z.object({ rows: z.array(rowSchema) });

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN"]);
    const body = schema.parse(await request.json());
    const validRows = body.rows.filter((row) => row.errors.length === 0);
    const imported = [];
    for (const row of validRows) {
      const data = row.data;
      const legacyOrderId = String(data["Order ID"] ?? "").trim();
      const phone = String(data["Phone Number"] ?? "");
      const normalizedPhone = normalizeNepalPhone(phone);
      const totalPrice = Number(data["Total Price (NPR)"] ?? 0);
      const advance = Number(data["Advance Paid (NPR)"] ?? 0);
      const additional = Number(data["Additional Payment (NPR)"] ?? 0);
      const payments = [
        advance > 0 ? { amount: advance, paymentType: "ADVANCE" as const } : null,
        additional > 0 ? { amount: additional, paymentType: "ADDITIONAL" as const } : null,
      ].filter((item): item is { amount: number; paymentType: "ADVANCE" | "ADDITIONAL" } => Boolean(item));
      const amountPaid = calculateAmountPaid(payments);
      const remainingBalance = calculateRemainingBalance(totalPrice, amountPaid);
      const legacyStatus = mapLegacyPaymentStatus(String(data["Payment Status"] ?? ""));
      const paymentStatus: PaymentStatusValue =
        legacyStatus === "UNPAID" && amountPaid > 0 ? calculatePaymentStatus({ totalPrice, amountPaid }) : (legacyStatus as PaymentStatusValue);
      const orderStage = (mapLegacyStage(String(data["Order Status"] ?? data["Production / Shipping Status"] ?? "")) ?? "NEW") as OrderStageValue;
      const customer = await prisma.customer.upsert({
        where: { normalizedPhone },
        create: {
          name: String(data["Customer Name"] ?? "Unknown Customer"),
          primaryPhone: phone,
          normalizedPhone,
        },
        update: {
          name: String(data["Customer Name"] ?? "Unknown Customer"),
          primaryPhone: phone,
        },
      });
      const order = await prisma.order.upsert({
        where: { legacyOrderId },
        update: {},
        create: {
          legacyOrderId,
          orderNumber: await getNextOrderNumber(),
          customerId: customer.id,
          quantity: 1,
          subtotal: totalPrice,
          totalPrice,
          amountPaid,
          remainingBalance,
          paymentStatus,
          orderStage,
          deliveryMethod: String(data["Delivery Method"] ?? "").toUpperCase().includes("PICK") ? "PICKUP" : "DELIVERY",
          deliveryAddress: String(data["Delivery Address / Pickup Location"] ?? ""),
          specialNotes: String(data["Special Notes"] ?? ""),
          bookedByUserId: user.id,
          items: {
            create: {
              productNameSnapshot: String(data["Product Type"] ?? "Imported product"),
              productType: String(data["Product Type"] ?? "IMPORTED"),
              quantity: 1,
              unitPrice: totalPrice,
              lineTotal: totalPrice,
            },
          },
          payments: {
            create: payments.map((payment) => ({
              amount: payment.amount,
              paymentType: payment.paymentType,
              paymentMethod: "OTHER",
              receivedByUserId: user.id,
              notes: "Imported from legacy Excel",
            })),
          },
          statusHistory: {
            create: { newStatus: orderStage, changedByUserId: user.id, notes: "Imported from legacy Excel" },
          },
          auditLogs: {
            create: {
              userId: user.id,
              entityType: "Order",
              entityId: legacyOrderId,
              action: "IMPORT",
              newData: data,
            },
          },
        },
      });
      imported.push(order.orderNumber);
    }
    return ok({ count: imported.length, orderNumbers: imported }, "Valid rows imported successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
