"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintLogger({ orderId }: { orderId: string }) {
  async function print() {
    await fetch(`/api/v1/orders/${orderId}/print-log`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ printType: "LABEL", copyNumber: 1 }),
    });
    window.print();
  }
  return <Button onClick={print}><Printer className="h-4 w-4" /> Print label</Button>;
}
