export default function OrderDetailsLoading() {
  return (
    <div className="mx-auto max-w-[1500px] animate-pulse space-y-6 pb-8" role="status" aria-label="Loading order details">
      <span className="sr-only">Loading order details</span>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-72 max-w-full" /><Skeleton className="h-4 w-80 max-w-full" /></div>
        <div className="flex gap-2"><Skeleton className="h-11 w-36 rounded-xl" /><Skeleton className="h-11 w-36 rounded-xl" /></div>
      </div>
      <div className="grid min-h-40 gap-5 rounded-[1.75rem] bg-[var(--primary)] p-6 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex gap-3"><div className="h-9 w-9 rounded-xl bg-white/10" /><div className="flex-1 space-y-2"><div className="h-3 w-20 rounded bg-white/10" /><div className="h-4 w-28 rounded bg-white/15" /><div className="h-3 w-24 rounded bg-white/10" /></div></div>)}</div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5"><Panel className="h-80" /><Panel className="h-72" /><Panel className="h-80" /></div>
        <div className="space-y-4 xl:sticky xl:top-24"><Panel className="h-80" /><Panel className="h-72" /><Panel className="h-[30rem]" /></div>
      </div>
    </div>
  );
}

function Panel({ className }: { className: string }) {
  return <div className={`rounded-[1.5rem] bg-[var(--surface)] p-5 ${className}`}><Skeleton className="h-5 w-40" /><Skeleton className="mt-2 h-3 w-64 max-w-full" /><div className="mt-7 space-y-4"><Skeleton className="h-12 rounded-xl" /><Skeleton className="h-12 rounded-xl" /><Skeleton className="h-12 rounded-xl" /></div></div>;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`rounded-lg bg-[var(--muted)] ${className}`} />;
}
