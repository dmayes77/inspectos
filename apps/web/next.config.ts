import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile workspace packages for Turbopack
  transpilePackages: ['@inspectos/auth', '@inspectos/database', '@inspectos/shared'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin/contacts/clients",
        destination: "/admin/contacts",
        permanent: true,
      },
      {
        source: "/admin/contacts/clients/:path*",
        destination: "/admin/contacts/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
