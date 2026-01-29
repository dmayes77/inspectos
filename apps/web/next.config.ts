import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
