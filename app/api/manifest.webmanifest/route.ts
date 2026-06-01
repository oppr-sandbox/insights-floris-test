import { NextRequest, NextResponse } from "next/server";

export const GET = (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const tenant = searchParams.get("tenant") || "default"; 

  // Logic to generate the manifest dynamically
  const manifest = {
    name: 'Oppr Insights',
    short_name: 'Oppr Insights',
    description: 'Oppr Insights - Professional Business Intelligence Platform',
    start_url: `/${tenant}/dashboard`,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };

  return NextResponse.json(manifest);
};
