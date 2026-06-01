export const permissions: Record<string, string[]> = {
  OWNER: ["topics:manage", "insights:manage", "company:manage", "users:manage", "billing:manage"],
  ADMIN: ["topics:manage", "insights:manage", "users:manage", "billing:manage"],
  MEMBER: ["feedbacks:manage", "insights:view"],
};

export const protectedRoutes = [
  "/dashboard",
  "/topics",
  "/feedbacks",
  "/insights",
  "/notifications",
  "/settings/company",
  "/settings/users",
  "/settings/naming-conventions",
  "/settings/billing",
];

export const routePermissions: Record<string, string[]> = {
  OWNER: [
    "/dashboard",
    "/topics",
    "/feedbacks",
    "/insights",
    "/notifications",
    "/settings/company",
    "/settings/users",
    "/settings/naming-conventions",
    "/settings/billing",
  ],
  ADMIN: [
    "/dashboard",
    "/topics",
    "/feedbacks",
    "/insights",
    "/notifications",
    "/settings/users",
    "/settings/naming-conventions",
    "/settings/billing",
  ],
  MEMBER: ["/dashboard", "/feedbacks", "/insights", "/notifications"],
};
