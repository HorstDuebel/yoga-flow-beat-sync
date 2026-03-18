import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Workaround: next-auth + Next.js 16 – Modul-Auflösung für next/server
  transpilePackages: ["next-auth"],
  env: {
    // Client und Server: 127.0.0.1 (Spotify erlaubt kein localhost)
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ??
      process.env.AUTH_URL ??
      "http://127.0.0.1:3000",
    AUTH_URL:
      process.env.AUTH_URL ??
      process.env.NEXTAUTH_URL ??
      "http://127.0.0.1:3000",
  },
  // localhost und 127.0.0.1 als gleiche Dev-Origin behandeln
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
