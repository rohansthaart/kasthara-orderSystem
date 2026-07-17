import { type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]",
        className,
      )}
      {...props}
    />
  );
}
