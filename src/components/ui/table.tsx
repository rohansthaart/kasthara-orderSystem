import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full text-left text-sm", className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("border-b border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-3 text-xs font-semibold uppercase text-[var(--muted-foreground)]", className)} {...props} />;
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-[var(--border)] px-3 py-3 align-top", className)} {...props} />;
}
