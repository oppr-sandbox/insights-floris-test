import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
  QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireCompany } from "./lib/auth";
import {
  runInsightPipeline,
  buildPrompt,
  buildSectionPrompt,
  SECTION_KEYS,
  fallbackModel,
  primaryModel,
  type Ctx,
  type LogLevel,
} from "./ai";

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

async function loadContext(
  ctx: QueryCtx,
  topicId: Id<"topics">,
): Promise<Ctx | null> {
  const topic = await ctx.db.get(topicId);
  if (!topic) return null;

  const submitted = await ctx.db
    .query("feedback")
    .withIndex("by_topic_status", (q) =>
      q.eq("topicId", topicId).eq("status", "SUBMITTED"),
    )
    .collect();

  const feedbacks = [];
  for (const f of submitted) {
    const u = await ctx.db.get(f.userId);
    feedbacks.push({
      feedbackId: f._id as string,
      feedbackCode: f.feedbackCode,
      displayName: userDisplayName(u),
      userId: f.userId as string,
      dateSubmitted: iso(f.dateSubmitted) ?? "",
      text: f.text ?? "",
      transcribedText: f.transcribeText ?? "",
      sentiment: f.sentiment ?? "",
    });
  }

  return {
    topic: {
      name: topic.name,
      description: topic.description ?? "",
      topicCode: topic.topicCode,
      startDate: iso(topic.startDate) ?? "",
      endDate: iso(topic.endDate) ?? "",
    },
    feedbacks,
  };
}

// ---- Public queries ----

export const topicsWithFeedback = query({
  args: {},
  handler: async (ctx) => {
    const { companyId } = await requireCompany(ctx);
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    const out = [];
    for (const t of topics) {
      const fb = await ctx.db
        .query("feedback")
        .withIndex("by_topic_status", (q) =>
          q.eq("topicId", t._id).eq("status", "SUBMITTED"),
        )
        .collect();
      if (fb.length > 0) {
        out.push({
          id: t._id,
          topicCode: t.topicCode,
          name: t.name,
          status: t.status,
          feedbackCount: fb.length,
        });
      }
    }
    out.sort((a, b) => b.feedbackCount - a.feedbackCount);
    return out;
  },
});

export const promptPreview = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, { topicId }) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await ctx.db.get(topicId);
    if (!topic || topic.companyId !== companyId) return null;

    const input = await loadContext(ctx, topicId);
    if (!input) return null;

    return {
      input,
      singlePrompt: buildPrompt(input),
      steps: SECTION_KEYS.map((section) => ({
        section,
        prompt: buildSectionPrompt(input, section),
      })),
    };
  },
});

export const listRuns = query({
  args: {},
  handler: async (ctx) => {
    const { companyId } = await requireCompany(ctx);
    const runs = await ctx.db
      .query("aiRuns")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .order("desc")
      .take(25);

    const out = [];
    for (const r of runs) {
      const topic = await ctx.db.get(r.topicId);
      out.push({
        id: r._id,
        topicCode: topic?.topicCode ?? "",
        topicName: topic?.name ?? "",
        mode: r.mode,
        model: r.model,
        modelUsed: r.modelUsed,
        status: r.status,
        durationMs: r.durationMs,
        createdOn: new Date(r._creationTime).toISOString(),
      });
    }
    return out;
  },
});

export const getRun = query({
  args: { runId: v.id("aiRuns") },
  handler: async (ctx, { runId }) => {
    const { companyId } = await requireCompany(ctx);
    const run = await ctx.db.get(runId);
    if (!run || run.companyId !== companyId) return null;
    const topic = await ctx.db.get(run.topicId);
    return {
      id: run._id,
      topicCode: topic?.topicCode ?? "",
      topicName: topic?.name ?? "",
      mode: run.mode,
      model: run.model,
      modelUsed: run.modelUsed,
      temperature: run.temperature,
      status: run.status,
      error: run.error,
      rawOutput: run.rawOutput,
      result: run.result,
      durationMs: run.durationMs,
      startedAt: iso(run.startedAt),
      finishedAt: iso(run.finishedAt),
    };
  },
});

export const runLogs = query({
  args: { runId: v.id("aiRuns") },
  handler: async (ctx, { runId }) => {
    const { companyId } = await requireCompany(ctx);
    const run = await ctx.db.get(runId);
    if (!run || run.companyId !== companyId) return [];
    const logs = await ctx.db
      .query("aiRunLogs")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    return logs.map((l) => ({
      id: l._id,
      ts: l._creationTime,
      level: l.level,
      message: l.message,
      data: l.data ?? null,
    }));
  },
});

// ---- Start a run ----

export const startRun = mutation({
  args: {
    topicId: v.id("topics"),
    mode: v.union(v.literal("single"), v.literal("stepwise")),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    promptOverride: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.companyId !== companyId) {
      throw new Error("Topic not found");
    }
    const submitted = await ctx.db
      .query("feedback")
      .withIndex("by_topic_status", (q) =>
        q.eq("topicId", topic._id).eq("status", "SUBMITTED"),
      )
      .take(1);
    if (submitted.length === 0) {
      throw new Error("This topic has no submitted feedback to analyze.");
    }

    const runId = await ctx.db.insert("aiRuns", {
      companyId,
      userId: user._id,
      topicId: topic._id,
      source: "lab",
      mode: args.mode,
      model: (args.model && args.model.trim()) || primaryModel(),
      temperature: args.temperature ?? 0,
      promptOverride: args.promptOverride,
      status: "running",
      startedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.insightLab.executeRun, { runId });
    return { runId };
  },
});

// ---- Internal: logging + execution ----

export const appendLog = internalMutation({
  args: {
    runId: v.id("aiRuns"),
    level: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiRunLogs", {
      runId: args.runId,
      level: args.level,
      message: args.message,
      data: args.data,
    });
  },
});

export const patchRun = internalMutation({
  args: {
    runId: v.id("aiRuns"),
    status: v.optional(v.string()),
    modelUsed: v.optional(v.string()),
    rawOutput: v.optional(v.string()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    finishedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, { runId, ...patch }) => {
    await ctx.db.patch(runId, patch);
  },
});

export const getRunInternal = internalQuery({
  args: { runId: v.id("aiRuns") },
  handler: async (ctx, { runId }) => ctx.db.get(runId),
});

export const contextForTopic = internalQuery({
  args: { topicId: v.id("topics") },
  handler: async (ctx, { topicId }) => loadContext(ctx, topicId),
});

export const executeRun = internalAction({
  args: { runId: v.id("aiRuns") },
  handler: async (ctx, { runId }) => {
    const log = async (level: LogLevel, message: string, data?: unknown) => {
      const safe =
        data === undefined ? undefined : JSON.parse(JSON.stringify(data));
      await ctx.runMutation(
        internal.insightLab.appendLog,
        safe === undefined
          ? { runId, level, message }
          : { runId, level, message, data: safe },
      );
    };

    const startedAt = Date.now();
    try {
      const run = await ctx.runQuery(internal.insightLab.getRunInternal, {
        runId,
      });
      if (!run) throw new Error("Run not found");

      await log("info", `Run started — mode: ${run.mode}, model: ${run.model}`);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

      await log("step", "Loading topic context + feedback");
      const input = await ctx.runQuery(internal.insightLab.contextForTopic, {
        topicId: run.topicId,
      });
      if (!input) throw new Error("Topic context not found");

      const models = [run.model, fallbackModel()].filter(
        (m, i, a) => a.indexOf(m) === i,
      );

      const { result, rawOutput, modelUsed } = await runInsightPipeline({
        apiKey,
        input,
        models,
        temperature: run.temperature,
        mode: run.mode === "stepwise" ? "stepwise" : "single",
        promptOverride: run.promptOverride,
        log,
        deadlineMs: Date.now() + 240_000,
      });

      const durationMs = Date.now() - startedAt;
      await ctx.runMutation(internal.insightLab.patchRun, {
        runId,
        status: "done",
        modelUsed,
        rawOutput,
        result,
        finishedAt: Date.now(),
        durationMs,
      });
      await log("success", `Run finished in ${durationMs} ms (model ${modelUsed})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await log("error", `Run failed: ${msg}`);
      await ctx.runMutation(internal.insightLab.patchRun, {
        runId,
        status: "failed",
        error: msg,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      });
    }
  },
});
