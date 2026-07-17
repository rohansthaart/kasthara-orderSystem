import { PackageOpen } from "lucide-react";
import { Card, CardContent } from "./card";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <PackageOpen className="h-10 w-10 text-[var(--muted-foreground)]" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}
