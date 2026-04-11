"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Car, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { saveToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Interceptor already unwraps { data, statusCode } → clean payload
      const { data: res } = await api.post<{
        accessToken: string; refreshToken: string; user: { role: string };
      }>("/auth/login", { email, password });

      saveToken(res.accessToken);
      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      if (axiosError.response?.status === 401) {
        setError("Correo o contraseña incorrectos. Intenta de nuevo.");
      } else if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError("Error al conectar con el servidor. Intenta más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#0A1628" }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, #C5A55A 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, #1C2D54 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div
          className="rounded-2xl border border-slate-700/50 p-8 shadow-2xl"
          style={{ backgroundColor: "#132040" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ backgroundColor: "#1C2D54" }}
            >
              <Car className="w-8 h-8" style={{ color: "#C5A55A" }} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span style={{ color: "#C5A55A" }}>M&amp;M</span>{" "}
              <span className="text-white">Driver</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">Panel Administrativo</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mmdriver.com"
                className="
                  w-full rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500
                  border border-slate-600 outline-none
                  focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                  transition-colors duration-200
                "
                style={{ backgroundColor: "#0A1628" }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="
                    w-full rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder-slate-500
                    border border-slate-600 outline-none
                    focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
                    transition-colors duration-200
                  "
                  style={{ backgroundColor: "#0A1628" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full flex items-center justify-center gap-2
                py-3 px-6 rounded-lg text-sm font-semibold
                text-slate-900 transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                hover:opacity-90 active:scale-[0.98]
              "
              style={{ backgroundColor: "#C5A55A" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-slate-600">
            M&amp;M Driver © {new Date().getFullYear()} — Servicio Ejecutivo Premium
          </p>
        </div>
      </div>
    </div>
  );
}
