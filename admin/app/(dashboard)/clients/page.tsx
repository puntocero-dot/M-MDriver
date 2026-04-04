"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  UserX,
  Phone,
  Mail,
  Car,
  Shield,
  AlertTriangle,
} from "lucide-react";
import api from "@/lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  totalTrips: number;
}

interface ClientsResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const { data, isLoading, error } = useQuery<ClientsResponse>({
    queryKey: ["admin-clients", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      const res = await api.get(`/admin/clients?${params}`);
      return res.data;
    },
    staleTime: 30_000,
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/users/${userId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      setShowDeactivateModal(false);
      setSelectedClient(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clients = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            Directorio de Clientes
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isLoading ? "Cargando..." : `${total} cliente${total !== 1 ? "s" : ""} registrado${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full bg-[#132040] border border-[#1C2D54] text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-400/60 transition-colors"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-[#0A1628] font-semibold rounded-lg text-sm transition-colors">
          Buscar
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
            className="px-4 py-2.5 bg-[#132040] hover:bg-[#1C2D54] text-slate-300 rounded-lg text-sm border border-[#1C2D54] transition-colors"
          >
            Limpiar
          </button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">No se pudieron cargar los clientes. Verifica que el backend esté activo.</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#132040] border border-[#1C2D54] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1C2D54] bg-[#0A1628]">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Cliente</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Contacto</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">Viajes</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">Registro</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Estado</th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2D54]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-[#1C2D54] rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      {search ? "No se encontraron clientes con ese criterio" : "No hay clientes registrados aún"}
                    </p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-[#0f1c35] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-400 font-semibold text-sm">
                            {client.firstName[0]}{client.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{client.firstName} {client.lastName}</p>
                          <p className="text-slate-500 text-xs font-mono">{client.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300 text-sm">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {client.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-amber-400" />
                        <span className="text-white font-semibold">{client.totalTrips}</span>
                        <span className="text-slate-500 text-xs">viaje{client.totalTrips !== 1 ? "s" : ""}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-slate-400 text-sm">
                        {format(new Date(client.createdAt), "d MMM yyyy", { locale: es })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          client.isActive
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-500/15 text-slate-400 border border-slate-500/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${client.isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
                          {client.isActive ? "Activo" : "Inactivo"}
                        </span>
                        {client.isVerified && (
                          <span title="Verificado"><Shield className="w-3.5 h-3.5 text-blue-400" /></span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {client.isActive ? (
                        <button
                          onClick={() => { setSelectedClient(client); setShowDeactivateModal(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Desactivar</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">Desactivado</span>
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
          <div className="px-6 py-4 border-t border-[#1C2D54] flex items-center justify-between">
            <p className="text-slate-400 text-sm">Página {page} de {totalPages} · {total} clientes</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-[#1C2D54] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-white text-sm font-medium px-2">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg bg-[#1C2D54] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#132040] border border-[#1C2D54] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Desactivar cliente</h3>
                <p className="text-slate-400 text-sm">Esta acción requiere confirmación</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              ¿Desactivar a <span className="text-white font-semibold">{selectedClient.firstName} {selectedClient.lastName}</span>? No podrá acceder a la plataforma.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeactivateModal(false); setSelectedClient(null); }}
                className="flex-1 py-2.5 bg-[#1C2D54] hover:bg-[#243760] text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deactivateMutation.mutate(selectedClient.id)}
                disabled={deactivateMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {deactivateMutation.isPending ? "Desactivando..." : "Desactivar"}
              </button>
            </div>
            {deactivateMutation.isError && (
              <p className="text-red-400 text-xs mt-3 text-center">
                Error: Solo SUPERADMIN puede desactivar clientes.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
