import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  // Transpile workspace packages for Turbopack
  transpilePackages: [
    '@inspectos/auth',
    '@inspectos/database',
    '@inspectos/shared',
    '@fullcalendar/core',
    '@fullcalendar/react',
    '@fullcalendar/daygrid',
    '@fullcalendar/timegrid',
    '@fullcalendar/interaction',
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.logo.dev",
      },
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
        destination: "/contacts",
        permanent: true,
      },
      {
        source: "/admin/contacts/clients/:path*",
        destination: "/contacts/:path*",
        permanent: true,
      },
      {
        source: "/contacts/clients",
        destination: "/contacts",
        permanent: true,
      },
      {
        source: "/contacts/clients/:path*",
        destination: "/contacts/:path*",
        permanent: true,
      },
      {
        source: "/admin/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/app",
        destination: "/",
        permanent: true,
      },
      {
        source: "/app/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
