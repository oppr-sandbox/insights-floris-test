import { mutation } from "./_generated/server";
import { requireCompany } from "./lib/auth";

// Returns a short-lived URL the client POSTs a file to; the response gives a
// storageId which is then recorded via a feature mutation (e.g. topics.addAttachments).
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireCompany(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
