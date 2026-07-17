"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, Printer, RotateCcw, Search } from "lucide-react";
import { orderCreateSchema } from "@/lib/validation";
import { parseCustomerDetails, type ParsedCustomerDetails } from "@/lib/customer-parser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatEnumLabel } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";

type Product = { id: string; name: string; productType: string; defaultPrice: number };
type FormValues = z.input<typeof orderCreateSchema>;

export function NewOrderForm({ products }: { products: Product[] }) {
  const [pasteText, setPasteText] = useState("");
  const [detected, setDetected] = useState<ParsedCustomerDetails | null>(null);
  const [duplicates, setDuplicates] = useState<Array<{ id: string; name: string; orders: Array<{ orderNumber: string }> }>>([]);
  const [created, setCreated] = useState<{ id: string; orderNumber: string } | null>(null);
  const [submitError, setSubmitError] = useState("");
  const firstProduct = products[0];
  const form = useForm<FormValues>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      customerName: "",
      primaryPhone: "",
      alternativePhone: "",
      items: [
        {
          productId: firstProduct?.id,
          productNameSnapshot: firstProduct?.name ?? "",
          productType: firstProduct?.productType ?? "",
          quantity: 1,
          unitPrice: firstProduct?.defaultPrice ?? 0,
          personalizationNotes: "",
        },
      ],
      discount: 0,
      deliveryCharge: 0,
      advancePayment: 0,
      paymentMethod: "CASH",
      deliveryMethod: "DELIVERY",
      deliveryAddress: "",
      pickupLocation: "",
      specialNotes: "",
    },
  });
  const item = useWatch({ control: form.control, name: "items.0" });
  const discount = useWatch({ control: form.control, name: "discount" });
  const deliveryCharge = useWatch({ control: form.control, name: "deliveryCharge" });
  const advancePayment = useWatch({ control: form.control, name: "advancePayment" });
  const selectedProductId = useWatch({ control: form.control, name: "items.0.productId" });
  const subtotal = (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(deliveryCharge || 0));
  const balance = total - Number(advancePayment || 0);

  async function detectPaste() {
    const data = parseCustomerDetails(pasteText);
    setDetected(data);
  }

  function applyDetected() {
    if (!detected) return;
    if (detected.customerName) form.setValue("customerName", detected.customerName);
    if (detected.phone) form.setValue("primaryPhone", detected.phone);
    if (detected.address) form.setValue("deliveryAddress", detected.address);
    if (detected.productType) {
      form.setValue("items.0.productType", detected.productType);
      form.setValue("items.0.productNameSnapshot", detected.productType);
    }
    if (detected.price) form.setValue("items.0.unitPrice", detected.price);
    if (detected.advanceAmount) form.setValue("advancePayment", detected.advanceAmount);
    if (detected.deliveryInstructions) form.setValue("specialNotes", detected.deliveryInstructions);
  }

  async function checkDuplicate(phone: string) {
    if (phone.replace(/\D/g, "").length < 4) return;
    const response = await fetch(`/api/v1/customers/search?q=${encodeURIComponent(phone)}`);
    if (response.ok) {
      const json = await response.json();
      setDuplicates(json.data ?? []);
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitError("");
    const response = await fetch("/api/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await response.json();
    if (!response.ok) {
      setSubmitError(json.message ?? "Order creation failed");
      return;
    }
    setCreated({ id: json.data.id, orderNumber: json.data.orderNumber });
  }

  if (created) {
    return (
      <Card>
        <CardContent className="space-y-5 py-10 text-center">
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">Order created</p>
            <h2 className="mt-1 text-3xl font-semibold">{created.orderNumber}</h2>
          </div>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link href={`/labels/${created.id}`}>
                <Printer className="h-4 w-4" /> Print label
              </Link>
            </Button>
            <Button variant="secondary" onClick={() => setCreated(null)}>
              <RotateCcw className="h-4 w-4" /> Create another order
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/orders/${created.id}`}>Open order</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Paste customer details</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={pasteText} onChange={(event) => setPasteText(event.target.value)} placeholder="Paste Messenger or Instagram text here..." />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={detectPaste}>
                <Search className="h-4 w-4" /> Detect values
              </Button>
              {detected ? (
                <Button type="button" onClick={applyDetected}>
                  <Copy className="h-4 w-4" /> Apply detected values
                </Button>
              ) : null}
            </div>
            {detected ? <pre className="overflow-auto rounded-md bg-[var(--muted)] p-3 text-xs">{JSON.stringify(detected, null, 2)}</pre> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Customer and order</h2>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Customer name" error={form.formState.errors.customerName?.message}>
              <Input {...form.register("customerName")} />
            </Field>
            <Field label="Phone number" error={form.formState.errors.primaryPhone?.message}>
              <Input {...form.register("primaryPhone")} onBlur={(event) => checkDuplicate(event.target.value)} />
            </Field>
            <Field label="Alternative phone">
              <Input {...form.register("alternativePhone")} />
            </Field>
            <Field label="Product">
              <Select
                value={selectedProductId ?? ""}
                onChange={(event) => {
                  const product = products.find((entry) => entry.id === event.target.value);
                  form.setValue("items.0.productId", event.target.value);
                  if (product) {
                    form.setValue("items.0.productNameSnapshot", product.name);
                    form.setValue("items.0.productType", product.productType);
                    form.setValue("items.0.unitPrice", product.defaultPrice);
                  }
                }}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Product type">
              <Input {...form.register("items.0.productType")} />
            </Field>
            <Field label="Quantity">
              <Input type="number" min="1" {...form.register("items.0.quantity", { valueAsNumber: true })} />
            </Field>
            <Field label="Unit price">
              <Input type="number" min="0" {...form.register("items.0.unitPrice", { valueAsNumber: true })} />
            </Field>
            <Field label="Personalization instructions">
              <Textarea {...form.register("items.0.personalizationNotes")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Delivery and notes</h2>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Delivery method">
              <Select {...form.register("deliveryMethod")}>
                <option value="DELIVERY">Delivery</option>
                <option value="PICKUP">Pickup</option>
                <option value="COURIER">Courier</option>
              </Select>
            </Field>
            <Field label="Required delivery date and time">
              <Input type="datetime-local" {...form.register("requiredDeliveryAt")} />
            </Field>
            <Field label="Delivery address">
              <Textarea {...form.register("deliveryAddress")} />
            </Field>
            <Field label="Pickup location">
              <Input {...form.register("pickupLocation")} />
            </Field>
            <Field label="Follow-up date and time">
              <Input type="datetime-local" {...form.register("followUpAt")} />
            </Field>
            <Field label="Special notes">
              <Textarea {...form.register("specialNotes")} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        {duplicates.length ? (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent>
              <p className="font-semibold">Existing customer warning</p>
              <p className="mt-1 text-sm">This phone number appears on previous orders. Staff can continue after checking history.</p>
              <ul className="mt-3 space-y-1 text-sm">
                {duplicates.map((customer) => (
                  <li key={customer.id}>{customer.name}: {customer.orders.map((order) => order.orderNumber).join(", ")}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Payment</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Discount">
              <Input type="number" min="0" {...form.register("discount", { valueAsNumber: true })} />
            </Field>
            <Field label="Delivery charge">
              <Input type="number" min="0" {...form.register("deliveryCharge", { valueAsNumber: true })} />
            </Field>
            <Field label="Advance payment">
              <Input type="number" min="0" {...form.register("advancePayment", { valueAsNumber: true })} />
            </Field>
            <Field label="Payment method">
              <Select {...form.register("paymentMethod")}>
                {["CASH", "ESEWA", "KHALTI", "FONEPAY", "BANK_TRANSFER", "COD", "OTHER"].map((method) => (
                  <option key={method} value={method}>{formatEnumLabel(method)}</option>
                ))}
              </Select>
            </Field>
            <div className="rounded-md bg-[var(--muted)] p-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>NPR {subtotal}</strong></div>
              <div className="mt-2 flex justify-between"><span>Total</span><strong>NPR {total}</strong></div>
              <div className="mt-2 flex justify-between"><span>Balance</span><strong>NPR {balance}</strong></div>
            </div>
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save order"}
            </Button>
            {submitError ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{submitError}</p> : null}
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
