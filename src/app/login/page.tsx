import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--background)] px-4">
      <section className="w-full max-w-md rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Kasthara</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Sign in to manage orders, labels, payments, and queues.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
