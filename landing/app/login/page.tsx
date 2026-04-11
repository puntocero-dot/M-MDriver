"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  Mail,
  Lock,
  ChevronLeft,
  AlertTriangle,
  User,
  Phone,
  Briefcase
} from "lucide-react";
import { loginClient, registerClient } from "../../lib/api";
import { saveAuth } from "../../lib/auth";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regForm, setRegForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;
      if (mode === "login") {
        response = await loginClient(email, password);
      } else {
        response = await registerClient(regForm);
      }

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
        router.push("/client"); // Redirect to the new private client dashboard
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("401") || msg.toLowerCase().includes("credencial")) {
        setError("Credenciales no autorizadas. Verifique su acceso.");
      } else if (msg.toLowerCase().includes("conflict") || msg.includes("409")) {
        setError("Este correo corporativo ya está registrado. Por favor inicie sesión.");
        setMode("login");
      } else {
        setError(msg || "Error de conexión. Intente de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row relative overflow-hidden">
      {/* ── Left Side: Brand Imagery & Luxury Vibe ── */}
      <div className="hidden lg:flex w-[45%] relative bg-surface-low border-r border-white/5 items-center justify-center p-12 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full opacity-[0.03] blur-[150px] bg-gold" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.02] blur-[100px] bg-gold-vibrant" />
        
        {/* Animated pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center text-center max-w-sm"
        >
          <div className="mb-12 relative group">
            <div className="absolute inset-0 bg-gold/20 blur-[40px] rounded-full opacity-60 transition-opacity group-hover:opacity-100" />
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-surface-high to-surface-container border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
              <ShieldCheck size={48} className="text-gold" strokeWidth={1} />
            </div>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-serif text-white mb-6 uppercase tracking-tight">The Midnight<br/> <span className="text-gold italic">Concierge</span></h1>
          <p className="text-on-surface-muted text-sm font-light leading-relaxed mb-12">
            El estándar más alto en movilidad ejecutiva blindada para la élite de El Salvador. 
            Acceda a su terminal segura.
          </p>

          <div className="flex gap-4">
            <div className="h-[1px] w-8 bg-gold/30 mt-2" />
            <p className="text-[9px] font-black tracking-[0.4em] uppercase text-gold/60">Strictly Confidential</p>
            <div className="h-[1px] w-8 bg-gold/30 mt-2" />
          </div>
        </motion.div>
      </div>

      {/* ── Right Side: Auth Form ── */}
      <div className="w-full lg:w-[55%] flex flex-col pt-12 md:pt-0 relative z-10">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden flex flex-col items-center text-center mb-10 px-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-high to-surface-container border border-white/10 flex items-center justify-center mb-6 shadow-xl">
             <ShieldCheck size={28} className="text-gold" strokeWidth={1} />
          </div>
          <h1 className="text-3xl font-serif text-white tracking-tight">M&M Driver</h1>
        </div>

        {/* Back Link */}
        <div className="absolute top-8 md:top-12 left-8 md:left-12 z-20">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 text-white/40 hover:text-gold transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-full bg-surface-high border border-white/10 flex items-center justify-center group-hover:bg-gold/10 group-hover:border-gold/30 transition-all">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="text-[10px] font-black tracking-[0.3em] uppercase hidden sm:block">Retorno</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-10 md:py-20 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md xl:max-w-lg"
          >
            {/* Mode Tabs */}
            <div className="flex bg-surface-high border border-white/10 rounded-2xl p-1.5 mb-10 shadow-lg relative">
              <motion.div
                className="absolute top-1.5 bottom-1.5 rounded-xl bg-surface-light border border-white/10 shadow-md"
                initial={false}
                animate={{
                  left: mode === "login" ? "6px" : "calc(50% + 3px)",
                  width: "calc(50% - 9px)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              />
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className={`flex-1 py-3.5 text-[11px] font-black tracking-[0.2em] uppercase rounded-xl relative z-10 transition-colors ${
                  mode === "login" ? "text-gold" : "text-white/40 hover:text-white/80"
                }`}
              >
                Ingreso
              </button>
              <button
                onClick={() => { setMode("register"); setError(""); }}
                className={`flex-1 py-3.5 text-[11px] font-black tracking-[0.2em] uppercase rounded-xl relative z-10 transition-colors ${
                  mode === "register" ? "text-gold" : "text-white/40 hover:text-white/80"
                }`}
              >
                Nuevo Protocolo
              </button>
            </div>

                <div className="mb-12 text-center">
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-3">
                {mode === "login" ? "Acceso Seguro" : "Nuevo Protocolo"}
              </h2>
              <p className="text-sm md:text-base text-on-surface-muted font-light">
                {mode === "login" 
                  ? "Ingrese sus credenciales de bóveda corporativa."
                  : "Complete los datos para generar su perfil encriptado."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-6"
                >
                  
                  {mode === "register" && (
                    <>
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 pl-2">Nombre</label>
                          <div className="relative group">
                            <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" />
                            <input
                              type="text"
                              value={regForm.firstName}
                              onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })}
                              placeholder="John"
                              required
                              className="w-full rounded-2xl bg-surface-high border border-white/10 pl-14 pr-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 focus:bg-white/[0.04] transition-all"
                            />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 pl-2">Apellido</label>
                          <div className="relative group">
                            <input
                              type="text"
                              value={regForm.lastName}
                              onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })}
                              placeholder="Doe"
                              required
                              className="w-full rounded-2xl bg-surface-high border border-white/10 px-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 focus:bg-white/[0.04] transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 pl-2">Teléfono Móvil</label>
                        <div className="relative group">
                          <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" />
                          <input
                            type="text"
                            value={regForm.phone}
                            onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                            placeholder="+503 0000-0000"
                            required
                            className="w-full rounded-2xl bg-surface-high border border-white/10 pl-14 pr-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 focus:bg-white/[0.04] transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-4">
                    <label className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/50 pl-2">Credencial Corporativa (Email)</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" />
                      <input
                        type="email"
                        value={mode === "login" ? email : regForm.email}
                        onChange={(e) => mode === "login" ? setEmail(e.target.value) : setRegForm({ ...regForm, email: e.target.value })}
                        placeholder="ejecutivo@empresa.com"
                        required
                        className="w-full h-16 rounded-2xl bg-surface-high border border-white/10 pl-14 pr-5 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 focus:bg-white/[0.04] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center pr-2">
                      <label className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/50 pl-2">Código Privado (Pass)</label>
                      {mode === "login" && (
                        <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-gold/60 hover:text-gold transition-colors">¿Extraviado?</a>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" />
                      <input
                        type="password"
                        value={mode === "login" ? password : regForm.password}
                        onChange={(e) => mode === "login" ? setPassword(e.target.value) : setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="••••••••"
                        required
                        className="w-full h-16 rounded-2xl bg-surface-high border border-white/10 pl-14 pr-5 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 focus:bg-white/[0.04] transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Error Block */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-2">
                      <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-red-400 text-xs leading-relaxed font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-2xl font-black text-[11px] tracking-[0.3em] uppercase transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-4 group mt-4 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--gold-vibrant) 0%, var(--gold) 100%)",
                  boxShadow: "0 15px 30px rgba(197,165,90,0.15)",
                }}
              >
                {/* Button Inner Glow */}
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <span className="relative z-10 text-on-primary">
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <span className="flex items-center gap-3">
                      {mode === "login" ? "Autorizar Acceso" : "Crear Bóveda"}
                      <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                    </span>
                  )}
                </span>
              </button>
            </form>
            
          </motion.div>
        </div>
      </div>
    </div>
  );
}
