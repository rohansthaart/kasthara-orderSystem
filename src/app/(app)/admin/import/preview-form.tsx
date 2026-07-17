"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

type PreviewRow = { rowNumber: number; data: Record<string, string>; errors: string[]; warnings: string[] };

export function ImportPreviewForm() {
  const [rows, setRows] = useState<PreviewRow[]>([]);
  async function submit(formData: FormData) {
    const response = await fetch("/api/v1/import/preview", { method: "POST", body: formData });
    const json = await response.json();
    if (!response.ok) {
      alert(json.message ?? "Preview failed");
      return;
    }
    setRows(json.data);
  }
  async function commit() {
    const response = await fetch("/api/v1/import/commit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const json = await response.json();
    if (!response.ok) {
      alert(json.message ?? "Import failed");
      return;
    }
    alert(`Imported ${json.data.count} orders`);
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <form action={submit} className="flex flex-col gap-3 sm:flex-row">
            <input className="rounded-md border border-[var(--border)] bg-white p-2 text-sm" type="file" name="file" accept=".xlsx" />
            <Button type="submit">Preview import</Button>
          </form>
        </CardContent>
      </Card>
      {rows.length ? (
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--border)] p-3">
            <p className="text-sm text-[var(--muted-foreground)]">{rows.filter((row) => row.errors.length === 0).length} valid rows ready to import.</p>
            <Button type="button" onClick={commit}>Import valid rows</Button>
          </div>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead><tr><Th>Row</Th><Th>Order ID</Th><Th>Customer</Th><Th>Phone</Th><Th>Errors</Th><Th>Warnings</Th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber}>
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
