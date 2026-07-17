"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ClipboardList, LayoutDashboard, Menu, Package, Plus, Upload, Users, WalletCards, X, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
};

export function MobileNavDrawer({ items, userName, userRole }: { items: NavItem[]; userName: string; userRole: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="secondary" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(86vw,22rem)] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-2xl outline-none transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] p-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">Kasthara</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-[var(--muted-foreground)]">
                {userName} / {userRole}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close navigation">
                <X className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {items.map((item) => {
              const Icon = icons[item.icon] ?? ClipboardList;
              const active = pathname === "/orders/new" ? item.href === "/orders/new" : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    active ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--foreground)] hover:bg-[var(--muted)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
