"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Truck,
  RefreshCw,
  CheckCircle,
  Circle,
  Car,
  WifiOff,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type DriverStatus = "AVAILABLE" | "ON_TRIP" | "OFFLINE";

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  activeTripId?: string;
  lastSeenAt?: string; // ISO string
}

// ─── Mock data (TODO: replace with real API) ─────────────────────────────────

const MOCK_DRIVERS: Driver[] = [
  {
    id: "D-001",
    name: "Roberto Quintero",
    phone: "+503 7123-4567",
    status: "ON_TRIP",
    activeTripId: "V-1042",
    lastSeenAt: new Date(Date.now() - 3 * 60_000).toISOString(),
  },
  {
    id: "D-002",
    name: "Carlos Mendoza",
    phone: "+503 7234-5678",
    status: "AVAILABLE",
    lastSeenAt: new Date(Date.now() - 1 * 60_000).toISOString(),
  },
  {
    id: "D-003",
    name: "Miguel Flores",
    phone: "+503 7345-6789",
    status: "AVAILABLE",
    lastSeenAt: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
  {
    id: "D-004",
    name: "José Martínez",
    phone: "+503 7456-7890",
    status: "ON_TRIP",
    activeTripId: "V-1041",
    lastSeenAt: new Date(Date.now() - 2 * 60_000).toISOString(),
  },
  {
    id: "D-005",
    name: "Alejandro Rivas",
    phone: "+503 7567-8901",
    status: "OFFLINE",
    lastSeenAt: new Date(Date.now() - 45 * 60_000).toISOString(),
  },
  {
    id: "D-006",
    name: "Fernando Castillo",
    phone: "+503 7678-9012",
    status: "AVAILABLE",
    lastSeenAt: new Date(Date.now() - 30_000).toISOString(),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeElapsed(isoString?: string): string {
  if (!isoString) return "—";
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  return `hace ${Math.floor(diff / 3600)} h`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DriverStatus }) {
  const map: Record<DriverStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    AVAILABLE: {
      label: "Disponible",
      icon: CheckCircle,
      color: "text-green-300",
      bg: "bg-green-900/40 border border-green-700/40",
    },
    ON_TRIP: {
      label: "En viaje",
      icon: Car,
      color: "text-yellow-300",
      bg: "bg-yellow-900/40 border border-yellow-700/40",
    },
    OFFLINE: {
      label: "Sin conexión",
      icon: WifiOff,
      color: "text-slate-400",
      bg: "bg-slate-800/60 border border-slate-700/40",
    },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────

interface AssignModalProps {
  driver: Driver;
  onClose: () => void;
  onAssign: (driverId: string, tripId: string) => Promise<void>;
}

function AssignModal({ driver, onClose, onAssign }: AssignModalProps) {
  const [tripId, setTripId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tripId.trim()) {
      setError("Ingresa un ID de viaje");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onAssign(driver.id, tripId.trim());
      onClose();
    } catch {
      setError("Error al asignar el conductor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border p-6 space-y-5"
        style={{ backgroundColor: "#132040", borderColor: "#1C2D54" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Asignar a Viaje</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Driver info */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "#0A1628" }}
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full"
            style={{ backgroundColor: "#1C2D54" }}
          >
            <Truck className="w-5 h-5" style={{ color: "#C5A55A" }} />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{driver.name}</p>
            <p className="text-slate-400 text-xs">{driver.phone}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">
              ID del Viaje
            </label>
            <input
              type="text"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              placeholder="Ej: V-1043"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
              autoFocus
            />
            {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            <p className="text-slate-500 text-xs mt-1.5">
              {/* TODO: Replace with dropdown from GET /trips?status=pending */}
              Ingresa manualmente el ID del viaje pendiente
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              style={{ backgroundColor: "#C5A55A", color: "#0A1628" }}
            >
              {loading ? "Asignando…" : "Asignar conductor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function FleetStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "gold" | "grey" | "blue";
}) {
  const colorMap = {
    green: "text-green-400",
    gold: "text-yellow-400",
    grey: "text-slate-400",
    blue: "text-blue-400",
  };
  return (
    <div
      className="flex-1 rounded-xl border p-4"
      style={{ backgroundColor: "#132040", borderColor: "#1C2D54" }}
    >
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-slate-400 text-xs mt-1">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FleetPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [assignTarget, setAssignTarget] = useState<Driver | null>(null);

  const fetchDrivers = useCallback(async () => {
    try {
      // TODO: Replace with real API
      // const res = await api.get<Driver[]>('/drivers');
      // const trips = await api.get('/trips?status=active');
      // setDrivers(res.data);
      setDrivers(MOCK_DRIVERS);
    } catch {
      // keep existing data
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 15_000);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  async function handleAssign(driverId: string, tripId: string) {
    // TODO: POST /trips/:tripId/assign  { driverId }
    console.log("Asignando conductor", driverId, "al viaje", tripId);
    // Optimistic update
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId
          ? { ...d, status: "ON_TRIP", activeTripId: tripId }
          : d
      )
    );
  }

  const available = drivers.filter((d) => d.status === "AVAILABLE").length;
  const onTrip = drivers.filter((d) => d.status === "ON_TRIP").length;
  const offline = drivers.filter((d) => d.status === "OFFLINE").length;

  return (
    <>
      {assignTarget && (
        <AssignModal
          driver={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssign={handleAssign}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ backgroundColor: "#1C2D54" }}
            >
              <Truck className="w-5 h-5" style={{ color: "#C5A55A" }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Flota en Vivo</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Monitor en tiempo real · actualización cada 15s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-slate-500">
                {lastRefresh.toLocaleTimeString("es-SV")}
              </span>
            )}
            <button
              onClick={fetchDrivers}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors border border-slate-700/50"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4">
          <FleetStat label="Total conductores" value={drivers.length} color="blue" />
          <FleetStat label="Disponibles" value={available} color="green" />
          <FleetStat label="En viaje" value={onTrip} color="gold" />
          <FleetStat label="Sin conexión" value={offline} color="grey" />
        </div>

        {/* Table */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#132040", borderColor: "#1C2D54" }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "#1C2D54" }}>
            <h2 className="text-base font-semibold text-white">Conductores</h2>
          </div>

          {loading ? (
            <div className="space-y-px">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse mx-5 my-3 rounded-lg"
                  style={{ backgroundColor: "#1C2D54" }}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#1C2D54" }}>
                    {["Nombre", "Estado", "Viaje Activo", "Última ubicación", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "#1C2D54" }}>
                  {drivers.map((driver) => (
                    <tr
                      key={driver.id}
                      className="hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-white text-sm font-medium">{driver.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{driver.phone}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={driver.status} />
                      </td>
                      <td className="px-5 py-4">
                        {driver.activeTripId ? (
                          <span
                            className="font-mono text-sm px-2 py-0.5 rounded"
                            style={{ backgroundColor: "#1C2D54", color: "#C5A55A" }}
                          >
                            {driver.activeTripId}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Circle
                            className={`w-2 h-2 fill-current ${
                              driver.status === "OFFLINE"
                                ? "text-slate-600"
                                : "text-green-400"
                            }`}
                          />
                          <span className="text-slate-400 text-sm">
                            {timeElapsed(driver.lastSeenAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {driver.status !== "ON_TRIP" && (
                          <button
                            onClick={() => setAssignTarget(driver)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                            style={{
                              borderColor: "#C5A55A",
                              color: "#C5A55A",
                            }}
                          >
                            Asignar a viaje
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TODO comment */}
        {/* Data sources:
            - GET /drivers         → list of all drivers with status
            - GET /trips?status=active  → active trips for assignment dropdown
            - POST /trips/:id/assign { driverId } → assign driver to trip
        */}
      </div>
    </>
  );
}
