"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Car,
  Shield,
  Stethoscope,
  Clock,
  ChevronRight,
  Phone,
  Star,
  MapPin,
  Menu,
  X,
  ArrowRight,
  Briefcase,
  Globe,
  Download,
  Smartphone,
  Apple,
  PlayCircle,
  Calculator,
  Loader2,
  CheckCircle,
  Headphones,
  ChevronLeft,
} from "lucide-react";
import {
  calculateQuote,
  registerClient,
  loginClient,
  createTrip,
  getMyTrips,
  type QuoteResponse,
  type Trip,
} from "../../lib/api";
import { getToken, clearAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";

// --- Types ---
type Step = "quote" | "register" | "success";

const LOCATIONS = [
  { label: "Aeropuerto Internacional El Salvador", lat: 13.4409, lng: -89.0557 },
  { label: "San Benito, San Salvador", lat: 13.6933, lng: -89.2372 },
  { label: "Santa Elena, Antiguo Cuscatlán", lat: 13.6769, lng: -89.2483 },
  { label: "Multiplaza / Cascadas", lat: 13.6821, lng: -89.2526 },
  { label: "World Trade Center SS", lat: 13.7082, lng: -89.2394 },
  { label: "Nuevo Cuscatlán", lat: 13.6475, lng: -89.2688 },
];

// --- Components ---

function useAuth() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    try {
      const token = localStorage.getItem("mm_driver_client_token");
      if (!token) { setAuthed(false); return; }
      const payload = JSON.parse(atob(token.split(".")[1]));
      setAuthed(!payload.exp || Date.now() / 1000 < payload.exp);
    } catch { setAuthed(false); }
  }, []);
  return authed;
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { ...fadeUp.visible.transition, delay } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const scrolled = true; // Always scrolled for the reservation page header
  const router = useRouter();

  const links = [
    { label: "Inicio", href: "/" },
    { label: "Servicios", href: "/#services" },
    { label: "Flota", href: "/#fleet" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-[100]"
    >
      <div className="container-page py-6 flex justify-center">
        <div className="w-full max-w-6xl h-20 flex items-center justify-between px-8 md:px-12 rounded-full glass border-white/10 shadow-2xl">
          <a href="/" className="flex items-center gap-3 group">
            <span className="text-gold-vibrant text-3xl font-serif font-black tracking-tighter">M&M</span>
            <span className="text-white text-lg font-medium tracking-[0.25em] uppercase font-sans">Driver</span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-on-surface-muted hover:text-gold-vibrant text-[10px] font-bold tracking-[0.2em] uppercase transition-all"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
             <button 
                onClick={() => router.push("/")}
                className="btn-outline-premium !py-2 !px-6 rounded-full text-[9px] flex items-center gap-2"
              >
                <ChevronLeft size={12} />
                Volver al Inicio
              </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

function SelectInput({ id, label, value, onChange }: any) {
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={id} className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 ml-2">
        {label}
      </label>
      <div className="relative group">
        <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-16 py-6 text-base text-white appearance-none focus:outline-none focus:border-gold/40 focus:bg-white/[0.07] transition-all duration-500"
        >
          <option value="" className="bg-[#05080F]">Seleccionar {label.toLowerCase()}...</option>
          {LOCATIONS.map((loc) => (
            <option key={loc.label} value={loc.label} className="bg-[#05080F]">
              {loc.label}
            </option>
          ))}
        </select>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronRight size={18} className="text-white/20 rotate-90" />
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const [step, setStep] = useState<Step>("quote");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const router = useRouter();

  useEffect(() => {
    setToken(getToken() || "");
  }, []);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const pickupObj = LOCATIONS.find((l) => l.label === pickup);
  const dropoffObj = LOCATIONS.find((l) => l.label === dropoff);

  async function handleQuote() {
    if (!pickupObj || !dropoffObj) {
      setError("Selecciona origen y destino para cotizar.");
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
      setError(err.message ?? "Error al calcular cotización.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterAndBook() {
    if (!quote || !pickupObj || !dropoffObj) return;
    setError("");
    setLoading(true);
    try {
      let auth;
      try {
        auth = await registerClient({ ...form });
      } catch (err: any) {
        const msg = err.message ?? "";
        if (msg.includes("registrado") || msg.includes("Conflict") || msg.includes("409")) {
          auth = await loginClient(form.email, form.password);
        } else {
          throw err;
        }
      }
      
      setToken(auth.accessToken);

      await createTrip(
        {
          pickupAddress: pickup,
          dropoffAddress: dropoff,
          pickupLat: pickupObj.lat,
          pickupLng: pickupObj.lng,
          dropoffLat: dropoffObj.lat,
          dropoffLng: dropoffObj.lng,
          quotedPrice: quote.estimatedPrice,
        },
        auth.accessToken
      );
      setStep("success");
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("401") || msg.includes("Unauthorized")) {
        setError("Este correo ya está registrado. Por favor, verifique su contraseña.");
      } else {
        setError(msg || "Error al procesar la reserva. Verifique sus datos.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#05080F] min-h-screen selection:bg-gold selection:text-on-primary">
      <Nav />
      
      <main className="pt-40 pb-24">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full opacity-10 filter blur-[120px] bg-gold" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-5 filter blur-[120px] bg-gold" />
        </div>

        <div className="container-page relative z-10">
          <FadeIn className="text-center mb-16">
            <span className="text-[10px] font-black tracking-[0.6em] uppercase text-gold mb-4 block">
              Protocolo de Reserva
            </span>
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-6">
              Cotizador <span className="text-gold-glow italic">Premium</span>
            </h1>
            <p className="text-white/40 text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Obtenga una cotización ejecutiva y asegure su traslado con nuestra flota certificada.
            </p>
          </FadeIn>

          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              {step === "quote" && (
                <motion.div
                  key="quote"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass rounded-[3rem] p-12 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col gap-10"
                >
                  <div className="space-y-8">
                    <SelectInput id="pickup" label="Origen de Protocolo" value={pickup} onChange={setPickup} />
                    <SelectInput id="dropoff" label="Destino de Protocolo" value={dropoff} onChange={setDropoff} />
                  </div>

                  {error && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
                      <X size={18} className="text-red-400" />
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {quote && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[2rem] border border-gold/20 p-8 relative overflow-hidden bg-gold/5"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Calculator size={80} className="text-gold" />
                      </div>
                      <p className="text-[10px] font-black tracking-[0.3em] uppercase text-gold/60 mb-4">Cotización Final Pactada</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-white">${(quote.estimatedPrice).toFixed(2)}</span>
                        <span className="text-sm text-white/40 font-bold uppercase tracking-widest">{quote.currency}</span>
                      </div>
                      <div className="mt-4 flex items-center gap-6 text-[11px] text-white/30 font-bold uppercase tracking-tighter">
                        <span>Distancia: {((quote.estimatedDistanceMeters)/1000).toFixed(1)} KM</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span>Estimado: {Math.round(quote.estimatedDurationSeconds/60)} MIN</span>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-5">
                    <button
                      onClick={handleQuote}
                      disabled={loading}
                      className="flex-1 btn-premium !py-6 flex items-center justify-center gap-4"
                    >
                      {loading ? <Loader2 size={24} className="animate-spin" /> : <Calculator size={20} />}
                      {loading ? "CALCULANDO..." : "OBTENER COTIZACIÓN"}
                    </button>

                    {quote && (
                      <button
                        onClick={() => setStep("register")}
                        className="flex-1 btn-outline-premium !py-6 flex items-center justify-center gap-4 group"
                      >
                        RESERVAR AHORA
                        <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {step === "register" && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass rounded-[3rem] p-12 border border-white/10 flex flex-col gap-8 shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-serif text-white mb-2">Protocolo de Registro</h3>
                      <p className="text-white/40 text-sm">Ingrese sus credenciales para confirmar la misión.</p>
                    </div>
                    <button onClick={() => setStep("quote")} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all">
                      <ChevronLeft size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 ml-2">Nombre</label>
                      <input 
                        type="text" 
                        value={form.firstName} 
                        onChange={e => setForm({...form, firstName: e.target.value})}
                        className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-8 py-5 text-white focus:outline-none focus:border-gold/40 transition-all"
                        placeholder="John" 
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 ml-2">Apellido</label>
                      <input 
                        type="text" 
                        value={form.lastName} 
                        onChange={e => setForm({...form, lastName: e.target.value})}
                        className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-8 py-5 text-white focus:outline-none focus:border-gold/40 transition-all"
                        placeholder="Doe" 
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 ml-2">Email Corporativo</label>
                      <input 
                        type="email" 
                        value={form.email} 
                        onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-8 py-5 text-white focus:outline-none focus:border-gold/40 transition-all"
                        placeholder="john@protocol.com" 
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 ml-2">Teléfono Movil</label>
                      <input 
                        type="tel" 
                        value={form.phone} 
                        onChange={e => setForm({...form, phone: e.target.value})}
                        className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-8 py-5 text-white focus:outline-none focus:border-gold/40 transition-all"
                        placeholder="+503 XXXX XXXX" 
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 ml-2">Código Privado (Password)</label>
                      <input 
                        type="password" 
                        value={form.password} 
                        onChange={e => setForm({...form, password: e.target.value})}
                        className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-8 py-5 text-white focus:outline-none focus:border-gold/40 transition-all"
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
                      <Star size={18} className="text-red-400" />
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleRegisterAndBook}
                    disabled={loading}
                    className="w-full btn-premium !py-6 flex items-center justify-center gap-4"
                  >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : <Shield size={20} />}
                    {loading ? "VALIDANDO..." : "CONFIRMAR MISIÓN"}
                  </button>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-[3rem] p-16 text-center flex flex-col items-center gap-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-gold/30"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gold/30 blur-[40px] rounded-full" />
                    <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-gold to-[#A07D20] shadow-2xl">
                      <CheckCircle size={64} className="text-[#05080F]" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-5xl font-serif text-white mb-6">Misión Confirmada</h2>
                    <p className="text-white/50 text-xl font-light leading-relaxed max-w-sm mx-auto">
                      Su conductor elite ha sido asignado. Protocolo de seguridad e itinerario enviados por email.
                    </p>
                  </div>

                  <div className="flex flex-col gap-5 w-full max-w-xs">
                    <a href="https://wa.me/50300000000" className="btn-premium w-full !py-5 flex items-center justify-center gap-3">
                      <Headphones size={20} /> SOPORTE VIP
                    </a>
                    <button onClick={() => router.push("/")} className="btn-outline-premium w-full !py-5">
                      FINALIZAR
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="py-24 border-t border-white/5">
        <div className="container-page text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <span className="text-3xl font-serif font-black text-gold-vibrant">M&M</span>
              <span className="text-xl font-medium text-white tracking-[0.3em] uppercase">Driver</span>
            </div>
            <p className="text-[10px] font-black tracking-[0.6em] text-white/20 uppercase">
              The Midnight Concierge · EST. 2026 · San Salvador
            </p>
        </div>
      </footer>
    </div>
  );
}
