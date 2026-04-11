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
    <div className="flex flex-col lg:flex-row h-screen bg-[#0f1c35] overflow-hidden">
      
      {/* ── Mobile Sidebar Header ── */}
      <nav className="lg:hidden w-full h-20 bg-surface-high border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CFA12E] to-[#A07D20] flex items-center justify-center shadow-lg">
            <ShieldCheck size={20} className="text-[#0A1628]" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-xs font-serif font-black tracking-widest uppercase">M&M Driver</span>
            <span className="text-gold/60 text-[9px] font-black tracking-[0.3em] uppercase">Client Terminal</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </nav>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-[320px] bg-[#0A1628] border-r border-white/5 flex-col shrink-0 relative z-20">
        {/* Subtle glow in sidebar */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gold/5 blur-[80px] pointer-events-none" />

        {/* Brand */}
        <div className="p-10 border-b border-white/5">
          <div className="flex items-center gap-4 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1C2D54] to-[#132040] border border-gold/30 flex items-center justify-center shadow-[0_0_20px_rgba(197,165,90,0.15)] group-hover:shadow-[0_0_25px_rgba(197,165,90,0.3)] transition-all flex-shrink-0">
              <ShieldCheck size={28} className="text-gold" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-white text-lg font-serif font-black tracking-widest uppercase leading-tight truncate">M&M Driver</span>
              <span className="text-gold/60 text-[9px] font-black tracking-[0.4em] uppercase truncate">Private Vault</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 py-10 px-6 flex flex-col gap-4">
          <button
            onClick={() => setActiveTab("book")}
            className={`flex items-center gap-4 py-4 px-6 rounded-2xl transition-all duration-300 font-bold text-[11px] tracking-widest uppercase relative overflow-hidden group ${
              activeTab === "book" 
                ? "text-gold border border-gold/30 bg-[#1C2D54]/40 shadow-[0_0_20px_rgba(197,165,90,0.05)]" 
                : "text-white/40 border border-transparent hover:bg-white/5 hover:text-white"
            }`}
          >
            {activeTab === "book" && <div className="absolute inset-0 bg-gold/5 animate-pulse" />}
            <PlusCircle size={20} className="relative z-10" />
            <span className="relative z-10 mt-[2px]">Nueva Misión</span>
          </button>
          
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-4 py-4 px-6 rounded-2xl transition-all duration-300 font-bold text-[11px] tracking-widest uppercase relative overflow-hidden group ${
              activeTab === "history" 
                ? "text-gold border border-gold/30 bg-[#1C2D54]/40 shadow-[0_0_20px_rgba(197,165,90,0.05)]" 
                : "text-white/40 border border-transparent hover:bg-white/5 hover:text-white"
            }`}
          >
            {activeTab === "history" && <div className="absolute inset-0 bg-gold/5 animate-pulse" />}
            <History size={20} className="relative z-10" />
            <span className="relative z-10 mt-[2px]">Bitácora Global</span>
          </button>
        </div>

        {/* User Card & Logout */}
        <div className="p-6 border-t border-white/5">
          <div className="bg-[#1C2D54]/20 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex flex-col truncate pr-4">
              <span className="text-white/90 text-[10px] font-black tracking-widest uppercase truncate">{user.firstName} {user.lastName}</span>
              <span className="text-white/40 text-[9px] font-bold tracking-widest uppercase truncate">{user.email}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={16} className="-translate-x-0.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area (Scrollable Dashboard) ── */}
      <main className="flex-1 h-full overflow-y-auto relative z-10 p-4 sm:p-8 lg:p-12 custom-scrollbar">
        {/* Mobile Tabs Wrapper */}
        <div className="lg:hidden flex gap-2 mb-8 bg-surface-high border border-white/5 p-1 rounded-2xl max-w-sm mx-auto">
           <button
            onClick={() => setActiveTab("book")}
            className={`flex-1 py-3 font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all ${
              activeTab === "book" ? "bg-gold/10 text-gold border border-gold/20" : "text-white/40"
            }`}
          >
            Nueva Misión
          </button>
           <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all ${
              activeTab === "history" ? "bg-gold/10 text-gold border border-gold/20" : "text-white/40"
            }`}
          >
            Bitácora
          </button>
        </div>

        {/* Main Content Wrapper */}
        <div className="w-full max-w-5xl mx-auto min-h-[600px] flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* BOOKING TAB */}
            {activeTab === "book" && (
              <motion.div
                key="book"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="card-service lg:p-14"
              >
                <div className="mb-12 border-b border-white/5 pb-8">
                  <h2 className="text-3xl lg:text-4xl font-serif text-white mb-3 tracking-tight">Solicitar Unidad</h2>
                  <p className="text-white/40 text-sm font-light">Cotización inmediata de traslados certificados. Seleccione sus coordenadas seguras.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-12 lg:gap-16">
                  <div className="flex flex-col gap-8">
                    {/* Select Origin */}
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black tracking-[0.3em] uppercase text-gold ml-1">Origen Asignado</label>
                      <div className="relative group">
                        <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors z-20 pointer-events-none" />
                        <select
                          value={pickup}
                          onChange={(e) => setPickup(e.target.value)}
                          className="w-full h-16 rounded-2xl bg-[#0f1c35]/80 border border-white/5 pl-16 pr-12 text-sm md:text-base text-white appearance-none focus:outline-none focus:border-gold/50 focus:bg-[#1C2D54]/50 focus:shadow-[0_0_20px_rgba(197,165,90,0.1)] transition-all cursor-pointer"
                        >
                          <option value="" className="bg-[#0A1628] text-white/40">Seleccionar origen de protocolo...</option>
                          {LOCATIONS.map((loc) => (
                            <option key={"p-"+loc.label} value={loc.label} className="bg-[#0A1628] text-sm py-3">
                              {loc.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none z-20">
                          <ChevronRight size={16} className="text-white/20" />
                        </div>
                      </div>
                    </div>

                    {/* Select Destination */}
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black tracking-[0.3em] uppercase text-gold ml-1">Destino Seguro</label>
                      <div className="relative group">
                        <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors z-20 pointer-events-none" />
                        <select
                          value={dropoff}
                          onChange={(e) => setDropoff(e.target.value)}
                          className="w-full h-16 rounded-2xl bg-[#0f1c35]/80 border border-white/5 pl-16 pr-12 text-sm md:text-base text-white appearance-none focus:outline-none focus:border-gold/50 focus:bg-[#1C2D54]/50 focus:shadow-[0_0_20px_rgba(197,165,90,0.1)] transition-all cursor-pointer"
                        >
                          <option value="" className="bg-[#0A1628] text-white/40">Seleccionar destino cerrado...</option>
                           {LOCATIONS.map((loc) => (
                            <option key={"d-"+loc.label} value={loc.label} className="bg-[#0A1628] text-sm py-3">
                              {loc.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none z-20">
                          <ChevronRight size={16} className="text-white/20" />
                        </div>
                      </div>
                    </div>

                    {/* Actions / Feedback */}
                    {error && (
                      <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                        <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-300 text-xs leading-relaxed">{error}</p>
                      </div>
                    )}
                    {success && (
                      <div className="flex items-start gap-3 bg-green-900/20 border border-green-500/20 rounded-xl p-4">
                        <ShieldCheck size={18} className="text-green-400 shrink-0 mt-0.5" />
                        <p className="text-green-300 text-xs leading-relaxed tracking-wide font-black uppercase">{success}</p>
                      </div>
                    )}

                    {!quote && (
                      <button
                        onClick={handleQuote}
                        disabled={loading || !pickup || !dropoff}
                        className="btn-outline-premium w-full mt-4 flex items-center justify-center gap-4 group disabled:opacity-50"
                      >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : (
                          <>
                            <Calculator size={18} className="group-hover:text-gold-vibrant" />
                            <span className="mt-[2px]">Evaluar Ruta Segura</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right Column: Quote Display */}
                  <div className="flex flex-col">
                    {quote ? (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="h-full rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between"
                        style={{ background: "linear-gradient(135deg, rgba(197,165,90,0.1) 0%, rgba(19,32,64,0) 100%)", border: "1px solid rgba(197,165,90,0.2)" }}
                      >
                        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
                          <Calculator size={180} />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                            <p className="text-[10px] font-black tracking-[0.4em] uppercase text-gold">Resumen de Misión</p>
                          </div>
                          
                          <div className="flex items-end gap-3 mb-8">
                            <span className="text-5xl lg:text-6xl font-black text-white tracking-tighter">${quote.estimatedPrice.toFixed(2)}</span>
                            <span className="text-sm font-bold text-white/40 mb-2 uppercase tracking-widest">{quote.currency}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6 mb-10 border-t border-white/5 pt-8">
                            <div className="flex flex-col gap-2">
                              <span className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">Distancia</span>
                              <span className="text-lg font-bold text-white/90">{(quote.estimatedDistanceMeters / 1000).toFixed(1)} km</span>
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">ETA</span>
                              <span className="text-lg font-bold text-white/90">{Math.ceil(quote.estimatedDurationSeconds / 60)} min</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          <button
                            onClick={handleBook}
                            disabled={loading}
                            className="btn-premium w-full flex items-center justify-center gap-3"
                          >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (
                              <>Autorizar y Desplegar</>
                            )}
                          </button>
                          <button
                            onClick={() => setQuote(null)}
                            className="py-4 rounded-full font-black text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors text-center"
                          >
                            Cancelar Protocolo
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-full border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-8 opacity-50 bg-white/[0.01] min-h-[300px]">
                        <ShieldCheck size={48} className="text-white/20 mb-6" />
                        <p className="text-[11px] font-black tracking-[0.3em] uppercase text-white/40 max-w-[200px] leading-relaxed">Esperando Selección de Coordenadas</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* HISTORY TAB */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col h-full bg-[#132040]/30 rounded-3xl border border-white/5 p-6 lg:p-12 shadow-2xl relative"
              >
                <div className="mb-10 flex justify-between items-end border-b border-white/5 pb-8 border-dashed">
                  <div>
                    <h2 className="text-3xl font-serif text-white mb-2 tracking-tight">Bitácora Global</h2>
                    <p className="text-white/40 text-sm font-light">Registro histórico de misiones desplegadas en su bóveda.</p>
                  </div>
                  <button onClick={fetchTrips} className="text-gold hover:text-gold-vibrant p-4 rounded-full hover:bg-gold/10 border border-transparent hover:border-gold/20 transition-all shadow-md">
                    {loadingTrips ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                  </button>
                </div>

                {loadingTrips ? (
                  <div className="flex-1 flex justify-center items-center py-32">
                    <Loader2 size={32} className="animate-spin text-gold" />
                  </div>
                ) : trips.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center py-32 text-center">
                    <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                      <Car size={32} className="text-white/20" />
                    </div>
                    <p className="text-[12px] font-black tracking-[0.3em] uppercase text-white/50 mb-2">Bóveda Vacía</p>
                    <p className="text-white/30 text-sm font-light">Aún no hay misiones registradas en el servidor.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 pb-8">
                    {trips.map((t) => (
                      <div key={t.id} className="bg-gradient-to-r from-[#1C2D54]/50 to-[#0A1628]/80 border border-white/5 rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between group hover:border-gold/30 hover:shadow-[0_10px_30px_rgba(197,165,90,0.05)] transition-all">
                        <div className="flex-1 flex gap-6">
                          {/* Timeline Nodes */}
                          <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 pt-1">
                            <div className="w-2.5 h-2.5 rounded-full border border-gold shadow-[0_0_8px_rgba(197,165,90,0.4)]" />
                            <div className="w-[1px] h-8 lg:h-10 border-l border-dashed border-white/10" />
                            <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                          </div>
                          {/* Addresses */}
                          <div className="flex flex-col justify-between gap-5 text-sm font-bold text-white/80 py-0.5">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black tracking-[0.3em] uppercase text-gold/60 mb-1">Punto Alfa</span>
                              <p className="truncate max-w-[200px] sm:max-w-xs xl:max-w-md">{t.pickupAddress}</p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black tracking-[0.3em] uppercase text-gold/60 mb-1">Destino Bravo</span>
                              <p className="truncate max-w-[200px] sm:max-w-xs xl:max-w-md">{t.dropoffAddress}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status & Price */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 md:border-l md:border-white/5 md:pl-8">
                          <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                            <span className="text-[9px] font-black tracking-[0.25em] uppercase text-green-400">{t.status || "CONFIRMADO"}</span>
                          </div>
                          <div className="flex items-end gap-1">
                            <span className="text-3xl font-serif text-white">${(t.fare ?? 0).toFixed(2)}</span>
                          </div>
                          <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase mt-1 md:mt-0">
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
      </main>
    </div>
  );
}
