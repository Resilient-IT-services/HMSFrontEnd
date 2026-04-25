import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['telephone-consisting-anticipated-fin.trycloudflare.com'],
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8081';
    return [
      {
        // Standard API calls
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        // Spring Security OAuth endpoints
        source: '/oauth2/:path*',
        destination: `${apiBaseUrl}/oauth2/:path*`,
      },
      {
        // Spring Security Login endpoints (if used)
        source: '/login/oauth2/:path*',
        destination: `${apiBaseUrl}/login/oauth2/:path*`,
      }
    ];
  },
};

export default nextConfig;
