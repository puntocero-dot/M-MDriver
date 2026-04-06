"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Star,
  Car,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Phone,
  AlertTriangle,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";

interface DriverRow {
  id: string;
  userId: string;
  isAvailable: boolean;
  licenseNumber: string;
  licenseExpiry: string;
  ratingAvg: number;
  totalTrips: number;
  currentLatitude: number | null;
  currentLongitude: number | null;
  lastLocationUpdate: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
  } | null;
}

interface DriversResponse {
  data: DriverRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PendingTrip {
  id: string;
  shortId: string;
  pickupAddress: string;
  dropoffAddress: string;
  quotedPrice: number;
  client: { name: string } | null;
}

export default function DriversPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [assignTarget, setAssignTarget] = useState<DriverRow | null>(null);
  const [selectedTripId, setSelectedTripId] = useState("");

  const { data, isLoading, error } = useQuery<DriversResponse>({
    queryKey: ["admin-drivers", page, availabilityFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (availabilityFilter) params.set("available", availabilityFilter);
      if (search) params.set("search", search);
      const res = await api.get(`/admin/drivers?${params}`);
      return res.data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // Fetch pending trips for the assign modal
  const { data: pendingTrips } = useQuery<PendingTrip[]>({
    queryKey: ["admin-trips-pending"],
    queryFn: async () => {
      const res = await api.get("/admin/trips?status=quoted&limit=50");
      return res.data?.data ?? [];
    },
    enabled: !!assignTarget,
    staleTime: 15_000,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ tripId, driverId }: { tripId: string; driverId: string }) => {
      await api.post(`/trips/${tripId}/assign`, { driverId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-drivers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-trips-pending"] });
      setAssignTarget(null);
      setSelectedTripId("");
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const drivers = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const availableCount = drivers.filter((d) => d.isAvailable).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-400" />
            Conductores
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isLoading
              ? "Cargando..."
              : `${availableCount} de ${total} conductores disponibles`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#1C2D54] p-4 bg-[#132040]">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o licencia..."
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
            value={availabilityFilter}
            onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-lg text-sm text-white border border-[#1C2D54] bg-[#0A1628] outline-none focus:border-amber-500/50 transition-colors cursor-pointer"
          >
            <option value="">Todos</option>
            <option value="true">Disponibles</option>
            <option value="false">En servicio</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">No se pudieron cargar los conductores.</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-[#1C2D54] overflow-hidden bg-[#132040]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1C2D54] bg-[#0A1628]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Licencia</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Disponible</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Viajes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1C2D54]/40">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-[#1C2D54] rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No se encontraron conductores.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-[#1C2D54]/40 hover:bg-[#0f1c35] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{driver.user?.name ?? "—"}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {driver.user?.phone ?? "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs px-2 py-1 rounded text-slate-300 bg-[#1C2D54]">
                        {driver.licenseNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {driver.isAvailable ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-600/30">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1C2D54] text-slate-400 border border-slate-600/30">
                          <XCircle className="h-3.5 w-3.5" />
                          En Servicio
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-white">{(Number(driver.ratingAvg) || 0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Car className="h-4 w-4 text-slate-500" />
                        <span>{driver.totalTrips}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {driver.isAvailable ? (
                        <button
                          onClick={() => { setAssignTarget(driver); setSelectedTripId(""); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#0A1628] bg-amber-500 hover:bg-amber-400 transition-all"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Asignar
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600 italic">No disponible</span>
                      )}
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
              Página {page} de {totalPages} · {total} conductores
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

      {/* Assign Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-[#1C2D54] p-6 w-full max-w-lg shadow-2xl bg-[#132040]">
            <h3 className="text-lg font-bold text-white mb-1">Asignar Conductor a Viaje</h3>
            <p className="text-sm text-slate-400 mb-5">
              Conductor:{" "}
              <strong className="text-amber-400">{assignTarget.user?.name ?? "—"}</strong>
              <span className="text-slate-500 ml-2">· Lic. {assignTarget.licenseNumber}</span>
            </p>

            {/* Trip selector */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {!pendingTrips ? (
                <div className="text-center py-6 text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Cargando viajes pendientes...
                </div>
              ) : pendingTrips.length === 0 ? (
                <div className="bg-[#0A1628] rounded-lg p-4 text-sm text-slate-400 text-center">
                  No hay viajes cotizados sin conductor asignado.
                </div>
              ) : (
                pendingTrips.map((trip) => (
                  <label
                    key={trip.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTripId === trip.id
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-[#1C2D54] bg-[#0A1628] hover:border-[#243760]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="trip"
                      value={trip.id}
                      checked={selectedTripId === trip.id}
                      onChange={() => setSelectedTripId(trip.id)}
                      className="mt-1 accent-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-amber-400 bg-[#1C2D54] px-1.5 py-0.5 rounded">
                          {trip.shortId}
                        </span>
                        <span className="text-slate-400 text-xs">{trip.client?.name ?? "—"}</span>
                        <span className="ml-auto text-white font-semibold text-xs">${(Number(trip.quotedPrice) || 0).toFixed(2)}</span>
                      </div>
                      <p className="text-slate-300 text-xs mt-1 truncate">{trip.pickupAddress}</p>
                      <p className="text-slate-500 text-xs truncate">→ {trip.dropoffAddress}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setAssignTarget(null); setSelectedTripId(""); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 border border-[#1C2D54] hover:text-white hover:border-[#243760] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => assignMutation.mutate({ tripId: selectedTripId, driverId: assignTarget.userId })}
                disabled={!selectedTripId || assignMutation.isPending}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-[#0A1628] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {assignMutation.isPending ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Asignando...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Confirmar Asignación</>
                )}
              </button>
            </div>
            {assignMutation.isError && (
              <p className="text-red-400 text-xs mt-3 text-center flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Error al asignar. Verifica permisos (SUPERVISOR/SUPERADMIN).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
