import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  async rewrites() {
      return [
        {
          source: '/ingest/static/:path*',
          destination: 'https://eu-assets.i.posthog.com/static/:path*',
        },
        {
          source: '/ingest/:path*',
          destination: 'https://eu.i.posthog.com/:path*',
        },
        {
          source: '/files/:path*',
          destination:  process.env.FILE_URL + '/:path*',
        },
        {
          source: "/api/:path*",
          destination: process.env.PUBLIC_API_URL + "/api/:path*",
        }
      ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_ROOT_DOMAIN!,
      },
      {
        protocol: "http",
        hostname: process.env.NEXT_PUBLIC_ROOT_DOMAIN!,
      },
      {
        protocol: "http",
        hostname: "*.localhost",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
