"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  DollarSign,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  User,
  Lock,
  MapPin,
  Clock,
  Fuel,
  Car,
  TrendingUp,
} from "lucide-react";
import api from "@/lib/api";

interface PricingConfig {
  id: string;
  name: string;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  perStopSurcharge: number;
  waitTimePerMinute: number;
  minimumFare: number;
  fuelFactor: number;
  companyVehicleSurcharge: number;
  isActive: boolean;
  effectiveFrom: string | null;
  createdAt: string;
}

interface PricingField {
  key: keyof Omit<PricingConfig, "id" | "name" | "isActive" | "effectiveFrom" | "createdAt">;
  label: string;
  desc: string;
  icon: React.ElementType;
  prefix: string;
  step: string;
}

const PRICING_FIELDS: PricingField[] = [
  { key: "baseFare", label: "Tarifa Base", desc: "Costo inicial por viaje", icon: DollarSign, prefix: "$", step: "0.01" },
  { key: "perKmRate", label: "Tarifa por Km", desc: "Costo adicional por kilómetro", icon: MapPin, prefix: "$", step: "0.01" },
  { key: "perMinuteRate", label: "Tarifa por Minuto", desc: "Costo por minuto de viaje", icon: Clock, prefix: "$", step: "0.001" },
  { key: "perStopSurcharge", label: "Recargo por Parada", desc: "Costo adicional por cada parada", icon: MapPin, prefix: "$", step: "0.01" },
  { key: "waitTimePerMinute", label: "Espera por Minuto", desc: "Costo por minuto de espera", icon: Clock, prefix: "$", step: "0.001" },
  { key: "minimumFare", label: "Tarifa Mínima", desc: "Cobro mínimo garantizado", icon: TrendingUp, prefix: "$", step: "0.01" },
  { key: "fuelFactor", label: "Factor de Combustible", desc: "Multiplicador por precio del combustible", icon: Fuel, prefix: "×", step: "0.001" },
  { key: "companyVehicleSurcharge", label: "Recargo Vehículo Empresa", desc: "Costo extra por vehículo de empresa", icon: Car, prefix: "$", step: "0.01" },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savedOk, setSavedOk] = useState(false);

  const { data: configs, isLoading, error } = useQuery<PricingConfig[]>({
    queryKey: ["admin-pricing"],
    queryFn: async () => {
      const res = await api.get("/admin/pricing");
      return res.data;
    },
    staleTime: 60_000,
  });

  const activeConfig = configs?.find((c) => c.isActive) ?? configs?.[0];

  useEffect(() => {
    if (activeConfig) {
      const vals: Record<string, string> = {};
      PRICING_FIELDS.forEach((f) => {
        vals[f.key] = String(activeConfig[f.key] ?? "");
      });
      setFormValues(vals);
    }
  }, [activeConfig]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!activeConfig) throw new Error("No config found");
      const payload: Record<string, number> = {};
      PRICING_FIELDS.forEach((f) => {
        payload[f.key] = parseFloat(formValues[f.key] ?? "0");
      });
      const res = await api.patch(`/admin/pricing/${activeConfig.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    },
  });

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (activeConfig) {
      const vals: Record<string, string> = {};
      PRICING_FIELDS.forEach((f) => {
        vals[f.key] = String(activeConfig[f.key] ?? "");
      });
      setFormValues(vals);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-400" />
          Configuración del Sistema
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Ajusta las tarifas operativas y parámetros de la plataforma
        </p>
      </div>

      {/* ── PRICING CONFIG ────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Configuración de Tarifas</h2>
          {activeConfig && (
            <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
              activeConfig.isActive
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "bg-slate-500/15 text-slate-400 border border-slate-500/20"
            }`}>
              {activeConfig.isActive ? "● Activa" : "Inactiva"} · {activeConfig.name}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#132040] border border-[#1C2D54] rounded-xl p-5 animate-pulse">
                <div className="h-3 bg-[#1C2D54] rounded w-1/2 mb-2" />
                <div className="h-10 bg-[#1C2D54] rounded" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">No se pudo cargar la configuración de tarifas.</p>
          </div>
        )}

        {!isLoading && !error && !activeConfig && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-amber-300 text-sm">No hay configuración de tarifas registrada en la base de datos.</p>
          </div>
        )}

        {activeConfig && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRICING_FIELDS.map((field) => {
                const Icon = field.icon;
                return (
                  <div
                    key={field.key}
                    className="bg-[#132040] border border-[#1C2D54] rounded-xl p-5 focus-within:border-amber-400/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-amber-400/70" />
                      <label className="text-sm font-medium text-white">{field.label}</label>
                    </div>
                    <p className="text-slate-500 text-xs mb-3">{field.desc}</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-semibold text-sm">
                        {field.prefix}
                      </span>
                      <input
                        type="number"
                        step={field.step}
                        min="0"
                        value={formValues[field.key] ?? ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full bg-[#0A1628] border border-[#1C2D54] text-white rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-400/60 transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-[#0A1628] font-semibold rounded-lg text-sm transition-colors"
              >
                {updateMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                onClick={handleReset}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#132040] hover:bg-[#1C2D54] text-slate-300 rounded-lg text-sm border border-[#1C2D54] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Restablecer
              </button>
              {savedOk && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  ¡Cambios guardados!
                </div>
              )}
              {updateMutation.isError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Error al guardar. Solo SUPERADMIN puede modificar tarifas.
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── DIVIDER ─────────────────────────────────────── */}
      <div className="border-t border-[#1C2D54]" />

      {/* ── OTHER SETTINGS (coming soon) ─────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-500" />
          Otras Configuraciones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Lock, label: "Seguridad y Accesos", desc: "Contraseñas, roles y permisos de API" },
            { icon: User, label: "Perfil del Administrador", desc: "Datos personales y foto de perfil" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="p-5 rounded-xl border border-[#1C2D54]/50 bg-[#0f1c35]/50 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-[#1C2D54] text-slate-500">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      {s.label}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C2D54] text-slate-500 font-mono tracking-tighter">
                        PRONTO
                      </span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
