import { Slot } from "@radix-ui/react-slot";
import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({ className, variant = "primary", size = "md", asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        variant === "primary" && "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:bg-[var(--primary-hover)]",
        variant === "secondary" && "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm hover:bg-[var(--muted)]",
        variant === "ghost" && "text-[var(--foreground)] hover:bg-[var(--muted)]",
        variant === "danger" && "bg-[var(--danger)] text-white shadow-sm hover:bg-[var(--danger-hover)]",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-base",
        size === "icon" && "h-10 w-10",
        className,
      )}
      {...props}
    />
  );
}
