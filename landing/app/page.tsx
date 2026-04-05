"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, Variants } from "framer-motion";
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
} from "lucide-react";

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
    { label: "Contacto", href: "#contact" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-[100] px-6 py-5 flex justify-center pointer-events-none"
    >
      <div 
        className={`w-full max-w-5xl h-[var(--navbar-height)] flex items-center justify-between px-8 rounded-full transition-all duration-500 pointer-events-auto ${
          scrolled ? "glass shadow-2xl" : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <span className="text-gold-vibrant text-2xl font-black tracking-tighter transition-transform group-hover:scale-105">
            M&M
          </span>
          <span className="text-white text-lg font-bold tracking-tight">
            Driver
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-on-surface-muted hover:text-gold-vibrant text-sm font-bold tracking-wide transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#contact"
          className="hidden md:flex btn-premium items-center gap-2 px-6 h-11 rounded-full text-[10px]"
        >
          Reserva Ahora
          <ChevronRight size={14} strokeWidth={3} />
        </a>

        {/* Mobile burger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute top-24 left-6 right-6 glass rounded-[2rem] p-10 flex flex-col gap-8 md:hidden shadow-2xl border-gold/20 pointer-events-auto"
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
            className="btn-premium px-6 py-5 rounded-2xl text-sm text-center font-bold"
            onClick={() => setOpen(false)}
          >
            Solicitar Conductor
          </a>
        </motion.div>
      )}
    </motion.nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section className="min-h-screen flex items-center pt-24 md:pt-0">
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
        <motion.div style={{ y, opacity }} className="flex flex-col gap-12 max-w-4xl">
          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex items-center gap-4"
            >
              <div className="h-[2px] w-12 bg-gold shadow-[0_0_10px_var(--gold)]" />
              <span className="text-xs font-bold tracking-[0.4em] uppercase text-gold">
                Exclusive Service · El Salvador
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-8xl font-black text-white leading-[0.9]"
            >
              Tu Conductor <br />
              <span className="text-gold-glow">Privado</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="text-xl text-on-surface-muted leading-relaxed max-w-2xl border-l-2 border-gold/20 pl-8 font-medium"
            >
              Redefiniendo la movilidad premium. Discreción, puntualidad y el estándar más alto en transporte personalizado para la élite de El Salvador.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-wrap gap-6"
          >
            <a href="#contact" className="btn-premium px-12 py-6 rounded-2xl text-xs">
              Comenzar Reserva
            </a>
            <a href="#how" className="btn-outline-premium px-12 py-6 rounded-2xl text-xs">
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
          <p className="text-on-surface-muted text-xl max-w-2xl mx-auto font-medium">
            Diseñados para quienes exigen discreción absoluta y el máximo lujo en cada traslado.
          </p>
        </FadeIn>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {services.map((s) => (
            <motion.div
              key={s.title}
              variants={fadeUp}
              className="group relative rounded-[2.5rem] p-10 flex flex-col gap-8 transition-all duration-500 bg-surface-container border border-white/5 hover:border-gold/30 hover:bg-surface-high hover:-translate-y-3"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center glass shadow-inner transition-transform duration-500 group-hover:scale-110"
                style={{ borderColor: `${s.color}20` }}
              >
                <s.icon size={32} style={{ color: s.color }} strokeWidth={1} />
              </div>
              
              <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {s.title}
                </h3>
                <p className="text-base text-on-surface-muted leading-relaxed font-medium">
                  {s.desc}
                </p>
              </div>

              <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-black text-gold tracking-widest uppercase opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                Saber más <ArrowRight size={14} />
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
        <FadeIn className="text-center mb-32">
          <span className="text-[10px] font-black tracking-[0.8em] uppercase text-gold mb-8 block">
            The Protocol
          </span>
          <h2 className="text-5xl md:text-8xl font-black text-white">
            Logística <span className="text-gold-glow">Privada</span>
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-20">
          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.2}>
              <div className="flex flex-col items-center text-center group">
                <div className="relative mb-12">
                  <div className="w-40 h-40 rounded-[3rem] flex items-center justify-center glass border-white/10 transition-all duration-700 group-hover:rounded-full group-hover:scale-110 group-hover:border-gold/40">
                    <step.icon size={56} className="text-gold transition-transform duration-500 group-hover:scale-110" strokeWidth={0.8} />
                  </div>
                  <span className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black bg-gold text-on-primary shadow-2xl">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-3xl font-black text-white mb-6 group-hover:text-gold transition-colors">
                  {step.title}
                </h3>
                <p className="text-lg text-on-surface-muted leading-relaxed font-medium max-w-[320px]">
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
      <div className="container-page grid lg:grid-cols-2 gap-24 items-center">
        {/* Left Content */}
        <FadeIn>
          <span className="text-[10px] font-black tracking-[0.8em] uppercase text-gold mb-10 block">
            The Standard
          </span>
          <h2 className="text-6xl md:text-8xl font-black text-white mb-12 leading-[0.85]">
            Excelencia <br /> <span className="text-gold-glow">Innegociable</span>.
          </h2>
          <p className="text-xl text-on-surface-muted leading-relaxed mb-16 font-medium border-l-2 border-gold/10 pl-10">
            Superamos estándares diplomáticos. Especialistas en logística crítica para la élite.
          </p>

          <div className="grid gap-12">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.15} className="flex gap-8 group">
                <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center bg-surface-container border border-white/5 transition-all group-hover:border-gold/50 group-hover:bg-surface-high">
                  <f.icon size={32} className="text-gold" strokeWidth={1} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white mb-2 group-hover:text-gold transition-colors">
                    {f.title}
                  </h4>
                  <p className="text-base text-on-surface-muted leading-relaxed font-medium">
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>

        {/* Right Dashboard Visualization */}
        <FadeIn delay={0.3} className="relative h-full flex flex-col justify-center">
          <div className="absolute inset-0 bg-gold/10 blur-[150px] rounded-full pointer-events-none" />
          
          <div className="relative glass rounded-[3.5rem] p-12 lg:p-16 border-white/10 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            
            <h3 className="text-2xl font-black text-white mb-12 flex items-center gap-4">
              <span className="w-3 h-3 rounded-full bg-gold animate-pulse" />
              Live Intelligence
            </h3>

            <div className="flex flex-col gap-8">
              {[
                { label: "Elite Drivers Active", value: "05", total: "/ 12", color: "var(--success)" },
                { label: "Successful Missions", value: "18", total: "", color: "var(--gold-vibrant)" },
                { label: "Response Window", value: "08", total: "min", color: "var(--info)" },
                { label: "Satisfaction Index", value: "4.99", total: "★", color: "var(--gold-vibrant)" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between py-6 border-b border-white/5 last:border-0 hover:bg-white/[0.02] px-4 rounded-3xl transition-colors">
                  <span className="text-[11px] font-black text-on-surface-muted uppercase tracking-[0.2em]">{m.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tabular-nums" style={{ color: m.color }}>{m.value}</span>
                    {m.total && <span className="text-xs font-black text-on-surface-var uppercase">{m.total}</span>}
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

      <FadeIn className="container-page text-center">
        <span className="text-[10px] font-black tracking-[1em] uppercase text-gold mb-12 block">
          The Invitation
        </span>

        <h2 className="text-5xl md:text-9xl font-black text-white mb-16 leading-[0.8] tracking-tighter">
          ELEVA TU <br /> <span className="text-gold-glow">EXPERIENCIA</span>
        </h2>

        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-24">
          <a href="https://wa.me/50300000000" className="btn-premium px-16 py-8 rounded-3xl text-sm w-full sm:w-auto">
            CONTACTAR CONCIERGE
          </a>
          <a href="#" className="btn-outline-premium px-16 py-8 rounded-3xl text-sm w-full sm:w-auto">
            DESCARGAR APP
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-16">
          {[
            { label: "Background Checked", icon: Shield },
            { label: "N1CO Integrated", icon: Star },
            { label: "Satellite Tracking", icon: MapPin },
            { label: "SOS Response Ready", icon: Clock },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <b.icon size={18} className="text-gold" />
              <span className="text-[10px] font-black tracking-[0.2em] text-on-surface-var uppercase">{b.label}</span>
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
    <footer className="py-16 bg-surface border-t border-white/[0.03]">
      <div className="container-page">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Brand Identity */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gold-vibrant tracking-tighter leading-none">
                M&M
              </span>
              <span className="text-xl font-bold text-white tracking-tight">
                Driver
              </span>
            </div>
            <p className="text-[10px] font-bold tracking-[0.4em] text-on-surface-var uppercase">
              The Midnight Concierge
            </p>
          </div>

          {/* Navigation Matrix */}
          <div className="flex flex-wrap items-center justify-center gap-10">
            {[
              "Privacy Policy",
              "Terms of Service",
              "Corporate Protocol",
              "Contact",
            ].map((l) => (
              <a
                key={l}
                href="#"
                className="text-[10px] font-bold tracking-widest text-on-surface-muted hover:text-gold uppercase transition-all duration-300"
              >
                {l}
              </a>
            ))}
          </div>

          {/* Copyright Metadata */}
          <div className="text-center md:text-right">
            <p className="text-[10px] font-bold tracking-widest text-on-surface-var uppercase">
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
      <BigCTA />
      <Footer />
    </div>
  );
}
