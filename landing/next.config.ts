import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "output: export" is only used for production static builds (Vercel/CDN).
  // Keeping it here breaks the dev-server CSS pipeline (Tailwind v4 / PostCSS HMR).
  // Re-enable at deploy time via: NEXT_PUBLIC_STATIC_EXPORT=1
  ...(process.env.NEXT_PUBLIC_STATIC_EXPORT === "1" ? { output: "export" } : {}),
};

export default nextConfig;
