"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, Eye, AlertTriangle, Car } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import StatusBadge, { TripStatus } from "@/components/ui/status-badge";
import api from "@/lib/api";

interface TripRow {
  id: string;
  shortId: string;
  status: TripStatus;
  pickupAddress: string;
  dropoffAddress: string;
  quotedPrice: number;
  finalPrice: number | null;
  scheduledAt: string | null;
  createdAt: string;
  client: { id: string; name: string; phone: string } | null;
  driver: { id: string; name: string; phone: string } | null;
}

interface TripsResponse {
  data: TripRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "quoted", label: "Cotizado" },
  { value: "confirmed", label: "Confirmado" },
  { value: "driver_assigned", label: "Chofer Asignado" },
  { value: "en_route_to_pickup", label: "En Camino" },
  { value: "at_pickup", label: "En Punto de Recogida" },
  { value: "in_transit", label: "En Tránsito" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "sos_active", label: "SOS Activo" },
];

export default function TripsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery<TripsResponse>({
    queryKey: ["admin-trips", page, statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await api.get(`/admin/trips?${params}`);
      return res.data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const trips = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Car className="w-6 h-6 text-amber-400" />
          Viajes
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isLoading ? "Cargando..." : `${total} viaje${total !== 1 ? "s" : ""} en total`}
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#1C2D54] p-4 bg-[#132040]">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por dirección, cliente..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-500 border border-[#1C2D54] bg-[#0A1628] outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0A1628] font-semibold rounded-lg text-sm transition-colors whitespace-nowrap">
              Buscar
            </button>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-lg text-sm text-white border border-[#1C2D54] bg-[#0A1628] outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">No se pudieron cargar los viajes. Verifica que el backend esté activo.</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#1C2D54] overflow-hidden bg-[#132040]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1C2D54] bg-[#0A1628]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Chofer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Precio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1C2D54]/40">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-[#1C2D54] rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    {error ? "Error al cargar viajes." : "No se encontraron viajes con los filtros aplicados."}
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr key={trip.id} className="border-b border-[#1C2D54]/40 hover:bg-[#0f1c35] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-[#1C2D54] text-amber-400">
                        {trip.shortId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{trip.client?.name ?? "—"}</p>
                        <p className="text-xs text-slate-500 mt-0.5 hidden sm:block truncate max-w-[180px]">
                          {trip.pickupAddress}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={trip.driver ? "text-slate-300" : "text-slate-500 italic"}>
                        {trip.driver?.name ?? "Sin asignar"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={trip.status} pulse={trip.status === "sos_active"} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-semibold text-white">
                        ${Number(trip.finalPrice ?? trip.quotedPrice).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-400 text-xs">
                      {format(new Date(trip.createdAt), "dd MMM, HH:mm", { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-[#1C2D54] hover:border-amber-500/50 hover:text-amber-400 transition-all"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1C2D54]">
            <span className="text-xs text-slate-500">
              Página {page} de {totalPages} · {total} viajes
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-[#1C2D54] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-white text-sm font-medium px-2">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-[#1C2D54] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
