"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

type PreviewRow = { rowNumber: number; data: Record<string, string>; errors: string[]; warnings: string[] };

export function ImportPreviewForm() {
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(formData: FormData) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/v1/import/preview", { method: "POST", body: formData });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Preview failed");
        return;
      }
      setRows(json.data);
      setMessage(`${json.data.length} rows previewed.`);
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/v1/import/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Import failed");
        return;
      }
      setMessage(`Imported ${json.data.count} orders.`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <form action={submit} className="flex flex-col gap-3 sm:flex-row">
            <input className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 text-sm shadow-sm" type="file" name="file" accept=".xlsx" />
            <Button type="submit" disabled={busy}>{busy ? "Working..." : "Preview import"}</Button>
          </form>
          {message ? <p className="mt-3 text-sm text-[var(--success)]">{message}</p> : null}
          {error ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </CardContent>
      </Card>
      {rows.length ? (
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--border)] p-3">
            <p className="text-sm text-[var(--muted-foreground)]">{rows.filter((row) => row.errors.length === 0).length} valid rows ready to import.</p>
            <Button type="button" onClick={commit} disabled={busy}>Import valid rows</Button>
          </div>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead><tr><Th>Row</Th><Th>Order ID</Th><Th>Customer</Th><Th>Phone</Th><Th>Errors</Th><Th>Warnings</Th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber} className="hover:bg-[var(--surface-subtle)]">
                    <Td>{row.rowNumber}</Td>
                    <Td>{row.data["Order ID"]}</Td>
                    <Td>{row.data["Customer Name"]}</Td>
                    <Td>{row.data["Phone Number"]}</Td>
                    <Td className="text-red-700">{row.errors.join(", ") || "-"}</Td>
                    <Td className="text-amber-700">{row.warnings.join(", ") || "-"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
