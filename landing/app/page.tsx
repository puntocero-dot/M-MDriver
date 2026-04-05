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
      className="fixed top-0 left-0 right-0 z-[100] px-6 py-8 flex justify-center pointer-events-none"
    >
      <div 
        className={`w-full max-w-6xl h-20 flex items-center justify-between px-10 rounded-full transition-all duration-500 pointer-events-auto ${
          scrolled ? "glass shadow-2xl border-white/10" : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <span className="text-gold-vibrant text-3xl font-serif font-black tracking-tighter transition-transform group-hover:scale-105">
            M&M
          </span>
          <span className="text-white text-xl font-medium tracking-[0.2em] uppercase font-sans">
            Driver
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-12">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-on-surface-muted hover:text-gold-vibrant text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-300 hover:tracking-[0.3em]"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#contact"
          className="hidden md:flex btn-premium items-center gap-3 !py-3 !px-8 rounded-full text-[11px] h-12 shadow-gold/20"
        >
          Reserva Ahora
          <ChevronRight size={16} strokeWidth={2.5} />
        </a>

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
              className="text-7xl md:text-9xl font-serif text-white leading-[1] md:leading-[0.95]"
            >
              Tu Conductor <br />
              <span className="text-gold-glow italic">Privado</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="text-2xl text-on-surface-muted leading-relaxed max-w-3xl border-l-[1px] border-gold/30 pl-10 font-light"
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
            <a href="#contact" className="btn-premium px-14 py-7 rounded-full text-sm tracking-[0.2em]">
              Comenzar Reserva
            </a>
            <a href="#how" className="btn-outline-premium px-14 py-7 rounded-full text-sm tracking-[0.2em]">
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
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12"
        >
          {services.map((s) => (
            <motion.div
              key={s.title}
              variants={fadeUp}
              className="group relative rounded-[3.5rem] p-16 flex flex-col gap-12 transition-all duration-700 bg-surface-container/40 border border-white/5 hover:border-gold/40 hover:bg-surface-container hover:-translate-y-4"
            >
              {/* Premium Icon Composition - Refined Relationship */}
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-gold/15 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div
                  className="relative w-full h-full rounded-[2.5rem] flex items-center justify-center glass border-white/10 transition-all duration-700 group-hover:rounded-full group-hover:rotate-[15deg] group-hover:border-gold/30"
                  style={{ boxShadow: `0 15px 40px -10px ${s.color}30` }}
                >
                  <s.icon size={40} style={{ color: s.color }} strokeWidth={1} className="transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-[15deg]" />
                </div>
              </div>
              
              <div className="flex flex-col gap-8">
                <h3 className="text-4xl font-serif text-white tracking-tight leading-tight">
                  {s.title}
                </h3>
                <p className="text-lg text-on-surface-muted leading-relaxed font-light">
                  {s.desc}
                </p>
              </div>

              <div className="mt-auto pt-8 flex items-center gap-4 text-[12px] font-bold text-gold tracking-[0.3em] uppercase opacity-40 group-hover:opacity-100 group-hover:translate-x-3 transition-all duration-700">
                Saber más <ArrowRight size={18} />
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
          <span className="text-[11px] font-bold tracking-[1em] uppercase text-gold/60 mb-10 block">
            The Protocol
          </span>
          <h2 className="text-6xl md:text-9xl font-serif text-white">
            Logística <span className="text-gold-glow italic">Privada</span>
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-24 mt-40">
          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.2}>
              <div className="flex flex-col items-center text-center group">
                <div className="relative mb-20">
                  <div className="w-52 h-52 rounded-[4.5rem] flex items-center justify-center glass border-white/10 transition-all duration-1000 group-hover:rounded-full group-hover:scale-110 group-hover:border-gold/50 group-hover:bg-gold/5">
                    <step.icon size={72} className="text-gold transition-all duration-700 group-hover:scale-110 group-hover:rotate-6" strokeWidth={0.5} />
                  </div>
                  <span className="absolute -top-6 -right-6 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-serif italic font-black bg-gold text-on-primary shadow-2xl border-8 border-surface">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-4xl font-serif text-white mb-10 group-hover:text-gold transition-colors duration-500">
                  {step.title}
                </h3>
                <p className="text-xl text-on-surface-muted leading-relaxed font-light max-w-[340px]">
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
          <p className="text-2xl text-on-surface-muted leading-relaxed mb-24 font-light border-l-[1px] border-gold/20 pl-12 max-w-2xl">
            Superamos estándares diplomáticos. Especialistas en logística crítica para la élite.
          </p>

          <div className="grid gap-20">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.15} className="flex gap-12 group">
                <div className="w-24 h-24 rounded-3xl flex-shrink-0 flex items-center justify-center bg-surface-container border border-white/5 transition-all duration-500 group-hover:border-gold/50 group-hover:bg-surface-high group-hover:rotate-3">
                  <f.icon size={42} className="text-gold" strokeWidth={0.6} />
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-4xl font-serif text-white group-hover:text-gold transition-colors duration-500">
                    {f.title}
                  </h4>
                  <p className="text-xl text-on-surface-muted leading-relaxed font-light">
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
          
          <div className="relative glass rounded-[4rem] p-16 border-white/10 shadow-2xl overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            
            <h3 className="text-2xl font-serif text-white mb-16 flex items-center gap-6">
              <span className="w-3 h-3 rounded-full bg-gold animate-pulse" />
              Live Intelligence
            </h3>

            <div className="flex flex-col gap-10">
              {[
                { label: "Elite Drivers Active", value: "05", total: "/ 12", color: "var(--success)" },
                { label: "Successful Missions", value: "18", total: "", color: "var(--gold-vibrant)" },
                { label: "Response Window", value: "08", total: "min", color: "var(--info)" },
                { label: "Satisfaction Index", value: "4.99", total: "★", color: "var(--gold-vibrant)" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between py-8 border-b border-white/10 last:border-0 hover:bg-white/[0.03] px-6 rounded-[2.5rem] transition-all duration-500">
                  <span className="text-[12px] font-bold text-on-surface-muted uppercase tracking-[0.3em] font-sans">{m.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tabular-nums" style={{ color: m.color }}>{m.value}</span>
                    {m.total && <span className="text-sm font-bold text-on-surface-var uppercase">{m.total}</span>}
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

        <div className="flex flex-col md:flex-row gap-10 justify-center items-center mb-32 max-w-4xl mx-auto">
          <a href="https://wa.me/50300000000" className="btn-premium px-20 py-10 rounded-full text-base w-full md:w-auto tracking-[0.2em] shadow-2xl">
            CONTACTAR CONCIERGE
          </a>
          <a href="#" className="btn-outline-premium px-20 py-10 rounded-full text-base w-full md:w-auto tracking-[0.2em]">
            DESCARGAR APP
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-20 gap-y-12 pt-16 border-t border-white/5">
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
      <BigCTA />
      <Footer />
    </div>
  );
}
