"use client";

import { useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ORDER_STAGES, type OrderStageValue } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatEnumLabel } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const nextStageByStage: Partial<Record<OrderStageValue, OrderStageValue>> = {
  NEW: "CONFIRMED",
  CONFIRMED: "DESIGN_PENDING",
  DESIGN_PENDING: "DESIGN_SENT",
  DESIGN_SENT: "DESIGN_APPROVED",
  DESIGN_APPROVED: "IN_PRODUCTION",
  IN_PRODUCTION: "READY_TO_PACK",
  READY_TO_PACK: "PACKED",
  PACKED: "PICKUP_READY",
  PICKUP_READY: "DELIVERED",
  SHIPPED: "DELIVERED",
  ON_HOLD: "CONFIRMED",
};

type StatusQuickActionsProps = {
  orderId: string;
  currentStage?: OrderStageValue | string;
  suggestedStage?: OrderStageValue | string;
  compact?: boolean;
  className?: string;
};

export function StatusQuickActions({ orderId, currentStage, suggestedStage, compact, className }: StatusQuickActionsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [selected, setSelected] = useState<string>(suggestedStage ?? nextStageByStage[currentStage as OrderStageValue] ?? "CONFIRMED");
  const [message, setMessage] = useState("");

  const primaryStage = suggestedStage ?? nextStageByStage[currentStage as OrderStageValue];
  const selectOptions = useMemo(() => ORDER_STAGES.filter((stage) => stage !== currentStage), [currentStage]);

  async function updateStatus(stage: string, notes = "Updated from quick actions") {
    setMessage("");
    setIsPending(true);
    try {
      const response = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderStage: stage, notes }),
      });
      if (!response.ok) {
        setMessage("Could not update");
        return;
      }
      setMessage("Updated");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className={cn("flex gap-2", compact ? "flex-col sm:flex-row" : "flex-col")}>
        {primaryStage ? (
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => updateStatus(primaryStage, "Updated from quick action")}
            className={compact ? "whitespace-nowrap" : "w-full"}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {formatEnumLabel(primaryStage)}
          </Button>
        ) : null}
        <div className={cn("flex gap-2", compact ? "min-w-0" : "")}>
          <Select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            disabled={isPending}
            className={cn("h-9 min-w-0 text-xs", compact ? "w-36" : "flex-1")}
          >
            {selectOptions.map((stage) => (
              <option key={stage} value={stage}>
                {formatEnumLabel(stage)}
              </option>
            ))}
          </Select>
          <Button type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => updateStatus(selected)}>
            Set
          </Button>
        </div>
      </div>
      {message ? (
        <p className={cn("text-xs", message === "Updated" ? "text-[var(--success)]" : "text-[var(--danger)]")}>{message}</p>
      ) : null}
    </div>
  );
}
