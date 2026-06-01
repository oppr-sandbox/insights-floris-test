import { query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

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
