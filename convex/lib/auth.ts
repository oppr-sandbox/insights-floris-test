import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

// Every domain query/mutation resolves the caller's company here and filters by
// it — this is the single multi-tenancy enforcement point.
export async function requireCompany(
  ctx: QueryCtx | MutationCtx,
): Promise<{ user: Doc<"users">; companyId: Id<"companies"> }> {
  const user = await requireUser(ctx);
  if (!user.companyId) {
    throw new Error("User is not attached to a company");
  }
  return { user, companyId: user.companyId };
}

export function requireRole(user: Doc<"users">, roles: Array<Doc<"users">["role"]>) {
  if (!roles.includes(user.role)) {
    throw new Error("Not authorized");
  }
}

// OWNER/ADMIN are "managers": they run topics and create insights, and see all
// company data. MEMBERs only give feedback and view insights.
export function isManager(user: Doc<"users">): boolean {
  return user.role === "OWNER" || user.role === "ADMIN";
}

// Topic-level visibility. Managers see every topic in the company; a MEMBER
// sees a topic only if they're in its audience (all-users or named) or created
// it. This is the single rule for who may see a topic's insights/analysis.
export function canSeeTopic(user: Doc<"users">, topic: Doc<"topics">): boolean {
  if (isManager(user)) return true;
  if (topic.userId === user._id) return true;
  return topic.isAllUsers || (topic.userIds ?? []).includes(user._id);
}
