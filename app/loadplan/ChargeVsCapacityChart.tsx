"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type DataPoint = {
  label: string;
  loadEtp: number;
  capacityEtp: number;
};

type Props = {
  data: DataPoint[];
};

function formatEtp(value: number) {
  return `${Number(value).toFixed(2)} ETP`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p
          key={index}
          className="font-medium"
          style={{ color: entry.color }}
        >
          {entry.name} : {formatEtp(Number(entry.value))}
        </p>
      ))}
    </div>
  );
}

export function ChargeVsCapacityChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Aucune donnée de charge sur la période.
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.loadEtp || 0, d.capacityEtp || 0]),
    1,
  );
  const yMax = Math.ceil(maxValue * 1.2 * 10) / 10;

  return (
    <div className="h-80 min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
        >
          <CartesianGrid
            stroke="#475569"
            strokeDasharray="3 3"
            vertical={false}
            opacity={0.35}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#94A3B8" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fontSize: 12, fill: "#94A3B8" }}
            tickFormatter={(value) => `${Number(value).toFixed(1)}`}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: "#94A3B8",
            }}
          />
          <Bar
            dataKey="loadEtp"
            name="Charge (ETP)"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Line
            type="monotone"
            dataKey="capacityEtp"
            name="Capacité (ETP)"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}