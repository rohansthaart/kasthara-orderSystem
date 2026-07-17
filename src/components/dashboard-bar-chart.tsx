"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { asCurrency } from "@/lib/utils";

type ChartRow = {
  label: string;
  value: number;
  meta?: string;
};

type TooltipPayload = {
  payload?: ChartRow & { percent?: number };
};

export function DashboardBarChart({ rows, money }: { rows: ChartRow[]; money?: boolean }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const data = [...rows]
    .sort((a, b) => b.value - a.value)
    .map((row) => ({
      ...row,
      percent: total > 0 ? Math.round((row.value / total) * 100) : 0,
    }));

  if (data.length === 0) {
    return <p className="text-sm text-[var(--muted-foreground)]">No data recorded for this view yet.</p>;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 10 }} barCategoryGap={12}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(value) => (money ? compactCurrency(Number(value)) : String(value))}
          />
          <YAxis
            dataKey="label"
            type="category"
            width={110}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
            tickFormatter={(value) => truncateLabel(String(value))}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = (payload[0] as TooltipPayload).payload;
              if (!row) return null;
              return (
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-lg">
                  <p className="font-medium">{row.label}</p>
                  <p className="text-[var(--muted-foreground)]">{money ? asCurrency(row.value) : row.value}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{row.meta ?? `${row.percent ?? 0}% of total`}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" fill="var(--primary)" radius={[0, 5, 5, 0]} minPointSize={3} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function compactCurrency(value: number) {
  if (value >= 100000) return `NPR ${Math.round(value / 1000)}k`;
  return asCurrency(value).replace("NPR", "").trim();
}

function truncateLabel(value: string) {
  return value.length > 15 ? `${value.slice(0, 14)}...` : value;
}
