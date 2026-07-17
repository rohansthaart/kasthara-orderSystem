"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { paymentSchema } from "@/lib/validation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Values = z.input<typeof paymentSchema>;

export function PaymentForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, paymentType: "ADDITIONAL", paymentMethod: "CASH", notes: "" },
  });
  async function submit(values: Values) {
    const response = await fetch(`/api/v1/orders/${orderId}/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) alert("Could not add payment");
    router.refresh();
    form.reset({ amount: 0, paymentType: "ADDITIONAL", paymentMethod: "CASH", notes: "" });
  }
  return (
    <Card>
      <CardHeader><h2 className="font-semibold">Add payment</h2></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-3">
          <Field label="Amount"><Input type="number" min="1" {...form.register("amount", { valueAsNumber: true })} /></Field>
          <Field label="Payment type">
            <select className="h-11 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm" {...form.register("paymentType")}>
              {["ADVANCE", "ADDITIONAL", "FINAL_PAYMENT", "DELIVERY_COLLECTION", "REFUND", "ADJUSTMENT"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Method">
            <select className="h-11 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm" {...form.register("paymentMethod")}>
              {["CASH", "ESEWA", "KHALTI", "FONEPAY", "BANK_TRANSFER", "COD", "OTHER"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Reference"><Input {...form.register("referenceNumber")} /></Field>
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>Record payment</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
