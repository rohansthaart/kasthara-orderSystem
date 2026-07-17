import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { calculatePaymentStatus, calculateRemainingBalance, calculateTotalPrice } from "../src/lib/payments";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

function hashPassword(password: string) {
  return hash(password, 12);
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@kasthara.local" },
    update: {},
    create: {
      name: "Kasthara Admin",
      email: "admin@kasthara.local",
      phone: "9800000000",
      role: "ADMIN",
      passwordHash: await hashPassword("password123"),
    },
  });
  const staff = await prisma.user.upsert({
    where: { email: "staff@kasthara.local" },
    update: {},
    create: {
      name: "Front Desk Staff",
      email: "staff@kasthara.local",
      phone: "9800000001",
      role: "STAFF",
      passwordHash: await hashPassword("password123"),
    },
  });

  const products = await Promise.all(
    [
      ["Acrylic keyring", "KEYRING", 350],
      ["Engraved wooden frame", "FRAME", 1800],
      ["Personalized wallet card", "WALLET_CARD", 550],
      ["Custom night lamp", "LAMP", 2200],
      ["Photo bottle", "BOTTLE", 1200],
    ].map(([name, productType, defaultPrice]) =>
      prisma.product.upsert({
        where: { id: `${productType}` },
        update: { name: String(name), productType: String(productType), defaultPrice: Number(defaultPrice) },
        create: { id: String(productType), name: String(name), productType: String(productType), defaultPrice: Number(defaultPrice) },
      }),
    ),
  );

  await prisma.labelSetting.upsert({
    where: { name: "Default" },
    update: {},
    create: { name: "Default", widthMm: 60, heightMm: 40, marginMm: 2, fontSize: 10 },
  });

  const customer = await prisma.customer.upsert({
    where: { normalizedPhone: "9801234567" },
    update: {},
    create: {
      name: "Srijana Shrestha",
      primaryPhone: "9801234567",
      normalizedPhone: "9801234567",
      alternativePhone: "9812345678",
    },
  });
  const subtotal = 2 * 350;
  const totalPrice = calculateTotalPrice({ subtotal, deliveryCharge: 100 });
  const amountPaid = 300;
  const remainingBalance = calculateRemainingBalance(totalPrice, amountPaid);
  const paymentStatus = calculatePaymentStatus({ totalPrice, amountPaid });
  const existing = await prisma.order.findUnique({ where: { orderNumber: "KAS-260714-001" } });
  if (!existing) {
    await prisma.order.create({
      data: {
        orderNumber: "KAS-260714-001",
        customerId: customer.id,
        quantity: 2,
        subtotal,
        deliveryCharge: 100,
        totalPrice,
        amountPaid,
        remainingBalance,
        paymentStatus,
        deliveryMethod: "DELIVERY",
        deliveryAddress: "Boudha, Kathmandu",
        requiredDeliveryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        specialNotes: "Call before delivery",
        bookedByUserId: staff.id,
        items: {
          create: {
            productId: products[0].id,
            productNameSnapshot: products[0].name,
            productType: products[0].productType,
            quantity: 2,
            unitPrice: 350,
            lineTotal: subtotal,
            personalizationNotes: "Names: Srijana and Aarav",
          },
        },
        payments: {
          create: {
            amount: amountPaid,
            paymentType: "ADVANCE",
            paymentMethod: "ESEWA",
            receivedByUserId: staff.id,
          },
        },
        statusHistory: {
          create: {
            newStatus: "NEW",
            changedByUserId: staff.id,
            notes: "Seed order",
          },
        },
        auditLogs: {
          create: {
            userId: staff.id,
            entityType: "Order",
            entityId: "KAS-260714-001",
            action: "CREATE",
            newData: { seeded: true },
          },
        },
      },
    });
  }
  await prisma.dailyOrderSequence.upsert({
    where: { dateKey: "2026-07-14" },
    update: { lastValue: 1 },
    create: { dateKey: "2026-07-14", lastValue: 1 },
  });
  console.log("Seed complete:", { admin: admin.email, staff: staff.email });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
