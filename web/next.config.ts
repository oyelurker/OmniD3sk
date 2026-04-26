import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
      {
        source: "/ws",
        destination: "http://localhost:8080/ws",
      },
      {
        source: "/audio-processors/:path*",
        destination: "http://localhost:8080/audio-processors/:path*",
      },
      {
        source: "/assets/:path*",
        destination: "http://localhost:8080/assets/:path*",
      },
    ];
  },
};

export default nextConfig;
