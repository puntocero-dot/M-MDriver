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
    const handler = () => setScrolled(window.scrollY > 20);
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
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-center"
    >
      <div 
        className={`w-full max-w-5xl h-14 flex items-center justify-between px-6 rounded-full transition-all duration-500 ${
          scrolled ? "glass shadow-2xl border-white/10" : "bg-transparent border-transparent"
        }`}
      >
        {/* Logo */}
        <a href="#" className="flex items-center gap-1.5 group">
          <span className="text-gold-vibrant text-2xl font-black tracking-tighter leading-none transition-transform group-hover:scale-105">
            M&M
          </span>
          <span className="text-white text-lg font-medium tracking-tight opacity-90">
            Driver
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-on-surface-muted hover:text-gold-vibrant text-sm font-semibold tracking-wide transition-all duration-300 hover:tracking-widest"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#contact"
          className="hidden md:flex btn-premium items-center gap-2 px-6 h-10 rounded-full text-xs uppercase tracking-widest"
        >
          Reserva Ahora
          <ChevronRight size={14} strokeWidth={3} />
        </a>

        {/* Mobile burger */}
        <button
          className="md:hidden text-white p-2 rounded-full hover:bg-white/5 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute top-20 left-6 right-6 glass rounded-3xl p-8 flex flex-col gap-6 md:hidden shadow-2xl border-gold/10"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-lg font-bold text-white/90 hover:text-gold-vibrant px-4 py-2 rounded-xl hover:bg-white/5 transition-all"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="btn-premium px-6 py-4 rounded-2xl text-sm text-center font-bold"
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
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden noise-overlay pt-32 pb-16">
      {/* Dynamic Background Elements */}
      <div
        className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full fixed pointer-events-none opacity-20 filter blur-[120px]"
        style={{
          background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)",
        }}
      />
      
      <div className="container-page relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left — Content */}
        <motion.div style={{ y, opacity }} className="flex flex-col gap-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex items-center gap-4"
          >
            <div className="h-[2px] w-12 bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-gold">
              El Salvador · Exclusive Service
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight text-white"
          >
            Tu Conductor <br />
            <span className="text-gold-glow">Privado</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-xl text-on-surface-muted leading-relaxed max-w-lg border-l-2 border-white/5 pl-8"
          >
            Redefiniendo la movilidad premium en El Salvador. Discreción, 
            puntualidad y el estándar más alto en transporte personalizado.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-wrap gap-6"
          >
            <a
              href="#contact"
              className="btn-premium flex items-center gap-3 px-10 py-5 rounded-2xl text-sm"
            >
              Comenzar Reserva
              <ArrowRight size={18} strokeWidth={2.5} />
            </a>
            <a
              href="#how"
              className="btn-outline-premium flex items-center gap-3 px-10 py-5 rounded-2xl text-sm"
            >
              Nuestra Metodología
            </a>
          </motion.div>

          {/* Luxury Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex gap-12 pt-6"
          >
            {[
              { value: "24/7", label: "Concierge" },
              { value: "100%", label: "Seguridad" },
              { value: "VIP", label: "Protocolo" },
            ].map((s) => (
              <div key={s.label} className="group cursor-default">
                <p className="text-3xl font-black text-white group-hover:text-gold transition-colors duration-500">
                  {s.value}
                </p>
                <p className="text-[10px] font-bold tracking-widest text-on-surface-var uppercase mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — Refined Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden lg:block"
        >
          <div
            className="relative rounded-[3rem] overflow-hidden p-1 bg-gradient-to-br from-gold/20 via-transparent to-white/5"
            style={{
              boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5)",
            }}
          >
            <div className="bg-surface-low rounded-[2.8rem] p-12 overflow-hidden relative">
              {/* Backglow */}
              <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
              
              <div className="relative z-10 flex flex-col gap-10">
                {/* Visual Placeholder for high-end car or driver */}
                <div className="flex justify-center py-8">
                  <div className="w-48 h-48 rounded-full flex items-center justify-center glass-gold shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                    <Car size={80} className="text-gold" strokeWidth={0.8} />
                  </div>
                </div>

                {/* Status Indicator Panel */}
                <div className="glass rounded-3xl p-8 border-white/[0.03]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-[0_0_10px_var(--success)]" />
                      <span className="text-xs font-bold text-success uppercase tracking-widest">
                        Ready for Pickup
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-var font-mono">ID: MM-9421</span>
                  </div>
                  
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-xl font-bold border-gold/20 text-gold shadow-inner">
                      CR
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-white tracking-tight">Carlos Rivas</p>
                        <div className="flex items-center gap-1">
                          <Star size={14} fill="var(--gold-vibrant)" className="text-gold-vibrant" />
                          <span className="text-sm font-bold text-white">4.99</span>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-muted font-medium mt-1 uppercase tracking-wider">Certified Executive Chauffeur</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-surface-high">
                        <MapPin size={16} className="text-gold" />
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-var uppercase font-bold tracking-tighter">Current Hub</p>
                        <p className="text-sm font-medium text-white/90">San Benito, SS</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-on-surface-var uppercase font-bold tracking-tighter">Availability</p>
                      <p className="text-sm font-bold text-gold">8 min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    <section id="services" className="py-24 md:py-32 relative overflow-hidden bg-surface">
      <div className="container-page relative z-10">
        <FadeIn className="text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-[2px] w-12 bg-gold/30" />
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-gold">
              Exclusividad & Confort
            </span>
            <div className="h-[2px] w-12 bg-gold/30" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
            Servicios a su Medida
          </h2>
          <p className="text-on-surface-muted text-lg max-w-2xl mx-auto font-medium">
            Diseñados para quienes exigen discreción, puntualidad y el máximo lujo en cada traslado personalizado.
          </p>
        </FadeIn>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {services.map((s) => (
            <motion.div
              key={s.title}
              variants={fadeUp}
              className="group relative rounded-3xl p-8 flex flex-col gap-6 cursor-pointer bg-surface-low border border-white/[0.03] transition-all duration-500 hover:bg-surface-high hover:border-gold/20 hover:-translate-y-2"
            >
              {/* Card Ambient Glow */}
              <div 
                className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 blur-3xl pointer-events-none transition-opacity duration-700" 
                style={{ background: s.color }}
              />

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center glass shadow-inner transition-transform duration-500 group-hover:scale-110"
                style={{ borderColor: `${s.color}15` }}
              >
                <s.icon size={26} style={{ color: s.color }} strokeWidth={1} />
              </div>
              
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {s.title}
                </h3>
                <p className="text-sm text-on-surface-muted leading-relaxed font-medium">
                  {s.desc}
                </p>
              </div>

              {/* Interaction Hint */}
              <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-bold text-gold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                SABER MÁS <ChevronRight size={14} strokeWidth={3} />
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
    <section id="how" className="py-24 md:py-36 bg-surface-low relative">
      <div className="container-page">
        <FadeIn className="text-center mb-24">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-[10px] font-bold tracking-[0.5em] uppercase text-gold">
              The Protocol
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white">
            Metodología <span className="text-gold">Privada</span>
          </h2>
        </FadeIn>

        <div className="relative grid md:grid-cols-3 gap-12 lg:gap-20">
          {/* Subtle Connector */}
          <div className="absolute top-16 left-20 right-20 h-px hidden md:block bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-[0_0_20px_rgba(255,255,255,0.05)]" />

          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.2}>
              <div className="flex flex-col items-center text-center group">
                <div className="relative mb-10">
                  <div className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center glass border-gold/10 transition-all duration-700 group-hover:rounded-full group-hover:scale-110 group-hover:border-gold/30">
                    <step.icon size={44} className="text-gold transition-all duration-500 group-hover:scale-95" strokeWidth={0.8} />
                  </div>
                  <span className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black bg-gold text-on-primary shadow-xl">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight group-hover:text-gold transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-on-surface-muted leading-relaxed font-medium max-w-[280px]">
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
    <section id="fleet" className="py-24 md:py-32 relative overflow-hidden noise-overlay">
      <div className="container-page grid lg:grid-cols-2 gap-16 lg:gap-32 items-center">
        {/* Left Content */}
        <FadeIn>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] w-12 bg-gold" />
            <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-gold">
              The Standard
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-[0.95]">
            Excelencia <br /> <span className="text-gold-glow">Innegociable</span>.
          </h2>
          <p className="text-on-surface-muted text-lg leading-relaxed mb-12 font-medium border-l border-white/10 pl-8">
            Nuestros conductores superan estándares diplomáticos de etiqueta.
            Especialistas en discreción y logística crítica para la élite de El Salvador.
          </p>

          <div className="flex flex-col gap-8">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.15} className="flex gap-6 group">
                <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center bg-surface-high border border-white/[0.03] transition-colors group-hover:border-gold/30">
                  <f.icon size={24} className="text-gold" strokeWidth={1} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-gold transition-colors">
                    {f.title}
                  </h4>
                  <p className="text-sm text-on-surface-muted leading-relaxed font-medium">
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>

        {/* Right Metric Visualization */}
        <FadeIn delay={0.3} className="relative">
          <div className="absolute inset-0 bg-gold/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative glass rounded-[3rem] p-10 lg:p-12 border-white/[0.03] shadow-2xl overflow-hidden group">
            {/* Top Shine */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
            
            <h3 className="text-xl font-black text-white mb-10 tracking-tight flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-gold shadow-[0_0_10px_var(--gold)]" />
              Real-Time Intelligence
            </h3>

            <div className="flex flex-col gap-6">
              {[
                { label: "Elite Drivers Active", value: "05", total: "/ 12", color: "var(--success)" },
                { label: "Successful Missions Today", value: "18", total: "", color: "var(--gold-vibrant)" },
                { label: "Response Window", value: "08", total: "min", color: "var(--info)" },
                { label: "User Satisfaction Index", value: "4.99", total: "★", color: "var(--gold-vibrant)" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between py-5 border-b border-white/[0.03] last:border-0 hover:px-4 transition-all duration-500 rounded-2xl hover:bg-white/[0.02]">
                  <span className="text-xs font-bold text-on-surface-var uppercase tracking-widest">{m.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black tabular-nums" style={{ color: m.color }}>{m.value}</span>
                    {m.total && <span className="text-[10px] font-bold text-on-surface-muted uppercase">{m.total}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 rounded-2xl bg-surface-high/50 flex items-center gap-4 border border-white/[0.03]">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-on-surface-muted uppercase">
                Satellite data synchronized
              </span>
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
    <section id="contact" className="py-32 relative overflow-hidden bg-surface-low">
      {/* Premium Background Effect */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, var(--gold) 0%, transparent 60%)",
        }}
      />

      <FadeIn className="container-page text-center relative z-10">
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className="text-[10px] font-bold tracking-[0.6em] uppercase text-gold">
            The Invitation
          </span>
        </div>

        <h2 className="text-5xl md:text-7xl font-black text-white mb-10 leading-[0.95] tracking-tighter">
          ELEVA TU <br /> <span className="text-gold-glow">EXPERIENCIA</span> HOY
        </h2>

        <p className="text-xl text-on-surface-muted mb-16 max-w-2xl mx-auto font-medium">
          Damos la bienvenida a clientes que exigen lo mejor. Su primer conductor exclusivo está a solo unos clics de distancia.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <a
            href="https://wa.me/50300000000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-premium flex items-center gap-4 px-12 py-6 rounded-3xl text-sm w-full sm:w-auto"
          >
            CONTACTAR CONCIERGE
            <ArrowRight size={20} strokeWidth={2.5} />
          </a>
          <a
            href="#"
            className="btn-outline-premium flex items-center gap-3 px-12 py-6 rounded-3xl text-sm w-full sm:w-auto"
          >
            DESCARGAR APP
          </a>
        </div>

        {/* Global Verification Badges */}
        <div className="flex flex-wrap items-center justify-center gap-12 mt-20">
          {[
            "Background Checked",
            "N1CO Integrated",
            "Satellite Tracking",
            "SOS Response Ready",
          ].map((b) => (
            <div key={b} className="flex items-center gap-3 group cursor-default">
              <Shield size={16} className="text-gold opacity-50 group-hover:opacity-100 transition-opacity" />
              <span className="text-[10px] font-bold tracking-widest text-on-surface-var uppercase group-hover:text-gold transition-colors">{b}</span>
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
