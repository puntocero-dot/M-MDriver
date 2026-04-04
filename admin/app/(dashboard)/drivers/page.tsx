"use client";

// TODO: Replace mock data with real API call:
// GET /drivers?available={filter}&page={page}
// Use react-query: useQuery({ queryKey: ['drivers', filter, page], queryFn: ... })
// TODO: Implement assign to trip: POST /trips/:id/assign { driverId }

import { useState } from "react";
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
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  license: string;
  phone: string;
  available: boolean;
  rating: number;
  totalTrips: number;
  vehicle: string;
  joinedDate: string;
}

// TODO: Remove mock data and replace with API fetch
const MOCK_DRIVERS: Driver[] = [
  { id: "D-001", name: "Roberto Flores", license: "SV-2024-0192", phone: "+503 6543-2109", available: true, rating: 4.9, totalTrips: 312, vehicle: "Toyota Camry 2023", joinedDate: "2024-01-15" },
  { id: "D-002", name: "Luis Torres", license: "SV-2023-0887", phone: "+503 7654-3210", available: false, rating: 4.7, totalTrips: 289, vehicle: "Honda Accord 2022", joinedDate: "2023-08-20" },
  { id: "D-003", name: "Marco Díaz", license: "SV-2024-0234", phone: "+503 8765-4321", available: true, rating: 4.8, totalTrips: 156, vehicle: "Hyundai Sonata 2023", joinedDate: "2024-03-10" },
  { id: "D-004", name: "Juan Pérez", license: "SV-2022-0456", phone: "+503 9876-5432", available: true, rating: 5.0, totalTrips: 445, vehicle: "Lexus ES 2023", joinedDate: "2022-11-05" },
  { id: "D-005", name: "Carlos Rivas", license: "SV-2023-1023", phone: "+503 6789-0123", available: false, rating: 4.6, totalTrips: 198, vehicle: "Mazda 6 2022", joinedDate: "2023-05-18" },
  { id: "D-006", name: "Pedro Martínez", license: "SV-2024-0567", phone: "+503 7890-1234", available: true, rating: 4.9, totalTrips: 87, vehicle: "Toyota Corolla 2024", joinedDate: "2024-06-01" },
  { id: "D-007", name: "Eduardo Vásquez", license: "SV-2023-0341", phone: "+503 8901-2345", available: true, rating: 4.7, totalTrips: 234, vehicle: "Kia K5 2023", joinedDate: "2023-02-14" },
  { id: "D-008", name: "Miguel Ramírez", license: "SV-2022-0789", phone: "+503 9012-3456", available: false, rating: 4.5, totalTrips: 367, vehicle: "Hyundai Elantra 2022", joinedDate: "2022-07-30" },
];

const PAGE_SIZE = 6;

export default function DriversPage() {
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);

  const filtered = MOCK_DRIVERS.filter((driver) => {
    const matchesSearch =
      search === "" ||
      driver.name.toLowerCase().includes(search.toLowerCase()) ||
      driver.license.toLowerCase().includes(search.toLowerCase()) ||
      driver.vehicle.toLowerCase().includes(search.toLowerCase());

    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && driver.available) ||
      (availabilityFilter === "busy" && !driver.available);

    return matchesSearch && matchesAvailability;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearchChange(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleFilterChange(val: string) {
    setAvailabilityFilter(val);
    setPage(1);
  }

  const availableCount = MOCK_DRIVERS.filter((d) => d.available).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Conductores</h1>
          <p className="text-slate-400 text-sm mt-1">
            {availableCount} de {MOCK_DRIVERS.length} conductores disponibles
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl border border-slate-700/50 p-4"
        style={{ backgroundColor: "#132040" }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, licencia o vehículo..."
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
          <select
            value={availabilityFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="
              px-4 py-2.5 rounded-lg text-sm text-white
              border border-slate-600 outline-none
              focus:border-amber-500 transition-colors cursor-pointer
            "
            style={{ backgroundColor: "#0A1628" }}
          >
            <option value="all">Todos</option>
            <option value="available">Disponibles</option>
            <option value="busy">En servicio</option>
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
                  Nombre
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Licencia
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Vehículo
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Disponible
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                  Rating
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                  Viajes Totales
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
                    No se encontraron conductores.
                  </td>
                </tr>
              ) : (
                paginated.map((driver) => (
                  <tr
                    key={driver.id}
                    className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{driver.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {driver.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className="font-mono text-xs px-2 py-1 rounded text-slate-300"
                        style={{ backgroundColor: "#1C2D54" }}
                      >
                        {driver.license}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-slate-300 text-sm">
                        {driver.vehicle}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {driver.available ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300 border border-green-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-600">
                          <XCircle className="h-3.5 w-3.5" />
                          En Servicio
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Star
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                        <span className="font-semibold text-white">
                          {driver.rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Car className="h-4 w-4 text-slate-500" />
                        <span>{driver.totalTrips}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {driver.available ? (
                        <button
                          onClick={() => setAssignTarget(driver.id)}
                          className="
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                            text-xs font-medium text-slate-900
                            transition-all duration-150 hover:opacity-90
                          "
                          style={{ backgroundColor: "#C5A55A" }}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Asignar a Viaje
                        </button>
                      ) : (
                        <span className="text-xs text-slate-600 italic">
                          No disponible
                        </span>
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
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "#1C2D54" }}
          >
            <span className="text-xs text-slate-500">
              Mostrando {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}{" "}
              conductores
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    p === page
                      ? "text-slate-900 font-semibold"
                      : "text-slate-400 hover:text-white border border-slate-600"
                  }`}
                  style={p === page ? { backgroundColor: "#C5A55A" } : {}}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assign modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="rounded-2xl border border-slate-700/50 p-6 w-full max-w-md shadow-2xl"
            style={{ backgroundColor: "#132040" }}
          >
            <h3 className="text-lg font-bold text-white mb-2">
              Asignar Conductor a Viaje
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Conductor:{" "}
              <strong className="text-white">
                {MOCK_DRIVERS.find((d) => d.id === assignTarget)?.name}
              </strong>
            </p>
            {/* TODO: Show list of unassigned trips and allow selection */}
            <div
              className="rounded-lg p-4 text-sm text-slate-400 text-center"
              style={{ backgroundColor: "#0A1628" }}
            >
              TODO: Mostrar viajes sin chofer asignado para seleccionar
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setAssignTarget(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 border border-slate-600 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => setAssignTarget(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-slate-900 transition-all hover:opacity-90"
                style={{ backgroundColor: "#C5A55A" }}
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
