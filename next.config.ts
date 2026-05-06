import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['fcc-reg-recall-voting.trycloudflare.com'],
  async rewrites() {
    const apiBaseUrl =  'http://localhost:8081';
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
