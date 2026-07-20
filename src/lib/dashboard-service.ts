import { format, startOfDay, endOfDay, startOfWeek, subDays } from "date-fns";
import { prisma } from "./prisma";

export async function getDashboardSummary() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const reportStart = startOfDay(subDays(now, 29));
  const activeOrderStages = ["CANCELLED", "RETURNED"] as const;
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
    productPerformance,
    reportOrders,
    reportPayments,
  ] = await Promise.all([
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
    prisma.orderItem.groupBy({
      by: ["productType"],
      where: { order: { orderDate: { gte: reportStart }, orderStage: { notIn: [...activeOrderStages] } } },
      _sum: { lineTotal: true, quantity: true },
      orderBy: { _sum: { lineTotal: "desc" } }, take: 8,
    }),
    prisma.order.findMany({
      where: { orderDate: { gte: reportStart }, orderStage: { notIn: [...activeOrderStages] } },
      select: { orderDate: true, bookedBy: { select: { name: true } }, deliveryMethod: true, source: { select: { name: true } } },
    }),
    prisma.payment.findMany({
      where: { paidAt: { gte: reportStart }, order: { orderStage: { notIn: [...activeOrderStages] } } },
      select: { amount: true, paymentMethod: true, paymentType: true },
    }),
  ]);
  const grouped = <T>(values: T[], key: (value: T) => string) => {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(key(value), (counts.get(key(value)) ?? 0) + 1);
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  };
  const paymentByMethod = new Map<string, number>();
  for (const payment of reportPayments) {
    const signedAmount = payment.paymentType === "REFUND" ? -Number(payment.amount) : Number(payment.amount);
    paymentByMethod.set(payment.paymentMethod, (paymentByMethod.get(payment.paymentMethod) ?? 0) + signedAmount);
  }
  const dailyOrders = Array.from({ length: 30 }, (_, index) => {
    const date = startOfDay(subDays(now, 29 - index));
    const key = format(date, "yyyy-MM-dd");
    return { date: key, label: format(date, "d MMM"), count: reportOrders.filter((order) => format(order.orderDate, "yyyy-MM-dd") === key).length };
  });

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
      paymentMethods: [...paymentByMethod.entries()].filter(([, value]) => value !== 0).map(([paymentMethod, value]) => ({ paymentMethod, value })).sort((a, b) => b.value - a.value),
      staffBookings: grouped(reportOrders, (order) => order.bookedBy.name).map((item) => ({ staffName: item.label, count: item.count })),
      deliveryDistribution: grouped(reportOrders, (order) => order.deliveryMethod).map((item) => ({ deliveryMethod: item.label, count: item.count })),
      sourceDistribution: grouped(reportOrders, (order) => order.source?.name ?? "Not recorded").map((item) => ({ sourceName: item.label, count: item.count })),
    },
    reportingPeriod: { start: reportStart, end: now },
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
    items: { select: { productNameSnapshot: true, quantity: true } },
  };
  const [followUpToday, produceToday, packToday, deliverToday, pickupReady, outstandingPayments, overdueOrders] =
    await Promise.all([
      prisma.order.findMany({ where: { followUpAt: { gte: todayStart, lte: todayEnd } }, select, orderBy: { followUpAt: "asc" }, take: 50 }),
      prisma.order.findMany({ where: { orderStage: { in: ["DESIGN_APPROVED", "IN_PRODUCTION"] } }, select, orderBy: { requiredDeliveryAt: "asc" }, take: 50 }),
      prisma.order.findMany({ where: { orderStage: "READY_TO_PACK" }, select, orderBy: { requiredDeliveryAt: "asc" }, take: 50 }),
      prisma.order.findMany({ where: { orderStage: { in: ["PACKED", "SHIPPED"] }, deliveryMethod: { in: ["DELIVERY", "COURIER"] } }, select, orderBy: { requiredDeliveryAt: "asc" }, take: 50 }),
      prisma.order.findMany({ where: { orderStage: "PICKUP_READY" }, select, orderBy: { requiredDeliveryAt: "asc" }, take: 50 }),
      prisma.order.findMany({ where: { paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] } }, select, orderBy: { remainingBalance: "desc" }, take: 50 }),
      prisma.order.findMany({ where: { requiredDeliveryAt: { lt: now }, orderStage: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] } }, select, orderBy: { requiredDeliveryAt: "asc" }, take: 50 }),
    ]);
  return { followUpToday, produceToday, packToday, deliverToday, pickupReady, outstandingPayments, overdueOrders };
}
