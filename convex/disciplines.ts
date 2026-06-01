import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireCompany } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("disciplines")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    return rows.map((r) => ({ id: r._id, name: r.name, code: r.code }));
  },
});

export const create = mutation({
  args: { name: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const id = await ctx.db.insert("disciplines", {
      companyId,
      name: args.name,
      code: args.code,
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("disciplines") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const d = await ctx.db.get(args.id);
    if (!d || d.companyId !== companyId) throw new Error("Not found");
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});
