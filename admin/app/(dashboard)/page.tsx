"use client";

import { useQuery } from "@tanstack/react-query";
import { Car, UserCheck, AlertTriangle, DollarSign, Clock, TrendingUp } from "lucide-react";
import StatCard from "@/components/ui/stat-card";
import { RevenueChart } from "@/components/ui/revenue-chart";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
  activeTrips: number;
  availableDrivers: number;
  sosAlerts: number;
  dailyRevenue: string;
}

interface ActivityItem {
  id: string;
  action: string;
  time: string;
  color: string;
}

interface WeeklyStat {
  label: string;
  value: string;
  pct: number;
}

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  activeTrips: 7,
  availableDrivers: 12,
  sosAlerts: 1,
  dailyRevenue: "$1,240.00",
};

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "V-1042", action: "Viaje completado", time: "hace 5 min", color: "text-green-400" },
  { id: "V-1041", action: "SOS activado por cliente", time: "hace 12 min", color: "text-red-400" },
  { id: "V-1040", action: "Chofer asignado a viaje", time: "hace 18 min", color: "text-blue-400" },
  { id: "V-1039", action: "Nuevo viaje confirmado", time: "hace 25 min", color: "text-amber-400" },
  { id: "V-1038", action: "Viaje cancelado por cliente", time: "hace 31 min", color: "text-slate-400" },
];

const MOCK_WEEKLY: WeeklyStat[] = [
  { label: "Viajes totales", value: "94", pct: 78 },
  { label: "Tasa de completado", value: "96.8%", pct: 97 },
  { label: "Calificación promedio", value: "4.9 ★", pct: 98 },
  { label: "Tiempo promedio de viaje", value: "28 min", pct: 55 },
];

// ─── Skeleton components ──────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div
      className="rounded-xl border border-slate-700/50 p-5 h-32 animate-pulse"
      style={{ backgroundColor: "#132040" }}
    />
  );
}

function ActivitySkeleton() {
  return (
    <ul className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <li
          key={i}
          className="h-10 rounded-lg animate-pulse"
          style={{ backgroundColor: "#1C2D54" }}
        />
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // TODO: Replace mock fetchers with real API once backend is ready
  // GET /admin/dashboard/stats
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<DashboardStats>("/admin/dashboard/stats");
      return res.data;
    },
    // Use mock data as placeholderData so UI renders immediately
    placeholderData: MOCK_STATS,
    staleTime: 30_000,
    retry: 1,
  });

  // TODO: GET /admin/dashboard/activity
  const {
    data: activity,
    isLoading: activityLoading,
  } = useQuery<ActivityItem[]>({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const res = await api.get<ActivityItem[]>("/admin/dashboard/activity");
      return res.data;
    },
    placeholderData: MOCK_ACTIVITY,
    staleTime: 15_000,
    retry: 1,
  });

  const displayStats = stats ?? MOCK_STATS;
  const displayActivity = activity ?? MOCK_ACTIVITY;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Resumen operativo en tiempo real
          </p>
        </div>
        <AnimatedGradientText className="hidden sm:flex text-xs font-semibold">
          <span className="inline animate-gradient bg-gradient-to-r from-[#C5A55A] via-[#F0D080] to-[#C5A55A] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent">
            ✦ M&amp;M Driver Admin
          </span>
        </AnimatedGradientText>
      </div>

      {/* Error banner */}
      {statsError && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-yellow-700/40 text-yellow-300 text-sm"
          style={{ backgroundColor: "#1c1208" }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          No se pudo conectar con el servidor. Mostrando datos de demostración.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading && !stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Viajes Activos"
              value={displayStats.activeTrips}
              icon={Car}
              color="blue"
              description="En curso ahora mismo"
              trend={{ value: 16, label: "vs ayer" }}
            />
            <StatCard
              title="Conductores Disponibles"
              value={displayStats.availableDrivers}
              icon={UserCheck}
              color="green"
              description="Listos para asignar"
              trend={{ value: 8, label: "vs ayer" }}
            />
            <StatCard
              title="Alertas SOS"
              value={displayStats.sosAlerts}
              icon={AlertTriangle}
              color="red"
              description="Requieren atención"
            />
            <StatCard
              title="Ingresos del Día"
              value={displayStats.dailyRevenue}
              icon={DollarSign}
              color="gold"
              description="Total acumulado hoy"
              trend={{ value: 23, label: "vs ayer" }}
            />
          </>
        )}
      </div>

      {/* Revenue chart — full width */}
      <RevenueChart />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div
          className="lg:col-span-2 rounded-xl border border-slate-700/50 p-5"
          style={{ backgroundColor: "#132040" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Actividad Reciente
            </h2>
            <span className="text-xs text-slate-500">Últimos eventos</span>
          </div>

          {activityLoading && !activity ? (
            <ActivitySkeleton />
          ) : (
            <ul className="space-y-3">
              {displayActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-slate-700/40 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-mono font-medium px-2 py-0.5 rounded"
                      style={{ backgroundColor: "#1C2D54", color: "#C5A55A" }}
                    >
                      {item.id}
                    </span>
                    <span className={`text-sm ${item.color}`}>{item.action}</span>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                    {item.time}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick stats */}
        <div
          className="rounded-xl border border-slate-700/50 p-5"
          style={{ backgroundColor: "#132040" }}
        >
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            Esta Semana
          </h2>
          {/* TODO: GET /admin/dashboard/weekly-stats */}
          <div className="space-y-4">
            {MOCK_WEEKLY.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <span className="text-xs font-semibold text-white">{item.value}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-700">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%`, backgroundColor: "#C5A55A" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
