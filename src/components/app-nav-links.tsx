"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function AppNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 p-3">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === "/orders/new" ? item.href === "/orders/new" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              active
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--foreground)] hover:bg-[var(--muted)]",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
