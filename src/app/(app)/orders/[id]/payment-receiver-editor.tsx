"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/ui/select";

type Payment = { id: string; paymentType: string; receivedByUserId: string; receivedBy: { name: string } };
type User = { id: string; name: string };

export function PaymentReceiverEditor({ orderId, payments, users }: { orderId: string; payments: Payment[]; users: User[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);
  const [error, setError] = useState("");
  const advance = payments.find((payment) => payment.paymentType === "ADVANCE");
  const finalPayment = payments.find((payment) => payment.paymentType === "FINAL_PAYMENT")
    ?? payments.find((payment) => payment.paymentType !== "ADVANCE" && payment.paymentType !== "REFUND");
  const editable = [advance, finalPayment].filter((payment): payment is Payment => Boolean(payment));

  if (!editable.length) return null;

  async function update(paymentId: string, receivedByUserId: string) {
    setSaving(paymentId);
    setUpdated(null);
    setError("");
    const response = await fetch(`/api/v1/orders/${orderId}/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ receivedByUserId }),
    });
    if (!response.ok) {
      setError("Could not update who received this payment.");
      setSaving(null);
      return;
    }
    setSaving(null);
    setUpdated(paymentId);
    router.refresh();
  }

  return (
    <div className="space-y-3 border-t border-[var(--border)] pt-4">
      <div>
        <p className="text-xs font-semibold text-[var(--foreground)]">Correct historical receivers</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">Changing a selection saves immediately.</p>
      </div>
      {editable.map((payment) => {
        const isAdvance = payment.id === advance?.id;
        const isSaving = saving === payment.id;
        const isUpdated = updated === payment.id;
        return (
          <div key={payment.id} className="rounded-xl bg-[var(--surface-subtle)] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium">{isAdvance ? "Advance received by" : "Final payment received by"}</p>
              <span className="min-h-4 text-xs" aria-live="polite">
                {isSaving ? <span className="inline-flex items-center gap-1 text-[var(--muted-foreground)]"><Loader2 className="h-3 w-3 animate-spin" />Saving</span> : null}
                {isUpdated ? <span className="inline-flex items-center gap-1 text-[var(--success)]"><CheckCircle2 className="h-3 w-3" />Updated</span> : null}
              </span>
            </div>
            <Select
              defaultValue={payment.receivedByUserId}
              aria-label={`Receiver for ${isAdvance ? "advance" : "final payment"}`}
              onChange={(event) => update(payment.id, event.target.value)}
              disabled={isSaving}
              className="rounded-lg bg-[var(--surface)]"
            >
              {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </Select>
            <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">Currently: {payment.receivedBy.name}</p>
          </div>
        );
      })}
      {error ? <p className="rounded-xl bg-red-50 p-3 text-xs text-[var(--danger)]" role="alert">{error}</p> : null}
    </div>
  );
}
