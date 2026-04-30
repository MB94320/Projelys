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
  utilization: number; // 0-120
};

type Props = {
  data: DataPoint[];
};

export function ResourceUtilizationChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="text-xs text-slate-500">
        Aucune ressource filtrée sur la période.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, bottom: 10, left: 60 }}
        >
          <XAxis
            type="number"
            domain={[0, 120]}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Taux d’occupation"]}
            labelFormatter={(label) => `Ressource : ${label}`}
          />
          {/* Ligne de référence 100 % */}
          <ReferenceLine x={100} stroke="#a855f7" strokeDasharray="3 3" />
          <Bar
            dataKey="utilization"
            radius={4}
            isAnimationActive={false}
            fill="#6366f1"
          >
            {data.map((entry, index) => {
              const u = entry.utilization;
              let color = "#6366f1"; // indigo
              if (u >= 95) color = "#f97373"; // rouge doux
              else if (u <= 50) color = "#7dd3fc"; // bleu clair
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={color}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
