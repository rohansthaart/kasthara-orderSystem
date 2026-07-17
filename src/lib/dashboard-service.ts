import { startOfDay, endOfDay, startOfWeek, subDays } from "date-fns";
import { prisma } from "./prisma";

export async function getDashboardSummary() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const [
    ordersToday,
    ordersThisWeek,
    revenueToday,
    paymentsToday,
    outstanding,
    designApproval,
    inProduction,
    readyToPack,
    readyForDelivery,
    overdueDeliveries,
    followUpsDueToday,
    unpaid,
    partiallyPaid,
    dailyOrders,
    productPerformance,
    paymentMethods,
    staffBookings,
    deliveryDistribution,
  ] = await prisma.$transaction([
    prisma.order.count({ where: { orderDate: { gte: todayStart, lte: todayEnd } } }),
    prisma.order.count({ where: { orderDate: { gte: weekStart } } }),
    prisma.order.aggregate({ where: { orderDate: { gte: todayStart, lte: todayEnd } }, _sum: { totalPrice: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: todayStart, lte: todayEnd } }, _sum: { amount: true } }),
    prisma.order.aggregate({ where: { orderStage: { notIn: ["CANCELLED", "RETURNED"] } }, _sum: { remainingBalance: true } }),
    prisma.order.count({ where: { orderStage: "DESIGN_SENT" } }),
    prisma.order.count({ where: { orderStage: "IN_PRODUCTION" } }),
    prisma.order.count({ where: { orderStage: "READY_TO_PACK" } }),
    prisma.order.count({ where: { orderStage: { in: ["PACKED", "PICKUP_READY", "SHIPPED"] } } }),
    prisma.order.count({ where: { requiredDeliveryAt: { lt: now }, orderStage: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] } } }),
    prisma.order.count({ where: { followUpAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.order.count({ where: { paymentStatus: "UNPAID" } }),
    prisma.order.count({ where: { paymentStatus: "PARTIALLY_PAID" } }),
    prisma.order.groupBy({ by: ["orderDate"], where: { orderDate: { gte: subDays(now, 14) } }, _count: true, orderBy: { orderDate: "asc" } }),
    prisma.orderItem.groupBy({ by: ["productType"], _sum: { lineTotal: true, quantity: true }, orderBy: { _sum: { lineTotal: "desc" } }, take: 8 }),
    prisma.payment.groupBy({ by: ["paymentMethod"], _sum: { amount: true }, orderBy: { paymentMethod: "asc" } }),
    prisma.order.groupBy({ by: ["bookedByUserId"], _count: true, orderBy: { bookedByUserId: "asc" } }),
    prisma.order.groupBy({ by: ["deliveryMethod"], _count: true, orderBy: { deliveryMethod: "asc" } }),
  ]);

  return {
    cards: {
      ordersToday,
      ordersThisWeek,
      revenueToday: Number(revenueToday._sum.totalPrice ?? 0),
      paymentsReceivedToday: Number(paymentsToday._sum.amount ?? 0),
      outstandingBalance: Number(outstanding._sum.remainingBalance ?? 0),
      designApproval,
      inProduction,
      readyToPack,
      readyForDelivery,
      overdueDeliveries,
      followUpsDueToday,
      unpaid,
      partiallyPaid,
    },
    charts: {
      dailyOrders,
      productPerformance,
      paymentMethods,
      staffBookings,
      deliveryDistribution,
    },
  };
}

export async function getTodayWorkQueues() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const select = {
    id: true,
    orderNumber: true,
    orderStage: true,
    paymentStatus: true,
    remainingBalance: true,
    requiredDeliveryAt: true,
    followUpAt: true,
    deliveryMethod: true,
    customer: { select: { name: true, primaryPhone: true } },
    items: true,
  };
  const [followUpToday, produceToday, packToday, deliverToday, pickupReady, outstandingPayments, overdueOrders] =
    await prisma.$transaction([
      prisma.order.findMany({ where: { followUpAt: { gte: todayStart, lte: todayEnd } }, select, take: 50 }),
      prisma.order.findMany({ where: { orderStage: { in: ["DESIGN_APPROVED", "IN_PRODUCTION"] } }, select, take: 50 }),
      prisma.order.findMany({ where: { orderStage: "READY_TO_PACK" }, select, take: 50 }),
      prisma.order.findMany({ where: { orderStage: { in: ["PACKED", "SHIPPED"] }, deliveryMethod: { in: ["DELIVERY", "COURIER"] } }, select, take: 50 }),
      prisma.order.findMany({ where: { orderStage: "PICKUP_READY" }, select, take: 50 }),
      prisma.order.findMany({ where: { paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] } }, select, take: 50 }),
      prisma.order.findMany({ where: { requiredDeliveryAt: { lt: now }, orderStage: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] } }, select, take: 50 }),
    ]);
  return { followUpToday, produceToday, packToday, deliverToday, pickupReady, outstandingPayments, overdueOrders };
}
