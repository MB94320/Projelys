"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

type DataPoint = {
  name: string;
  utilization: number;
};

type Props = {
  data: DataPoint[];
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">
        Ressource : {label}
      </p>
      <p className="text-slate-700 dark:text-slate-200">
        Taux d’occupation : {payload[0]?.value}%
      </p>
    </div>
  );
}

export function ResourceUtilizationChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Aucune ressource filtrée sur la période.
      </div>
    );
  }

  return (
    <div className="h-64 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, bottom: 10, left: 80 }}
        >
          <XAxis
            type="number"
            domain={[0, 120]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={100} stroke="#a855f7" strokeDasharray="3 3" />
          <Bar
            dataKey="utilization"
            radius={4}
            isAnimationActive={false}
            fill="#6366f1"
          >
            {data.map((entry, index) => {
              const u = entry.utilization;
              let color = "#6366f1";
              if (u >= 95) color = "#f97373";
              else if (u <= 50) color = "#7dd3fc";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}