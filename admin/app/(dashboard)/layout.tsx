"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Car,
  Users,
  UserCheck,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  Truck,
} from "lucide-react";
import { isAuthenticated, clearToken } from "@/lib/auth";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Viajes", icon: Car },
  { href: "/drivers", label: "Conductores", icon: UserCheck },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/sos", label: "SOS Alertas", icon: AlertTriangle },
  { href: "/fleet", label: "Flota en Vivo", icon: Truck },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Don't render anything until hydrated to avoid flash
  if (!hydrated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0A1628" }}
      >
        <div className="animate-pulse text-slate-400 text-sm">Cargando...</div>
      </div>
    );
  }

  const Sidebar = () => (
    <aside
      className="flex flex-col h-full w-64"
      style={{ backgroundColor: "#0A1628", borderRight: "1px solid #1C2D54" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: "#1C2D54" }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
          style={{ backgroundColor: "#1C2D54" }}
        >
          <Car className="w-5 h-5" style={{ color: "#C5A55A" }} />
        </div>
        <div className="leading-tight">
          <span
            className="block text-lg font-bold"
            style={{ color: "#C5A55A" }}
          >
            M&amp;M
          </span>
          <span className="block text-sm font-medium text-white -mt-1">
            Driver
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150 group relative
                    ${
                      active
                        ? "text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }
                  `}
                  style={
                    active
                      ? {
                          backgroundColor: "#132040",
                          borderLeft: "3px solid #C5A55A",
                          paddingLeft: "calc(0.75rem - 3px)",
                        }
                      : {}
                  }
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 transition-colors ${
                      active ? "" : "group-hover:text-slate-300"
                    }`}
                    style={active ? { color: "#C5A55A" } : {}}
                  />
                  {item.label}
                  {item.href === "/sos" && (
                    <span className="ml-auto flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: "#1C2D54" }}
      >
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
            text-slate-400 hover:text-red-400 hover:bg-red-900/20
            transition-all duration-150
          "
        >
          <LogOut className="h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0A1628" }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header
          className="lg:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ backgroundColor: "#0A1628", borderColor: "#1C2D54" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: "#C5A55A" }}>
              M&amp;M
            </span>
            <span className="text-white font-medium">Driver</span>
          </div>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: "#0A1628" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
