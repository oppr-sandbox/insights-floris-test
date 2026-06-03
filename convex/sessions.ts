import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { requireCompany, canSeeTopic, isManager } from "./lib/auth";

const iso = (ms?: number | null) =>
  ms != null ? new Date(ms).toISOString() : undefined;

// Aggregates topic + feedback + generated-insight content across every insight
// in a session into one text context. Shared by the chat route and the report
// generator so both reason over the same combined database.
export async function buildSessionContext(
  ctx: QueryCtx,
  session: Doc<"analysisSessions">,
): Promise<string> {
  const lines: string[] = [];
  const topicIds = session.topicIds ?? [];
  const reportIds = session.reportIds ?? [];
  const multi = session.insightIds.length + topicIds.length + reportIds.length > 1;
  let idx = 0;

  const renderFeedback = async (fid: Id<"feedback">) => {
    const f = await ctx.db.get(fid);
    if (!f) return;
    const parts: string[] = [];
    if (f.text) parts.push(f.text);
    if (f.transcribeText) parts.push(`(voice) "${f.transcribeText}"`);
    if (f.imageFileIds?.length) parts.push(`(${f.imageFileIds.length} image(s) attached)`);
    lines.push(`- [${f.feedbackCode}] ${parts.join(" ") || "(no text)"}`);
  };

  const renderDocs = async (label: string, ids: Id<"files">[] | undefined) => {
    for (const fileId of ids ?? []) {
      const file = await ctx.db.get(fileId);
      if (!file) continue;
      if (file.parseStatus === "PARSED" && file.parsedText) {
        lines.push(`--- ${label}: ${file.fileName} ---`);
        lines.push(file.parsedText);
        lines.push(`--- end ${file.fileName} ---`);
      } else {
        lines.push(`- ${label}: ${file.fileName} (${file.parseStatus === "UNSUPPORTED" ? "format not parsed" : "not yet parsed"})`);
      }
    }
  };

  for (const insId of session.insightIds) {
    idx++;
    const ins = await ctx.db.get(insId);
    if (!ins) continue;
    const topic = await ctx.db.get(ins.topicId);
    lines.push(multi ? `### SOURCE ${idx} — Insight ${ins.insightCode}` : `### Insight ${ins.insightCode}`);
    lines.push(`Topic: ${topic?.name ?? ""} (${topic?.topicCode ?? ""})`);
    if (topic?.description) lines.push(`Topic description: ${topic.description}`);

    // Generated insight content (if present), to give the bot prior analysis.
    // These fields are flexible JSON, so guard everything.
    const summary = ins.summary as { overview?: string[] } | null | undefined;
    if (summary?.overview?.length) {
      lines.push(`Insight summary: ${summary.overview.join(" ")}`);
    }
    const finding = ins.finding as { findings_summary?: string } | null | undefined;
    if (finding?.findings_summary) {
      lines.push(`Findings summary: ${finding.findings_summary}`);
    }

    lines.push("Feedback:");
    for (const fid of ins.feedbackIds) await renderFeedback(fid);
    if (topic) await renderDocs("Topic document", topic.attachmentIds);
    lines.push("");
  }

  // Raw topic sources: the guided flow reasons over the topic and all its
  // submitted feedback directly, not a prior insight.
  for (const topicId of topicIds) {
    idx++;
    const topic = await ctx.db.get(topicId);
    if (!topic) continue;
    lines.push(multi ? `### SOURCE ${idx} — Topic ${topic.topicCode}` : `### Topic ${topic.topicCode}`);
    lines.push(`Topic: ${topic.name}`);
    if (topic.description) lines.push(`Topic description: ${topic.description}`);
    const submitted = await ctx.db
      .query("feedback")
      .withIndex("by_topic_status", (q) =>
        q.eq("topicId", topic._id).eq("status", "SUBMITTED"),
      )
      .collect();
    lines.push(`Feedback (${submitted.length}):`);
    for (const f of submitted) await renderFeedback(f._id);
    await renderDocs("Topic document", topic.attachmentIds);
    lines.push("");
  }

  // Generated deep-dive reports folded in as sources.
  for (const reportId of session.reportIds ?? []) {
    idx++;
    const report = await ctx.db.get(reportId);
    if (!report) continue;
    lines.push(multi ? `### SOURCE ${idx} — Report: ${report.title}` : `### Report: ${report.title}`);
    const sections = (report.sections ?? []) as { title?: string; content?: string }[];
    for (const sec of sections) {
      if (sec.title) lines.push(`**${sec.title}**`);
      if (sec.content) lines.push(sec.content);
    }
    lines.push("");
  }

  // Documents the user uploaded during a guided interview.
  if ((session.attachmentIds ?? []).length) {
    lines.push("### USER-PROVIDED DOCUMENTS");
    await renderDocs("Document", session.attachmentIds);
    lines.push("");
  }

  return lines.join("\n");
}

async function lensByKey(ctx: QueryCtx, companyId: Id<"companies">, key: string) {
  return ctx.db
    .query("lenses")
    .withIndex("by_company_key", (q) => q.eq("companyId", companyId).eq("key", key))
    .unique();
}

async function sessionDto(ctx: QueryCtx, s: Doc<"analysisSessions">) {
  const insights = [];
  for (const id of s.insightIds) {
    const ins = await ctx.db.get(id);
    if (!ins) continue;
    const topic = await ctx.db.get(ins.topicId);
    insights.push({
      id: ins._id,
      insightCode: ins.insightCode,
      topicName: topic?.name ?? "",
      topicCode: topic?.topicCode ?? "",
    });
  }
  const topics = [];
  for (const id of s.topicIds ?? []) {
    const topic = await ctx.db.get(id);
    if (!topic) continue;
    topics.push({
      id: topic._id,
      topicCode: topic.topicCode,
      topicName: topic.name,
    });
  }
  const reports = [];
  for (const id of s.reportIds ?? []) {
    const r = await ctx.db.get(id);
    if (!r) continue;
    reports.push({ id: r._id, title: r.title });
  }
  const lens = await lensByKey(ctx, s.companyId, s.lensKey);
  const sourceCount =
    s.insightIds.length + (s.topicIds?.length ?? 0) + (s.reportIds?.length ?? 0);
  return {
    id: s._id,
    title: s.title ?? "",
    mode: s.mode ?? (lens?.generatesReport ? "guided" : "ask"),
    lensKey: s.lensKey,
    lensName: lens?.name ?? s.lensKey,
    lensIcon: lens?.icon ?? "Sparkles",
    sections: (lens?.sections ?? []) as { key: string; title: string; guidance?: string }[],
    generatesReport: lens?.generatesReport ?? false,
    isMulti: sourceCount > 1,
    insights,
    topics,
    reports,
    attachmentCount: s.attachmentIds?.length ?? 0,
    createdAt: iso(s.createdAt) ?? "",
    updatedAt: iso(s.updatedAt),
  };
}

// All "ask" conversations for the current user across every topic — the
// Conversations tab in the Insights hub. Newest activity first.
export const conversations = query({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("analysisSessions")
      .withIndex("by_company_user", (q) =>
        q.eq("companyId", companyId).eq("userId", user._id),
      )
      .order("desc")
      .collect();
    const ask = rows.filter((s) => (s.mode ?? "ask") === "ask");
    const startedBy =
      user.displayName ??
      ([user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        user.email ||
        "You");
    return Promise.all(
      ask.map(async (s) => {
        const sources: string[] = [];
        const topicSet = new Set<string>();
        if (s.primaryTopicId) topicSet.add(s.primaryTopicId);
        for (const id of s.topicIds ?? []) {
          const t = await ctx.db.get(id);
          if (t) {
            sources.push(t.topicCode);
            topicSet.add(t._id);
          }
        }
        for (const id of s.insightIds) {
          const ins = await ctx.db.get(id);
          if (ins) {
            sources.push(ins.insightCode);
            topicSet.add(ins.topicId);
          }
        }
        for (const id of s.reportIds ?? []) {
          const r = await ctx.db.get(id);
          if (r) {
            sources.push(r.title);
            const rs = await ctx.db.get(r.sessionId);
            if (rs?.primaryTopicId) topicSet.add(rs.primaryTopicId);
          }
        }
        const messageCount = (
          await ctx.db
            .query("aiChatHistory")
            .withIndex("by_session_user", (q) =>
              q.eq("sessionId", s._id).eq("userId", user._id),
            )
            .collect()
        ).length;
        return {
          id: s._id,
          title: s.title ?? "Conversation",
          startedBy,
          sources,
          topicCount: topicSet.size,
          multiTopic: topicSet.size > 1,
          messageCount,
          createdAt: iso(s.createdAt) ?? "",
          updatedAt: iso(s.updatedAt),
        };
      }),
    );
  },
});

// Single-insight chat: find or create the user's session for (insight, lens).
export const getOrCreateForInsight = mutation({
  args: { insightId: v.id("insights"), lensKey: v.string() },
  handler: async (ctx, { insightId, lensKey }) => {
    const { user, companyId } = await requireCompany(ctx);
    const insight = await ctx.db.get(insightId);
    if (!insight || insight.companyId !== companyId) throw new Error("Insight not found");

    const existing = await ctx.db
      .query("analysisSessions")
      .withIndex("by_owner_lens_primary", (q) =>
        q.eq("userId", user._id).eq("lensKey", lensKey).eq("primaryInsightId", insightId),
      )
      .unique();
    if (existing) return { id: existing._id };

    const id = await ctx.db.insert("analysisSessions", {
      companyId,
      userId: user._id,
      insightIds: [insightId],
      lensKey,
      primaryInsightId: insightId,
      createdAt: Date.now(),
    });
    return { id };
  },
});

// Multi-insight workspace session.
export const create = mutation({
  args: {
    insightIds: v.array(v.id("insights")),
    lensKey: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { insightIds, lensKey, title }) => {
    const { user, companyId } = await requireCompany(ctx);
    if (insightIds.length === 0) throw new Error("Pick at least one insight");
    for (const id of insightIds) {
      const ins = await ctx.db.get(id);
      if (!ins || ins.companyId !== companyId) throw new Error("Insight not found");
    }
    const id = await ctx.db.insert("analysisSessions", {
      companyId,
      userId: user._id,
      insightIds,
      lensKey,
      title,
      createdAt: Date.now(),
    });
    return { id };
  },
});

// Guided analysis (RCA / Fishbone / custom): a lens-driven interview anchored
// to one or more raw topics (and optionally existing insights) that builds
// toward a structured report.
export const createGuided = mutation({
  args: {
    lensKey: v.string(),
    topicIds: v.optional(v.array(v.id("topics"))),
    insightIds: v.optional(v.array(v.id("insights"))),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { lensKey, topicIds, insightIds, title }) => {
    const { user, companyId } = await requireCompany(ctx);
    if (!isManager(user)) throw new Error("Not authorized");
    const topics = topicIds ?? [];
    const insights = insightIds ?? [];
    if (topics.length === 0 && insights.length === 0) {
      throw new Error("Pick at least one topic or insight");
    }
    for (const id of topics) {
      const t = await ctx.db.get(id);
      if (!t || t.companyId !== companyId) throw new Error("Topic not found");
    }
    for (const id of insights) {
      const ins = await ctx.db.get(id);
      if (!ins || ins.companyId !== companyId) throw new Error("Insight not found");
    }
    const lens = await lensByKey(ctx, companyId, lensKey);
    if (!lens || !lens.generatesReport) {
      throw new Error("This method does not produce a report");
    }
    const id = await ctx.db.insert("analysisSessions", {
      companyId,
      userId: user._id,
      mode: "guided",
      insightIds: insights,
      topicIds: topics,
      lensKey,
      primaryTopicId: topics[0],
      title,
      createdAt: Date.now(),
    });
    return { id };
  },
});

// General "Ask" conversation over a slice. Must be anchored to at least one
// generated artifact (an insight); raw topics may be added as extra context.
export const createAsk = mutation({
  args: {
    insightIds: v.optional(v.array(v.id("insights"))),
    topicIds: v.optional(v.array(v.id("topics"))),
    reportIds: v.optional(v.array(v.id("analysisReports"))),
    // When a conversation is started from inside a single topic (or one of its
    // insights), anchor it to that topic so it lists under the topic too.
    scopeTopicId: v.optional(v.id("topics")),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { insightIds, topicIds, reportIds, scopeTopicId, title }) => {
    const { user, companyId } = await requireCompany(ctx);
    const insights = insightIds ?? [];
    const topics = topicIds ?? [];
    const reports = reportIds ?? [];
    if (insights.length + topics.length + reports.length === 0) {
      throw new Error("Pick at least one topic, insight or report to talk to");
    }
    for (const id of insights) {
      const ins = await ctx.db.get(id);
      if (!ins || ins.companyId !== companyId) throw new Error("Insight not found");
      const t = await ctx.db.get(ins.topicId);
      if (t && !canSeeTopic(user, t)) throw new Error("Insight not found");
    }
    for (const id of topics) {
      const t = await ctx.db.get(id);
      if (!t || t.companyId !== companyId) throw new Error("Topic not found");
      if (!canSeeTopic(user, t)) throw new Error("Topic not found");
    }
    for (const id of reports) {
      const r = await ctx.db.get(id);
      if (!r || r.companyId !== companyId) throw new Error("Report not found");
    }
    if (scopeTopicId) {
      const t = await ctx.db.get(scopeTopicId);
      if (!t || t.companyId !== companyId || !canSeeTopic(user, t)) {
        throw new Error("Topic not found");
      }
    }
    const single = insights.length === 1 && topics.length === 0 && reports.length === 0;
    const id = await ctx.db.insert("analysisSessions", {
      companyId,
      userId: user._id,
      mode: "ask",
      insightIds: insights,
      topicIds: topics,
      reportIds: reports,
      lensKey: "general",
      primaryInsightId: single ? insights[0] : undefined,
      primaryTopicId: scopeTopicId,
      title,
      createdAt: Date.now(),
    });
    return { id };
  },
});

// Saved Ask threads for a single insight, newest first. Talking is gated on a
// generated artifact, so this only ever lists conversations for an insight
// that already exists.
export const askThreadsForInsight = query({
  args: { insightId: v.id("insights") },
  handler: async (ctx, { insightId }) => {
    const { user, companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("analysisSessions")
      .withIndex("by_owner_lens_primary", (q) =>
        q.eq("userId", user._id).eq("lensKey", "general").eq("primaryInsightId", insightId),
      )
      .order("desc")
      .collect();
    return rows
      .filter((s) => s.companyId === companyId)
      .map((s) => ({
        id: s._id,
        title: s.title ?? "Conversation",
        createdAt: iso(s.createdAt) ?? "",
        updatedAt: iso(s.updatedAt),
      }));
  },
});

// Register an uploaded file and attach it to a guided session as mid-interview
// evidence. The client POSTs the file to a generated upload URL, then calls
// this with the resulting storageId.
export const addDocument = mutation({
  args: {
    sessionId: v.id("analysisSessions"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileExtension: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const s = await ctx.db.get(args.sessionId);
    if (!s || s.companyId !== companyId) throw new Error("Session not found");
    const fileId = await ctx.db.insert("files", {
      storageId: args.storageId,
      fileName: args.fileName,
      fileExtension: args.fileExtension,
      fileSize: args.fileSize,
      contentType: args.contentType,
      userId: user._id,
      companyId,
      parseStatus: "PENDING",
    });
    await ctx.scheduler.runAfter(0, internal.ingestion.parseFile, { fileId });
    await ctx.db.patch(args.sessionId, {
      attachmentIds: [...(s.attachmentIds ?? []), fileId],
      updatedAt: Date.now(),
    });
    return { fileId };
  },
});

export const documents = query({
  args: { sessionId: v.id("analysisSessions") },
  handler: async (ctx, { sessionId }) => {
    const { companyId } = await requireCompany(ctx);
    const s = await ctx.db.get(sessionId);
    if (!s || s.companyId !== companyId) return [];
    const out = [];
    for (const fileId of s.attachmentIds ?? []) {
      const file = await ctx.db.get(fileId);
      if (!file) continue;
      out.push({
        id: file._id,
        fileName: file.fileName,
        fileExtension: file.fileExtension ?? "",
        fileSize: file.fileSize ?? 0,
        parseStatus: file.parseStatus ?? "",
      });
    }
    return out;
  },
});

// The unified per-topic Analysis list: guided analyses anchored to this topic,
// each with its latest report status. (Quick insights are listed separately
// from `insights.byTopic`.)
export const guidedByTopic = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, { topicId }) => {
    const { user, companyId } = await requireCompany(ctx);
    const topic = await ctx.db.get(topicId);
    if (!topic || topic.companyId !== companyId || !canSeeTopic(user, topic)) {
      return [];
    }
    const rows = (await ctx.db
      .query("analysisSessions")
      .withIndex("by_company_topic", (q) =>
        q.eq("companyId", companyId).eq("primaryTopicId", topicId),
      )
      .order("desc")
      .collect()).filter((s) => s.mode !== "ask");
    return Promise.all(
      rows.map(async (s) => {
        const lens = await lensByKey(ctx, companyId, s.lensKey);
        const reports = await ctx.db
          .query("analysisReports")
          .withIndex("by_session", (q) => q.eq("sessionId", s._id))
          .order("desc")
          .collect();
        const latest = reports[0];
        return {
          id: s._id,
          title: s.title ?? lens?.name ?? s.lensKey,
          lensKey: s.lensKey,
          lensName: lens?.name ?? s.lensKey,
          lensIcon: lens?.icon ?? "Sparkles",
          reportStatus: latest?.status ?? "DRAFT",
          reportId: latest?._id,
          createdAt: iso(s.createdAt) ?? "",
          updatedAt: iso(s.updatedAt),
        };
      }),
    );
  },
});

// Topics with their generated insights, for the hub's slice picker. Only
// topics that have at least one insight you can talk to are returned.
export const sliceSources = query({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const insights = await ctx.db
      .query("insights")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .order("desc")
      .collect();

    const byTopic = new Map<
      string,
      { id: Id<"insights">; insightCode: string; status: string; label: string }[]
    >();
    for (const ins of insights) {
      const list = byTopic.get(ins.topicId) ?? [];
      list.push({
        id: ins._id,
        insightCode: ins.insightCode,
        status: ins.status,
        label: ins.label ?? "",
      });
      byTopic.set(ins.topicId, list);
    }

    const out = [];
    for (const [topicId, topicInsights] of byTopic) {
      const topic = await ctx.db.get(topicId as Id<"topics">);
      if (!topic || !canSeeTopic(user, topic)) continue;
      out.push({
        topicId: topic._id,
        topicCode: topic.topicCode,
        topicName: topic.name,
        insights: topicInsights,
      });
    }
    out.sort((a, b) => a.topicCode.localeCompare(b.topicCode));
    return out;
  },
});

export const list = query({
  args: { multiOnly: v.optional(v.boolean()) },
  handler: async (ctx, { multiOnly }) => {
    const { user, companyId } = await requireCompany(ctx);
    let rows = await ctx.db
      .query("analysisSessions")
      .withIndex("by_company_user", (q) => q.eq("companyId", companyId).eq("userId", user._id))
      .order("desc")
      .collect();
    if (multiOnly) rows = rows.filter((r) => r.insightIds.length > 1);
    return Promise.all(rows.map((r) => sessionDto(ctx, r)));
  },
});

export const get = query({
  args: { sessionId: v.id("analysisSessions") },
  handler: async (ctx, { sessionId }) => {
    const { companyId } = await requireCompany(ctx);
    const s = await ctx.db.get(sessionId);
    if (!s || s.companyId !== companyId) return null;
    return sessionDto(ctx, s);
  },
});

export const remove = mutation({
  args: { sessionId: v.id("analysisSessions") },
  handler: async (ctx, { sessionId }) => {
    const { companyId } = await requireCompany(ctx);
    const s = await ctx.db.get(sessionId);
    if (!s || s.companyId !== companyId) throw new Error("Session not found");
    for (const m of await ctx.db
      .query("aiChatHistory")
      .withIndex("by_session_user", (q) => q.eq("sessionId", sessionId))
      .collect()) {
      await ctx.db.delete(m._id);
    }
    for (const r of await ctx.db
      .query("analysisReports")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect()) {
      await ctx.db.delete(r._id);
    }
    await ctx.db.delete(sessionId);
    return { ok: true };
  },
});

// Everything the chat route needs to run a lens conversation for a session.
export const chatPayload = query({
  args: { sessionId: v.id("analysisSessions") },
  handler: async (ctx, { sessionId }) => {
    const { companyId } = await requireCompany(ctx);
    const s = await ctx.db.get(sessionId);
    if (!s || s.companyId !== companyId) return null;
    const lens = await lensByKey(ctx, companyId, s.lensKey);
    const context = await buildSessionContext(ctx, s);
    return {
      lensName: lens?.name ?? s.lensKey,
      systemPrompt: lens?.systemPrompt ?? "",
      sections: lens?.sections ?? [],
      generatesReport: lens?.generatesReport ?? false,
      context,
    };
  },
});

export const getChat = query({
  args: { sessionId: v.id("analysisSessions") },
  handler: async (ctx, { sessionId }) => {
    const { user, companyId } = await requireCompany(ctx);
    const s = await ctx.db.get(sessionId);
    if (!s || s.companyId !== companyId) return [];
    const rows = await ctx.db
      .query("aiChatHistory")
      .withIndex("by_session_user", (q) =>
        q.eq("sessionId", sessionId).eq("userId", user._id),
      )
      .collect();
    return rows.map((m) => ({
      id: m._id,
      role: m.role,
      parts: m.parts,
      metadata: m.metadata ?? null,
    }));
  },
});

export const saveChatMessage = mutation({
  args: {
    sessionId: v.id("analysisSessions"),
    role: v.string(),
    parts: v.any(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const s = await ctx.db.get(args.sessionId);
    if (!s || s.companyId !== companyId) throw new Error("Session not found");
    const id = await ctx.db.insert("aiChatHistory", {
      sessionId: args.sessionId,
      lensKey: s.lensKey,
      userId: user._id,
      companyId,
      role: args.role,
      parts: args.parts,
      metadata: args.metadata,
    });
    await ctx.db.patch(args.sessionId, { updatedAt: Date.now() });
    return { id };
  },
});
