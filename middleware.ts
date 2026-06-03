import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const PUBLIC_ROUTES = ["login", "invite", "accept-invite", "not-found"];

// Single-tenant sandbox: the seeded company slug. Used to route the bare root.
const DEFAULT_TENANT = "oppr";

export default convexAuthNextjsMiddleware(async (req, { convexAuth }) => {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/ingest") ||
    pathname.startsWith("/registration")
  ) {
    return;
  }

  const isAuthenticated = await convexAuth.isAuthenticated();
  const segments = pathname.split("/").filter(Boolean);
  const tenant = segments[0];

  if (!tenant) {
    // Magic-link landing: ConvexAuth appends ?code to SITE_URL (bare root).
    // Forward the code to the login page (where the client provider exchanges
    // it) instead of dropping it on a plain redirect.
    const code = req.nextUrl.searchParams.get("code");
    if (code) {
      return nextjsMiddlewareRedirect(
        req,
        `/${DEFAULT_TENANT}/login?code=${encodeURIComponent(code)}`,
      );
    }
    return nextjsMiddlewareRedirect(
      req,
      `/${DEFAULT_TENANT}/${isAuthenticated ? "dashboard" : "login"}`,
    );
  }

  const isPublic = PUBLIC_ROUTES.some((r) => segments[1]?.startsWith(r));

  if (!isAuthenticated && !isPublic) {
    return nextjsMiddlewareRedirect(req, `/${tenant}/login`);
  }

  if (isAuthenticated && pathname.includes("login")) {
    return nextjsMiddlewareRedirect(req, `/${tenant}/dashboard`);
  }

  return;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
