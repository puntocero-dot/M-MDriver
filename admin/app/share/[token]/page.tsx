"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Car, MapPin, CheckCircle, Circle, Clock, AlertTriangle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TripStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DRIVER_ASSIGNED"
  | "EN_ROUTE_TO_PICKUP"
  | "ARRIVED_AT_PICKUP"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

interface Stop {
  id: string;
  label: string;
  address: string;
  completed: boolean;
  type: "PICKUP" | "STOP" | "DROPOFF";
}

interface SharedTrip {
  id: string;
  status: TripStatus;
  driverName: string;
  driverPhone?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  estimatedArrivalAt?: string; // ISO
  stops: Stop[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TripStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  DRIVER_ASSIGNED: "Conductor asignado",
  EN_ROUTE_TO_PICKUP: "En camino a recogerle",
  ARRIVED_AT_PICKUP: "Conductor ha llegado",
  IN_PROGRESS: "Viaje en curso",
  COMPLETED: "Viaje completado",
  CANCELLED: "Viaje cancelado",
};

const STATUS_COLORS: Record<TripStatus, { text: string; bg: string; border: string }> = {
  PENDING: { text: "text-slate-300", bg: "bg-slate-800", border: "border-slate-600" },
  CONFIRMED: { text: "text-blue-300", bg: "bg-blue-900/40", border: "border-blue-600/50" },
  DRIVER_ASSIGNED: { text: "text-blue-300", bg: "bg-blue-900/40", border: "border-blue-600/50" },
  EN_ROUTE_TO_PICKUP: { text: "text-yellow-300", bg: "bg-yellow-900/40", border: "border-yellow-600/50" },
  ARRIVED_AT_PICKUP: { text: "text-orange-300", bg: "bg-orange-900/40", border: "border-orange-600/50" },
  IN_PROGRESS: { text: "text-green-300", bg: "bg-green-900/40", border: "border-green-600/50" },
  COMPLETED: { text: "text-green-400", bg: "bg-green-900/40", border: "border-green-600/50" },
  CANCELLED: { text: "text-red-300", bg: "bg-red-900/40", border: "border-red-600/50" },
};

function formatTime(isoString?: string): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("es-SV", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Components ───────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold" style={{ color: "#C5A55A" }}>
          M&amp;M
        </span>
        <span className="text-3xl font-bold text-white">Driver</span>
      </div>
      <p className="text-slate-400 text-sm">Viaje compartido en vivo</p>
    </div>
  );
}

function TripStatusBadge({ status }: { status: TripStatus }) {
  const cfg = STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center px-5 py-2 rounded-full text-base font-semibold border ${cfg.text} ${cfg.bg} ${cfg.border}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function DriverCard({ trip }: { trip: SharedTrip }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ backgroundColor: "#132040", borderColor: "#1C2D54" }}
    >
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">
        Tu conductor
      </p>
      <div className="flex items-center gap-4">
        <div
          className="flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0"
          style={{ backgroundColor: "#1C2D54" }}
        >
          <Car className="w-7 h-7" style={{ color: "#C5A55A" }} />
        </div>
        <div>
          <p className="text-white text-lg font-semibold">{trip.driverName}</p>
          {trip.vehicleModel && (
            <p className="text-slate-400 text-sm">{trip.vehicleModel}</p>
          )}
          {trip.vehiclePlate && (
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono font-bold"
              style={{ backgroundColor: "#1C2D54", color: "#C5A55A" }}
            >
              {trip.vehiclePlate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div
      className="w-full h-56 rounded-2xl border flex flex-col items-center justify-center gap-3"
      style={{ backgroundColor: "#0e1a2e", borderColor: "#1C2D54" }}
    >
      <MapPin className="w-10 h-10 text-slate-600" />
      <p className="text-slate-600 text-sm text-center px-4">
        {/* TODO: Replace with embedded Google Maps using the driver's live GPS coordinates */}
        Mapa en tiempo real
        <br />
        <span className="text-xs">Próximamente disponible</span>
      </p>
    </div>
  );
}

function StopsList({ stops }: { stops: Stop[] }) {
  return (
    <div
      className="rounded-2xl border p-4 space-y-1"
      style={{ backgroundColor: "#132040", borderColor: "#1C2D54" }}
    >
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">
        Ruta del viaje
      </p>
      <ol className="space-y-3">
        {stops.map((stop, idx) => (
          <li key={stop.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center mt-0.5">
              {stop.completed ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <Circle
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: idx === 0 ? "#C5A55A" : "#334155" }}
                />
              )}
              {idx < stops.length - 1 && (
                <div
                  className="w-px flex-1 mt-1"
                  style={{
                    minHeight: "16px",
                    backgroundColor: stop.completed ? "#16a34a" : "#1C2D54",
                  }}
                />
              )}
            </div>
            <div className="pb-3">
              <p
                className={`text-sm font-medium ${
                  stop.completed ? "text-slate-500 line-through" : "text-white"
                }`}
              >
                {stop.label}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">{stop.address}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 rounded-xl bg-slate-800 w-48 mx-auto" />
      <div className="h-10 rounded-full bg-slate-800 w-40 mx-auto" />
      <div className="h-28 rounded-2xl bg-slate-800" />
      <div className="h-56 rounded-2xl bg-slate-800" />
      <div className="h-40 rounded-2xl bg-slate-800" />
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl border p-8 flex flex-col items-center gap-3 text-center"
      style={{ backgroundColor: "#1a0808", borderColor: "#7f1d1d" }}
    >
      <AlertTriangle className="w-12 h-12 text-red-400" />
      <h2 className="text-white font-semibold text-lg">Enlace no disponible</h2>
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShareTripPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    async function fetchTrip() {
      try {
        // TODO: Replace with real API call
        // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/share/${token}`);
        // if (!res.ok) throw new Error(res.status === 404 ? 'Enlace inválido o expirado' : 'Error al cargar el viaje');
        // const data = await res.json();
        // setTrip(data);

        // Mock response for development
        await new Promise((r) => setTimeout(r, 800));
        setTrip({
          id: "V-1042",
          status: "IN_PROGRESS",
          driverName: "Roberto Quintero",
          vehicleModel: "Toyota Camry 2023",
          vehiclePlate: "P-123-456",
          estimatedArrivalAt: new Date(Date.now() + 18 * 60_000).toISOString(),
          stops: [
            {
              id: "s1",
              label: "Punto de recogida",
              address: "World Trade Center, San Salvador",
              completed: true,
              type: "PICKUP",
            },
            {
              id: "s2",
              label: "Parada 1",
              address: "Hospital de Diagnóstico, San Salvador",
              completed: false,
              type: "STOP",
            },
            {
              id: "s3",
              label: "Destino final",
              address: "Aeropuerto Internacional El Salvador",
              completed: false,
              type: "DROPOFF",
            },
          ],
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Este enlace es inválido o ha expirado."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [token]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#0A1628" }}
    >
      <div className="max-w-md mx-auto px-4 py-8 space-y-5">
        {/* Logo */}
        <Logo />

        {loading && <LoadingSkeleton />}

        {!loading && error && <ErrorState message={error} />}

        {!loading && trip && (
          <>
            {/* Status badge */}
            <div className="flex justify-center">
              <TripStatusBadge status={trip.status} />
            </div>

            {/* Driver card */}
            <DriverCard trip={trip} />

            {/* Map placeholder */}
            <MapPlaceholder />

            {/* Stops */}
            <StopsList stops={trip.stops} />

            {/* ETA */}
            {trip.estimatedArrivalAt &&
              trip.status !== "COMPLETED" &&
              trip.status !== "CANCELLED" && (
                <div
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                  style={{ backgroundColor: "#132040", borderColor: "#1C2D54" }}
                >
                  <Clock className="w-5 h-5 flex-shrink-0" style={{ color: "#C5A55A" }} />
                  <div>
                    <p className="text-slate-400 text-xs">Llegada estimada</p>
                    <p className="text-white font-semibold text-lg">
                      {formatTime(trip.estimatedArrivalAt)}
                    </p>
                  </div>
                </div>
              )}

            {/* CTA */}
            <a
              href="mmdriver://open"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#C5A55A", color: "#0A1628" }}
            >
              <Car className="w-5 h-5" />
              Abrir la app M&amp;M Driver
            </a>
          </>
        )}

        {/* Footer */}
        <footer className="text-center pt-4 pb-2">
          <p className="text-slate-600 text-xs">
            Powered by M&amp;M Driver
            <br />
            Su conductor personal, en su propio vehículo
          </p>
        </footer>
      </div>
    </div>
  );
}
