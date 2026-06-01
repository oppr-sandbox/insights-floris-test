import { query } from "./_generated/server";
import { requireCompany } from "./lib/auth";

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const { companyId } = await requireCompany(ctx);

    const topics = await ctx.db
      .query("topics")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const insights = await ctx.db
      .query("insights")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    const submitted = feedback.filter((f) => f.status === "SUBMITTED");
    const respondents = new Set(submitted.map((f) => f.userId));

    return {
      totalTopics: topics.length,
      activeTopics: topics.filter((t) => t.status === "ACTIVE").length,
      completedTopics: topics.filter((t) => t.status === "COMPLETED").length,
      draftTopics: topics.filter((t) => t.status === "DRAFT").length,
      totalFeedbacks: submitted.length,
      totalRespondents: respondents.size,
      totalInsights: insights.length,
      publishedInsights: insights.filter((i) => i.status === "PUBLISHED").length,
      recentInsightsGenerated: insights.length,
      feedbackPendingReview: 0,
    };
  },
});
