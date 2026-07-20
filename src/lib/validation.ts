import { z } from "zod";
import { DELIVERY_METHODS, ORDER_STAGES, PAYMENT_METHODS, PAYMENT_TYPES } from "./constants";
import { isValidNepalPhone } from "./phone";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  paymentType: z.enum(PAYMENT_TYPES).default("ADDITIONAL"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  receivedByUserId: z.string().min(1).optional(),
  referenceNumber: z.string().trim().optional(),
  paidAt: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
});

export const statusSchema = z.object({
  orderStage: z.enum(ORDER_STAGES),
  notes: z.string().trim().optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().optional(),
  productNameSnapshot: z.string().min(1),
  productType: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  personalizationNotes: z.string().trim().optional(),
});

export const orderCreateSchema = z.object({
  customerName: z.string().min(1),
  primaryPhone: z.string().refine(isValidNepalPhone, "Enter a valid Nepal mobile number"),
  alternativePhone: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  discount: z.coerce.number().nonnegative().default(0),
  deliveryCharge: z.coerce.number().nonnegative().default(0),
  advancePayment: z.coerce.number().nonnegative().default(0),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  advanceReceivedByUserId: z.string().min(1).optional(),
  sourceId: z.string().min(1),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  deliveryAddress: z.string().optional(),
  pickupLocation: z.string().optional(),
  requiredDeliveryAt: z.coerce.date().optional(),
  followUpAt: z.coerce.date().optional(),
  specialNotes: z.string().optional(),
});

export const orderUpdateSchema = orderCreateSchema.partial().extend({
  orderStage: z.enum(ORDER_STAGES).optional(),
});

export const orderEditSchema = z.object({
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative(),
  deliveryCharge: z.coerce.number().nonnegative(),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  deliveryAddress: z.string().optional(),
  pickupLocation: z.string().optional(),
  requiredDeliveryAt: z.coerce.date().optional(),
  specialNotes: z.string().optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  orderStage: z.enum(ORDER_STAGES).optional(),
  paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"]).optional(),
  deliveryMethod: z.enum(DELIVERY_METHODS).optional(),
  staffId: z.string().optional(),
  productId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(["orderDate", "requiredDeliveryAt", "totalPrice", "remainingBalance"]).default("orderDate"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const productSchema = z.object({
  name: z.string().min(1),
  productType: z.string().min(1),
  defaultPrice: z.coerce.number().nonnegative(),
  isActive: z.boolean().default(true),
});

export const orderSourceSchema = z.object({
  name: z.string().trim().min(1).max(60),
  isActive: z.boolean().default(true),
});

export const labelSettingSchema = z.object({
  widthMm: z.coerce.number().int().min(20).max(150),
  heightMm: z.coerce.number().int().min(15).max(150),
  marginMm: z.coerce.number().int().min(0).max(10),
  fontSize: z.coerce.number().int().min(6).max(18),
  dpi: z.coerce.number().int().min(150).max(600),
  showAddress: z.boolean(),
  showNotes: z.boolean(),
  showBalance: z.boolean(),
  showRequiredAt: z.boolean(),
}).refine((value) => value.marginMm * 2 < Math.min(value.widthMm, value.heightMm), {
  message: "Margin is too large for this label size",
  path: ["marginMm"],
});

export const paymentReceiverUpdateSchema = z.object({
  receivedByUserId: z.string().min(1),
});

export const userSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF"),
  isActive: z.boolean().default(true),
});
