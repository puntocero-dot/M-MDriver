"use client";

// TODO: Replace mock data with real API call:
// GET /trips?status={filter}&search={query}&page={page}&limit=10
// Use react-query: useQuery({ queryKey: ['trips', filter, search, page], queryFn: ... })

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import StatusBadge, { TripStatus } from "@/components/ui/status-badge";

interface Trip {
  id: string;
  client: string;
  driver: string;
  status: TripStatus;
  price: string;
  date: Date;
  origin: string;
}

// TODO: Remove mock data and fetch from API
const MOCK_TRIPS: Trip[] = [
  { id: "V-1042", client: "Carlos Mendoza", driver: "Roberto Flores", status: "completed", price: "$45.00", date: new Date("2026-04-03T14:30:00"), origin: "Hotel Intercontinental" },
  { id: "V-1041", client: "Ana García", driver: "Luis Torres", status: "sos_active", price: "$38.50", date: new Date("2026-04-03T13:55:00"), origin: "Aeropuerto Internacional" },
  { id: "V-1040", client: "Empresa TechSV", driver: "Marco Díaz", status: "in_transit", price: "$62.00", date: new Date("2026-04-03T13:20:00"), origin: "World Trade Center" },
  { id: "V-1039", client: "Dr. Ramírez", driver: "Juan Pérez", status: "confirmed", price: "$55.00", date: new Date("2026-04-03T12:00:00"), origin: "Hospital de Diagnóstico" },
  { id: "V-1038", client: "María López", driver: "Sin asignar", status: "pending", price: "$28.00", date: new Date("2026-04-03T11:45:00"), origin: "Colonia Escalón" },
  { id: "V-1037", client: "Banco Central", driver: "Carlos Rivas", status: "completed", price: "$120.00", date: new Date("2026-04-03T10:30:00"), origin: "Centro Financiero" },
  { id: "V-1036", client: "Sofia Herrera", driver: "Pedro Martínez", status: "cancelled", price: "$33.00", date: new Date("2026-04-03T09:15:00"), origin: "Mall Multiplaza" },
  { id: "V-1035", client: "Clínica Alemana", driver: "Eduardo Vásquez", status: "driver_assigned", price: "$75.00", date: new Date("2026-04-03T08:00:00"), origin: "Clínica Alemana" },
];

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "driver_assigned", label: "Chofer Asignado" },
  { value: "in_transit", label: "En Tránsito" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "sos_active", label: "SOS Activo" },
];

const PAGE_SIZE = 6;

export default function TripsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = MOCK_TRIPS.filter((trip) => {
    const matchesSearch =
      search === "" ||
      trip.id.toLowerCase().includes(search.toLowerCase()) ||
      trip.client.toLowerCase().includes(search.toLowerCase()) ||
      trip.driver.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || trip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleFilterChange(val: string) {
    setStatusFilter(val);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Viajes</h1>
        <p className="text-slate-400 text-sm mt-1">
          Gestión y seguimiento de todos los viajes
        </p>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl border border-slate-700/50 p-4"
        style={{ backgroundColor: "#132040" }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por ID, cliente o chofer..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500
                border border-slate-600 outline-none
                focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                transition-colors
              "
              style={{ backgroundColor: "#0A1628" }}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="
              px-4 py-2.5 rounded-lg text-sm text-white
              border border-slate-600 outline-none
              focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
              transition-colors cursor-pointer
            "
            style={{ backgroundColor: "#0A1628" }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border border-slate-700/50 overflow-hidden"
        style={{ backgroundColor: "#132040" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "#1C2D54", backgroundColor: "#0A1628" }}
              >
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Chofer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                  Precio
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Fecha
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No se encontraron viajes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginated.map((trip, idx) => (
                  <tr
                    key={trip.id}
                    className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className="font-mono text-xs font-semibold px-2 py-1 rounded"
                        style={{
                          backgroundColor: "#1C2D54",
                          color: "#C5A55A",
                        }}
                      >
                        {trip.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{trip.client}</p>
                        <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                          {trip.origin}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={
                          trip.driver === "Sin asignar"
                            ? "text-slate-500 italic"
                            : "text-slate-300"
                        }
                      >
                        {trip.driver}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={trip.status}
                        pulse={trip.status === "sos_active"}
                      />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-semibold text-white">
                        {trip.price}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-400 text-xs">
                      {format(trip.date, "dd MMM, HH:mm", { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/trips/${trip.id.replace("V-", "")}`}
                        className="
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                          text-xs font-medium text-slate-300
                          border border-slate-600 hover:border-amber-500
                          hover:text-amber-400 transition-all duration-150
                        "
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "#1C2D54" }}
          >
            <span className="text-xs text-slate-500">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}{" "}
              viajes
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="
                  p-1.5 rounded-lg border border-slate-600
                  text-slate-400 hover:text-white hover:border-slate-400
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all
                "
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`
                    w-8 h-8 rounded-lg text-xs font-medium transition-all
                    ${
                      p === page
                        ? "text-slate-900 font-semibold"
                        : "text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400"
                    }
                  `}
                  style={p === page ? { backgroundColor: "#C5A55A" } : {}}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="
                  p-1.5 rounded-lg border border-slate-600
                  text-slate-400 hover:text-white hover:border-slate-400
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all
                "
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
