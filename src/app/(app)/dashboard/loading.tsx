export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse space-y-8 pb-8" aria-label="Loading dashboard">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-48 rounded bg-[var(--muted)]" />
          <div className="h-10 w-72 max-w-full rounded-lg bg-[var(--muted)]" />
          <div className="h-4 w-96 max-w-full rounded bg-[var(--muted)]" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-36 rounded-xl bg-[var(--muted)]" />
          <div className="h-11 w-32 rounded-xl bg-[var(--muted)]" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="h-[360px] rounded-[1.75rem] bg-[var(--primary)]/90" />
        <div className="h-[360px] rounded-[1.75rem] bg-[var(--surface)]" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <div className="h-64 rounded-[1.75rem] bg-[var(--surface)]" />
        <div className="h-64 rounded-[1.75rem] bg-[#e9e1d2]" />
      </div>

      <div className="space-y-4 pt-2">
        <div className="h-7 w-48 rounded bg-[var(--muted)]" />
        <div className="h-[340px] rounded-[1.75rem] bg-[var(--surface)]" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-80 rounded-[1.75rem] bg-[var(--surface)]" />
          <div className="h-80 rounded-[1.75rem] bg-[var(--surface)]" />
        </div>
      </div>
    </div>
  );
}
