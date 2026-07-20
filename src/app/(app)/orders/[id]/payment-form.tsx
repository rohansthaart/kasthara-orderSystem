"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { paymentSchema } from "@/lib/validation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatEnumLabel } from "@/components/ui/status-badge";

type Values = z.input<typeof paymentSchema>;
type StaffMember = { id: string; name: string };

export function PaymentForm({ orderId, remainingBalance, staffMembers, currentUserId }: { orderId: string; remainingBalance: number; staffMembers: StaffMember[]; currentUserId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, paymentType: "ADDITIONAL", paymentMethod: "CASH", receivedByUserId: currentUserId, notes: "" },
  });
  async function submit(values: Values) {
    setError("");
    const response = await fetch(`/api/v1/orders/${orderId}/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      setError("Could not add payment");
      return;
    }
    router.refresh();
    form.reset({ amount: 0, paymentType: "ADDITIONAL", paymentMethod: "CASH", receivedByUserId: currentUserId, notes: "" });
  }
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
      <CardHeader className="border-0 bg-transparent px-5 pb-2 pt-5"><h2 className="font-semibold">Record payment</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Add the amount and who received it.</p></CardHeader>
      <CardContent className="px-5 pb-5 pt-2">
        <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
          <Field label="Amount"><div className="flex gap-2"><Input type="number" min="1" inputMode="decimal" {...form.register("amount", { valueAsNumber: true })} />{remainingBalance > 0 ? <Button type="button" size="sm" variant="secondary" className="shrink-0 rounded-lg" onClick={() => form.setValue("amount", remainingBalance, { shouldValidate: true })}>Full due</Button> : null}</div></Field>
          <Field label="Payment type">
            <Select {...form.register("paymentType")}>
              {["ADVANCE", "ADDITIONAL", "FINAL_PAYMENT", "DELIVERY_COLLECTION", "REFUND", "ADJUSTMENT"].map((item) => <option key={item} value={item}>{formatEnumLabel(item)}</option>)}
            </Select>
          </Field>
          <Field label="Method">
            <Select {...form.register("paymentMethod")}>
              {["CASH", "ESEWA", "KHALTI", "FONEPAY", "BANK_TRANSFER", "COD", "OTHER"].map((item) => <option key={item} value={item}>{formatEnumLabel(item)}</option>)}
            </Select>
          </Field>
          <Field label="Received by">
            <Select {...form.register("receivedByUserId")}>
              <option value="">Select staff member</option>
              {staffMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </Select>
            <p className="text-xs text-[var(--muted-foreground)]">Select who actually received this payment.</p>
          </Field>
          <Field label="Reference"><Input placeholder="Optional transaction ID" {...form.register("referenceNumber")} /></Field>
          <Button className="h-11 w-full rounded-xl" type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Recording..." : "Record payment"}</Button>
          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
