export const permissions: Record<string, string[]> = {
  OWNER: ["topics:manage", "insights:manage", "company:manage", "users:manage", "billing:manage"],
  ADMIN: ["topics:manage", "insights:manage", "users:manage", "billing:manage"],
  MEMBER: ["feedbacks:manage", "insights:view"],
};

export const protectedRoutes = [
  "/dashboard",
  "/me",
  "/topics",
  "/feedbacks",
  "/insights",
  "/notifications",
  "/settings/company",
  "/settings/users",
  "/settings/naming-conventions",
  "/settings/billing",
  "/settings/roadmap",
  "/config",
];

export const routePermissions: Record<string, string[]> = {
  OWNER: [
    "/dashboard",
    "/me",
    "/topics",
    "/feedbacks",
    "/insights",
    "/notifications",
    "/settings/company",
    "/settings/users",
    "/settings/naming-conventions",
    "/settings/billing",
    "/settings/roadmap",
    "/config",
  ],
  ADMIN: [
    "/dashboard",
    "/me",
    "/topics",
    "/feedbacks",
    "/insights",
    "/notifications",
    "/settings/users",
    "/settings/naming-conventions",
    "/settings/billing",
    "/settings/roadmap",
    "/config",
  ],
  MEMBER: ["/dashboard", "/me", "/feedbacks", "/insights", "/notifications"],
};
