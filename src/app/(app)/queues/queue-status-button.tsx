"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function QueueStatusButton({ orderId, orderStage }: { orderId: string; orderStage: string }) {
  const router = useRouter();
  async function update() {
    await fetch(`/api/v1/orders/${orderId}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderStage, notes: "Updated from queue" }),
    });
    router.refresh();
  }
  return <Button size="sm" variant="secondary" onClick={update}>{orderStage.replaceAll("_", " ")}</Button>;
}
