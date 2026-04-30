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

export function ChargeVsCapacityChart({ data }: Props) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 24, bottom: 8, left: 0 }}
        >
          <CartesianGrid stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6B7280" }}
          />
          <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
          <Tooltip />
          <Legend />

          <Bar
            dataKey="loadEtp"
            name="Charge (ETP)"
            fill="#44d7a6ff"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />

          <Line
            type="monotone"
            dataKey="capacityEtp"
            name="Capacité (ETP)"
            stroke="#f5b383ff"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
