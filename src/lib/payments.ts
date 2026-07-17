import type { PaymentStatusValue, PaymentTypeValue } from "./constants";

export function calculateTotalPrice(input: {
  subtotal: number;
  discount?: number;
  deliveryCharge?: number;
}) {
  const total =
    Number(input.subtotal || 0) - Number(input.discount || 0) + Number(input.deliveryCharge || 0);
  return Math.max(0, roundMoney(total));
}

export function calculateAmountPaid(
  payments: Array<{ amount: number; paymentType?: PaymentTypeValue | string }>,
) {
  return roundMoney(
    payments.reduce((sum, payment) => {
      if (payment.paymentType === "REFUND") return sum - Number(payment.amount);
      return sum + Number(payment.amount);
    }, 0),
  );
}

export function calculateRemainingBalance(totalPrice: number, amountPaid: number) {
  return roundMoney(Number(totalPrice || 0) - Number(amountPaid || 0));
}

export function calculatePaymentStatus(input: {
  totalPrice: number;
  amountPaid: number;
  refunded?: boolean;
}): PaymentStatusValue {
  if (input.refunded) return "REFUNDED";
  if (input.amountPaid <= 0) return "UNPAID";
  if (input.amountPaid < input.totalPrice) return "PARTIALLY_PAID";
  return "PAID";
}

export function assertValidPaymentAmount(amount: number, paymentType?: PaymentTypeValue | string) {
  if (!Number.isFinite(amount)) throw new Error("Payment amount must be a number");
  if (paymentType !== "REFUND" && amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }
  if (paymentType === "REFUND" && amount <= 0) {
    throw new Error("Refund amount must be greater than zero");
  }
}

export function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
