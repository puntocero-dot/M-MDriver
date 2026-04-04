import React from "react";

export type TripStatus =
  | "pending"
  | "confirmed"
  | "driver_assigned"
  | "in_transit"
  | "completed"
  | "cancelled"
  | "sos_active";

const STATUS_CONFIG: Record<
  TripStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "Pendiente",
    bg: "bg-slate-700",
    text: "text-slate-200",
    border: "border-slate-500",
  },
  confirmed: {
    label: "Confirmado",
    bg: "bg-yellow-900",
    text: "text-yellow-300",
    border: "border-yellow-600",
  },
  driver_assigned: {
    label: "Chofer Asignado",
    bg: "bg-blue-900",
    text: "text-blue-300",
    border: "border-blue-600",
  },
  in_transit: {
    label: "En Tránsito",
    bg: "bg-amber-900",
    text: "text-amber-300",
    border: "border-amber-500",
  },
  completed: {
    label: "Completado",
    bg: "bg-green-900",
    text: "text-green-300",
    border: "border-green-600",
  },
  cancelled: {
    label: "Cancelado",
    bg: "bg-slate-800",
    text: "text-slate-400",
    border: "border-slate-600",
  },
  sos_active: {
    label: "SOS ACTIVO",
    bg: "bg-red-900",
    text: "text-red-300",
    border: "border-red-500",
  },
};

interface StatusBadgeProps {
  status: TripStatus;
  className?: string;
  pulse?: boolean;
}

export default function StatusBadge({
  status,
  className = "",
  pulse = false,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        border ${config.bg} ${config.text} ${config.border} ${className}
      `}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status === "sos_active" ? "bg-red-400" : "bg-current"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === "sos_active" ? "bg-red-500" : "bg-current"
            }`}
          />
        </span>
      )}
      {config.label}
    </span>
  );
}
