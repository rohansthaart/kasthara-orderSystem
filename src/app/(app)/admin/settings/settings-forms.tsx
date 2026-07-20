"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Package, Plus, Printer, Radio, Ruler, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { asCurrency } from "@/lib/utils";
import { mmToDots, qrSizeMm, type LabelSettings } from "@/lib/label-settings";

type Product = { id: string; name: string; productType: string; defaultPrice: number; isActive: boolean };
type Source = { id: string; name: string; isActive: boolean };
type CatalogItem = { id: string; title: string; detail?: string; isActive: boolean };

const labelPresets = [
  { label: "48 × 30", widthMm: 48, heightMm: 30 },
  { label: "50 × 30", widthMm: 50, heightMm: 30 },
  { label: "60 × 40", widthMm: 60, heightMm: 40 },
  { label: "100 × 150", widthMm: 100, heightMm: 150 },
];

export function SettingsForms({ products, sources, labelSettings }: { products: Product[]; sources: Source[]; labelSettings: LabelSettings }) {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-medium text-[var(--primary)]">Administration</p>
        <h1 className="mt-1 text-2xl font-semibold">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">Configure label output and keep order-entry choices accurate.</p>
      </header>

      <LabelSettingsCard initialSettings={labelSettings} />

      <section aria-labelledby="catalog-heading" className="space-y-3">
        <div>
          <h2 id="catalog-heading" className="text-lg font-semibold">Order catalog</h2>
          <p className="text-sm text-[var(--muted-foreground)]">These choices appear when staff create an order.</p>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <CatalogCard
            title="Products"
            description="Names, product types, and starting prices."
            icon={<Package className="h-4 w-4" />}
            items={products.map((product) => ({ id: product.id, title: product.name, detail: `${product.productType} · ${asCurrency(product.defaultPrice)}`, isActive: product.isActive }))}
            endpoint="/api/v1/products"
            fields={[{ name: "name", label: "Product name" }, { name: "productType", label: "Product type" }, { name: "defaultPrice", label: "Default price", type: "number" }]}
          />
          <CatalogCard
            title="Order sources"
            description="Where customers discovered or contacted you."
            icon={<Radio className="h-4 w-4" />}
            items={sources.map((source) => ({ id: source.id, title: source.name, isActive: source.isActive }))}
            endpoint="/api/v1/order-sources"
            fields={[{ name: "name", label: "Source name" }]}
          />
        </div>
      </section>
    </div>
  );
}

function LabelSettingsCard({ initialSettings }: { initialSettings: LabelSettings }) {
  const [values, setValues] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const widthDots = mmToDots(values.widthMm, values.dpi);
  const heightDots = mmToDots(values.heightMm, values.dpi);
  const previewQrSize = qrSizeMm(values);
  const previewScale = Math.min(250 / Math.max(1, values.widthMm), 190 / Math.max(1, values.heightMm));
  const previewWidth = Math.max(24, values.widthMm * previewScale);
  const previewHeight = Math.max(24, values.heightMm * previewScale);

  function setNumber(field: keyof Pick<LabelSettings, "widthMm" | "heightMm" | "marginMm" | "fontSize" | "dpi">, value: string) {
    setSaved(false);
    setValues((current) => ({ ...current, [field]: Number(value) }));
  }

  function setBoolean(field: keyof Pick<LabelSettings, "showAddress" | "showNotes" | "showBalance" | "showRequiredAt">, value: boolean) {
    setSaved(false);
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (values.marginMm * 2 >= Math.min(values.widthMm, values.heightMm)) {
      setError("Margin is too large for this label size.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/v1/settings/label", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Could not save label settings");
        return;
      }
      setSaved(true);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 border-b border-[var(--border)]">
        <div className="mt-0.5 rounded-md bg-[var(--surface-subtle)] p-2 text-[var(--primary)]"><Printer className="h-5 w-5" /></div>
        <div>
          <h2 className="font-semibold">Printer and label</h2>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">Saved dimensions control the preview, print page, QR resolution, and downloaded PDF.</p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={save} className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Common sizes</legend>
            <div className="flex flex-wrap gap-2">
              {labelPresets.map((preset) => {
                const selected = values.widthMm === preset.widthMm && values.heightMm === preset.heightMm;
                return (
                  <Button
                    key={preset.label}
                    type="button"
                    size="sm"
                    variant={selected ? "primary" : "secondary"}
                    onClick={() => { setSaved(false); setValues((current) => ({ ...current, widthMm: preset.widthMm, heightMm: preset.heightMm })); }}
                  >
                    {preset.label} mm
                  </Button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SettingField label="Width" hint="20–150 mm">
              <Input type="number" min="20" max="150" required value={values.widthMm} onChange={(event) => setNumber("widthMm", event.target.value)} />
            </SettingField>
            <SettingField label="Height" hint="15–150 mm">
              <Input type="number" min="15" max="150" required value={values.heightMm} onChange={(event) => setNumber("heightMm", event.target.value)} />
            </SettingField>
            <SettingField label="Printer DPI" hint="JP-PT265: 203">
              <Input type="number" min="150" max="600" required value={values.dpi} onChange={(event) => setNumber("dpi", event.target.value)} />
            </SettingField>
            <SettingField label="Inner margin" hint="0–10 mm">
              <Input type="number" min="0" max="10" required value={values.marginMm} onChange={(event) => setNumber("marginMm", event.target.value)} />
            </SettingField>
            <SettingField label="Base text size" hint="6–18 px">
              <Input type="number" min="6" max="18" required value={values.fontSize} onChange={(event) => setNumber("fontSize", event.target.value)} />
            </SettingField>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">Information to print</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckSetting label="Delivery address" checked={values.showAddress} onChange={(checked) => setBoolean("showAddress", checked)} />
              <CheckSetting label="Special notes" checked={values.showNotes} onChange={(checked) => setBoolean("showNotes", checked)} />
              <CheckSetting label="Remaining balance" checked={values.showBalance} onChange={(checked) => setBoolean("showBalance", checked)} />
              <CheckSetting label="Required date" checked={values.showRequiredAt} onChange={(checked) => setBoolean("showRequiredAt", checked)} />
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
            <Button type="submit" disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save label settings"}</Button>
            {saved ? <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--success)]" role="status"><CheckCircle2 className="h-4 w-4" />Settings saved</p> : null}
            {error ? <p className="text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
          </div>
        </form>

        <aside className="space-y-3 lg:border-l lg:border-[var(--border)] lg:pl-6">
          <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-[var(--primary)]" /><h3 className="text-sm font-semibold">Output preview</h3></div>
          <div className="flex min-h-52 items-center justify-center rounded-lg bg-[var(--surface-subtle)] p-5">
            <div
              className="relative overflow-hidden border border-[var(--border-strong)] bg-white p-3 text-black shadow-sm"
              style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
            >
              <div className="flex justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-[8px] font-bold">KASTHARA</p>
                  <p className="truncate text-[7px] font-semibold">KAS-260720-001</p>
                  <p className="truncate text-[8px] font-bold">Customer Name</p>
                  <p className="text-[8px] font-bold">98XXXXXXXX</p>
                  {values.showBalance ? <p className="truncate text-[7px] font-semibold">Balance: NPR 500</p> : null}
                </div>
                <div className="grid shrink-0 place-items-center border-[3px] border-black bg-white text-[7px] font-black" style={{ width: `${Math.min(38, previewQrSize * 2.2)}px`, aspectRatio: "1" }}>QR</div>
              </div>
              <div className="absolute inset-x-3 bottom-2 border-t border-black pt-1 text-[6px] font-semibold">Product x1</div>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-[var(--surface-subtle)] p-3"><dt className="text-xs text-[var(--muted-foreground)]">Print page</dt><dd className="mt-0.5 font-semibold">{values.widthMm} × {values.heightMm} mm</dd></div>
            <div className="rounded-md bg-[var(--surface-subtle)] p-3"><dt className="text-xs text-[var(--muted-foreground)]">Raster size</dt><dd className="mt-0.5 font-semibold">{widthDots} × {heightDots} dots</dd></div>
          </dl>
          <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">The printer driver must use the same paper dimensions and 100% scale.</p>
        </aside>
      </CardContent>
    </Card>
  );
}

function SettingField({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}<p className="text-xs text-[var(--muted-foreground)]">{hint}</p></div>;
}

function CheckSetting({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--border)] px-3 py-2.5 text-sm font-medium hover:bg-[var(--surface-subtle)]">
      <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function CatalogCard({ title, description, icon, items, endpoint, fields }: { title: string; description: string; icon: React.ReactNode; items: CatalogItem[]; endpoint: string; fields: Array<{ name: string; label: string; type?: string }> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body: Record<string, unknown> = { ...values };
    if ("defaultPrice" in body) body.defaultPrice = Number(body.defaultPrice);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Could not save this item");
        return;
      }
      setValues({});
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 border-b border-[var(--border)]">
        <div className="rounded-md bg-[var(--surface-subtle)] p-2 text-[var(--primary)]">{icon}</div>
        <div><h3 className="font-semibold">{title}</h3><p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{description}</p></div>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <ul className="max-h-64 divide-y divide-[var(--border)] overflow-auto">
          {items.length ? items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p>{item.detail ? <p className="truncate text-xs text-[var(--muted-foreground)]">{item.detail}</p> : null}</div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.isActive ? "Active" : "Inactive"}</span>
            </li>
          )) : <li className="py-6 text-center text-sm text-[var(--muted-foreground)]">Nothing added yet.</li>}
        </ul>

        <form onSubmit={save} className="space-y-3 border-t border-[var(--border)] pt-4">
          <h4 className="text-sm font-semibold">Add {title === "Products" ? "product" : "source"}</h4>
          <div className={`grid gap-3 ${fields.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {fields.map((field) => (
              <div className={field.name === "name" && fields.length === 3 ? "sm:col-span-2" : ""} key={field.name}>
                <Label>{field.label}<span className="ml-1 text-[var(--danger)]">*</span></Label>
                <Input className="mt-1.5" type={field.type} min={field.type === "number" ? "0" : undefined} required value={values[field.name] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} />
              </div>
            ))}
          </div>
          <Button type="submit" size="sm" disabled={saving}><Plus className="h-4 w-4" />{saving ? "Adding..." : "Add"}</Button>
          {error ? <p className="text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
