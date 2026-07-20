"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Copy, Printer, RotateCcw, Search } from "lucide-react";
import { orderCreateSchema } from "@/lib/validation";
import { parseCustomerDetails, type ParsedCustomerDetails } from "@/lib/customer-parser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatEnumLabel } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { asCurrency } from "@/lib/utils";

type Product = { id: string; name: string; productType: string; defaultPrice: number };
type Source = { id: string; name: string };
type StaffMember = { id: string; name: string };
type FormValues = z.input<typeof orderCreateSchema>;

export function NewOrderForm({ products, sources, staffMembers, currentUserId }: { products: Product[]; sources: Source[]; staffMembers: StaffMember[]; currentUserId: string }) {
  const [pasteText, setPasteText] = useState("");
  const [detected, setDetected] = useState<ParsedCustomerDetails | null>(null);
  const [duplicates, setDuplicates] = useState<Array<{ id: string; name: string; orders: Array<{ orderNumber: string }> }>>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
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
      advanceReceivedByUserId: currentUserId,
      sourceId: sources[0]?.id ?? "",
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
  const deliveryMethod = useWatch({ control: form.control, name: "deliveryMethod" });
  const subtotal = (Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(deliveryCharge || 0));
  const balance = total - Number(advancePayment || 0);
  const hasDetectedValues = detected !== null && Object.keys(detected).length > 0;
  const detectedValueCount = detected ? Object.keys(detected).length : 0;

  function detectPaste() {
    const data = parseCustomerDetails(pasteText);
    setDetected(data);
  }

  function applyDetected() {
    if (!detected) return;
    const setOptions = { shouldDirty: true, shouldValidate: true } as const;
    if (detected.customerName) form.setValue("customerName", detected.customerName, setOptions);
    if (detected.phone) {
      form.setValue("primaryPhone", detected.phone, setOptions);
      void checkDuplicate(detected.phone);
    }
    if (detected.alternativePhone) form.setValue("alternativePhone", detected.alternativePhone, setOptions);

    const detectedDeliveryMethod = detected.deliveryMethod ?? (detected.address ? "DELIVERY" : undefined);
    if (detectedDeliveryMethod) form.setValue("deliveryMethod", detectedDeliveryMethod, setOptions);
    if (detected.address) {
      if (detectedDeliveryMethod === "PICKUP") {
        form.setValue("pickupLocation", detected.address, setOptions);
      } else {
        form.setValue("deliveryAddress", detected.address, setOptions);
      }
    }

    if (detected.productType) {
      const matchedProduct = findMatchingProduct(products, detected.productType);
      if (matchedProduct) {
        form.setValue("items.0.productId", matchedProduct.id, setOptions);
        form.setValue("items.0.productNameSnapshot", matchedProduct.name, setOptions);
        form.setValue("items.0.productType", matchedProduct.productType, setOptions);
        if (detected.price === undefined) form.setValue("items.0.unitPrice", matchedProduct.defaultPrice, setOptions);
      } else {
        form.setValue("items.0.productId", undefined, setOptions);
        form.setValue("items.0.productType", detected.productType, setOptions);
        form.setValue("items.0.productNameSnapshot", detected.productType, setOptions);
      }
    }
    if (detected.price !== undefined) form.setValue("items.0.unitPrice", detected.price, setOptions);
    if (detected.advanceAmount !== undefined) form.setValue("advancePayment", detected.advanceAmount, setOptions);
    if (detected.deliveryInstructions) form.setValue("specialNotes", detected.deliveryInstructions, setOptions);
  }

  async function checkDuplicate(phone: string) {
    if (phone.replace(/\D/g, "").length < 4) {
      setDuplicates([]);
      return;
    }
    setIsCheckingDuplicate(true);
    try {
      const response = await fetch(`/api/v1/customers/search?q=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const json = await response.json();
        setDuplicates(json.data ?? []);
      }
    } finally {
      setIsCheckingDuplicate(false);
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
      <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_22px_60px_-36px_rgba(41,62,43,0.55)]">
        <CardContent className="px-6 py-10 sm:px-10 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-[var(--success)]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="mt-5 text-sm font-medium text-[var(--success)]">Order created</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{created.orderNumber}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">The order is ready for labeling, payment tracking, and production.</p>
          </div>
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild className="rounded-xl">
              <Link href={`/labels/${created.id}`}>
                <Printer className="h-4 w-4" /> Print label
              </Link>
            </Button>
            <Button variant="secondary" className="rounded-xl" onClick={() => setCreated(null)}>
              <RotateCcw className="h-4 w-4" /> Create another order
            </Button>
            <Button asChild variant="secondary" className="rounded-xl">
              <Link href={`/orders/${created.id}`}>Open order</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]" noValidate>
      <div className="space-y-5">
        <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
          <CardHeader className="border-0 bg-transparent px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            <FormSectionHeader step="01" title="Paste message" helper="Optional quick start for Messenger, Instagram, or chat orders." />
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-6 pt-1 sm:px-6">
            <Textarea className="min-h-28 rounded-xl bg-[var(--surface-subtle)]" value={pasteText} onChange={(event) => { setPasteText(event.target.value); setDetected(null); }} placeholder="Paste a customer message here. We’ll pick out the name, phone, address, price, and notes." />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="rounded-lg" onClick={detectPaste} disabled={!pasteText.trim()}>
                <Search className="h-4 w-4" /> Detect values
              </Button>
              {hasDetectedValues ? (
                <Button type="button" className="rounded-lg" onClick={applyDetected}>
                  <Copy className="h-4 w-4" /> Apply {detectedValueCount} detected {detectedValueCount === 1 ? "value" : "values"}
                </Button>
              ) : null}
            </div>
            {hasDetectedValues && detected ? (
              <div className="rounded-xl bg-green-50 p-4 text-sm">
                <div className="flex items-center gap-2 font-medium text-[var(--success)]"><CheckCircle2 className="h-4 w-4" /> Values ready to review</div>
                <div className="mt-2 grid gap-x-5 gap-y-1 text-[var(--muted-foreground)] sm:grid-cols-2">
                  {detected.customerName ? <p>Name: <span className="text-[var(--foreground)]">{detected.customerName}</span></p> : null}
                  {detected.phone ? <p>Phone: <span className="text-[var(--foreground)]">{detected.phone}</span></p> : null}
                  {detected.alternativePhone ? <p>Alternative phone: <span className="text-[var(--foreground)]">{detected.alternativePhone}</span></p> : null}
                  {detected.productType ? <p>Product: <span className="text-[var(--foreground)]">{detected.productType}</span></p> : null}
                  {detected.address ? <p className="sm:col-span-2">Address: <span className="text-[var(--foreground)]">{detected.address}</span></p> : null}
                  {detected.price !== undefined ? <p>Price: <span className="text-[var(--foreground)]">{asCurrency(detected.price)}</span></p> : null}
                  {detected.advanceAmount !== undefined ? <p>Advance: <span className="text-[var(--foreground)]">{asCurrency(detected.advanceAmount)}</span></p> : null}
                  {detected.deliveryMethod ? <p>Method: <span className="text-[var(--foreground)]">{formatEnumLabel(detected.deliveryMethod)}</span></p> : null}
                  {detected.deliveryInstructions ? <p className="sm:col-span-2">Delivery notes: <span className="text-[var(--foreground)]">{detected.deliveryInstructions}</span></p> : null}
                </div>
              </div>
            ) : detected ? <p className="rounded-xl bg-[var(--surface-subtle)] p-4 text-sm text-[var(--muted-foreground)]">No order values were found. Add labels such as Name, Phone, Address, Product, Total, or Advance and try again.</p> : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
          <CardHeader className="border-0 bg-transparent px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            <FormSectionHeader step="02" title="Customer and item" helper="Add the details needed to identify and make the order." />
          </CardHeader>
          <CardContent className="grid gap-4 px-5 pb-6 pt-1 sm:px-6 md:grid-cols-2">
            <Field label="Customer name" required error={form.formState.errors.customerName?.message}>
              <Input autoComplete="name" autoFocus placeholder="Full name" {...form.register("customerName")} />
            </Field>
            <Field label="Phone number" required error={form.formState.errors.primaryPhone?.message}>
              <Input inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" {...form.register("primaryPhone")} onBlur={(event) => checkDuplicate(event.target.value)} />
              {isCheckingDuplicate ? <p className="text-xs text-[var(--muted-foreground)]">Checking previous orders…</p> : null}
            </Field>
            <Field label="Alternative phone">
              <Input inputMode="tel" autoComplete="tel" placeholder="Optional" {...form.register("alternativePhone")} />
            </Field>
            <Field label="Product" required>
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
                <option value="">{products.length ? "Custom / unmatched product" : "No active products available"}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Order source" required error={form.formState.errors.sourceId?.message}>
              <Select {...form.register("sourceId")}>
                <option value="">Select source</option>
                {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
              </Select>
            </Field>
            <Field label="Product type">
              <Input {...form.register("items.0.productType")} />
            </Field>
            <Field label="Quantity" required error={form.formState.errors.items?.[0]?.quantity?.message}>
              <Input type="number" min="1" inputMode="numeric" {...form.register("items.0.quantity", { valueAsNumber: true })} />
            </Field>
            <Field label="Unit price" required error={form.formState.errors.items?.[0]?.unitPrice?.message}>
              <Input type="number" min="0" inputMode="decimal" {...form.register("items.0.unitPrice", { valueAsNumber: true })} />
            </Field>
            <Field className="md:col-span-2" label="Personalization instructions">
              <Textarea className="min-h-22" placeholder="Name, size, color, or custom message" {...form.register("items.0.personalizationNotes")} />
            </Field>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
          <CardHeader className="border-0 bg-transparent px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            <FormSectionHeader step="03" title="Fulfilment" helper="Set the handoff method, deadline, and location." />
          </CardHeader>
          <CardContent className="grid gap-4 px-5 pb-6 pt-1 sm:px-6 md:grid-cols-2">
            <Field label="Delivery method" required>
              <Select {...form.register("deliveryMethod")}>
                <option value="DELIVERY">Delivery</option>
                <option value="PICKUP">Pickup</option>
                <option value="COURIER">Courier</option>
              </Select>
            </Field>
            <Field label="Required delivery date and time">
              <Input type="datetime-local" {...form.register("requiredDeliveryAt")} />
            </Field>
            {deliveryMethod === "PICKUP" ? (
              <Field label="Pickup location">
                <Input placeholder="Branch or collection point" {...form.register("pickupLocation")} />
              </Field>
            ) : (
              <Field className="md:col-span-2" label={deliveryMethod === "COURIER" ? "Courier address" : "Delivery address"}>
                <Textarea className="min-h-22" autoComplete="street-address" placeholder="Area, street, landmark, and any access instructions" {...form.register("deliveryAddress")} />
              </Field>
            )}
            <Field className="md:col-span-2" label="Special notes">
              <Textarea className="min-h-22" placeholder="Anything the team should know before processing this order" {...form.register("specialNotes")} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24">
        {duplicates.length ? (
          <Card className="rounded-[1.5rem] border-0 bg-[#fbefdf] shadow-[0_16px_42px_-32px_rgba(108,70,26,0.45)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--warning)]" /><p className="font-semibold">Existing customer found</p></div>
              <p className="mt-2 text-sm text-[#755a36]">Review recent orders before saving a possible duplicate.</p>
              <ul className="mt-3 space-y-1 text-sm">
                {duplicates.map((customer) => (
                  <li key={customer.id}>{customer.name}: {customer.orders.map((order) => order.orderNumber).join(", ")}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
        <Card className="overflow-hidden rounded-[1.75rem] border-0 shadow-[0_20px_56px_-34px_rgba(41,62,43,0.55)]">
          <CardHeader className="border-0 bg-transparent px-5 pb-3 pt-5">
            <FormSectionHeader step="04" title="Payment and total" helper="Review the amount due before saving." compact />
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 pt-1">
            <Field label="Discount">
              <Input type="number" min="0" inputMode="decimal" {...form.register("discount", { valueAsNumber: true })} />
            </Field>
            <Field label="Delivery charge">
              <Input type="number" min="0" inputMode="decimal" {...form.register("deliveryCharge", { valueAsNumber: true })} />
            </Field>
            <Field label="Advance payment">
              <Input type="number" min="0" inputMode="decimal" {...form.register("advancePayment", { valueAsNumber: true })} />
            </Field>
            {Number(advancePayment) > 0 ? (
              <Field label="Advance received by" required>
                <Select {...form.register("advanceReceivedByUserId")}>
                  <option value="">Select staff member</option>
                  {staffMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </Select>
                <p className="text-xs text-[var(--muted-foreground)]">Choose who actually took the advance, even if another person is entering the order.</p>
              </Field>
            ) : null}
            <Field label="Payment method">
              <Select {...form.register("paymentMethod")}>
                {["CASH", "ESEWA", "KHALTI", "FONEPAY", "BANK_TRANSFER", "COD", "OTHER"].map((method) => (
                  <option key={method} value={method}>{formatEnumLabel(method)}</option>
                ))}
              </Select>
            </Field>
            <div className="rounded-2xl bg-[var(--primary)] p-4 text-sm text-white shadow-[0_18px_42px_-28px_color-mix(in_srgb,var(--primary)_90%,transparent)]">
              <div className="flex justify-between text-white/65"><span>Subtotal</span><span className="tabular-nums">{asCurrency(subtotal)}</span></div>
              {Number(discount) > 0 ? <div className="mt-2 flex justify-between text-white/65"><span>Discount</span><span className="tabular-nums">− {asCurrency(Number(discount))}</span></div> : null}
              {Number(deliveryCharge) > 0 ? <div className="mt-2 flex justify-between text-white/65"><span>Delivery</span><span className="tabular-nums">{asCurrency(Number(deliveryCharge))}</span></div> : null}
              <div className="mt-3 flex justify-between border-t border-white/15 pt-3 text-base font-semibold"><span>Total</span><span className="tabular-nums">{asCurrency(total)}</span></div>
              <div className="mt-3 flex justify-between rounded-xl bg-white/10 px-3 py-2"><span>Balance due</span><strong className="tabular-nums">{asCurrency(balance)}</strong></div>
            </div>
            <Button className="h-12 w-full rounded-xl" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save order"}
            </Button>
            <p className="text-center text-xs text-[var(--muted-foreground)]">Review required fields before saving.</p>
            {submitError ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{submitError}</p> : null}
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function FormSectionHeader({ step, title, helper, compact }: { step: string; title: string; helper: string; compact?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)] text-xs font-semibold tabular-nums text-[var(--primary)]">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className={compact ? "font-semibold" : "text-base font-semibold tracking-[-0.01em]"}>{title}</h2>
        <p className="mt-0.5 text-sm leading-5 text-[var(--muted-foreground)]">{helper}</p>
      </div>
    </div>
  );
}

function Field({ label, required, error, children, className }: { label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}{required ? <span className="ml-1 text-[var(--danger)]" aria-label="required">*</span> : null}</Label>
      {children}
      {error ? <p className="text-xs text-[var(--danger)]" role="alert">{error}</p> : null}
    </div>
  );
}

function findMatchingProduct(products: Product[], detectedProduct: string) {
  const detected = normaliseProductName(detectedProduct);
  if (!detected) return undefined;
  const detectedTokens = new Set(detected.split(" ").filter(Boolean));

  const ranked = products.map((product, index) => {
    const candidate = normaliseProductName(`${product.name} ${product.productType}`);
    const candidateTokens = new Set(candidate.split(" ").filter(Boolean));
    const sharedTokens = [...detectedTokens].filter((token) => candidateTokens.has(token));
    const phraseBonus = candidate.includes(detected) || detected.includes(candidate) ? 20 : 0;
    return { product, index, score: sharedTokens.length * 10 + phraseBonus };
  }).sort((left, right) => right.score - left.score || left.index - right.index);

  return ranked[0] && ranked[0].score > 0 ? ranked[0].product : undefined;
}

function normaliseProductName(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/key\s*chain/g, "keyring")
    .replace(/key\s*ring/g, "keyring")
    .replace(/single\s*side/g, "single side")
    .replace(/double\s*side/g, "double side")
    .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
    .replace(/\b(?:a|an|the|want|need|please|product|item)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
