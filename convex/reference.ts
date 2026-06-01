import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";

export const languages = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const rows = await ctx.db.query("languages").collect();
    return rows.map((r) => ({
      id: r._id,
      name: r.name,
      languageCode: r.languageCode,
    }));
  },
});

export const countries = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const rows = await ctx.db.query("countries").collect();
    return rows.map((r) => ({
      id: r._id,
      name: r.name,
      countryCode: r.countryCode,
    }));
  },
});
