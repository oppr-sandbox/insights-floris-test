import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireCompany, requireUser } from "./lib/auth";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    displayName: v.optional(v.string()),
    userImage: v.optional(v.string()),
    locationId: v.optional(v.id("locations")),
    disciplineId: v.optional(v.id("disciplines")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(args)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(user._id, patch);
    return { ok: true };
  },
});

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
