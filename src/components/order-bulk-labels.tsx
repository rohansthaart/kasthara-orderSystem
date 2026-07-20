"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrderBulkLabels({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [selected, setSelected] = useState(0);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ids = new FormData(event.currentTarget).getAll("orderId").map(String);
    if (ids.length) router.push(`/labels/bulk?ids=${encodeURIComponent(ids.join(","))}`);
  }
  return (
    <form
      onSubmit={submit}
      onChange={(event) => setSelected(new FormData(event.currentTarget).getAll("orderId").length)}
      className="space-y-3"
    >
      <div className="sticky top-[4.5rem] z-20 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-white/70 bg-[var(--surface)]/95 px-4 shadow-[0_16px_42px_-28px_rgba(41,62,43,0.55)] backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`h-2 w-2 shrink-0 rounded-full ${selected ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{selected ? `${selected} order${selected === 1 ? "" : "s"} selected` : "Bulk label preparation"}</p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">{selected ? "Download printable labels for this selection." : "Select orders from the list below."}</p>
          </div>
        </div>
        <Button type="submit" variant="secondary" size="sm" className="shrink-0 rounded-lg" disabled={!selected}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download labels</span>
          <span className="sm:hidden">Labels</span>
        </Button>
      </div>
      {children}
    </form>
  );
}
