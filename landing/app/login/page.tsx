"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  Mail,
  Lock,
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { loginClient } from "../../lib/api";
import { saveAuth } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginClient(email, password);

      // Defensive check — the server should always return a user with a role
      const role = response?.user?.role;
      if (!role) {
        setError("Respuesta del servidor inesperada. Intente de nuevo.");
        return;
      }

      saveAuth(response.accessToken, response.user);

      if (role === "SUPERADMIN" || role === "SUPERVISOR") {
        window.location.href = "https://m-m-driver-admin.vercel.app/dashboard";
      } else if (role === "DRIVER") {
        router.push("/driver-panel");
      } else {
        // CLIENT — back to landing home
        router.push("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("401") || msg.toLowerCase().includes("credencial") || msg.toLowerCase().includes("inválid")) {
        setError("Correo o contraseña incorrectos. Verifique sus datos.");
      } else if (msg.toLowerCase().includes("not found") || msg.includes("404")) {
        setError("No existe una cuenta con ese correo. ¿Desea registrarse al reservar?");
      } else if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
        setError("Sin conexión al servidor. Intente más tarde.");
      } else {
        setError(msg || "Error al iniciar sesión. Intente de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080E1C] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-[0.07] blur-[160px] bg-[#CFA12E]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.04] blur-[120px] bg-[#CFA12E]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        {/* Back link */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-white/40 hover:text-gold transition-all duration-300 mb-10 group"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[9px] font-black tracking-[0.3em] uppercase">Volver al Inicio</span>
        </button>

        {/* Card */}
        <div className="relative rounded-[2rem] border border-white/8 shadow-2xl overflow-hidden"
          style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)" }}
        >
          {/* Gold top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#CFA12E]/60 to-transparent" />

          {/* Shield icon — inside the card, not floating */}
          <div className="flex flex-col items-center pt-12 pb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#CFA12E] to-[#A07D20] flex items-center justify-center shadow-xl shadow-[#CFA12E]/20 mb-8">
              <ShieldCheck size={40} className="text-[#080E1C]" strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl font-serif text-white tracking-tight mb-1">Bienvenido</h1>
            <p className="text-[9px] font-black tracking-[0.4em] uppercase text-[#CFA12E]/60 mb-0">
              Servicio de Protocolo Privado
            </p>
          </div>

          {/* Divider */}
          <div className="mx-10 h-[1px] bg-white/5 my-6" />

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5 px-10 pb-10">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black tracking-[0.25em] uppercase text-white/40 ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full rounded-xl bg-white/[0.04] border border-white/8 px-11 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#CFA12E]/50 focus:bg-white/[0.06] transition-all duration-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black tracking-[0.25em] uppercase text-white/40 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-white/[0.04] border border-white/8 px-11 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#CFA12E]/50 focus:bg-white/[0.06] transition-all duration-300"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3"
              >
                <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs leading-relaxed">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-4 rounded-xl font-black text-[11px] tracking-[0.3em] uppercase transition-all duration-500 disabled:opacity-60 flex items-center justify-center gap-3 group"
              style={{
                background: "linear-gradient(135deg, #CFA12E 0%, #A07D20 100%)",
                color: "#080E1C",
                boxShadow: "0 8px 32px rgba(207,161,46,0.25)",
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="px-10 pb-10 text-center">
            <p className="text-[11px] text-white/30">
              ¿Sin cuenta?{" "}
              <a href="/#reserva" className="text-[#CFA12E]/80 hover:text-[#CFA12E] font-bold transition-colors">
                Regístrate al reservar →
              </a>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p className="mt-8 text-center text-[9px] font-black tracking-[0.25em] text-white/20 uppercase">
          © {new Date().getFullYear()} M&M Driver Services · VIP Protocol
        </p>
      </motion.div>
    </div>
  );
}
