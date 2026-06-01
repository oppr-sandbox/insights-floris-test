import { mutation } from "./_generated/server";

// Seeds the sandbox: one company (slug "oppr") plus reference data, so that
// magic-link users land in a real tenant and topic codes resolve. Idempotent.
export const init = mutation({
  args: {},
  handler: async (ctx) => {
    let company = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", "oppr"))
      .unique();

    if (!company) {
      const companyId = await ctx.db.insert("companies", {
        name: "Oppr",
        slug: "oppr",
        subdomain: "oppr",
        companyEmail: "hello@oppr.ai",
      });
      company = await ctx.db.get(companyId);
    }
    const companyId = company!._id;

    const existingLocations = await ctx.db
      .query("locations")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    if (existingLocations.length === 0) {
      await ctx.db.insert("locations", {
        companyId,
        name: "Amsterdam",
        code: "AMS",
      });
      await ctx.db.insert("locations", {
        companyId,
        name: "Rotterdam",
        code: "RTM",
      });
    }

    const existingDisciplines = await ctx.db
      .query("disciplines")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    if (existingDisciplines.length === 0) {
      await ctx.db.insert("disciplines", { companyId, name: "IT", code: "IT" });
      await ctx.db.insert("disciplines", {
        companyId,
        name: "Operations",
        code: "OPS",
      });
    }

    const existingLanguages = await ctx.db.query("languages").take(1);
    if (existingLanguages.length === 0) {
      await ctx.db.insert("languages", { name: "English", languageCode: "en" });
      await ctx.db.insert("languages", { name: "Dutch", languageCode: "nl" });
    }

    const existingCountries = await ctx.db.query("countries").take(1);
    if (existingCountries.length === 0) {
      await ctx.db.insert("countries", {
        name: "Netherlands",
        countryCode: "NL",
      });
    }

    return { companyId, slug: "oppr" };
  },
});
