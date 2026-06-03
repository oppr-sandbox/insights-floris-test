import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  async rewrites() {
      const rewrites = [
        {
          source: '/ingest/static/:path*',
          destination: 'https://eu-assets.i.posthog.com/static/:path*',
        },
        {
          source: '/ingest/:path*',
          destination: 'https://eu.i.posthog.com/:path*',
        },
      ];
      // Legacy REST/file proxies — only registered when their backend URL is
      // configured (local dev). Omitted in the Convex-only production deploy so
      // the build doesn't fail on an undefined destination.
      if (process.env.FILE_URL) {
        rewrites.push({
          source: '/files/:path*',
          destination: `${process.env.FILE_URL}/:path*`,
        });
      }
      if (process.env.PUBLIC_API_URL) {
        rewrites.push({
          source: '/api/:path*',
          destination: `${process.env.PUBLIC_API_URL}/api/:path*`,
        });
      }
      return rewrites;
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
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
