"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusQuickActions } from "@/components/status-quick-actions";
import { formatEnumLabel } from "@/components/ui/status-badge";
import { ORDER_STAGES, type OrderStageValue } from "@/lib/constants";

export function StatusForm({ orderId, currentStage }: { orderId: string; currentStage: OrderStageValue }) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(formData: FormData) {
    setError("");
    const response = await fetch(`/api/v1/orders/${orderId}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderStage: formData.get("orderStage"),
        notes: formData.get("notes"),
      }),
    });
    if (!response.ok) {
      setError("Could not update status");
      return;
    }
    router.refresh();
  }
  return (
    <Card>
      <CardHeader><h2 className="font-semibold">Status</h2></CardHeader>
      <CardContent>
        <div className="mb-4 rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3">
          <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">Quick action</p>
          <StatusQuickActions orderId={orderId} currentStage={currentStage} />
        </div>
        <form action={submit} className="space-y-3">
          <div className="space-y-2">
            <Label>Order stage</Label>
            <Select name="orderStage" defaultValue={currentStage}>
              {ORDER_STAGES.map((stage) => <option key={stage} value={stage}>{formatEnumLabel(stage)}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <input name="notes" className="h-11 w-full rounded-md border border-[var(--border)] px-3 text-sm" />
          </div>
          <Button className="w-full" type="submit" variant="secondary">Update with note</Button>
          {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
