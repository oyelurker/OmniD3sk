import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: "/ws",
        destination: `${API_URL}/ws`,
      },
      {
        source: "/audio-processors/:path*",
        destination: `${API_URL}/audio-processors/:path*`,
      },
      {
        source: "/assets/:path*",
        destination: `${API_URL}/assets/:path*`,
      },
    ];
  },
};

export default nextConfig;
