export default function NewOrderLoading() {
  return (
    <div className="mx-auto max-w-[1500px] animate-pulse space-y-6 pb-8" role="status" aria-label="Loading new order form">
      <span className="sr-only">Loading new order form</span>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-80 max-w-full" /><Skeleton className="h-4 w-[30rem] max-w-full" /></div>
        <Skeleton className="h-12 w-44 rounded-xl" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <FormPanel height="h-64" />
          <FormPanel height="h-[34rem]" />
          <FormPanel height="h-[28rem]" />
        </div>
        <div className="xl:sticky xl:top-24"><FormPanel height="h-[38rem]" /></div>
      </div>
    </div>
  );
}

function FormPanel({ height }: { height: string }) {
  return <div className={`rounded-[1.75rem] bg-[var(--surface)] p-6 ${height}`}><div className="flex gap-3"><Skeleton className="h-9 w-9 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-64 max-w-full" /></div></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Skeleton className="h-11 rounded-xl" /><Skeleton className="h-11 rounded-xl" /><Skeleton className="h-11 rounded-xl" /><Skeleton className="h-11 rounded-xl" /></div></div>;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`rounded-lg bg-[var(--muted)] ${className}`} />;
}
