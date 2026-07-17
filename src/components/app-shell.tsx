import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, LayoutDashboard, Package, Plus, Upload, Users, WalletCards } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders/new", label: "New Order", icon: Plus },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/queues", label: "Queues", icon: Package },
  { href: "/payments", label: "Payments", icon: WalletCards },
  { href: "/admin/import", label: "Import", icon: Upload },
  { href: "/admin/users", label: "Users", icon: Users },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="flex min-h-dvh bg-[var(--background)]">
      <aside className="no-print hidden w-64 shrink-0 border-r border-[var(--border)] bg-white lg:block">
        <div className="border-b border-[var(--border)] p-5">
          <Link href="/dashboard" className="block text-xl font-semibold text-[#162218]">
            Kasthara
          </Link>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Order operations</p>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            if (user.role !== "ADMIN" && item.href.startsWith("/admin")) return null;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium hover:bg-[var(--muted)]">
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-10 border-b border-[var(--border)] bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{user.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm">
                <Link href="/orders/new">New Order</Link>
              </Button>
              <form action="/api/v1/auth/logout" method="post">
                <Button variant="secondary" size="sm" type="submit">
                  Logout
                </Button>
              </form>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {nav.map((item) => {
              if (user.role !== "ADMIN" && item.href.startsWith("/admin")) return null;
              return (
                <Link key={item.href} href={item.href} className="shrink-0 rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
