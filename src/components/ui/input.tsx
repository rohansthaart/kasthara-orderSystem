import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm shadow-sm transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]",
        className,
      )}
      {...props}
    />
  );
}
