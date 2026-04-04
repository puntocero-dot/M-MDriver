"use client";

// TODO: Replace mock data with real API call:
// GET /trips/:id — fetch full trip details including timeline and stops
// Use react-query: useQuery({ queryKey: ['trip', id], queryFn: () => api.get(`/trips/${id}`) })
// TODO: Implement cancel trip: DELETE /trips/:id (SUPERADMIN only)

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  User,
  Car,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Navigation,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import StatusBadge, { TripStatus } from "@/components/ui/status-badge";

interface TimelineEvent {
  status: TripStatus;
  label: string;
  time: Date | null;
  completed: boolean;
}

interface Stop {
  order: number;
  address: string;
  note?: string;
  arrivedAt: Date | null;
}

// TODO: Remove mock data and replace with API fetch
const MOCK_TRIP = {
  id: "V-1042",
  status: "completed" as TripStatus,
  price: "$45.00",
  client: { name: "Carlos Mendoza", phone: "+503 7890-1234", type: "Ejecutivo" },
  driver: { name: "Roberto Flores", license: "SV-2024-0192", phone: "+503 6543-2109", rating: 4.9 },
  createdAt: new Date("2026-04-03T14:00:00"),
  startedAt: new Date("2026-04-03T14:15:00"),
  completedAt: new Date("2026-04-03T14:58:00"),
  origin: "Hotel Intercontinental, Col. San Benito",
  destination: "Aeropuerto Internacional El Salvador",
  distance: "48.2 km",
  duration: "43 min",
  notes: "Cliente con equipaje. Preferencia de música clásica.",
  timeline: [
    { status: "pending" as TripStatus, label: "Viaje creado", time: new Date("2026-04-03T14:00:00"), completed: true },
    { status: "confirmed" as TripStatus, label: "Confirmado por cliente", time: new Date("2026-04-03T14:02:00"), completed: true },
    { status: "driver_assigned" as TripStatus, label: "Chofer asignado", time: new Date("2026-04-03T14:05:00"), completed: true },
    { status: "in_transit" as TripStatus, label: "Viaje en curso", time: new Date("2026-04-03T14:15:00"), completed: true },
    { status: "completed" as TripStatus, label: "Viaje completado", time: new Date("2026-04-03T14:58:00"), completed: true },
  ] as TimelineEvent[],
  stops: [
    { order: 1, address: "Hotel Intercontinental, Col. San Benito", note: "Origen", arrivedAt: new Date("2026-04-03T14:15:00") },
    { order: 2, address: "Banco Agrícola, Edificio Torre, 4to Nivel", note: "Parada intermedia", arrivedAt: new Date("2026-04-03T14:35:00") },
    { order: 3, address: "Aeropuerto Internacional El Salvador", note: "Destino final", arrivedAt: new Date("2026-04-03T14:58:00") },
  ] as Stop[],
};

// TODO: Check user role from JWT or context — show cancel only for SUPERADMIN
const IS_SUPERADMIN = true;

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // TODO: Replace with API fetch
  const trip = MOCK_TRIP;

  async function handleCancelTrip() {
    setCancelLoading(true);
    try {
      // TODO: await api.delete(`/trips/${tripId}`)
      await new Promise((r) => setTimeout(r, 1000)); // Simulated delay
      router.push("/trips");
    } catch {
      setCancelLoading(false);
      setShowCancelConfirm(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Viajes
      </button>

      {/* Trip header */}
      <div
        className="rounded-xl border border-slate-700/50 p-6"
        style={{ backgroundColor: "#132040" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{trip.id}</h1>
              <StatusBadge
                status={trip.status}
                pulse={trip.status === "sos_active"}
              />
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Creado el{" "}
              {format(trip.createdAt, "dd 'de' MMMM, yyyy — HH:mm", {
                locale: es,
              })}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" style={{ color: "#C5A55A" }} />
              <span className="text-2xl font-bold" style={{ color: "#C5A55A" }}>
                {trip.price}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>{trip.distance}</span>
              <span>•</span>
              <span>{trip.duration}</span>
            </div>
          </div>
        </div>

        {/* Origin / Destination */}
        <div
          className="mt-4 p-4 rounded-lg space-y-3"
          style={{ backgroundColor: "#0A1628" }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 h-3 w-3 rounded-full bg-green-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Origen
              </p>
              <p className="text-sm text-white mt-0.5">{trip.origin}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">
                Destino
              </p>
              <p className="text-sm text-white mt-0.5">{trip.destination}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {trip.notes && (
          <p className="mt-3 text-xs text-slate-400 italic">
            Notas: {trip.notes}
          </p>
        )}
      </div>

      {/* Client + Driver */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client */}
        <div
          className="rounded-xl border border-slate-700/50 p-5"
          style={{ backgroundColor: "#132040" }}
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Cliente
          </h2>
          <p className="text-white font-medium">{trip.client.name}</p>
          <p className="text-slate-400 text-sm mt-1">{trip.client.phone}</p>
          <span
            className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#1C2D54", color: "#C5A55A" }}
          >
            {trip.client.type}
          </span>
        </div>

        {/* Driver */}
        <div
          className="rounded-xl border border-slate-700/50 p-5"
          style={{ backgroundColor: "#132040" }}
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Car className="h-4 w-4" />
            Conductor
          </h2>
          <p className="text-white font-medium">{trip.driver.name}</p>
          <p className="text-slate-400 text-sm mt-1">{trip.driver.phone}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-500">
              Lic: {trip.driver.license}
            </span>
            <span className="text-xs text-amber-400">
              ★ {trip.driver.rating}
            </span>
          </div>
        </div>
      </div>

      {/* Map placeholder */}
      <div
        className="rounded-xl border border-slate-700/50 overflow-hidden"
        style={{ backgroundColor: "#132040" }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "#1C2D54" }}>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Navigation className="h-4 w-4" style={{ color: "#C5A55A" }} />
            Mapa del viaje
          </h2>
        </div>
        <div
          className="flex flex-col items-center justify-center h-64 bg-slate-800/30"
        >
          <MapPin className="h-12 w-12 text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm font-medium">Mapa del viaje</p>
          <p className="text-slate-600 text-xs mt-1">
            {/* TODO: Integrate Google Maps or Mapbox with trip coordinates */}
            Integración de mapa pendiente
          </p>
        </div>
      </div>

      {/* Stops */}
      <div
        className="rounded-xl border border-slate-700/50 p-5"
        style={{ backgroundColor: "#132040" }}
      >
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4" style={{ color: "#C5A55A" }} />
          Paradas ({trip.stops.length})
        </h2>
        <div className="space-y-3">
          {trip.stops.map((stop, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: "#1C2D54", border: "2px solid #C5A55A" }}
                >
                  {stop.order}
                </div>
                {idx < trip.stops.length - 1 && (
                  <div className="w-px h-8 mt-1" style={{ backgroundColor: "#1C2D54" }} />
                )}
              </div>
              <div className="flex-1 pb-3">
                <p className="text-sm text-white">{stop.address}</p>
                <div className="flex items-center gap-3 mt-1">
                  {stop.note && (
                    <span className="text-xs text-slate-500">{stop.note}</span>
                  )}
                  {stop.arrivedAt && (
                    <span className="text-xs text-slate-500">
                      {format(stop.arrivedAt, "HH:mm")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div
        className="rounded-xl border border-slate-700/50 p-5"
        style={{ backgroundColor: "#132040" }}
      >
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: "#C5A55A" }} />
          Historial de Estados
        </h2>
        <div className="space-y-4">
          {trip.timeline.map((event, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0
                    ${event.completed ? "" : "border-2 border-slate-600"}
                  `}
                  style={
                    event.completed
                      ? { backgroundColor: "#C5A55A" }
                      : { backgroundColor: "#1C2D54" }
                  }
                >
                  {event.completed ? (
                    <CheckCircle className="h-4 w-4 text-slate-900" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-slate-500" />
                  )}
                </div>
                {idx < trip.timeline.length - 1 && (
                  <div
                    className="w-px flex-1 my-1"
                    style={{
                      minHeight: "24px",
                      backgroundColor: event.completed ? "#C5A55A40" : "#1C2D54",
                    }}
                  />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-medium ${
                      event.completed ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {event.label}
                  </p>
                  {event.time && (
                    <span className="text-xs text-slate-500">
                      {format(event.time, "HH:mm:ss")}
                    </span>
                  )}
                </div>
                <StatusBadge status={event.status} className="mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions — SUPERADMIN only */}
      {IS_SUPERADMIN &&
        trip.status !== "completed" &&
        trip.status !== "cancelled" && (
          <div
            className="rounded-xl border border-red-500/30 p-5"
            style={{ backgroundColor: "#132040" }}
          >
            <h2 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Acciones Administrativas
            </h2>

            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="
                  flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                  text-red-400 border border-red-500/40 hover:bg-red-900/30
                  transition-all duration-150
                "
              >
                <XCircle className="h-4 w-4" />
                Cancelar Viaje
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">
                  ¿Estás seguro de que deseas cancelar el viaje{" "}
                  <strong className="text-white">{trip.id}</strong>? Esta acción
                  no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelTrip}
                    disabled={cancelLoading}
                    className="
                      flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                      bg-red-600 hover:bg-red-700 text-white
                      disabled:opacity-60 disabled:cursor-not-allowed
                      transition-all duration-150
                    "
                  >
                    {cancelLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {cancelLoading ? "Cancelando..." : "Confirmar Cancelación"}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="
                      px-4 py-2.5 rounded-lg text-sm font-medium
                      text-slate-400 border border-slate-600
                      hover:text-white hover:border-slate-400
                      transition-all duration-150
                    "
                  >
                    No, volver atrás
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
