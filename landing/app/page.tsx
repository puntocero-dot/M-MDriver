"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
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
  Headphones,
} from "lucide-react";
import { getToken } from "../lib/auth";

// Hydration-safe auth hook — never reads localStorage during SSR
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

  const authed = useAuth();

  const links = [
    { label: "Servicios", href: "#services" },
    { label: "Cómo Funciona", href: "#how" },
    { label: "Flota", href: "#fleet" },
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
          <a href="#" className="flex items-center gap-3 group flex-shrink-0">
            <span className="text-gold-vibrant text-3xl font-serif font-black tracking-tighter transition-transform group-hover:scale-105">
              M&M
            </span>
            <span className="text-white text-lg font-medium tracking-[0.25em] uppercase font-sans">
              Driver
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-on-surface-muted hover:text-gold-vibrant text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => (window as any).toggleDownloadModal?.()}
              className="btn-outline-premium flex items-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-download" aria-hidden="true">
                <path d="M12 15V3"></path>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <path d="m7 10 5 5 5-5"></path>
              </svg>
              DESCARGAR APP
            </button>
            <a
              href="/reserva"
              className="btn-premium !py-2 !px-6 rounded-full text-[9px] shadow-gold/20 flex items-center gap-2"
            >
              Reserva Ahora
              <ChevronRight size={12} strokeWidth={3} />
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
            <button
              onClick={() => { (window as any).toggleDownloadModal?.(); setOpen(false); }}
              className="text-gold text-lg font-bold text-left"
            >
              Descargar App
            </button>
            <a
              href="/reserva"
              className="btn-premium px-6 py-5 rounded-xl text-sm text-center font-bold"
              onClick={() => setOpen(false)}
            >
              Reserva Ahora
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
            <a href="/reserva" className="btn-premium">
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
        <FadeIn className="text-center mb-40">
          <span className="text-[11px] font-bold tracking-[1em] uppercase text-gold/60 mb-6 block">
            The Protocol
          </span>
          <h2 className="text-6xl md:text-9xl font-serif text-white">
            Logística <span className="text-gold-glow italic">Privada</span>
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-20">
          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.2}>
              <div className="flex flex-col items-center text-center group">
                <div className="relative mb-16">
                  <div className="w-40 h-40 rounded-3xl flex items-center justify-center glass border-white/10 transition-all duration-1000 group-hover:rounded-2xl group-hover:scale-105 group-hover:border-gold/50 group-hover:bg-gold/5">
                    <step.icon size={52} className="text-gold transition-all duration-700 group-hover:scale-110 group-hover:rotate-6" strokeWidth={0.5} />
                  </div>
                  <span className="absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center text-base font-serif italic font-black bg-gold text-on-primary shadow-2xl border-[4px] border-surface">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-3xl font-serif text-white mb-8 group-hover:text-gold transition-colors duration-500">
                  {step.title}
                </h3>
                <p className="text-base text-on-surface-muted leading-loose font-light max-w-[260px] mx-auto">
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
    icon: Headphones,
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
          <button
            onClick={() => (window as any).toggleDownloadModal?.()}
            className="btn-outline-premium flex items-center gap-3"
          >
            <Download size={18} />
            DESCARGAR APP
          </button>
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
            <a
              href="/admin"
              className="text-[11px] font-bold tracking-[0.2em] text-gold/40 hover:text-gold uppercase transition-all duration-300 border-l border-white/10 pl-6 lg:pl-12"
            >
              Admin Access
            </a>
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


function DownloadModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    (window as any).toggleDownloadModal = () => setIsOpen((prev) => !prev);
    return () => { delete (window as any).toggleDownloadModal; };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#05080F]/95 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl border border-white/10 shadow-2xl relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem]"
            style={{ 
              background: "linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
            }}
          >
            {/* Ambient luxury glow */}
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-gold/15 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-gold/5 blur-[80px] rounded-full pointer-events-none" />

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/5 shadow-xl z-10"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* Scrollable Content Container */}
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar p-6 md:p-12">
              
              {/* Icon Container */}
              <div className="relative mb-8 w-fit mx-auto">
                <div className="absolute inset-0 bg-gold/40 blur-[30px] rounded-3xl opacity-30" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#CFA12E] to-[#A07D20] flex items-center justify-center shadow-xl">
                  <Smartphone size={48} className="text-[#05080F]" strokeWidth={1} />
                </div>
              </div>
              
              <div className="text-center mb-8 mx-auto w-full max-w-sm">
                <h2 className="text-3xl md:text-4xl font-serif text-white mb-4 tracking-tight">Experiencia M&M Mobile</h2>
                <p className="text-lg text-white/40 leading-relaxed font-light">
                  Lleve el estándar de protocolo VIP en su bolsillo. Acceso exclusivo para clientes.
                </p>
              </div>

              {/* Platform buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-10">
                {/* Android */}
                <div className="flex flex-col items-center gap-4 bg-white/[0.04] border border-white/10 p-6 md:p-8 rounded-[1.5rem] opacity-60 cursor-not-allowed transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <PlayCircle size={28} className="text-gold" fill="currentColor" />
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black tracking-[0.3em] uppercase text-white/40 mb-1">Android Platform</p>
                    <p className="text-lg font-bold text-white/50 tracking-tight">Próximamente</p>
                  </div>
                </div>

                {/* iOS */}
                <div className="flex flex-col items-center gap-4 bg-white/[0.04] border border-white/10 p-6 md:p-8 rounded-[1.5rem] opacity-60 cursor-not-allowed transition-all">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <Apple size={28} className="text-white/30" fill="currentColor" />
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black tracking-[0.3em] uppercase text-white/40 mb-1">iOS / Apple</p>
                    <p className="text-lg font-bold text-white/50 tracking-tight">Próximamente</p>
                  </div>
                </div>
              </div>

              {/* Instructions Section */}
              <div className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] p-6 md:p-10 mb-8 block">
                <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-gold mb-6 flex items-center gap-3">
                  <div className="w-3 h-[1px] bg-gold" />
                  Protocolo de Instalación
                </h4>
                <div className="flex flex-col gap-5">
                  {[
                    { n: "01", text: "Descarga segura del paquete APK certificado." },
                    { n: "02", text: "Autorización de instalación de fuentes privadas." },
                    { n: "03", text: "Vinculación de credenciales M&M corporativas." },
                    { n: "04", text: "Activación de protocolos de seguridad biométricos." },
                  ].map((s) => (
                    <div key={s.n} className="flex items-start gap-4">
                      <span className="text-base font-serif italic font-black text-gold/60 mt-0.5 shrink-0">{s.n}</span>
                      <p className="text-sm md:text-base text-white/60 font-light leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] w-6 bg-white/10" />
                <p className="text-[9px] font-black tracking-[0.2em] text-white/20 uppercase italic">Security Certified</p>
                <div className="h-[1px] w-6 bg-white/10" />
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
      {/* Removed Booking and History sections for a cleaner Landing Experience */}
      <DownloadModal />
      <BigCTA />
      <Footer />
    </div>
  );
}
