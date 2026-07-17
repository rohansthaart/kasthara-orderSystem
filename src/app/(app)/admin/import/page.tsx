import { ImportPreviewForm } from "./preview-form";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Excel import</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Preview old Excel files, validate each row, then import valid records.</p>
      </div>
      <ImportPreviewForm />
    </div>
  );
}
