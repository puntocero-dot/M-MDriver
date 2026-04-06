"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type SOSStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

interface SOSAlert {
  id: string;
  tripId: string;
  triggeredBy: string;
  triggeredAt: string; // ISO string
  lat: number;
  lng: number;
  status: SOSStatus;
  notes?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeElapsed(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  return `hace ${Math.floor(diff / 3600)} h`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio not available (SSR guard)
  }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SOSStatus }) {
  const map: Record<SOSStatus, { label: string; classes: string; pulse?: boolean }> = {
    ACTIVE: {
      label: "ACTIVO",
      classes: "bg-red-900/60 text-red-300 border border-red-500/50",
      pulse: true,
    },
    ACKNOWLEDGED: {
      label: "ATENDIDO",
      classes: "bg-yellow-900/60 text-yellow-300 border border-yellow-500/50",
    },
    RESOLVED: {
      label: "RESUELTO",
      classes: "bg-green-900/60 text-green-300 border border-green-500/50",
    },
  };
  const cfg = map[status];
  return (
    <span className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.classes}`}>
      {cfg.pulse && (
        <>
          <span className="animate-ping absolute left-2.5 inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </>
      )}
      {!cfg.pulse && <span className="h-2 w-2 rounded-full bg-current" />}
      {cfg.label}
    </span>
  );
}

// ─── Alert card ──────────────────────────────────────────────────────────────

interface AlertCardProps {
  alert: SOSAlert;
  onAcknowledge: (id: string) => Promise<void>;
  onResolve: (id: string, notes: string) => Promise<void>;
}

function AlertCard({ alert, onAcknowledge, onResolve }: AlertCardProps) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);

  const mapsUrl = `https://www.google.com/maps?q=${alert.lat},${alert.lng}`;

  async function handleAcknowledge() {
    setLoading(true);
    await onAcknowledge(alert.id);
    setLoading(false);
  }

  async function handleResolve() {
    if (!showNotes) {
      setShowNotes(true);
      return;
    }
    setLoading(true);
    await onResolve(alert.id, notes);
    setLoading(false);
    setShowNotes(false);
  }

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{
        backgroundColor: "#132040",
        borderColor: alert.status === "ACTIVE" ? "#ef4444" : "#1C2D54",
        boxShadow: alert.status === "ACTIVE" ? "0 0 16px rgba(239,68,68,0.15)" : "none",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
            style={{ backgroundColor: "#1C2D54" }}
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              Viaje{" "}
              <span style={{ color: "#C5A55A" }} className="font-mono">
                #{alert.tripId}
              </span>
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              Activado por <span className="text-slate-300">{alert.triggeredBy}</span>
              {" · "}
              {timeElapsed(alert.triggeredAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={alert.status} />
      </div>

      {/* GPS */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-blue-400 transition-colors group"
      >
        <MapPin className="w-3.5 h-3.5 group-hover:text-blue-400" />
        <span className="font-mono">
          {(alert.lat ?? 0).toFixed(6)}, {(alert.lng ?? 0).toFixed(6)}
        </span>
        <span className="text-blue-500 underline underline-offset-2">Ver en Google Maps</span>
      </a>

      {/* Notes input (resolve flow) */}
      {showNotes && (
        <div className="space-y-2">
          <label className="text-xs text-slate-400">Notas de resolución (opcional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe la resolución…"
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={() => setShowNotes(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {alert.status !== "RESOLVED" && (
        <div className="flex items-center gap-3 pt-1">
          {alert.status === "ACTIVE" && (
            <button
              onClick={handleAcknowledge}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#92400e", color: "#fde68a" }}
            >
              {loading ? "Procesando…" : "Reconocer"}
            </button>
          )}
          <button
            onClick={handleResolve}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
          >
            {loading ? "Procesando…" : showNotes ? "Confirmar resolución" : "Resolver"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SOSPage() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const prevCountRef = useRef(0);

  const fetchAlerts = useCallback(async () => {
    try {
      // TODO: Replace with real API — GET /sos/active
      const res = await api.get<SOSAlert[]>("/sos/active");
      const incoming = res.data;

      // Play beep if new alerts appeared
      if (incoming.length > prevCountRef.current) {
        playBeep();
      }
      prevCountRef.current = incoming.length;
      setAlerts(incoming);
    } catch {
      // Keep existing alerts if fetch fails — avoid flickering
    } finally {
      setLoading(false);
      setLastFetch(new Date());
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10_000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  async function handleAcknowledge(id: string) {
    // TODO: PATCH /sos/:id/acknowledge
    await api.patch(`/sos/${id}/acknowledge`);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "ACKNOWLEDGED" } : a))
    );
  }

  async function handleResolve(id: string, notes: string) {
    // TODO: PATCH /sos/:id/resolve
    await api.patch(`/sos/${id}/resolve`, { notes });
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "RESOLVED", notes } : a))
    );
  }

  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE");
  const otherAlerts = alerts.filter((a) => a.status !== "ACTIVE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ backgroundColor: "#7f1d1d" }}
          >
            <AlertTriangle className="w-5 h-5 text-red-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Alertas SOS Activas</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Monitoreo en tiempo real · actualización cada 10s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-xs text-slate-500">
              Última actualización: {lastFetch.toLocaleTimeString("es-SV")}
            </span>
          )}
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors border border-slate-700/50"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {!loading && (
        <div className="flex gap-4">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-800/40"
            style={{ backgroundColor: "#3b0a0a" }}
          >
            <span className="text-red-400 font-bold text-lg">{activeAlerts.length}</span>
            <span className="text-red-300 text-sm">Activas</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-yellow-800/30"
            style={{ backgroundColor: "#1c1208" }}
          >
            <span className="text-yellow-400 font-bold text-lg">
              {alerts.filter((a) => a.status === "ACKNOWLEDGED").length}
            </span>
            <span className="text-yellow-300 text-sm">Reconocidas</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-800/30"
            style={{ backgroundColor: "#0a1c0a" }}
          >
            <span className="text-green-400 font-bold text-lg">
              {alerts.filter((a) => a.status === "RESOLVED").length}
            </span>
            <span className="text-green-300 text-sm">Resueltas</span>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-40 rounded-xl animate-pulse"
              style={{ backgroundColor: "#132040" }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && alerts.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl border border-green-800/30"
          style={{ backgroundColor: "#0a1c0a" }}
        >
          <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
          <h2 className="text-xl font-semibold text-green-300">Sin alertas activas</h2>
          <p className="text-green-600 text-sm mt-1">
            No hay situaciones de emergencia en este momento
          </p>
        </div>
      )}

      {/* Active alerts */}
      {activeAlerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
            Alertas activas ({activeAlerts.length})
          </h2>
          {activeAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          ))}
        </section>
      )}

      {/* Other alerts */}
      {otherAlerts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Historial reciente ({otherAlerts.length})
          </h2>
          {otherAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          ))}
        </section>
      )}
    </div>
  );
}
