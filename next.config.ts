import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/login",
        destination: "http://localhost:8081/api/auth/login",
      },
      {
        source: "/api/auth/logout",
        destination: "http://localhost:8081/api/auth/logout",
      },
    ];
  },
};

export default nextConfig;
