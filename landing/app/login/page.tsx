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
      const role = response?.user?.role;
      
      if (!role) {
        setError("Error de autenticación. Contacte a soporte.");
        return;
      }

      saveAuth(response.accessToken, response.user);

      if (role === "SUPERADMIN" || role === "SUPERVISOR") {
        window.location.href = "https://m-m-driver-admin.vercel.app/dashboard";
      } else if (role === "DRIVER") {
        router.push("/driver-panel");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("401") || msg.toLowerCase().includes("credencial")) {
        setError("Credenciales no autorizadas. Verifique su acceso.");
      } else {
        setError("Error de conexión. Intente de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05080F] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background visual elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] rounded-full opacity-[0.05] blur-[150px] bg-[#CFA12E]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full opacity-[0.03] blur-[120px] bg-[#CFA12E]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl z-10"
      >
        {/* Back Link - Styled as a premium action */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 text-white/30 hover:text-gold transition-all duration-500 mb-12 ml-4 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-gold/10 transition-colors">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-[10px] font-black tracking-[0.4em] uppercase">Retorno VIP</span>
        </button>

        {/* Premium Core Card */}
        <div className="relative rounded-[3.5rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden"
          style={{ background: "linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)" }}
        >
          {/* Subtle gold accent at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CFA12E]/40 to-transparent" />

          {/* Header Section - Significant spacing to avoid "overlap" feel */}
          <div className="flex flex-col items-center pt-20 pb-12">
            <div className="relative mb-14">
              <div className="absolute inset-0 bg-gold/30 blur-[30px] rounded-[2rem] opacity-40 shrink-0" />
              <div className="relative w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-[#CFA12E] to-[#A07D20] flex items-center justify-center shadow-2xl">
                <ShieldCheck size={56} className="text-[#05080F]" strokeWidth={1} />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight mb-4">Bienvenido</h1>
            <p className="text-[11px] font-black tracking-[0.6em] uppercase text-[#CFA12E]/50">
              Protocolo de Acceso Reservado
            </p>
          </div>

          {/* Form Section - Generous Paddings */}
          <form onSubmit={handleLogin} className="px-16 md:px-24 pb-16 flex flex-col gap-10">
            {/* Input Groups */}
            <div className="space-y-8">
              {/* Email */}
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 ml-2">
                  Credencial (Email)
                </label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@protocol.com"
                    required
                    className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-16 py-6 text-base text-white placeholder:text-white/10 focus:outline-none focus:border-gold/40 focus:bg-white/[0.07] transition-all duration-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 ml-2">
                  Código Privado
                </label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-16 py-6 text-base text-white placeholder:text-white/10 focus:outline-none focus:border-gold/40 focus:bg-white/[0.07] transition-all duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Error Message Section */}
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-4 bg-red-500/5 border border-red-500/20 rounded-2xl p-5"
              >
                <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm leading-relaxed font-medium">{error}</p>
              </motion.div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-6 rounded-2xl font-black text-xs tracking-[0.4em] uppercase transition-all duration-700 disabled:opacity-40 flex items-center justify-center gap-4 group"
              style={{
                background: "linear-gradient(135deg, #CFA12E 0%, #A07D20 100%)",
                color: "#05080F",
                boxShadow: "0 15px 45px rgba(207,161,46,0.25)",
              }}
            >
              {loading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>
                  Validar Acceso
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                </>
              )}
            </button>
          </form>

          {/* Registration Hook */}
          <div className="px-16 md:px-24 pb-16 text-center border-t border-white/5 pt-10">
            <p className="text-xs text-white/20 font-medium">
              ¿Nueva incorporación?{" "}
              <a href="/#fleet" className="text-gold/60 hover:text-gold font-black transition-colors ml-2 tracking-widest uppercase text-[10px]">
                Registro al Reservar
              </a>
            </p>
          </div>
        </div>

        {/* Legal Minimal */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="h-[1px] w-12 bg-white/10" />
          <p className="text-[10px] font-black tracking-[0.5em] text-white/20 uppercase">
            EST. 2026 · M&M Driver Services · VIP System
          </p>
        </div>
      </motion.div>
    </div>
  );
}
