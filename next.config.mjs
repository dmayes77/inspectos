/** @type {import('next').NextConfig} */
const nextConfig = {};

let config = nextConfig;

// Bundle analyzer (only when ANALYZE=true)
if (process.env.ANALYZE === "true") {
  const { default: withBundleAnalyzer } = await import("@next/bundle-analyzer");
  config = withBundleAnalyzer({ enabled: true })(nextConfig);
}

export default config;
