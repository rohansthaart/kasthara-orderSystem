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
    <Card className="overflow-hidden rounded-[1.5rem] border-0 shadow-[0_18px_50px_-34px_rgba(41,62,43,0.5)]">
      <CardHeader className="border-0 bg-transparent px-5 pb-2 pt-5"><h2 className="font-semibold">Move order forward</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Use the suggested next step or set a specific stage.</p></CardHeader>
      <CardContent className="px-5 pb-5 pt-2">
        <div className="mb-4 rounded-2xl bg-[var(--surface-subtle)] p-3">
          <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">Suggested action</p>
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
            <input name="notes" placeholder="Why is this changing?" className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]" />
          </div>
          <Button className="w-full rounded-xl" type="submit" variant="secondary">Update with note</Button>
          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
