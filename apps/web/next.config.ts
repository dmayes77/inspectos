import type { NextConfig } from "next";

const publicSiteUrl = process.env.PUBLIC_SITE_URL || "https://inspectos.co";

const nextConfig: NextConfig = {
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
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: publicSiteUrl,
        permanent: true,
      },
      {
        source: "/pricing",
        destination: `${publicSiteUrl}/pricing`,
        permanent: true,
      },
      {
        source: "/data-charter",
        destination: `${publicSiteUrl}/data-charter`,
        permanent: true,
      },
      {
        source: "/admin/contacts/clients",
        destination: "/app/contacts",
        permanent: true,
      },
      {
        source: "/admin/contacts/clients/:path*",
        destination: "/app/contacts/:path*",
        permanent: true,
      },
      {
        source: "/app/contacts/clients",
        destination: "/app/contacts",
        permanent: true,
      },
      {
        source: "/app/contacts/clients/:path*",
        destination: "/app/contacts/:path*",
        permanent: true,
      },
      {
        source: "/admin/:path*",
        destination: "/app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
