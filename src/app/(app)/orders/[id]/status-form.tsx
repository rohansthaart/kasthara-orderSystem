"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ORDER_STAGES, type OrderStageValue } from "@/lib/constants";

export function StatusForm({ orderId, currentStage }: { orderId: string; currentStage: OrderStageValue }) {
  const router = useRouter();
  async function submit(formData: FormData) {
    const response = await fetch(`/api/v1/orders/${orderId}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderStage: formData.get("orderStage"),
        notes: formData.get("notes"),
      }),
    });
    if (!response.ok) alert("Could not update status");
    router.refresh();
  }
  return (
    <Card>
      <CardHeader><h2 className="font-semibold">Change status</h2></CardHeader>
      <CardContent>
        <form action={submit} className="space-y-3">
          <div className="space-y-2">
            <Label>Order stage</Label>
            <select name="orderStage" defaultValue={currentStage} className="h-11 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm">
              {ORDER_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <input name="notes" className="h-11 w-full rounded-md border border-[var(--border)] px-3 text-sm" />
          </div>
          <Button className="w-full" type="submit">Update stage</Button>
        </form>
      </CardContent>
    </Card>
  );
}
