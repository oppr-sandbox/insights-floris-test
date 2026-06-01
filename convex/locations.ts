import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireCompany } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("locations")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    return rows.map((r) => ({ id: r._id, name: r.name, code: r.code }));
  },
});

export const create = mutation({
  args: { name: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const id = await ctx.db.insert("locations", {
      companyId,
      name: args.name,
      code: args.code,
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const loc = await ctx.db.get(args.id);
    if (!loc || loc.companyId !== companyId) throw new Error("Not found");
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});
