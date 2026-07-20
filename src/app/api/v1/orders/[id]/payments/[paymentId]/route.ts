import { fail, handleRouteError, ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentReceiverUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string; paymentId: string }> }) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { id, paymentId } = await context.params;
    const body = paymentReceiverUpdateSchema.parse(await request.json());
    const payment = await prisma.payment.findFirst({ where: { id: paymentId, orderId: id } });
    if (!payment) return fail("Payment not found", 404);
    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.payment.update({ where: { id: paymentId }, data: { receivedByUserId: body.receivedByUserId }, include: { receivedBy: { select: { id: true, name: true } } } });
      await tx.auditLog.create({ data: { userId: user.id, orderId: id, entityType: "Payment", entityId: paymentId, action: "UPDATE_RECEIVED_BY", previousData: { receivedByUserId: payment.receivedByUserId }, newData: { receivedByUserId: body.receivedByUserId } } });
      return record;
    });
    return ok(updated, "Payment receiver updated successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}
