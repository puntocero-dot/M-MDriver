"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LogIn, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Mail, 
  Lock,
  ChevronLeft
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
      saveAuth(response.accessToken, response.user);

      // Unified Redirection Logic
      if (response.user.role === "SUPERADMIN" || response.user.role === "SUPERVISOR") {
        // Redirect to Admin Panel (assuming relative path if on same domain 
        // or absolute if different)
        window.location.href = "https://m-m-driver-admin.vercel.app/dashboard";
      } else if (response.user.role === "DRIVER") {
        router.push("/driver-panel");
      } else {
        // Client stays on landing, but now authorized
        router.push("/#reserva");
      }
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A1121] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gold/5 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-on-surface-muted hover:text-gold transition-colors mb-8 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Volver al Inicio</span>
        </button>

        <div className="glass rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-3xl bg-gold flex items-center justify-center shadow-2xl shadow-gold/20 border-[6px] border-[#0A1121]">
            <ShieldCheck size={40} className="text-[#0A1121]" strokeWidth={1.5} />
          </div>

          <div className="mt-10 mb-10 text-center">
            <h1 className="text-3xl font-serif text-white mb-2 tracking-tight">Bienvenido</h1>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gold/60">Servicio de Protocolo Privado</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-muted ml-1">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-var" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-12 py-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface-muted ml-1">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-var" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-12 py-4 text-sm text-white focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-red-400 text-xs font-medium text-center bg-red-400/10 py-3 rounded-xl border border-red-400/20"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-premium flex items-center justify-center gap-3 mt-4 disabled:opacity-70 group"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
              {loading ? "Iniciando..." : "Ingresar"}
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-xs text-on-surface-muted italic">
              ¿No tienes cuenta? <a href="/#reserva" className="text-gold font-bold hover:underline not-italic ml-1">Regístrate al reservar</a>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-bold tracking-[0.2em] text-on-surface-var uppercase">
          © {new Date().getFullYear()} M&M Driver Services · VIP Protocol
        </p>
      </motion.div>
    </div>
  );
}
