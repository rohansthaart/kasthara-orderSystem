export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse space-y-6 pb-8" role="status" aria-label="Loading orders">
      <span className="sr-only">Loading orders</span>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3"><Skeleton className="h-4 w-36" /><Skeleton className="h-10 w-80 max-w-full" /><Skeleton className="h-4 w-[32rem] max-w-full" /></div>
        <div className="flex gap-2"><Skeleton className="h-11 w-32 rounded-xl" /><Skeleton className="h-11 w-32 rounded-xl" /></div>
      </div>
      <div className="rounded-[1.5rem] bg-[var(--surface)] p-4">
        <div className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_130px_auto]">
          <Skeleton className="h-11 rounded-xl" />{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-11 rounded-xl" />)}
        </div>
        <div className="mt-3 flex justify-between"><Skeleton className="h-3 w-44" /><Skeleton className="h-3 w-16" /></div>
      </div>
      <Skeleton className="h-14 rounded-2xl" />
      <div className="space-y-3 lg:hidden">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-64 rounded-[1.25rem]" />)}</div>
      <div className="hidden overflow-hidden rounded-[1.5rem] bg-[var(--surface)] lg:block">
        <Skeleton className="h-12 rounded-none bg-[var(--muted)]" />
        {Array.from({ length: 6 }, (_, index) => <div key={index} className="grid grid-cols-[3fr_2fr_2fr_2fr_3fr] gap-5 border-b border-[var(--border)] p-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>)}
      </div>
    </div>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`rounded-lg bg-[var(--muted)] ${className}`} />;
}
