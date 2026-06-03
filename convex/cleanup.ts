import { internalMutation } from "./_generated/server";

// Dev-only: wipe all OPERATIONAL data so we can re-seed test topics from a
// clean slate. Deliberately preserves identity (users, companies), reference
// data (locations, disciplines, languages, countries), configured lenses, and
// app settings — wiping those would break login and remove the analysis
// methodologies + reference lookups.
//
// Run with:  npx convex run cleanup:wipeData
export const wipeData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "topics",
      "feedback",
      "insights",
      "analysisSessions",
      "analysisReports",
      "aiChatHistory",
      "files",
      "notifications",
      "notificationReads",
      "counters",
      "aiRuns",
      "aiRunLogs",
    ] as const;

    const deleted: Record<string, number> = {};
    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
      deleted[table] = rows.length;
    }
    return deleted;
  },
});
