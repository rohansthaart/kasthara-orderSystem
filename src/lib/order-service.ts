import { prisma } from "./prisma";
import { buildOrderNumber, dailySequenceKey } from "./order-number";
import { calculateAmountPaid, calculatePaymentStatus, calculateRemainingBalance, calculateTotalPrice, roundMoney } from "./payments";
import { normalizeNepalPhone, lastFourPhoneDigits } from "./phone";
import type { SessionUser } from "./auth";
import type { z } from "zod";
import type { orderCreateSchema, orderEditSchema, orderQuerySchema, paymentSchema, statusSchema } from "./validation";

type CreateOrderInput = z.infer<typeof orderCreateSchema>;
type OrderQueryInput = z.infer<typeof orderQuerySchema>;
type PaymentInput = z.infer<typeof paymentSchema>;
type StatusInput = z.infer<typeof statusSchema>;
type OrderEditInput = z.infer<typeof orderEditSchema>;

const ORDER_TRANSACTION_TIMEOUT_MS = 15_000;

export async function getNextOrderNumber(date = new Date()) {
  const dateKey = dailySequenceKey(date);
  const seq = await prisma.dailyOrderSequence.upsert({
    where: { dateKey },
    create: { dateKey, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return buildOrderNumber(date, seq.lastValue);
}

export async function createOrder(input: CreateOrderInput, user: SessionUser) {
  const orderDate = new Date();
  const normalizedPhone = normalizeNepalPhone(input.primaryPhone);
  const subtotal = roundMoney(
    input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );
  const totalPrice = calculateTotalPrice({
    subtotal,
    discount: input.discount,
    deliveryCharge: input.deliveryCharge,
  });
  const amountPaid = input.advancePayment > 0 ? input.advancePayment : 0;
  const advanceReceivedByUserId = input.advanceReceivedByUserId ?? user.id;
  const remainingBalance = calculateRemainingBalance(totalPrice, amountPaid);
  const paymentStatus = calculatePaymentStatus({ totalPrice, amountPaid });
  const quantity = input.items.reduce((sum, item) => sum + item.quantity, 0);

  const orderId = await prisma.$transaction(async (tx) => {
    const dateKey = dailySequenceKey(orderDate);
    const sequence = await tx.dailyOrderSequence.upsert({
      where: { dateKey },
      create: { dateKey, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
    });
    const orderNumber = buildOrderNumber(orderDate, sequence.lastValue);
    if (amountPaid > 0) {
      const receiver = await tx.user.findFirst({ where: { id: advanceReceivedByUserId, isActive: true }, select: { id: true } });
      if (!receiver) throw new Error("Select an active staff member who received the advance payment");
    }

    const customer = await tx.customer.upsert({
      where: { normalizedPhone },
      create: {
        name: input.customerName,
        primaryPhone: input.primaryPhone,
        normalizedPhone,
        alternativePhone: input.alternativePhone,
      },
      update: {
        name: input.customerName,
        primaryPhone: input.primaryPhone,
        alternativePhone: input.alternativePhone,
      },
    });

    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        orderDate,
        quantity,
        subtotal,
        discount: input.discount,
        deliveryCharge: input.deliveryCharge,
        totalPrice,
        amountPaid,
        remainingBalance,
        paymentStatus,
        deliveryMethod: input.deliveryMethod,
        deliveryAddress: input.deliveryAddress,
        pickupLocation: input.pickupLocation,
        requiredDeliveryAt: input.requiredDeliveryAt,
        followUpAt: input.followUpAt,
        specialNotes: input.specialNotes,
        sourceId: input.sourceId,
        bookedByUserId: user.id,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            productType: item.productType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: roundMoney(item.quantity * item.unitPrice),
            personalizationNotes: item.personalizationNotes,
          })),
        },
        payments:
          amountPaid > 0 && input.paymentMethod
            ? {
                create: {
                  amount: amountPaid,
                  paymentType: "ADVANCE",
                  paymentMethod: input.paymentMethod,
                  receivedByUserId: advanceReceivedByUserId,
                  paidAt: orderDate,
                },
              }
            : undefined,
        statusHistory: {
          create: {
            newStatus: "NEW",
            changedByUserId: user.id,
            notes: "Order created",
          },
        },
        auditLogs: {
          create: {
            userId: user.id,
            entityType: "Order",
            entityId: orderNumber,
            action: "CREATE",
            newData: { orderNumber, totalPrice, amountPaid },
          },
        },
      },
      select: { id: true },
    });
    return order.id;
  }, { timeout: ORDER_TRANSACTION_TIMEOUT_MS });

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) throw new Error("Order was created but could not be retrieved");
  return order;
}

export async function listOrders(query: OrderQueryInput) {
  const where: Record<string, unknown> = {};
  if (query.orderStage) where.orderStage = query.orderStage;
  if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
  if (query.deliveryMethod) where.deliveryMethod = query.deliveryMethod;
  if (query.staffId) where.bookedByUserId = query.staffId;
  if (query.dateFrom || query.dateTo) {
    where.orderDate = {
      gte: query.dateFrom,
      lte: query.dateTo,
    };
  }
  if (query.productId) {
    where.items = { some: { productId: query.productId } };
  }
  if (query.search) {
    const normalized = normalizeNepalPhone(query.search);
    const lastFour = lastFourPhoneDigits(query.search);
    where.OR = [
      { orderNumber: { contains: query.search, mode: "insensitive" } },
      { legacyOrderId: { contains: query.search, mode: "insensitive" } },
      { deliveryAddress: { contains: query.search, mode: "insensitive" } },
      { customer: { name: { contains: query.search, mode: "insensitive" } } },
      { customer: { normalizedPhone: { contains: normalized } } },
      lastFour.length === 4 ? { customer: { normalizedPhone: { endsWith: lastFour } } } : undefined,
    ].filter(Boolean);
  }
  const skip = (query.page - 1) * query.pageSize;
  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        customer: true,
        bookedBy: { select: { id: true, name: true } },
        source: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { [query.sortBy]: query.sortDir },
      skip,
      take: query.pageSize,
    }),
  ]);
  return {
    data: orders,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      pageCount: Math.ceil(total / query.pageSize),
    },
  };
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({ where: { id }, include: orderInclude });
}

export async function getOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
}

export async function addPayment(orderId: string, input: PaymentInput, user: SessionUser) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: true } });
    if (!order) throw new Error("Order not found");
    const receivedByUserId = input.receivedByUserId ?? user.id;
    const receiver = await tx.user.findFirst({ where: { id: receivedByUserId, isActive: true }, select: { id: true } });
    if (!receiver) throw new Error("Select an active staff member who received the payment");
    const payment = await tx.payment.create({
      data: {
        orderId,
        amount: input.amount,
        paymentType: input.paymentType,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber,
        receivedByUserId,
        paidAt: input.paidAt ?? new Date(),
        notes: input.notes,
      },
    });
    const amountPaid = calculateAmountPaid([
      ...order.payments.map((item) => ({ amount: Number(item.amount), paymentType: item.paymentType })),
      { amount: input.amount, paymentType: input.paymentType },
    ]);
    const totalPrice = Number(order.totalPrice);
    const remainingBalance = calculateRemainingBalance(totalPrice, amountPaid);
    const paymentStatus = calculatePaymentStatus({
      totalPrice,
      amountPaid,
      refunded: input.paymentType === "REFUND" && remainingBalance >= totalPrice,
    });
    await tx.order.update({
      where: { id: orderId },
      data: { amountPaid, remainingBalance, paymentStatus },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        orderId,
        entityType: "Payment",
        entityId: payment.id,
        action: "CREATE",
        newData: {
          amount: input.amount,
          paymentType: input.paymentType,
          paymentMethod: input.paymentMethod,
          receivedByUserId,
        },
      },
    });
    return tx.order.findUnique({ where: { id: orderId }, include: orderInclude });
  });
}

export async function updateOrderDetails(orderId: string, input: OrderEditInput, user: SessionUser) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true, payments: true } });
    if (!order) throw new Error("Order not found");
    const primaryItem = order.items[0];
    if (!primaryItem) throw new Error("Order has no items to update");
    const subtotal = roundMoney(input.quantity * input.unitPrice);
    const totalPrice = calculateTotalPrice({ subtotal, discount: input.discount, deliveryCharge: input.deliveryCharge });
    const amountPaid = calculateAmountPaid(order.payments.map((payment) => ({ amount: Number(payment.amount), paymentType: payment.paymentType })));
    const remainingBalance = calculateRemainingBalance(totalPrice, amountPaid);
    const paymentStatus = calculatePaymentStatus({ totalPrice, amountPaid });
    await tx.orderItem.update({ where: { id: primaryItem.id }, data: { quantity: input.quantity, unitPrice: input.unitPrice, lineTotal: subtotal } });
    await tx.order.update({
      where: { id: orderId },
      data: {
        quantity: input.quantity,
        subtotal,
        discount: input.discount,
        deliveryCharge: input.deliveryCharge,
        totalPrice,
        amountPaid,
        remainingBalance,
        paymentStatus,
        deliveryMethod: input.deliveryMethod,
        deliveryAddress: input.deliveryAddress,
        pickupLocation: input.pickupLocation,
        requiredDeliveryAt: input.requiredDeliveryAt,
        specialNotes: input.specialNotes,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id, orderId, entityType: "Order", entityId: orderId, action: "UPDATE_DETAILS",
        previousData: { quantity: order.quantity, subtotal: order.subtotal, discount: order.discount, deliveryCharge: order.deliveryCharge, totalPrice: order.totalPrice },
        newData: { quantity: input.quantity, subtotal, discount: input.discount, deliveryCharge: input.deliveryCharge, totalPrice, amountPaid, paymentStatus },
      },
    });
    return tx.order.findUnique({ where: { id: orderId }, include: orderInclude });
  });
}

export async function changeOrderStatus(orderId: string, input: StatusInput, user: SessionUser) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    const cancelledAt = input.orderStage === "CANCELLED" ? new Date() : order.cancelledAt;
    await tx.order.update({
      where: { id: orderId },
      data: { orderStage: input.orderStage, cancelledAt },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        previousStatus: order.orderStage,
        newStatus: input.orderStage,
        changedByUserId: user.id,
        notes: input.notes,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        orderId,
        entityType: "Order",
        entityId: order.id,
        action: "STATUS_CHANGE",
        previousData: { orderStage: order.orderStage },
        newData: { orderStage: input.orderStage, notes: input.notes },
      },
    });
    return tx.order.findUnique({ where: { id: orderId }, include: orderInclude });
  });
}

export async function createPrintLog(orderId: string, user: SessionUser, input: { printerName?: string; printType?: string; copyNumber?: number }) {
  return prisma.printLog.create({
    data: {
      orderId,
      printedByUserId: user.id,
      printerName: input.printerName,
      printType: input.printType === "BULK_LABEL" ? "BULK_LABEL" : input.printType === "REPRINT" ? "REPRINT" : "LABEL",
      copyNumber: input.copyNumber ?? 1,
    },
  });
}

export const orderInclude = {
  customer: true,
  bookedBy: { select: { id: true, name: true, email: true } },
  items: true,
  source: { select: { id: true, name: true } },
  payments: { include: { receivedBy: { select: { id: true, name: true } } }, orderBy: { paidAt: "desc" as const } },
  statusHistory: { include: { changedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" as const } },
  printLogs: { include: { printedBy: { select: { id: true, name: true } } }, orderBy: { printedAt: "desc" as const } },
  auditLogs: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" as const } },
};
