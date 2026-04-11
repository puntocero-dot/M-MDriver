"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, ShieldCheck, ChevronRight, Calculator,
  Loader2, LogOut, History, PlusCircle, Car, AlertTriangle
} from "lucide-react";
import { calculateQuote, createTrip, getMyTrips, type QuoteResponse, type Trip } from "../../lib/api";
import { clearAuth, getToken, getUser } from "../../lib/auth";

const LOCATIONS = [
  { label: "Aeropuerto Internacional El Salvador", lat: 13.4409, lng: -89.0557 },
  { label: "San Benito, San Salvador", lat: 13.6933, lng: -89.2372 },
  { label: "Santa Elena, Antiguo Cuscatlán", lat: 13.6769, lng: -89.2483 },
  { label: "Multiplaza / Cascadas", lat: 13.6821, lng: -89.2526 },
  { label: "World Trade Center SS", lat: 13.7082, lng: -89.2394 },
  { label: "Nuevo Cuscatlán", lat: 13.6475, lng: -89.2688 },
];

type Tab = "book" | "history";

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("book");
  
  // Book State
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // History State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    if (!token || !u) {
      router.push("/login");
      return;
    }
    setUser(u);
    if (activeTab === "history") {
      fetchTrips();
    }
  }, [activeTab]);

  async function fetchTrips() {
    setLoadingTrips(true);
    const token = getToken();
    try {
      if (!token) return;
      const data = await getMyTrips(token);
      setTrips(data?.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingTrips(false);
    }
  }

  function handleLogout() {
    clearAuth();
    router.push("/");
  }

  const pickupObj = LOCATIONS.find((l) => l.label === pickup);
  const dropoffObj = LOCATIONS.find((l) => l.label === dropoff);

  async function handleQuote() {
    if (!pickupObj || !dropoffObj) {
      setError("Seleccione Origen y Destino.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await calculateQuote({
        pickupLat: pickupObj.lat,
        pickupLng: pickupObj.lng,
        dropoffLat: dropoffObj.lat,
        dropoffLng: dropoffObj.lng,
      });
      setQuote(result);
    } catch (err: any) {
      setError(err.message ?? "Error en cotización.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBook() {
    if (!quote || !pickupObj || !dropoffObj) return;
    setError("");
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;
      const t = await createTrip({
        pickupAddress: pickupObj.label,
        pickupLat: pickupObj.lat,
        pickupLng: pickupObj.lng,
        dropoffAddress: dropoffObj.label,
        dropoffLat: dropoffObj.lat,
        dropoffLng: dropoffObj.lng,
        quotedPrice: quote.estimatedPrice,
      }, token);
      setSuccess(`Misión Confirmada. ID: ${t.id}`);
      setQuote(null);
      setPickup("");
      setDropoff("");
      setTimeout(() => {
        setSuccess("");
        setActiveTab("history");
      }, 3000);
    } catch (err: any) {
      setError(err.message ?? "Error al reservar misión.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null; // Avoid hydration mismatch while redirecting

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center">
      
      {/* ── Navbar ── */}
      <nav className="w-full h-20 bg-surface-high border-b border-white/5 flex items-center justify-between px-6 md:px-12 fixed top-0 z-50">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CFA12E] to-[#A07D20] flex items-center justify-center shadow-lg">
            <ShieldCheck size={20} className="text-[#0A1628]" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-xs font-serif font-black tracking-widest uppercase">M&M Driver</span>
            <span className="text-gold/60 text-[9px] font-black tracking-[0.3em] uppercase">Client Terminal</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end mr-4 border-r border-white/10 pr-6">
            <span className="text-white/80 text-xs font-bold tracking-wide">{user.firstName} {user.lastName}</span>
            <span className="text-white/40 text-[9px] font-black tracking-widest uppercase">{user.email}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all group"
          >
            <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </nav>

      {/* ── Main Content Area ── */}
      <div className="w-full max-w-[1200px] mt-[100px] px-6 lg:px-8 mb-20 flex flex-col md:flex-row gap-8 lg:gap-12 mx-auto">
        
        {/* ── Sidebar Tabs ── */}
        <div className="w-full md:w-72 flex flex-col gap-3 shrink-0">
          <button
            onClick={() => setActiveTab("book")}
            className={`flex items-center gap-4 py-4 px-6 rounded-2xl transition-all duration-300 font-bold text-xs tracking-widest uppercase ${
              activeTab === "book" 
                ? "bg-gold/10 border-gold/30 text-gold shadow-[0_0_20px_rgba(197,165,90,0.1)] border" 
                : "bg-surface-high border-white/5 text-white/40 border hover:bg-white/5 hover:text-white"
            }`}
          >
            <PlusCircle size={18} />
            Nueva Misión
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-4 py-4 px-6 rounded-2xl transition-all duration-300 font-bold text-xs tracking-widest uppercase ${
              activeTab === "history" 
                ? "bg-gold/10 border-gold/30 text-gold shadow-[0_0_20px_rgba(197,165,90,0.1)] border" 
                : "bg-surface-high border-white/5 text-white/40 border hover:bg-white/5 hover:text-white"
            }`}
          >
            <History size={18} />
            Mis Viajes
          </button>
        </div>

        {/* ── Main Content Container ── */}
        <div className="flex-1 bg-surface-high border border-white/5 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden min-h-[600px]">
          {/* Ambient Glow */}
          <div className="absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-gold/5 blur-[100px] pointer-events-none" />

          <AnimatePresence mode="wait">
            
            {/* BOOKING TAB */}
            {activeTab === "book" && (
              <motion.div
                key="book"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="mb-10">
                  <h2 className="text-3xl font-serif text-white mb-2">Solicitar Unidad</h2>
                  <p className="text-white/40 text-sm font-light">Cotización inmediata de traslados certificados.</p>
                </div>

                <div className="space-y-6 max-w-xl">
                  {/* Select Origin */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 ml-2">Origen de Protocolo</label>
                    <div className="relative group">
                      <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" />
                      <select
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        className="w-full rounded-2xl bg-surface border border-white/10 px-16 py-5 text-sm text-white appearance-none focus:outline-none focus:border-gold/40 focus:bg-white/[0.02] transition-all duration-300"
                      >
                        <option value="" className="bg-[#0A1628]">Seleccionar origen...</option>
                        {LOCATIONS.map((loc) => (
                          <option key={"p-"+loc.label} value={loc.label} className="bg-[#0A1628] text-sm py-2">
                            {loc.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Select Destination */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 ml-2">Destino de Protocolo</label>
                    <div className="relative group">
                      <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" />
                      <select
                        value={dropoff}
                        onChange={(e) => setDropoff(e.target.value)}
                        className="w-full rounded-2xl bg-surface border border-white/10 px-16 py-5 text-sm text-white appearance-none focus:outline-none focus:border-gold/40 focus:bg-white/[0.02] transition-all duration-300"
                      >
                        <option value="" className="bg-[#0A1628]">Seleccionar destino...</option>
                         {LOCATIONS.map((loc) => (
                          <option key={"d-"+loc.label} value={loc.label} className="bg-[#0A1628] text-sm py-2">
                            {loc.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  {error && <p className="text-red-400 text-xs font-bold bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</p>}
                  {success && <p className="text-green-400 text-xs font-bold bg-green-400/10 p-4 rounded-xl border border-green-400/20">{success}</p>}

                  {!quote ? (
                    <button
                      onClick={handleQuote}
                      disabled={loading || !pickup || !dropoff}
                      className="w-full mt-4 py-5 rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-4 bg-white/5 border border-white/10 hover:bg-gold hover:text-surface text-gold hover:border-gold group"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : (
                        <>
                          <Calculator size={16} />
                          Calcular Tarifa
                        </>
                      )}
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 border border-gold/30 bg-gold/5 rounded-3xl p-8 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Calculator size={100} />
                      </div>
                      <p className="text-[10px] font-black tracking-[0.4em] uppercase text-gold/60 mb-2">Cuota Autorizada</p>
                      <div className="flex items-end gap-2 mb-6">
                        <span className="text-5xl font-black text-white">${quote.estimatedPrice.toFixed(2)}</span>
                        <span className="text-sm font-bold text-white/40 mb-2 uppercase tracking-wide">{quote.currency}</span>
                      </div>
                      
                      <div className="flex gap-6 mb-8">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase mb-1">Distancia</span>
                          <span className="text-sm font-bold text-white/80">{(quote.estimatedDistanceMeters / 1000).toFixed(1)} km</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black tracking-[0.2em] text-white/40 uppercase mb-1">Estimado</span>
                          <span className="text-sm font-bold text-white/80">{Math.ceil(quote.estimatedDurationSeconds / 60)} min</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setQuote(null)}
                          className="flex-1 py-4 rounded-xl font-bold text-[10px] tracking-[0.2em] uppercase bg-surface border border-white/10 hover:bg-white/5 transition-colors text-white mt-auto"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleBook}
                          disabled={loading}
                          className="flex-[2] py-4 rounded-xl font-black text-[11px] tracking-[0.3em] uppercase bg-gradient-to-r from-gold-vibrant to-gold text-surface shadow-[0_0_20px_rgba(207,161,46,0.3)] transition-all flex justify-center items-center gap-2"
                        >
                          {loading ? <Loader2 size={18} className="animate-spin" /> : "Confirmar Viaje"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="mb-10 flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-serif text-white mb-2">Bitácora de Viajes</h2>
                    <p className="text-white/40 text-sm font-light">Registro histórico de misiones corporativas.</p>
                  </div>
                  <button onClick={fetchTrips} className="text-gold hover:text-gold-vibrant p-2 rounded-full hover:bg-gold/10 transition-colors">
                    {loadingTrips ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                  </button>
                </div>

                {loadingTrips ? (
                  <div className="flex-1 flex justify-center items-center min-h-[300px]">
                    <Loader2 size={32} className="animate-spin text-gold" />
                  </div>
                ) : trips.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center min-h-[300px] text-center opacity-50">
                    <Car size={48} className="text-white/20 mb-6" />
                    <p className="text-white/60 font-medium">Bóveda vacía.</p>
                    <p className="text-white/30 text-sm mt-2">Aún no hay misiones registradas.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 custom-scrollbar max-h-[600px] overflow-y-auto pr-2">
                    {trips.map((t) => (
                      <div key={t.id} className="bg-surface border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group hover:border-gold/20 transition-colors">
                        <div className="flex-1 flex flex-col gap-4">
                          {/* Route */}
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-2 h-2 rounded-full border border-gold" />
                              <div className="w-[1px] h-4 bg-white/10" />
                              <div className="w-2 h-2 rounded-full bg-gold" />
                            </div>
                            <div className="flex flex-col text-sm font-medium text-white/80 gap-3">
                              <p className="truncate max-w-[200px] md:max-w-xs">{t.pickupAddress}</p>
                              <p className="truncate max-w-[200px] md:max-w-xs">{t.dropoffAddress}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status & Price */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-green-500/80">{t.status || "CONFIRMADO"}</span>
                          </div>
                          <span className="text-xl font-black text-white">${(t.fare ?? 0).toFixed(2)}</span>
                          <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
