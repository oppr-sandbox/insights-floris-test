import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["login", "invite", "accept-invite", "reset-password", "forgot-password", "not-found"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/ingest") ||
    pathname.startsWith("/registration")
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const tenant = segments[0];

  if (!tenant) {
    const hasAccessToken = req.cookies.has("access_token");
    const lastTenant = req.cookies.get("last_tenant")?.value;

    if (hasAccessToken && lastTenant) {
      return NextResponse.redirect(new URL(`/${lastTenant}/dashboard`, req.url));
    }

    return NextResponse.next();
  }

  const isPublic = PUBLIC_ROUTES.some((r) => segments[1]?.startsWith(r));
  const hasAccessToken = req.cookies.has("access_token");

  if (!hasAccessToken && !isPublic) {
    return NextResponse.redirect(new URL(`/${tenant}/login`, req.url));
  }

  if (hasAccessToken && pathname.includes('login')) {
    return NextResponse.redirect(new URL(`/${tenant}/dashboard`, req.url));
  }

  const response = NextResponse.next();

  if (hasAccessToken) {
    response.cookies.set("last_tenant", tenant, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
