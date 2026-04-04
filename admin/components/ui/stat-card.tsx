import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "blue" | "green" | "red" | "gold";
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
}

const COLOR_MAP = {
  blue: {
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    border: "border-blue-500/30",
    trend: "text-blue-400",
  },
  green: {
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    border: "border-green-500/30",
    trend: "text-green-400",
  },
  red: {
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    border: "border-red-500/30",
    trend: "text-red-400",
  },
  gold: {
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    border: "border-amber-500/30",
    trend: "text-amber-400",
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
  trend,
}: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div
      className={`
        rounded-xl border ${colors.border} p-5
        transition-transform duration-200 hover:scale-[1.02]
        hover:shadow-lg
      `}
      style={{ backgroundColor: "#132040" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
          {trend && (
            <p className={`mt-2 text-xs font-medium ${colors.trend}`}>
              {trend.value > 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`${colors.iconBg} rounded-lg p-3 ml-4`}>
          <Icon className={`h-6 w-6 ${colors.iconColor}`} />
        </div>
      </div>
    </div>
  );
}
