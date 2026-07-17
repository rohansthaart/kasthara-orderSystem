import { handleRouteError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildOrdersWorkbook } from "@/lib/excel-service";

export async function GET() {
  try {
    await requireRole(["ADMIN", "STAFF"]);
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        bookedBy: true,
        items: true,
        payments: { include: { receivedBy: true } },
      },
      orderBy: { orderDate: "desc" },
      take: 1000,
    });
    const rows = orders.map((order) => ({
      orderNumber: order.orderNumber,
      orderDate: order.orderDate.toISOString(),
      customerName: order.customer.name,
      phone: order.customer.primaryPhone,
      bookedBy: order.bookedBy.name,
      advancePaid: order.payments.filter((p) => p.paymentType === "ADVANCE").reduce((sum, p) => sum + Number(p.amount), 0),
      additionalPayments: order.payments.filter((p) => p.paymentType === "ADDITIONAL").reduce((sum, p) => sum + Number(p.amount), 0),
      amountPaid: Number(order.amountPaid),
      finalPaymentReceivedBy: order.payments.find((p) => p.paymentType === "FINAL_PAYMENT")?.receivedBy.name ?? "",
      totalPrice: Number(order.totalPrice),
      remainingBalance: Number(order.remainingBalance),
      productType: order.items.map((item) => item.productType).join(", "),
      orderStage: order.orderStage,
      paymentStatus: order.paymentStatus,
      deliveryMethod: order.deliveryMethod,
      deliveryAddress: order.deliveryAddress ?? order.pickupLocation ?? "",
      specialNotes: order.specialNotes ?? "",
    }));
    const buffer = await buildOrdersWorkbook(rows);
    return new Response(buffer, {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": "attachment; filename=kasthara-orders.xlsx",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
