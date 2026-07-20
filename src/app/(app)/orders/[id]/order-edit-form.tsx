"use client";

import { Pencil, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type InitialOrder = {
  quantity: number;
  unitPrice: number;
  discount: number;
  deliveryCharge: number;
  deliveryMethod: "PICKUP" | "DELIVERY" | "COURIER";
  deliveryAddress: string;
  pickupLocation: string;
  requiredDeliveryAt: string;
  specialNotes: string;
};

export function OrderEditForm({ orderId, initial }: { orderId: string; initial: InitialOrder }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (name: keyof InitialOrder, value: string | number) => setValues((current) => ({ ...current, [name]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...values, requiredDeliveryAt: values.requiredDeliveryAt || undefined };
    const response = await fetch(`/api/v1/orders/${orderId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const json = await response.json();
      setError(json.message ?? "Could not save corrections.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <Card className="overflow-hidden rounded-[1.5rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
        <CardHeader className="flex-row items-center justify-between gap-4 border-0 bg-transparent px-5 py-5">
          <div><h2 className="font-semibold">Correct order</h2><p className="mt-1 text-sm leading-5 text-[var(--muted-foreground)]">Fix price, quantity, or delivery details.</p></div>
          <Button type="button" variant="secondary" size="sm" className="shrink-0 rounded-lg" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" />Edit</Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
      <CardHeader className="border-0 bg-transparent px-5 pb-2 pt-5"><h2 className="font-semibold">Correct order</h2><p className="mt-1 text-sm leading-5 text-[var(--muted-foreground)]">Totals and payment status update automatically after saving.</p></CardHeader>
      <CardContent className="px-5 pb-5 pt-2">
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <Field label="Quantity"><Input type="number" min="1" value={values.quantity} onChange={(event) => set("quantity", Number(event.target.value))} /></Field>
          <Field label="Unit price"><Input type="number" min="0" value={values.unitPrice} onChange={(event) => set("unitPrice", Number(event.target.value))} /></Field>
          <Field label="Discount"><Input type="number" min="0" value={values.discount} onChange={(event) => set("discount", Number(event.target.value))} /></Field>
          <Field label="Delivery charge"><Input type="number" min="0" value={values.deliveryCharge} onChange={(event) => set("deliveryCharge", Number(event.target.value))} /></Field>
          <Field label="Delivery method">
            <Select value={values.deliveryMethod} onChange={(event) => set("deliveryMethod", event.target.value as InitialOrder["deliveryMethod"])}>
              <option value="DELIVERY">Delivery</option><option value="PICKUP">Pickup</option><option value="COURIER">Courier</option>
            </Select>
          </Field>
          <Field label="Required delivery"><Input type="datetime-local" value={values.requiredDeliveryAt} onChange={(event) => set("requiredDeliveryAt", event.target.value)} /></Field>
          <Field label="Delivery address"><Textarea value={values.deliveryAddress} onChange={(event) => set("deliveryAddress", event.target.value)} /></Field>
          <Field label="Pickup location"><Input value={values.pickupLocation} onChange={(event) => set("pickupLocation", event.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Special notes"><Textarea value={values.specialNotes} onChange={(event) => set("specialNotes", event.target.value)} /></Field></div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" className="rounded-lg" disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save corrections"}</Button>
            <Button type="button" variant="ghost" className="rounded-lg" onClick={() => { setValues(initial); setEditing(false); }}>Cancel</Button>
          </div>
          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-[var(--danger)] sm:col-span-2" role="alert">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
