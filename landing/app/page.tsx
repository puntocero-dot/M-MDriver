"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useScroll, useTransform, Variants } from "framer-motion";
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
  HeadphonesIcon,
  Calculator,
  CheckCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  calculateQuote,
  registerClient,
  createTrip,
  type QuoteResponse,
} from "../lib/api";

// ── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
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

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { label: "Servicios", href: "#services" },
    { label: "Cómo funciona", href: "#how" },
    { label: "Flota", href: "#fleet" },
    { label: "Reservar", href: "#reserva" },
    { label: "Contacto", href: "#contact" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
    >
      <div className="container-page py-8 flex justify-center">
        <div 
          className={`w-full max-w-6xl h-20 flex items-center justify-between px-8 md:px-12 rounded-full transition-all duration-700 pointer-events-auto ${
            scrolled ? "glass shadow-2xl border-white/10" : "bg-transparent"
          }`}
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <span className="text-gold-vibrant text-3xl font-serif font-black tracking-tighter transition-transform group-hover:scale-105">
              M&M
            </span>
            <span className="text-white text-lg font-medium tracking-[0.25em] uppercase font-sans">
              Driver
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-10">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-on-surface-muted hover:text-gold-vibrant text-[10px] font-bold tracking-[0.25em] uppercase transition-all duration-300 hover:tracking-[0.35em]"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <a
              href="#contact"
              className="btn-premium !py-2.5 !px-8 rounded-full text-[10px] shadow-gold/20 flex items-center gap-2"
            >
              Reserva Ahora
              <ChevronRight size={14} strokeWidth={3} />
            </a>
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute top-28 left-6 right-6 glass rounded-2xl p-10 flex flex-col gap-8 md:hidden shadow-2xl border-gold/20 pointer-events-auto"
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-xl font-bold text-white hover:text-gold-vibrant transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contact"
              className="btn-premium px-6 py-5 rounded-xl text-sm text-center font-bold"
              onClick={() => setOpen(false)}
            >
              Solicitar Conductor
            </a>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section className="hero-section min-h-screen flex items-center">
      {/* Background blobs simplified & moved back */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full opacity-20 filter blur-[120px]"
          style={{
            background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-10 filter blur-[120px]"
          style={{
            background: "radial-gradient(circle, var(--gold-soft) 0%, transparent 70%)",
          }}
        />
      </div>
      
      <div className="container-page">
        <motion.div style={{ y, opacity }} className="flex flex-col gap-16 max-w-5xl">
          <div className="flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex items-center gap-6"
            >
              <div className="h-[1px] w-16 bg-gold/60" />
              <span className="text-[10px] font-bold tracking-[0.6em] uppercase text-gold/80">
                Exclusive Service · El Salvador
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-8xl xl:text-9xl font-serif text-white leading-[1] md:leading-[0.95] tracking-tight"
            >
              Tu Conductor <br />
              <span className="text-gold-glow italic">Privado</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="text-xl md:text-2xl text-on-surface-muted leading-relaxed max-w-3xl border-l-[1px] border-gold/30 pl-8 md:pl-10 font-light"
            >
              Redefiniendo la movilidad premium. Discreción, puntualidad y el estándar más alto en transporte personalizado para la élite de El Salvador.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-8"
          >
            <a href="#reserva" className="btn-premium">
              Comenzar Reserva
            </a>
            <a href="#how" className="btn-outline-premium">
              Metodología
            </a>
          </motion.div>

          {/* Key Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex gap-16 pt-8 border-t border-white/5"
          >
            {[
              { value: "24/7", label: "Concierge" },
              { value: "100%", label: "Seguridad" },
              { value: "VIP", label: "Protocolo" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-black text-white">{s.value}</p>
                <p className="text-[10px] font-bold tracking-widest text-on-surface-var uppercase mt-2">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────

const services = [
  {
    icon: Stethoscope,
    title: "Transporte Médico",
    desc: "Traslados a clínicas, hospitales y citas médicas con discreción y puntualidad. Ideal para pacientes y familiares.",
    color: "#bfcdff",
  },
  {
    icon: Briefcase,
    title: "Ejecutivo",
    desc: "Reuniones de negocios, aeropuerto y eventos corporativos. Su imagen, nuestra prioridad.",
    color: "#f2ca50",
  },
  {
    icon: Globe,
    title: "Corporativo",
    desc: "Cuenta corporativa con facturación centralizada, tracking en tiempo real y reportes mensuales.",
    color: "#c7c6c4",
  },
  {
    icon: Shield,
    title: "Seguridad Total",
    desc: "Conductores verificados, rutas encriptadas y botón SOS activo durante todo el trayecto.",
    color: "#4caf50",
  },
];

function Services() {
  return (
    <section id="services" className="bg-surface-low">
      <div className="container-page">
        <FadeIn className="text-center mb-24">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-[10px] font-black tracking-[0.6em] uppercase text-gold">
              Exclusividad & Confort
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8">
            Servicios a su Medida
          </h2>
          <p className="text-on-surface-muted text-xl max-w-2xl mx-auto font-medium text-center">
            Diseñados para quienes exigen discreción absoluta y el máximo lujo en cada traslado.
          </p>
        </FadeIn>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {services.map((s) => (
            <motion.div
              key={s.title}
              variants={fadeUp}
              className="card-service group"
            >
              {/* Icon */}
              <div
                className="card-service-icon"
                style={{
                  background: `${s.color}18`,
                  border: `1px solid ${s.color}30`,
                }}
              >
                <s.icon
                  size={24}
                  style={{ color: s.color }}
                  strokeWidth={1.75}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                <h3 style={{ fontFamily: '"Bodoni Moda", serif', fontSize: "1.1rem", fontWeight: 700, color: "var(--on-surface)", lineHeight: 1.3 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--on-surface-muted)", lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--gold)", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.5 }} className="group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-400">
                Saber más <ArrowRight size={13} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

const steps = [
  {
    num: "01",
    icon: Phone,
    title: "Solicita",
    desc: "Abre la app, ingresa tu destino y confirma la cotización en segundos. Pago con N1CO o efectivo.",
  },
  {
    num: "02",
    icon: Car,
    title: "Llegamos",
    desc: "Tu conductor llega en menos de 15 minutos. Tracking en tiempo real en tu pantalla.",
  },
  {
    num: "03",
    icon: Clock,
    title: "Traslado",
    desc: "Viaje silencioso, puntual y seguro. Botón SOS activo, ruta compartida con tus contactos.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-surface">
      <div className="container-page">
        <FadeIn className="text-center mb-28">
          <span className="text-[11px] font-bold tracking-[1em] uppercase text-gold/60 mb-6 block">
            The Protocol
          </span>
          <h2 className="text-6xl md:text-9xl font-serif text-white">
            Logística <span className="text-gold-glow italic">Privada</span>
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.2}>
              <div className="flex flex-col items-center text-center group">
                <div className="relative mb-14">
                  <div className="w-40 h-40 rounded-3xl flex items-center justify-center glass border-white/10 transition-all duration-1000 group-hover:rounded-2xl group-hover:scale-105 group-hover:border-gold/50 group-hover:bg-gold/5">
                    <step.icon size={52} className="text-gold transition-all duration-700 group-hover:scale-110 group-hover:rotate-6" strokeWidth={0.5} />
                  </div>
                  <span className="absolute -top-4 -right-4 w-15 h-15 rounded-full flex items-center justify-center text-lg font-serif italic font-black bg-gold text-on-primary shadow-2xl border-[6px] border-surface">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-3xl font-serif text-white mb-6 group-hover:text-gold transition-colors duration-500">
                  {step.title}
                </h3>
                <p className="text-lg text-on-surface-muted leading-relaxed font-light max-w-[300px]">
                  {step.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Fleet / Features ──────────────────────────────────────────────────────────

const features = [
  {
    icon: HeadphonesIcon,
    title: "Conductores Verificados",
    desc: "Cada conductor pasa por verificación de antecedentes, capacitación en etiqueta y protocolo médico.",
  },
  {
    icon: Shield,
    title: "Privacidad Total",
    desc: "Rutas cifradas, datos protegidos y NDA implícito. Lo que sucede en su traslado, queda en su traslado.",
  },
  {
    icon: Stethoscope,
    title: "Foco Médico",
    desc: "Entrenados para acompañar a pacientes, coordinar con personal médico y manejar emergencias.",
  },
];

function Fleet() {
  return (
    <section id="fleet" className="bg-surface-low overflow-hidden">
      <div className="container-page flex flex-col lg:flex-row gap-24 items-center">
        {/* Left Content - Reduced width to prevent colision */}
        <FadeIn className="w-full lg:w-3/5">
          <span className="text-[11px] font-bold tracking-[1em] uppercase text-gold/60 mb-12 block">
            The Standard
          </span>
          <h2 className="text-6xl md:text-8xl xl:text-[10rem] font-serif text-white mb-16 leading-[1.05] md:leading-[0.9]">
            Excelencia <br /> <span className="text-gold-glow italic">Innegociable</span>.
          </h2>
          <p className="text-xl text-on-surface-muted leading-relaxed mb-32 font-light border-l-[1px] border-gold/20 pl-10 max-w-2xl">
            Superamos estándares diplomáticos. Especialistas en logística crítica para la élite.
          </p>

          <div className="grid gap-8">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.15} className="flex gap-10 group">
                <div 
                  className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:rotate-3"
                  style={{
                    background: `rgba(207, 161, 46, 0.1)`,
                    border: `1px solid rgba(207, 161, 46, 0.2)`,
                  }}
                >
                  <f.icon size={26} className="text-gold transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="text-2xl font-serif text-white group-hover:text-gold transition-colors duration-500 font-bold">
                    {f.title}
                  </h4>
                  <p className="text-lg text-on-surface-muted leading-relaxed font-light">
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>

        {/* Right Dashboard Visualization - Better positioning */}
        <FadeIn delay={0.3} className="w-full lg:w-2/5 relative h-full flex flex-col justify-center mt-20 lg:mt-0">
          <div className="absolute inset-0 bg-gold/5 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="card-dashboard group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            
            <h3 className="text-xl font-serif text-white mb-10 flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              Live Intelligence
            </h3>

            <div className="flex flex-col gap-4">
              {[
                { label: "Elite Drivers Active", value: "05", total: "/ 12", color: "var(--success)" },
                { label: "Successful Missions", value: "18", total: "", color: "var(--gold-vibrant)" },
                { label: "Response Window", value: "08", total: "min", color: "var(--info)" },
                { label: "Satisfaction Index", value: "4.99", total: "★", color: "var(--gold-vibrant)" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between py-6 px-6 rounded-xl border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500">
                  <span className="text-[10px] font-bold text-on-surface-muted uppercase tracking-[0.2em] font-sans">{m.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tabular-nums" style={{ color: m.color }}>{m.value}</span>
                    {m.total && <span className="text-[10px] font-bold text-on-surface-var uppercase">{m.total}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ── Booking / Quote Section ───────────────────────────────────────────────────

// Predefined landmark locations in El Salvador for the dropdown
const LOCATIONS = [
  { label: "Aeropuerto Internacional", lat: 13.4408, lng: -89.0555 },
  { label: "Centro Histórico, San Salvador", lat: 13.6929, lng: -89.2182 },
  { label: "Multiplaza", lat: 13.6786, lng: -89.2507 },
  { label: "Metrocentro", lat: 13.7000, lng: -89.2244 },
  { label: "Hospital de Diagnóstico", lat: 13.6964, lng: -89.2176 },
  { label: "Hospital Bloom", lat: 13.7026, lng: -89.2090 },
  { label: "Zona Rosa", lat: 13.6840, lng: -89.2430 },
  { label: "Aeropuerto Ilopango", lat: 13.6985, lng: -89.1196 },
  { label: "Santa Ana Centro", lat: 13.9952, lng: -89.5590 },
  { label: "San Miguel Centro", lat: 13.4792, lng: -88.1792 },
];

type Step = "quote" | "register" | "success";

function SelectInput({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[10px] font-bold tracking-[0.25em] uppercase text-on-surface-muted"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl px-5 py-4 pr-10 text-sm font-medium text-white bg-white/5 border border-white/10 focus:outline-none focus:border-gold/60 transition-all duration-300"
          style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
        >
          <option value="" disabled style={{ background: "#0D1B35" }}>
            Seleccionar ubicación…
          </option>
          {LOCATIONS.map((loc) => (
            <option key={loc.label} value={loc.label} style={{ background: "#0D1B35" }}>
              {loc.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gold pointer-events-none"
        />
      </div>
    </div>
  );
}

function BookingSection() {
  const [step, setStep] = useState<Step>("quote");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  // Register form fields
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
    } catch (err: unknown) {
      setError((err as Error).message ?? "Error al calcular cotización.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterAndBook() {
    if (!quote || !pickupObj || !dropoffObj) return;
    setError("");
    setLoading(true);
    try {
      // 1. Register
      const auth = await registerClient({ ...form });
      setToken(auth.accessToken);

      // 2. Create trip
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
    } catch (err: unknown) {
      setError(
        (err as Error).message ??
          "Error al procesar la reserva. Verifique sus datos."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="reserva" className="bg-surface-low relative overflow-hidden">
      {/* Gold ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(207,161,46,0.06) 0%, transparent 100%)",
        }}
      />

      <div className="container-page">
        <FadeIn className="text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-[1px] w-12 bg-gold/40" />
            <span className="text-[10px] font-black tracking-[0.6em] uppercase text-gold">
              Cotizador Ejecutivo
            </span>
            <div className="h-[1px] w-12 bg-gold/40" />
          </div>
          <h2 className="text-5xl md:text-7xl font-serif text-white mb-8">
            Su viaje,{" "}
            <span className="text-gold-glow italic">en segundos</span>.
          </h2>
          <p className="text-on-surface-muted text-xl max-w-2xl mx-auto font-light">
            Obtenga una cotización precisa al instante y reserve su conductor privado ahora mismo.
          </p>
        </FadeIn>

        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {step === "quote" && (
              <motion.div
                key="quote"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
                className="glass rounded-3xl p-10 border border-white/8 flex flex-col gap-8"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <SelectInput
                  id="pickup-location"
                  label="Origen"
                  value={pickup}
                  onChange={setPickup}
                />
                <SelectInput
                  id="dropoff-location"
                  label="Destino"
                  value={dropoff}
                  onChange={setDropoff}
                />

                {error && (
                  <p className="text-red-400 text-sm font-medium text-center">
                    {error}
                  </p>
                )}

                {quote && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-gold/20 p-6"
                    style={{ background: "rgba(207,161,46,0.05)" }}
                  >
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gold/70 mb-4">
                      Cotización Estimada
                    </p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-5xl font-black text-white tabular-nums">
                          ${quote.estimatedPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-on-surface-muted mt-1">
                          {quote.currency} · {(quote.estimatedDistanceMeters / 1000).toFixed(1)} km · ~{Math.round(quote.estimatedDurationSeconds / 60)} min
                        </p>
                      </div>
                      <CheckCircle size={40} className="text-gold opacity-60" />
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    id="btn-quote"
                    onClick={handleQuote}
                    disabled={loading}
                    className="flex-1 btn-premium flex items-center justify-center gap-3 disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Calculator size={18} />
                    )}
                    {loading ? "Calculando…" : "Cotizar Ahora"}
                  </button>

                  {quote && (
                    <button
                      id="btn-proceed-register"
                      onClick={() => setStep("register")}
                      className="flex-1 btn-outline-premium flex items-center justify-center gap-2"
                    >
                      Reservar
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
                className="glass rounded-3xl p-10 flex flex-col gap-6"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-serif text-white">Crear Cuenta</h3>
                  <button
                    onClick={() => setStep("quote")}
                    className="text-on-surface-muted hover:text-white transition-colors text-sm"
                  >
                    ← Volver
                  </button>
                </div>

                {/* Cost reminder */}
                {quote && (
                  <div
                    className="flex items-center justify-between rounded-xl px-5 py-3 border border-gold/20"
                    style={{ background: "rgba(207,161,46,0.05)" }}
                  >
                    <span className="text-xs text-on-surface-muted">
                      {pickup} → {dropoff}
                    </span>
                    <span className="text-xl font-black text-gold">
                      ${quote.estimatedPrice.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "firstName", label: "Nombre", type: "text", key: "firstName" as const },
                    { id: "lastName", label: "Apellido", type: "text", key: "lastName" as const },
                  ].map((field) => (
                    <div key={field.id} className="flex flex-col gap-2">
                      <label
                        htmlFor={field.id}
                        className="text-[10px] font-bold tracking-[0.25em] uppercase text-on-surface-muted"
                      >
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        type={field.type}
                        value={form[field.key]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [field.key]: e.target.value }))
                        }
                        className="rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-gold/60 transition-all"
                        placeholder={field.label}
                      />
                    </div>
                  ))}
                </div>

                {[
                  { id: "email", label: "Email", type: "email", key: "email" as const, placeholder: "su@email.com" },
                  { id: "phone", label: "Teléfono", type: "tel", key: "phone" as const, placeholder: "+503 XXXX XXXX" },
                  { id: "password", label: "Contraseña", type: "password", key: "password" as const, placeholder: "Mínimo 8 caracteres" },
                ].map((field) => (
                  <div key={field.id} className="flex flex-col gap-2">
                    <label
                      htmlFor={field.id}
                      className="text-[10px] font-bold tracking-[0.25em] uppercase text-on-surface-muted"
                    >
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      type={field.type}
                      value={form[field.key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [field.key]: e.target.value }))
                      }
                      className="rounded-xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-gold/60 transition-all"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}

                {error && (
                  <p className="text-red-400 text-sm font-medium text-center">
                    {error}
                  </p>
                )}

                <button
                  id="btn-confirm-booking"
                  onClick={handleRegisterAndBook}
                  disabled={loading}
                  className="btn-premium flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  {loading ? "Procesando..." : "Confirmar Reserva"}
                </button>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="glass rounded-3xl p-12 text-center flex flex-col items-center gap-8"
                style={{ border: "1px solid rgba(207,161,46,0.2)" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(207,161,46,0.15)", border: "1px solid rgba(207,161,46,0.3)" }}
                >
                  <CheckCircle size={48} className="text-gold" />
                </motion.div>

                <div>
                  <h3 className="text-4xl font-serif text-white mb-4">
                    ¡Reserva Confirmada!
                  </h3>
                  <p className="text-on-surface-muted text-lg font-light">
                    Su conductor privado ha sido asignado. Recibirá una confirmación por email.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://wa.me/50300000000"
                    className="btn-premium flex items-center gap-2"
                  >
                    <Phone size={16} /> Contactar Concierge
                  </a>
                  <button
                    onClick={() => {
                      setStep("quote");
                      setQuote(null);
                      setPickup("");
                      setDropoff("");
                      setForm({ firstName: "", lastName: "", email: "", phone: "", password: "" });
                    }}
                    className="btn-outline-premium"
                  >
                    Nueva Cotización
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// ── Big CTA ───────────────────────────────────────────────────────────────────

function BigCTA() {
  return (
    <section id="contact" className="bg-surface relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,var(--gold)_0%,transparent_60%)]" />
      </div>

      <FadeIn className="container-page text-center pb-24">
        <span className="text-[11px] font-bold tracking-[1.2em] uppercase text-gold/60 mb-16 block">
          The Invitation
        </span>

        <h2 className="text-6xl md:text-[10rem] font-serif text-white mb-24 leading-[1.1] md:leading-[1] tracking-tighter">
          ELEVA TU <br /> <span className="text-gold-glow italic">EXPERIENCIA</span>
        </h2>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-32 max-w-2xl mx-auto">
          <a href="https://wa.me/50300000000" className="btn-premium">
            CONTACTAR CONCIERGE
          </a>
          <a href="#" className="btn-outline-premium">
            DESCARGAR APP
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 mt-12 pt-12 border-t border-white/5">
          {[
            { label: "Background Checked", icon: Shield },
            { label: "N1CO Integrated", icon: Star },
            { label: "Satellite Tracking", icon: MapPin },
            { label: "SOS Response Ready", icon: Clock },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-4 group transition-all duration-500 hover:scale-110">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gold/5 border border-gold/20 group-hover:border-gold group-hover:bg-gold/10 transition-colors">
                <b.icon size={18} className="text-gold" />
              </div>
              <span className="text-[11px] font-bold tracking-[0.3em] text-on-surface-var group-hover:text-gold uppercase transition-colors">{b.label}</span>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-24 bg-surface border-t border-white/[0.03]">
      <div className="container-page">
        <div className="flex flex-col md:flex-row items-center justify-between gap-16">
          {/* Brand Identity */}
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-serif font-black text-gold-vibrant tracking-tighter leading-none">
                M&M
              </span>
              <span className="text-xl font-medium text-white tracking-[0.3em] uppercase font-sans">
                Driver
              </span>
            </div>
            <p className="text-[11px] font-bold tracking-[0.5em] text-on-surface-var uppercase">
              The Midnight Concierge
            </p>
          </div>

          {/* Navigation Matrix */}
          <div className="flex flex-wrap items-center justify-center gap-12">
            {[
              "Privacy Policy",
              "Terms of Service",
              "Corporate Protocol",
              "Contact",
            ].map((l) => (
              <a
                key={l}
                href="#"
                className="text-[11px] font-bold tracking-[0.2em] text-on-surface-muted hover:text-gold uppercase transition-all duration-300"
              >
                {l}
              </a>
            ))}
          </div>

          {/* Copyright Metadata */}
          <div className="text-center md:text-right">
            <p className="text-[11px] font-bold tracking-[0.2em] text-on-surface-var uppercase">
              © {new Date().getFullYear()} M&M Driver · San Salvador
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Main Page Layout ──────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-surface selection:bg-gold selection:text-on-primary">
      <Nav />
      <Hero />
      <Services />
      <HowItWorks />
      <Fleet />
      <BookingSection />
      <BigCTA />
      <Footer />
    </div>
  );
}
