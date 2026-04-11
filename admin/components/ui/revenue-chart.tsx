"use client";

// UI/UX Pro Max: Charts — AreaChart for financial trend data
// Color: Gold fill (#C5A55A at 20% opacity) with gold stroke
// Axes: minimal labels, no gridlines cluttering (clean luxury feel)
// Tooltip: dark themed, matches navy palette

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface RevenueDataPoint {
  day: string;
  revenue: number;
  trips: number;
}

const MOCK_DATA: RevenueDataPoint[] = [
  { day: "Lun", revenue: 890, trips: 11 },
  { day: "Mar", revenue: 1240, trips: 15 },
  { day: "Mié", revenue: 980, trips: 12 },
  { day: "Jue", revenue: 1560, trips: 19 },
  { day: "Vie", revenue: 2100, trips: 26 },
  { day: "Sáb", revenue: 1890, trips: 23 },
  { day: "Hoy", revenue: 1240, trips: 15 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="px-3 py-2.5 rounded-xl border border-white/10 text-sm shadow-2xl"
      style={{ backgroundColor: "#0A1628" }}
    >
      <p className="text-slate-400 text-xs mb-1.5 font-medium">{label}</p>
      <p className="text-white font-bold">
        ${payload[0]?.value?.toLocaleString("en-US")} USD
      </p>
      {payload[1] && (
        <p className="text-slate-400 text-xs mt-0.5">
          {payload[1].value} viajes
        </p>
      )}
    </div>
  );
}

export function RevenueChart() {
  const [mounted, setMounted] = (require("react") as typeof import("react")).useState(false);
  
  (require("react") as typeof import("react")).useEffect(() => {
    setMounted(true);
  }, []);

  const total = MOCK_DATA.reduce((sum, d) => sum + d.revenue, 0);
  const avg = Math.round(total / MOCK_DATA.length);

  return (
    <div
      className="rounded-2xl border border-white/5 p-5"
      style={{
        background: "linear-gradient(135deg, #132040 0%, #0f1c35 100%)",
        boxShadow:
          "0 0 0 1px rgba(28,45,84,0.8), 0 4px 24px rgba(0,0,0,0.4), inset 0 0 40px rgba(197,165,90,0.05)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: "#C5A55A" }} />
            Ingresos — Últimos 7 días
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Promedio diario:{" "}
            <span className="font-semibold" style={{ color: "#C5A55A" }}>
              ${avg.toLocaleString("en-US")} USD
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            ${total.toLocaleString("en-US")}
          </p>
          <p className="text-xs text-emerald-400 font-medium">+23% vs semana anterior</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 min-h-[192px] w-full">
        {!mounted ? (
          <div className="h-full w-full flex items-center justify-center bg-white/5 rounded-lg animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={180} debounce={50}>
            <AreaChart data={MOCK_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C5A55A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#C5A55A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(197,165,90,0.2)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C5A55A"
                strokeWidth={2}
                fill="url(#goldGradient)"
                dot={{ fill: "#C5A55A", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#C5A55A", stroke: "#0A1628", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
