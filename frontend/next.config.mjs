/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "videos.pexels.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/docs", destination: "/api/backend/docs", permanent: false },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "gsap"],
  },
};

export default nextConfig;
