import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireCompany } from "./lib/auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const { companyId } = await requireCompany(ctx);
    const company = await ctx.db.get(companyId);
    if (!company) return null;
    return {
      id: company._id,
      name: company.name,
      slug: company.slug,
      subdomain: company.subdomain ?? "",
      companyEmail: company.companyEmail ?? "",
      phone: company.phone ?? "",
      address: company.address ?? "",
      street: company.street ?? "",
      postalCode: company.postalCode ?? "",
      city: company.city ?? "",
      languageId: company.languageId ?? null,
      countryId: company.countryId ?? null,
    };
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    companyEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    street: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const patch: Record<string, string> = {};
    for (const [k, val] of Object.entries(args)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(companyId, patch);
    return { ok: true };
  },
});
