import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@inspectos/shared"],
  experimental: {
    globalNotFound: true,
  },
};

export default nextConfig;
