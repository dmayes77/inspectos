import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile workspace packages for Turbopack
  transpilePackages: ['@inspectos/auth', '@inspectos/database', '@inspectos/shared'],
};

export default nextConfig;
