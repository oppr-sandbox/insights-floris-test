import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { requireCompany, canSeeTopic, isManager } from "./lib/auth";
import { generateInsightCode } from "./lib/codes";

const iso = (ms?: number | null) =>
  ms != null ? new Date(ms).toISOString() : undefined;

function userDisplayName(u: Doc<"users"> | null): string {
  if (!u) return "Unknown";
  return (
    u.displayName ??
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ??
    u.email ??
    "User"
  );
}

async function toDto(ctx: QueryCtx, insight: Doc<"insights">) {
  const topic = await ctx.db.get(insight.topicId);
  const creator = await ctx.db.get(insight.userId);

  const respondents = new Set<string>();
  for (const fid of insight.feedbackIds) {
    const f = await ctx.db.get(fid);
    if (f) respondents.add(f.userId);
  }

  return {
    id: insight._id,
    insightCode: insight.insightCode,
    topicId: insight.topicId,
    topicCode: topic?.topicCode ?? "",
    topicName: topic?.name ?? "",
    feedbackCount: insight.feedbackIds.length,
    respondentsCount: respondents.size,
    label: insight.label ?? "",
    createdOn: new Date(insight._creationTime).toISOString(),
    createdBy: userDisplayName(creator),
    publishedDate: iso(insight.publishedDate),
    status: insight.status,
  };
}

// Keep only insights whose topic the caller may see (managers: all; members:
// their audience). Topics are cached so we never load one twice.
async function filterVisible(
  ctx: QueryCtx,
  user: Doc<"users">,
  rows: Doc<"insights">[],
) {
  const seen = new Map<string, boolean>();
  const visible: Doc<"insights">[] = [];
  for (const ins of rows) {
    let ok = seen.get(ins.topicId);
    if (ok === undefined) {
      const topic = await ctx.db.get(ins.topicId);
      ok = !!topic && canSeeTopic(user, topic);
      seen.set(ins.topicId, ok);
    }
    if (ok) visible.push(ins);
  }
  return visible;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("insights")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .order("desc")
      .collect();
    const visible = await filterVisible(ctx, user, rows);
    return Promise.all(visible.map((r) => toDto(ctx, r)));
  },
});

// The Insights hub "By topic" view: every topic the caller can see that has
// feedback or generated work, each with its quick insights and deep dives in
// one place. Also the source list for the "Talk" picker.
export const hub = query({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    const lensByKey = async (key: string) =>
      ctx.db
        .query("lenses")
        .withIndex("by_company_key", (q) =>
          q.eq("companyId", companyId).eq("key", key),
        )
        .unique();

    const out = [];
    for (const t of topics) {
      if (!canSeeTopic(user, t)) continue;

      const topicInsights = await ctx.db
        .query("insights")
        .withIndex("by_topic", (q) => q.eq("topicId", t._id))
        .order("desc")
        .collect();

      const sessions = await ctx.db
        .query("analysisSessions")
        .withIndex("by_company_topic", (q) =>
          q.eq("companyId", companyId).eq("primaryTopicId", t._id),
        )
        .order("desc")
        .collect();
      const guided = sessions.filter((s) => s.mode !== "ask");
      const topicConversations = sessions.filter((s) => s.mode === "ask");

      const submitted = await ctx.db
        .query("feedback")
        .withIndex("by_topic_status", (q) =>
          q.eq("topicId", t._id).eq("status", "SUBMITTED"),
        )
        .collect();

      if (topicInsights.length === 0 && guided.length === 0 && submitted.length === 0) {
        continue;
      }

      const insightDtos = topicInsights.map((i) => ({
        id: i._id,
        insightCode: i.insightCode,
        label: i.label ?? "",
        status: i.status,
        createdAt: new Date(i._creationTime).toISOString(),
      }));

      const deepDives = await Promise.all(
        guided.map(async (s) => {
          const lens = await lensByKey(s.lensKey);
          const reports = await ctx.db
            .query("analysisReports")
            .withIndex("by_session", (q) => q.eq("sessionId", s._id))
            .order("desc")
            .collect();
          const latest = reports[0];
          return {
            sessionId: s._id,
            title: s.title ?? lens?.name ?? s.lensKey,
            lensName: lens?.name ?? s.lensKey,
            lensIcon: lens?.icon ?? "Sparkles",
            reportId: latest?._id,
            reportStatus: latest?.status ?? "DRAFT",
            createdAt: iso(s.createdAt) ?? "",
            updatedAt: iso(s.updatedAt),
          };
        }),
      );

      const conversations = topicConversations.map((s) => ({
        sessionId: s._id,
        title: s.title ?? "Conversation",
        createdAt: iso(s.createdAt) ?? "",
        updatedAt: iso(s.updatedAt),
      }));

      const times = [
        ...insightDtos.map((i) => i.createdAt),
        ...deepDives.map((d) => d.updatedAt ?? d.createdAt),
        ...conversations.map((c) => c.updatedAt ?? c.createdAt),
      ].filter(Boolean);
      const lastActivityAt = times.sort().at(-1) ?? new Date(t._creationTime).toISOString();

      out.push({
        topicId: t._id,
        topicCode: t.topicCode,
        topicName: t.name,
        status: t.status,
        feedbackCount: submitted.length,
        insights: insightDtos,
        deepDives,
        conversations,
        lastActivityAt,
      });
    }

    out.sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? 1 : -1));
    return out;
  },
});

export const byTopic = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, { topicId }) => {
    const { user, companyId } = await requireCompany(ctx);
    const topic = await ctx.db.get(topicId);
    if (!topic || topic.companyId !== companyId) return [];
    if (!canSeeTopic(user, topic)) return [];
    const rows = await ctx.db
      .query("insights")
      .withIndex("by_topic", (q) => q.eq("topicId", topicId))
      .order("desc")
      .collect();
    return Promise.all(rows.map((r) => toDto(ctx, r)));
  },
});

export const published = query({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("insights")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", companyId).eq("status", "PUBLISHED"),
      )
      .order("desc")
      .collect();
    const visible = await filterVisible(ctx, user, rows);
    return Promise.all(visible.map((r) => toDto(ctx, r)));
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const insight = await ctx.db
      .query("insights")
      .withIndex("by_code", (q) => q.eq("insightCode", args.code))
      .unique();
    if (!insight || insight.companyId !== companyId) return null;

    const topic = await ctx.db.get(insight.topicId);
    if (topic && !canSeeTopic(user, topic)) return null;
    const creator = await ctx.db.get(insight.userId);

    const submitted = topic
      ? await ctx.db
          .query("feedback")
          .withIndex("by_topic_status", (q) =>
            q.eq("topicId", topic._id).eq("status", "SUBMITTED"),
          )
          .collect()
      : [];
    const respondentsCount = new Set(submitted.map((f) => f.userId)).size;

    return {
      id: insight._id,
      insightCode: insight.insightCode,
      topicId: insight.topicId,
      topicCode: topic?.topicCode ?? "",
      topicName: topic?.name ?? "",
      topicContent: topic?.content ?? topic?.description ?? "",
      topicChannels: topic?.channels ?? [],
      status: insight.status,
      label: insight.label ?? "",
      feedbackCount: insight.feedbackIds.length,
      feedbacksCount: submitted.length,
      respondentsCount,
      createdOn: new Date(insight._creationTime).toISOString(),
      createdBy: userDisplayName(creator),
      publishedDate: iso(insight.publishedDate),
      error: insight.error,
      summary: insight.summary ?? null,
      sentiment: insight.sentiment ?? null,
      contradiction: insight.contradiction ?? null,
      findings: insight.finding ?? null,
    };
  },
});

export const feedbacks = query({
  args: { insightId: v.id("insights") },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const insight = await ctx.db.get(args.insightId);
    if (!insight || insight.companyId !== companyId) return [];
    const insightTopic = await ctx.db.get(insight.topicId);
    if (insightTopic && !canSeeTopic(user, insightTopic)) return [];

    const disciplineNames = new Map<string, string | undefined>();
    const disciplineFor = async (id?: Id<"disciplines">) => {
      if (!id) return undefined;
      if (!disciplineNames.has(id)) {
        disciplineNames.set(id, (await ctx.db.get(id))?.name);
      }
      return disciplineNames.get(id);
    };

    const out = [];
    for (const fid of insight.feedbackIds) {
      const f = await ctx.db.get(fid);
      if (!f) continue;
      const u = await ctx.db.get(f.userId);
      const displayName = userDisplayName(u);
      const discipline = await disciplineFor(u?.disciplineId);

      let audioFile = undefined;
      if (f.audioFileId) {
        const file = await ctx.db.get(f.audioFileId);
        if (file) {
          audioFile = {
            id: file._id,
            url: (await ctx.storage.getUrl(file.storageId)) ?? "",
            fileName: file.fileName,
            fileExtension: file.fileExtension ?? "",
            fileSize: file.fileSize ?? 0,
            contentType: file.contentType ?? "",
            contentHash: "",
            createdAt: new Date(file._creationTime).toISOString(),
            createdBy: displayName,
          };
        }
      }

      const imageFiles = [];
      for (const imgId of f.imageFileIds ?? []) {
        const file = await ctx.db.get(imgId);
        if (!file) continue;
        imageFiles.push({
          id: file._id,
          url: (await ctx.storage.getUrl(file.storageId)) ?? "",
          fileName: file.fileName,
          fileExtension: file.fileExtension ?? "",
          fileSize: file.fileSize ?? 0,
          contentType: file.contentType ?? "",
          contentHash: "",
          createdAt: new Date(file._creationTime).toISOString(),
          createdBy: displayName,
        });
      }

      out.push({
        id: f._id,
        user: {
          id: f.userId,
          email: u?.email ?? "",
          displayName,
          initials: displayName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? "")
            .join(""),
          userImage: u?.userImage ?? u?.image ?? "",
          role: u?.role,
          discipline,
        },
        dateSubmitted: iso(f.dateSubmitted) ?? "",
        sentiment: f.sentiment,
        text: f.text,
        textLangCode: f.textLangCode,
        transcribedText: f.transcribeText,
        transcribedTextLangCode: f.transcribeTextLangCode,
        imageFiles: imageFiles.length ? imageFiles : undefined,
        audioFile,
      });
    }
    return out;
  },
});

export const generate = mutation({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    if (!isManager(user)) throw new Error("Not authorized");
    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.companyId !== companyId) {
      throw new Error("Topic not found");
    }

    const submitted = await ctx.db
      .query("feedback")
      .withIndex("by_topic_status", (q) =>
        q.eq("topicId", topic._id).eq("status", "SUBMITTED"),
      )
      .collect();
    if (submitted.length === 0) {
      throw new Error("This topic has no submitted feedback to analyze yet.");
    }

    const insightCode = await generateInsightCode(
      ctx,
      topic._id,
      topic.topicCode,
    );

    const insightId = await ctx.db.insert("insights", {
      insightCode,
      topicId: topic._id,
      companyId,
      userId: user._id,
      status: "GENERATING",
      calculatedAt: Date.now(),
      feedbackIds: submitted.map((f) => f._id),
    });

    await ctx.scheduler.runAfter(0, internal.ai.generateInsight, { insightId });

    return { insightId, insightCode };
  },
});

export const regenerate = mutation({
  args: { id: v.id("insights") },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    if (!isManager(user)) throw new Error("Not authorized");
    const insight = await ctx.db.get(args.id);
    if (!insight || insight.companyId !== companyId) {
      throw new Error("Insight not found");
    }
    if (insight.status !== "FAILED" && insight.status !== "GENERATING") {
      throw new Error("Only failed or stuck insights can be regenerated");
    }

    // Refresh the feedback set from the topic's current submitted feedback.
    const submitted = await ctx.db
      .query("feedback")
      .withIndex("by_topic_status", (q) =>
        q.eq("topicId", insight.topicId).eq("status", "SUBMITTED"),
      )
      .collect();
    if (submitted.length === 0) {
      throw new Error("This topic has no submitted feedback to analyze yet.");
    }

    await ctx.db.patch(args.id, {
      status: "GENERATING",
      error: undefined,
      calculatedAt: Date.now(),
      feedbackIds: submitted.map((f) => f._id),
    });

    await ctx.scheduler.runAfter(0, internal.ai.generateInsight, {
      insightId: args.id,
    });
    return { ok: true };
  },
});

export const publish = mutation({
  args: { id: v.id("insights"), label: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const insight = await ctx.db.get(args.id);
    if (!insight || insight.companyId !== companyId) {
      throw new Error("Insight not found");
    }
    if (insight.status !== "DRAFT") {
      throw new Error("Only draft insights can be published");
    }
    await ctx.db.patch(args.id, {
      status: "PUBLISHED",
      publishedDate: Date.now(),
      label: args.label?.trim() || undefined,
    });
    return { ok: true };
  },
});

// Adjust the free-text tag/note on an insight at any time.
export const updateLabel = mutation({
  args: { id: v.id("insights"), label: v.string() },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const insight = await ctx.db.get(args.id);
    if (!insight || insight.companyId !== companyId) {
      throw new Error("Insight not found");
    }
    await ctx.db.patch(args.id, { label: args.label.trim() || undefined });
    return { ok: true };
  },
});

export const remove = mutation({
  args: { id: v.id("insights") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const insight = await ctx.db.get(args.id);
    if (!insight || insight.companyId !== companyId) {
      throw new Error("Insight not found");
    }
    if (insight.status !== "DRAFT" && insight.status !== "FAILED") {
      throw new Error("Only draft or failed insights can be deleted");
    }
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

// ---- Chat (IDA) ----

export const getChat = query({
  args: { insightId: v.id("insights") },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const insight = await ctx.db.get(args.insightId);
    if (!insight || insight.companyId !== companyId) {
      return { prompt: "", messages: [] };
    }

    const topic = await ctx.db.get(insight.topicId);
    if (topic && !canSeeTopic(user, topic)) {
      return { prompt: "", messages: [] };
    }
    const lines: string[] = [
      "You are IDA, an expert analyst of employee feedback for this topic.",
      "",
      "**Topic Details:**",
      `Topic Name: ${topic?.name ?? ""}`,
      `Topic Description: ${topic?.description ?? ""}`,
      `Topic Code: ${topic?.topicCode ?? ""}`,
      "",
      "**Raw Feedback Data:**",
    ];
    for (const fid of insight.feedbackIds) {
      const f = await ctx.db.get(fid);
      if (!f) continue;
      lines.push("---");
      lines.push(`Feedback Code: ${f.feedbackCode}`);
      if (f.text) lines.push(`Text: "${f.text}"`);
      if (f.transcribeText) lines.push(`Transcribed: "${f.transcribeText}"`);
    }
    const prompt = lines.join("\n");

    const messages = await ctx.db
      .query("aiChatHistory")
      .withIndex("by_insight_user", (q) =>
        q.eq("insightId", args.insightId).eq("userId", user._id),
      )
      .collect();
    return {
      prompt,
      messages: messages.map((m) => ({
        id: m._id,
        role: m.role,
        parts: m.parts,
        metadata: m.metadata ?? null,
      })),
    };
  },
});

export const saveChatMessage = mutation({
  args: {
    insightId: v.id("insights"),
    role: v.string(),
    parts: v.any(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const insight = await ctx.db.get(args.insightId);
    if (!insight || insight.companyId !== companyId) {
      throw new Error("Insight not found");
    }
    const id = await ctx.db.insert("aiChatHistory", {
      insightId: args.insightId,
      userId: user._id,
      companyId,
      role: args.role,
      parts: args.parts,
      metadata: args.metadata,
    });
    return { id };
  },
});

// ---- Internal: generation context + result persistence (used by ai action) ----

export const getContext = internalQuery({
  args: { insightId: v.id("insights") },
  handler: async (ctx, args) => {
    const insight = await ctx.db.get(args.insightId);
    if (!insight) return null;
    const topic = await ctx.db.get(insight.topicId);

    const feedbacks = [];
    for (const fid of insight.feedbackIds) {
      const f = await ctx.db.get(fid);
      if (!f) continue;
      const u = await ctx.db.get(f.userId);
      feedbacks.push({
        feedbackId: f._id,
        feedbackCode: f.feedbackCode,
        displayName: userDisplayName(u),
        userId: f.userId as string,
        dateSubmitted: iso(f.dateSubmitted) ?? "",
        text: f.text ?? "",
        transcribedText: f.transcribeText ?? "",
        sentiment: f.sentiment ?? "",
      });
    }

    // Knowledge bucket: parsed contents of the topic's uploaded documents.
    const knowledgeParts: string[] = [];
    for (const fid of topic?.attachmentIds ?? []) {
      const file = await ctx.db.get(fid);
      if (file?.parseStatus === "PARSED" && file.parsedText) {
        knowledgeParts.push(`--- Document: ${file.fileName} ---\n${file.parsedText}\n--- end ${file.fileName} ---`);
      }
    }

    return {
      topic: {
        name: topic?.name ?? "",
        description: topic?.description ?? "",
        topicCode: topic?.topicCode ?? "",
        startDate: iso(topic?.startDate) ?? "",
        endDate: iso(topic?.endDate) ?? "",
      },
      knowledge: knowledgeParts.join("\n\n"),
      feedbacks,
    };
  },
});

export const saveResult = internalMutation({
  args: {
    insightId: v.id("insights"),
    summary: v.any(),
    sentiment: v.any(),
    contradiction: v.any(),
    finding: v.any(),
  },
  handler: async (ctx, args) => {
    const insight = await ctx.db.get(args.insightId);
    if (!insight) return;
    await ctx.db.patch(args.insightId, {
      summary: args.summary,
      sentiment: args.sentiment,
      contradiction: args.contradiction,
      finding: args.finding,
      status: "DRAFT",
      calculatedAt: Date.now(),
    });
    const topic = await ctx.db.get(insight.topicId);
    await ctx.db.insert("notifications", {
      companyId: insight.companyId,
      type: "insight-ready",
      title: "Insights Generation",
      body: `Insights for Topic #${topic?.topicCode ?? ""} - ${topic?.name ?? ""} is now ready.`,
      payload: { insightId: insight._id, insightCode: insight.insightCode },
      userIds: [insight.userId],
    });
  },
});

export const markFailed = internalMutation({
  args: { insightId: v.id("insights"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.insightId, {
      status: "FAILED",
      error: args.error,
    });
  },
});
