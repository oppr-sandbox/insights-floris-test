import { query } from "./_generated/server";
import { getCurrentUser, requireCompany } from "./lib/auth";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// All users in the caller's company — for topic user-access and respondent lists.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const { companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("users")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    return rows.map((u) => {
      const displayName =
        u.displayName ??
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ??
        u.email ??
        "User";
      return {
        id: u._id,
        displayName,
        email: u.email ?? "",
        position: u.role ?? "MEMBER",
        role: u.role ?? "MEMBER",
        userImage: u.userImage ?? u.image ?? "",
        initials: initialsOf(displayName),
        locationId: u.locationId ?? null,
        disciplineId: u.disciplineId ?? null,
      };
    });
  },
});

// Current authenticated user's profile + tenant context. Replaces GET /api/users/me.
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const company = user.companyId ? await ctx.db.get(user.companyId) : null;
    const location = user.locationId ? await ctx.db.get(user.locationId) : null;
    const discipline = user.disciplineId
      ? await ctx.db.get(user.disciplineId)
      : null;

    return {
      id: user._id,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      displayName: user.displayName ?? user.email ?? "",
      phoneNumber: user.phone ?? "",
      lastLogin: user.lastLogin ?? null,
      userImage: user.userImage ?? user.image ?? "",
      role: user.role ?? "MEMBER",
      companyId: user.companyId ?? null,
      companySlug: company?.slug ?? null,
      companyName: company?.name ?? null,
      locationId: user.locationId ?? null,
      location: location?.name ?? null,
      disciplineId: user.disciplineId ?? null,
      discipline: discipline?.name ?? null,
    };
  },
});
