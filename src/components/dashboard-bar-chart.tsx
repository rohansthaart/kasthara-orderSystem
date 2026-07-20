"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { asCurrency } from "@/lib/utils";

type ChartRow = {
  label: string;
  value: number;
  meta?: string;
};

type TooltipPayload = {
  payload?: ChartRow & { percent?: number };
};

export function DashboardBarChart({
  rows,
  money,
  direction = "rows",
}: {
  rows: ChartRow[];
  money?: boolean;
  direction?: "rows" | "columns";
}) {
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

  if (direction === "columns") {
    return (
      <div
        className="h-[320px] w-full sm:h-[360px]"
        role="img"
        aria-label={`Product demand chart with ${data.length} products and sales values on the vertical axis`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 14, bottom: 64, left: 12 }} barCategoryGap="28%">
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 5" vertical={false} />
            <XAxis
              dataKey="label"
              type="category"
              interval={0}
              tickLine={false}
              axisLine={false}
              height={72}
              tickMargin={12}
              angle={-32}
              textAnchor="end"
              tick={{ fill: "var(--foreground)", fontSize: 11 }}
              tickFormatter={(value) => truncateColumnLabel(String(value))}
            />
            <YAxis
              type="number"
              tickLine={false}
              axisLine={false}
              width={68}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(value) => (money ? compactCurrency(Number(value)) : String(value))}
            />
            <Tooltip cursor={{ fill: "var(--muted)" }} content={(props) => <ChartTooltip {...props} money={money} />} />
            <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} minPointSize={3} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const chartHeight = Math.max(152, data.length * 44 + 26);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 2 }} barCategoryGap={14}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 5" horizontal={false} />
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
            width={132}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
            tickFormatter={(value) => truncateLabel(String(value))}
          />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={(props) => <ChartTooltip {...props} money={money} />} />
          <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} minPointSize={3} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  money,
}: {
  active?: boolean;
  payload?: readonly unknown[];
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const row = (payload[0] as TooltipPayload).payload;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-lg">
      <p className="font-medium">{row.label}</p>
      <p className="text-[var(--muted-foreground)]">{money ? asCurrency(row.value) : row.value}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{row.meta ?? `${row.percent ?? 0}% of total`}</p>
    </div>
  );
}

type TrendRow = {
  date: string;
  label: string;
  count: number;
};

type TrendTooltipPayload = {
  payload?: TrendRow;
};

export function DashboardOrderTrend({ rows }: { rows: TrendRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const average = rows.length > 0 ? total / rows.length : 0;

  if (rows.length === 0) {
    return <p className="px-4 py-10 text-sm text-[var(--muted-foreground)]">No order activity recorded for this period.</p>;
  }

  return (
    <div
      className="h-[240px] w-full sm:h-[280px]"
      role="img"
      aria-label={`${total} active orders across the last ${rows.length} days, averaging ${average.toFixed(1)} orders per day`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 12, right: 14, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="orderTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="88%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 6" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={42}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            width={36}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "var(--ring)", strokeDasharray: "3 4" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = (payload[0] as TrendTooltipPayload).payload;
              if (!row) return null;
              return (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-lg">
                  <p className="text-xs text-[var(--muted-foreground)]">{row.label}</p>
                  <p className="mt-0.5 font-semibold tabular-nums">{row.count} orders</p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#orderTrendFill)"
            activeDot={{ r: 5, fill: "var(--surface)", stroke: "var(--primary)", strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function compactCurrency(value: number) {
  if (value >= 100000) return `NPR ${Math.round(value / 1000)}k`;
  return asCurrency(value).replace("NPR", "").trim();
}

function truncateLabel(value: string) {
  return value.length > 20 ? `${value.slice(0, 19)}...` : value;
}

function truncateColumnLabel(value: string) {
  return value.length > 14 ? `${value.slice(0, 13)}...` : value;
}
