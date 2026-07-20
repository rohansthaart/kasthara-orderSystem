import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AppNavLinks } from "@/components/app-nav-links";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/orders/new", label: "New Order", icon: "plus" },
  { href: "/orders", label: "Orders", icon: "orders" },
  { href: "/queues", label: "Queues", icon: "queues" },
  { href: "/payments", label: "Payments", icon: "payments" },
  { href: "/admin/import", label: "Import", icon: "import" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const visibleNav = nav.filter((item) => user.role === "ADMIN" || !item.href.startsWith("/admin"));
  return (
    <div className="flex min-h-dvh bg-[var(--background)]">
      <aside className="no-print hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] lg:block">
        <div className="border-b border-[var(--border)] p-5">
          <Link href="/dashboard" className="block text-xl font-semibold text-[var(--foreground)]">
            Kasthara
          </Link>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Order operations</p>
        </div>
        <AppNavLinks items={visibleNav} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <MobileNavDrawer items={visibleNav} userName={user.name} userRole={user.role} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{user.role}</p>
              </div>
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
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
