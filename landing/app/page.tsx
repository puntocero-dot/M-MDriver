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
    const handler = () => setScrolled(window.scrollY > 40);
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
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <span
            className="text-gold-glow text-xl font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            M&M
          </span>
          <span
            className="text-[#e5e2e1] text-xl font-semibold"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            Driver
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[#c7c6c4] hover:text-[#f2ca50] text-sm font-medium transition-colors"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#contact"
          className="hidden md:flex btn-gold items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Solicitar Conductor
          <ChevronRight size={14} />
        </a>

        {/* Mobile burger */}
        <button
          className="md:hidden text-[#e5e2e1]"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="glass md:hidden px-6 pb-6 pt-2 flex flex-col gap-4"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-[#c7c6c4] hover:text-[#f2ca50] text-sm font-medium"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="btn-gold px-5 py-3 rounded-xl text-sm text-center"
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
  const y = useTransform(scrollYProgress, [0, 0.4], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Ambient gradient blobs */}
      <div
        className="absolute top-[-120px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(242,202,80,0.07) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(191,205,255,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-20 grid lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left — copy */}
        <motion.div style={{ y, opacity }} className="flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex items-center gap-3"
          >
            <div
              className="h-px w-8"
              style={{ background: "var(--gold)" }}
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--gold)", fontFamily: "var(--font-inter)" }}
            >
              El Salvador · Servicio Premium
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: "easeOut" }}
            style={{ fontFamily: "var(--font-manrope)" }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-[#e5e2e1]"
          >
            Tu Conductor{" "}
            <span className="text-gold-glow">Privado</span>,{" "}
            <br className="hidden md:block" />
            Siempre Listo.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="text-lg text-[#c7c6c4] leading-relaxed max-w-md"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Servicio de chófer premium en El Salvador. Transporte médico,
            ejecutivo y corporativo con su propio conductor, en su propio
            vehículo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#contact"
              className="btn-gold flex items-center gap-2.5 px-7 py-4 rounded-2xl text-sm"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Solicitar Conductor
              <ArrowRight size={16} />
            </a>
            <a
              href="#how"
              className="flex items-center gap-2 px-7 py-4 rounded-2xl text-sm font-semibold text-[#e5e2e1] transition-colors hover:text-[#f2ca50]"
              style={{
                fontFamily: "var(--font-inter)",
                background: "var(--surface-high)",
                border: "0.5px solid var(--outline-var)",
              }}
            >
              Cómo funciona
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex gap-8 pt-4"
          >
            {[
              { value: "24/7", label: "Disponible" },
              { value: "100%", label: "Puntual" },
              { value: "N1CO", label: "Pagos" },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className="text-2xl font-bold text-gold-glow"
                  style={{ fontFamily: "var(--font-manrope)" }}
                >
                  {s.value}
                </p>
                <p
                  className="text-xs text-[#99907c] mt-0.5"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — vehicle visual */}
        <motion.div
          initial={{ opacity: 0, x: 40, rotate: 2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
          className="relative hidden lg:block"
        >
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "var(--surface-high)",
              border: "0.5px solid var(--outline-var)",
              padding: "48px 32px",
              transform: "perspective(1200px) rotateX(3deg) rotateY(-4deg)",
              boxShadow: "-24px 24px 60px rgba(0,0,0,0.55)",
            }}
          >
            {/* Fake car silhouette — elegant geometric placeholder */}
            <div className="flex flex-col gap-6">
              {/* Car icon large */}
              <div className="flex justify-center">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(242,202,80,0.12) 0%, transparent 70%)",
                  }}
                >
                  <Car
                    size={72}
                    style={{ color: "var(--gold)", opacity: 0.9 }}
                    strokeWidth={1}
                  />
                </div>
              </div>

              {/* Live status card */}
              <div
                className="glass rounded-2xl p-5"
                style={{ borderColor: "rgba(242,202,80,0.2)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: "#4caf50" }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#4caf50", fontFamily: "var(--font-inter)" }}
                  >
                    Conductor disponible
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: "var(--surface-highest)",
                      color: "var(--gold)",
                      fontFamily: "var(--font-manrope)",
                    }}
                  >
                    CR
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold text-[#e5e2e1]"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      Carlos Rivas
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={10} fill="#f2ca50" color="#f2ca50" />
                      <span
                        className="text-[11px] text-[#99907c]"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        4.98 · Verificado
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className="mt-4 flex items-center gap-2 text-xs text-[#99907c]"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  <MapPin size={12} style={{ color: "var(--gold)" }} />
                  <span>ETA · 8 min · Col. Escalón</span>
                </div>
              </div>

              {/* Progress blade */}
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 h-1 rounded-full overflow-hidden"
                  style={{ background: "var(--surface-highest)" }}
                >
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "68%" }}
                    transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--gold-dim), var(--gold))",
                    }}
                  />
                </div>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: "var(--gold)", fontFamily: "var(--font-inter)" }}
                >
                  En camino
                </span>
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
    <section id="services" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8" style={{ background: "var(--gold)" }} />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--gold)", fontFamily: "var(--font-inter)" }}
            >
              La Experiencia
            </span>
            <div className="h-px w-8" style={{ background: "var(--gold)" }} />
          </div>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-[#e5e2e1] mb-4"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            Servicios a su Medida
          </h2>
          <p
            className="text-[#c7c6c4] text-lg max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Diseñados para quienes exigen discreción, puntualidad y confort en
            cada traslado.
          </p>
        </FadeIn>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {services.map((s) => (
            <motion.div
              key={s.title}
              variants={fadeUp}
              className="group relative rounded-2xl p-6 flex flex-col gap-4 cursor-default transition-transform hover:-translate-y-1"
              style={{
                background: "var(--surface-low)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${s.color}18`,
                }}
              >
                <s.icon size={22} style={{ color: s.color }} strokeWidth={1.5} />
              </div>
              <h3
                className="text-base font-semibold text-[#e5e2e1]"
                style={{ fontFamily: "var(--font-manrope)" }}
              >
                {s.title}
              </h3>
              <p
                className="text-sm text-[#99907c] leading-relaxed"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {s.desc}
              </p>
              {/* Bottom accent line on hover */}
              <div
                className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, var(--gold), transparent)",
                }}
              />
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
    <section
      id="how"
      className="py-28 px-6"
      style={{ background: "var(--surface-low)" }}
    >
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8" style={{ background: "var(--gold)" }} />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--gold)", fontFamily: "var(--font-inter)" }}
            >
              El Proceso
            </span>
            <div className="h-px w-8" style={{ background: "var(--gold)" }} />
          </div>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-[#e5e2e1]"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            Cómo Funciona
          </h2>
        </FadeIn>

        <div className="relative grid md:grid-cols-3 gap-8">
          {/* Connector line */}
          <div
            className="absolute top-12 left-1/6 right-1/6 h-px hidden md:block pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--outline-var), transparent)",
            }}
          />

          {steps.map((step, i) => (
            <FadeIn key={step.num} delay={i * 0.15}>
              <div className="flex flex-col items-center text-center gap-5">
                {/* Icon circle */}
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center glass"
                    style={{ border: "0.5px solid var(--outline-var)" }}
                  >
                    <step.icon
                      size={32}
                      style={{ color: "var(--gold)" }}
                      strokeWidth={1.2}
                    />
                  </div>
                  <span
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--gold), var(--gold-dim))",
                      color: "var(--on-primary)",
                      fontFamily: "var(--font-manrope)",
                    }}
                  >
                    {step.num}
                  </span>
                </div>
                <h3
                  className="text-xl font-bold text-[#e5e2e1]"
                  style={{ fontFamily: "var(--font-manrope)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm text-[#99907c] leading-relaxed max-w-xs"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
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
    <section id="fleet" className="py-28 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        {/* Left */}
        <FadeIn>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8" style={{ background: "var(--gold)" }} />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--gold)", fontFamily: "var(--font-inter)" }}
            >
              El Estándar Aureum
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-[#e5e2e1] mb-6 leading-tight"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            Excelencia Humana en Cada Viaje
          </h2>
          <p
            className="text-[#c7c6c4] text-base leading-relaxed mb-10"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Nuestros conductores no son solo choferes — son expertos en
            discreción, puntualidad y etiqueta. Disponibles para traslados
            médicos, corporativos y ejecutivos en todo El Salvador.
          </p>

          <div className="flex flex-col gap-5">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1} className="flex gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: "var(--surface-high)" }}
                >
                  <f.icon
                    size={18}
                    style={{ color: "var(--gold)" }}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <h4
                    className="text-sm font-semibold text-[#e5e2e1] mb-1"
                    style={{ fontFamily: "var(--font-manrope)" }}
                  >
                    {f.title}
                  </h4>
                  <p
                    className="text-sm text-[#99907c] leading-relaxed"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>

        {/* Right — glass metrics card */}
        <FadeIn delay={0.2}>
          <div
            className="glass rounded-3xl p-8 flex flex-col gap-6"
            style={{
              transform:
                "perspective(1200px) rotateX(2deg) rotateY(3deg)",
              boxShadow: "20px 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            <h3
              className="text-lg font-bold text-[#e5e2e1]"
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              Panel en Tiempo Real
            </h3>

            {[
              { label: "Conductores activos", value: "5/12", color: "#4caf50" },
              { label: "Viajes completados hoy", value: "18", color: "#f2ca50" },
              { label: "Tiempo promedio de llegada", value: "11 min", color: "#bfcdff" },
              { label: "Calificación promedio", value: "4.97 ★", color: "#f2ca50" },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between py-3"
                style={{
                  borderBottom: "0.5px solid var(--outline-var)",
                }}
              >
                <span
                  className="text-sm text-[#99907c]"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {m.label}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: m.color, fontFamily: "var(--font-manrope)" }}
                >
                  {m.value}
                </span>
              </div>
            ))}

            <div
              className="flex items-center gap-2 text-xs text-[#4d4635]"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#4caf50" }}
              />
              Actualizado hace 30 segundos
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
    <section
      id="contact"
      className="py-32 px-6 relative overflow-hidden"
      style={{ background: "var(--surface-low)" }}
    >
      {/* Background gold glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(242,202,80,0.08) 0%, transparent 70%)",
        }}
      />

      <FadeIn className="max-w-3xl mx-auto text-center relative">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-8" style={{ background: "var(--gold)" }} />
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "var(--gold)", fontFamily: "var(--font-inter)" }}
          >
            Únete
          </span>
          <div className="h-px w-8" style={{ background: "var(--gold)" }} />
        </div>

        <h2
          className="text-4xl md:text-6xl font-extrabold text-[#e5e2e1] mb-6 leading-tight"
          style={{ fontFamily: "var(--font-manrope)" }}
        >
          ELEVA TU{" "}
          <span className="text-gold-glow">EXPERIENCIA</span>{" "}
          HOY
        </h2>

        <p
          className="text-lg text-[#c7c6c4] mb-10 max-w-lg mx-auto"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Descarga la app o escríbenos por WhatsApp. Tu primer conductor está a
          minutos de distancia.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="https://wa.me/50300000000"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold flex items-center gap-2.5 px-8 py-4 rounded-2xl text-sm"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            WhatsApp
            <ArrowRight size={16} />
          </a>
          <a
            href="#"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold text-[#e5e2e1] hover:text-[#f2ca50] transition-colors"
            style={{
              fontFamily: "var(--font-inter)",
              background: "var(--surface-high)",
              border: "0.5px solid var(--outline-var)",
            }}
          >
            Descargar App
          </a>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-[#4d4635]">
          {[
            "Conductores verificados",
            "Pagos N1CO",
            "Cobertura El Salvador",
            "Soporte 24/7",
          ].map((b) => (
            <div key={b} className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--outline-var)" }}
              />
              <span style={{ fontFamily: "var(--font-inter)" }}>{b}</span>
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
    <footer
      className="py-12 px-6"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="max-w-6xl mx-auto"
        style={{
          borderTop: "0.5px solid var(--outline-var)",
          paddingTop: "2rem",
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-extrabold text-gold-glow"
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              M&M
            </span>
            <span
              className="text-lg font-semibold text-[#e5e2e1]"
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              Driver
            </span>
            <span
              className="text-xs text-[#4d4635] ml-3 tracking-widest"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              THE MIDNIGHT CONCIERGE
            </span>
          </div>

          {/* Links */}
          <div className="flex gap-6">
            {[
              "Política de Privacidad",
              "Términos de Servicio",
              "Contacto",
            ].map((l) => (
              <a
                key={l}
                href="#"
                className="text-xs text-[#4d4635] hover:text-[#99907c] transition-colors"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {l}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p
            className="text-xs text-[#4d4635]"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            © {new Date().getFullYear()} M&M Driver. El Salvador.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main style={{ background: "var(--surface)" }}>
      <Nav />
      <Hero />
      <Services />
      <HowItWorks />
      <Fleet />
      <BigCTA />
      <Footer />
    </main>
  );
}
