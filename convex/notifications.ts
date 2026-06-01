import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireCompany } from "./lib/auth";

// A notification targets the caller if it has no explicit recipients (company-wide)
// or lists the caller in userIds.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .order("desc")
      .collect();

    const mine = rows.filter(
      (n) => n.userIds.length === 0 || n.userIds.includes(user._id),
    );

    const reads = await ctx.db
      .query("notificationReads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const readSet = new Set(reads.map((r) => r.notificationId));

    return mine.map((n) => ({
      id: n._id,
      type: n.type,
      title: n.title,
      body: n.body ?? "",
      payload: n.payload ?? null,
      createdAt: new Date(n._creationTime).toISOString(),
      read: readSet.has(n._id),
    }));
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const mine = rows.filter(
      (n) => n.userIds.length === 0 || n.userIds.includes(user._id),
    );
    const reads = await ctx.db
      .query("notificationReads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const readSet = new Set(reads.map((r) => r.notificationId));
    const unread = mine.filter((n) => !readSet.has(n._id)).length;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const today = mine.filter((n) => n._creationTime >= dayAgo).length;
    return {
      total: mine.length,
      unread,
      read: mine.length - unread,
      today,
      responseRate: 0,
    };
  },
});

export const markRead = mutation({
  args: { ids: v.array(v.id("notifications")) },
  handler: async (ctx, args) => {
    const { user } = await requireCompany(ctx);
    for (const id of args.ids) {
      const existing = await ctx.db
        .query("notificationReads")
        .withIndex("by_notification_user", (q) =>
          q.eq("notificationId", id).eq("userId", user._id),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("notificationReads", {
          notificationId: id,
          userId: user._id,
          readAt: Date.now(),
        });
      }
    }
    return { ok: true };
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const mine = rows.filter(
      (n) => n.userIds.length === 0 || n.userIds.includes(user._id),
    );
    const reads = await ctx.db
      .query("notificationReads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const readSet = new Set(reads.map((r) => r.notificationId));
    for (const n of mine) {
      if (!readSet.has(n._id)) {
        await ctx.db.insert("notificationReads", {
          notificationId: n._id,
          userId: user._id,
          readAt: Date.now(),
        });
      }
    }
    return { ok: true };
  },
});
