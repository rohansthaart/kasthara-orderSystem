"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Package, Plus, Settings, Upload, Users, WalletCards, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  plus: Plus,
  orders: ClipboardList,
  queues: Package,
  payments: WalletCards,
  import: Upload,
  users: Users,
  settings: Settings,
};

export function AppNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 p-3">
      {items.map((item) => {
        const Icon = icons[item.icon] ?? ClipboardList;
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
