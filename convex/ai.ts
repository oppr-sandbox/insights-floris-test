import {
  internalAction,
  action,
  query,
  mutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const MODEL_SETTING_KEY = "insightModel";

export type Ctx = {
  topic: {
    name: string;
    description: string;
    topicCode: string;
    startDate: string;
    endDate: string;
  };
  // Parsed contents of the topic's uploaded documents (Markdown), if any.
  knowledge?: string;
  feedbacks: Array<{
    feedbackId: string;
    feedbackCode: string;
    displayName: string;
    userId: string;
    dateSubmitted: string;
    text: string;
    transcribedText: string;
    sentiment: string;
  }>;
};

export type LogLevel = "info" | "step" | "success" | "warn" | "error";
export type Logger = (
  level: LogLevel,
  message: string,
  data?: unknown,
) => Promise<void> | void;

type GeminiJson = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export const primaryModel = () => process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export const fallbackModel = () =>
  process.env.GEMINI_MODEL_FALLBACK ?? "gemini-3.1-flash-lite";
export const modelList = () =>
  [primaryModel(), fallbackModel()].filter((m, i, a) => a.indexOf(m) === i);

const geminiUrl = (model: string, apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// fetch with a hard timeout — without this a slow/hung model call keeps the
// action running until the platform kills it, leaving insights stuck forever.
async function fetchWithTimeout(
  url: string,
  body: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// Calls Gemini across the candidate models (primary then fallback), retrying
// transient errors with backoff, bounded by a per-call timeout AND an absolute
// wall-clock deadline so total time can never exceed the platform limit.
export async function callGemini(opts: {
  apiKey: string;
  models: string[];
  body: string;
  log?: Logger;
  perCallTimeoutMs?: number;
  maxAttemptsPerModel?: number;
  deadlineMs?: number;
}): Promise<{ json: GeminiJson; modelUsed: string }> {
  const log: Logger = opts.log ?? (() => undefined);
  const perCall = opts.perCallTimeoutMs ?? 110_000;
  const maxAttempts = opts.maxAttemptsPerModel ?? 2;
  const deadline = opts.deadlineMs ?? Date.now() + 240_000;
  const errors: string[] = [];

  for (const model of opts.models) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (Date.now() >= deadline) {
        await log("warn", "Wall-clock deadline reached — stopping retries");
        throw new Error(`Deadline exceeded. ${errors.join("  |  ")}`);
      }
      const started = Date.now();
      await log("step", `Calling ${model} (attempt ${attempt}/${maxAttempts})`);
      try {
        const res = await fetchWithTimeout(
          geminiUrl(model, opts.apiKey),
          opts.body,
          perCall,
        );
        const ms = Date.now() - started;
        if (res.ok) {
          const json = (await res.json()) as GeminiJson;
          await log("success", `${model} → 200 in ${ms} ms`, {
            usage: json.usageMetadata,
          });
          return { json, modelUsed: model };
        }
        const detail = `${res.status}: ${(await res.text()).slice(0, 300)}`;
        await log("warn", `${model} → HTTP ${detail} (${ms} ms)`);
        errors.push(`[${model} #${attempt}] ${detail}`);
        if (!RETRYABLE.has(res.status)) break; // non-transient → next model
      } catch (e) {
        const ms = Date.now() - started;
        const msg = e instanceof Error ? e.message : String(e);
        const timedOut = msg.toLowerCase().includes("abort");
        await log(
          "warn",
          `${model} ${timedOut ? `timed out after ${perCall} ms` : `errored: ${msg}`} (${ms} ms)`,
        );
        errors.push(`[${model} #${attempt}] ${timedOut ? "timeout" : msg}`);
      }
      if (attempt < maxAttempts && Date.now() < deadline) {
        const backoff = Math.min(1000 * 2 ** (attempt - 1), 8000);
        await log("info", `Backing off ${backoff} ms before retry`);
        await sleep(backoff);
      }
    }
  }
  throw new Error(errors.join("  |  ") || "All model attempts failed");
}

// JSON shape the model must return; mirrors the original .NET InsightResponse.
const OUTPUT_SCHEMA = `{
  "summary": {
    "overview": ["string"],
    "key_points": ["string"],
    "next_steps": ["string"],
    "key_themes": [{ "theme": "string", "mentions": 0, "business_impact": "Low|Medium|High", "sentiment": "Positive|Neutral|Negative", "examples": [{ "feedback_id": "string", "user_id": "string", "text": "string", "sentiment": "string" }], "recommendations": ["string"] }],
    "implementation_strategy": { "short_term": ["string"], "medium_term": ["string"], "long_term": ["string"] }
  },
  "sentiment": {
    "sentiment_executive_summary": "string",
    "sentiment_analysis": { "distribution": { "positive": 0, "neutral": 0, "negative": 0 }, "overall_sentiment_score": 0.0, "sentiment_matrix": { "low": { "positive": 0, "neutral": 0, "negative": 0 }, "medium": { "positive": 0, "neutral": 0, "negative": 0 }, "high": { "positive": 0, "neutral": 0, "negative": 0 }, "explanation": "string" } },
    "feedback_highlights": [{ "highlight_id": "string", "text": "string", "sentiment": "string", "theme": "string", "user_id": "string", "display_name": "string", "feedback_id": "string", "feedback_code": "string" }]
  },
  "contradiction": {
    "contradiction_summary": "string",
    "contradictions": [{ "feedback_id_a": "string", "feedback_code_a": "string", "feedback_id_b": "string", "feedback_code_b": "string", "excerpt_a": "string", "excerpt_b": "string", "title": "string", "description": "string", "resolution": "string", "participants": ["string"], "impact": "Low|Medium|High", "severity": "string" }]
  },
  "finding": {
    "findings_summary": "string",
    "findings": [{ "lesson_title": "string", "key_learning": "string", "supporting_evidences": [{ "feedback_id": "string", "summarized_message": "string" }], "impact": "Low|Medium|High", "applicability": "string", "implementation_cost": "Low|Medium|High", "priority": "Low|Medium|High", "recommendations": ["string"], "potential_questions": [{ "question": "string", "context_of_question": "string" }] }]
  }
}`;

// Per-section schemas for stepwise generation (each requested in its own call).
export const SECTION_KEYS = [
  "summary",
  "sentiment",
  "contradiction",
  "finding",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

const SECTION_SCHEMAS: Record<SectionKey, string> = {
  summary: `{
  "summary": {
    "overview": ["string"],
    "key_points": ["string"],
    "next_steps": ["string"],
    "key_themes": [{ "theme": "string", "mentions": 0, "business_impact": "Low|Medium|High", "sentiment": "Positive|Neutral|Negative", "examples": [{ "feedback_id": "string", "user_id": "string", "text": "string", "sentiment": "string" }], "recommendations": ["string"] }],
    "implementation_strategy": { "short_term": ["string"], "medium_term": ["string"], "long_term": ["string"] }
  }
}`,
  sentiment: `{
  "sentiment": {
    "sentiment_executive_summary": "string",
    "sentiment_analysis": { "distribution": { "positive": 0, "neutral": 0, "negative": 0 }, "overall_sentiment_score": 0.0, "sentiment_matrix": { "low": { "positive": 0, "neutral": 0, "negative": 0 }, "medium": { "positive": 0, "neutral": 0, "negative": 0 }, "high": { "positive": 0, "neutral": 0, "negative": 0 }, "explanation": "string" } },
    "feedback_highlights": [{ "highlight_id": "string", "text": "string", "sentiment": "string", "theme": "string", "user_id": "string", "display_name": "string", "feedback_id": "string", "feedback_code": "string" }]
  }
}`,
  contradiction: `{
  "contradiction": {
    "contradiction_summary": "string",
    "contradictions": [{ "feedback_id_a": "string", "feedback_code_a": "string", "feedback_id_b": "string", "feedback_code_b": "string", "excerpt_a": "string", "excerpt_b": "string", "title": "string", "description": "string", "resolution": "string", "participants": ["string"], "impact": "Low|Medium|High", "severity": "string" }]
  }
}`,
  finding: `{
  "finding": {
    "findings_summary": "string",
    "findings": [{ "lesson_title": "string", "key_learning": "string", "supporting_evidences": [{ "feedback_id": "string", "summarized_message": "string" }], "impact": "Low|Medium|High", "applicability": "string", "implementation_cost": "Low|Medium|High", "priority": "Low|Medium|High", "recommendations": ["string"], "potential_questions": [{ "question": "string", "context_of_question": "string" }] }]
  }
}`,
};

function knowledgeBlock(data: Ctx): string {
  if (!data.knowledge?.trim()) return "";
  return `\n---\n**Knowledge Bucket (parsed from uploaded documents):**\n${data.knowledge}\n`;
}

function contextBlocks(data: Ctx): { topicData: string; feedbackData: string } {
  const topicData = [
    `Topic Name: ${data.topic.name}`,
    `Topic Description: ${data.topic.description}`,
    `Topic Code: ${data.topic.topicCode}`,
    `Start Date: ${data.topic.startDate}`,
    `End Date: ${data.topic.endDate}`,
  ].join("\n");

  const feedbackData = data.feedbacks
    .map((f) =>
      [
        "---",
        `Feedback ID: ${f.feedbackId}`,
        `Feedback Code: ${f.feedbackCode}`,
        `Submitted By: "${f.displayName}"`,
        `Created At: ${f.dateSubmitted}`,
        f.text ? `Text: "${f.text}"` : "",
        f.transcribedText ? `Transcribed Text: "${f.transcribedText}"` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  return { topicData, feedbackData };
}

export function buildPrompt(data: Ctx): string {
  const { topicData, feedbackData } = contextBlocks(data);

  return `You are an expert analyst of employee feedback. Analyze the feedback for this topic and produce structured insights.

**Topic Details:**
${topicData}
${knowledgeBlock(data)}
---
**Raw Feedback Data:**
(Each item is one piece of feedback collected for this topic. Analyze all relevant content.)
${feedbackData}
---

**Output Format Requirements:**
- Return ONLY valid JSON (no markdown, no code fences, no explanations) that adheres strictly to this schema:
${OUTPUT_SCHEMA}

**Answer Requirements:**
- Provide a concise overview and key points.
- Identify key themes with mentions counts and sentiment.
- Summarize overall sentiment with a distribution.
- List contradictions if any; if none, explain briefly in contradiction_summary.
- Provide actionable findings and next steps.
- For each finding, include 2-3 "potential_questions" a user could ask the AI assistant to explore it further, each with a brief context_of_question.
- Reference feedback using the Feedback Code where relevant.
- Fill every field; if a field has no data, give a short explanation string.`;
}

export function buildSectionPrompt(data: Ctx, section: SectionKey): string {
  const { topicData, feedbackData } = contextBlocks(data);

  return `You are an expert analyst of employee feedback. Analyze the feedback for this topic and produce ONLY the "${section}" section of the insight.

**Topic Details:**
${topicData}
${knowledgeBlock(data)}
---
**Raw Feedback Data:**
${feedbackData}
---

**Output Format Requirements:**
- Return ONLY valid JSON (no markdown, no code fences, no explanations) for the "${section}" section, adhering strictly to this schema:
${SECTION_SCHEMAS[section]}

**Answer Requirements:**
- Reference feedback using the Feedback Code where relevant.
- Fill every field; if a field has no data, give a short explanation string.`;
}

function extractText(json: GeminiJson): string {
  return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

export type PipelineResult = {
  result: {
    summary: unknown;
    sentiment: unknown;
    contradiction: unknown;
    finding: unknown;
  };
  rawOutput: string;
  modelUsed: string;
};

// The single shared pipeline both the real insight flow and the Config lab run,
// so the lab always reflects production behaviour.
export async function runInsightPipeline(opts: {
  apiKey: string;
  input: Ctx;
  models: string[];
  temperature: number;
  mode: "single" | "stepwise";
  promptOverride?: string;
  log: Logger;
  deadlineMs: number;
}): Promise<PipelineResult> {
  const { log } = opts;
  await log("info", `Input: ${opts.input.feedbacks.length} feedback item(s)`, {
    topic: opts.input.topic.topicCode,
  });

  if (opts.mode === "stepwise") {
    const result: Record<string, unknown> = {};
    const rawParts: string[] = [];
    let modelUsed = opts.models[0];
    for (const section of SECTION_KEYS) {
      const prompt = buildSectionPrompt(opts.input, section);
      await log("step", `Step "${section}": prompt assembled`, {
        chars: prompt.length,
      });
      const body = JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature,
          responseMimeType: "application/json",
        },
      });
      const { json, modelUsed: mu } = await callGemini({
        apiKey: opts.apiKey,
        models: opts.models,
        body,
        log,
        deadlineMs: opts.deadlineMs,
      });
      modelUsed = mu;
      const text = extractText(json);
      const parsed = parseJson(text);
      result[section] = parsed[section] ?? parsed;
      rawParts.push(`// ${section}\n${text}`);
      await log("success", `Step "${section}" parsed`);
    }
    return {
      result: {
        summary: result.summary ?? {},
        sentiment: result.sentiment ?? {},
        contradiction: result.contradiction ?? {},
        finding: result.finding ?? {},
      },
      rawOutput: rawParts.join("\n\n"),
      modelUsed,
    };
  }

  // single
  const prompt = opts.promptOverride?.trim()
    ? opts.promptOverride
    : buildPrompt(opts.input);
  await log("step", "Prompt assembled (single call)", { chars: prompt.length });
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: opts.temperature,
      responseMimeType: "application/json",
    },
  });
  const { json, modelUsed } = await callGemini({
    apiKey: opts.apiKey,
    models: opts.models,
    body,
    log,
    deadlineMs: opts.deadlineMs,
  });
  const text = extractText(json);
  await log("step", "Parsing JSON response", { chars: text.length });
  const parsed = parseJson(text);
  await log("success", "Generation complete");
  return {
    result: {
      summary: parsed.summary ?? {},
      sentiment: parsed.sentiment ?? parsed.sentiments ?? {},
      contradiction: parsed.contradiction ?? parsed.contradictions ?? {},
      finding: parsed.finding ?? parsed.findings ?? {},
    },
    rawOutput: text.replace(/```json|```/g, "").trim(),
    modelUsed,
  };
}

export const generateInsight = internalAction({
  args: { insightId: v.id("insights") },
  handler: async (ctx, { insightId }) => {
    try {
      const data = await ctx.runQuery(internal.insights.getContext, {
        insightId,
      });
      if (!data) throw new Error("Insight context not found");

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

      const active = await ctx.runQuery(internal.ai.activeModel, {});
      const models = [active, fallbackModel()].filter(
        (m, i, a) => a.indexOf(m) === i,
      );

      const { result } = await runInsightPipeline({
        apiKey,
        input: data,
        models,
        temperature: 0,
        mode: "single",
        log: () => undefined,
        deadlineMs: Date.now() + 240_000,
      });

      await ctx.runMutation(internal.insights.saveResult, {
        insightId,
        summary: result.summary,
        sentiment: result.sentiment,
        contradiction: result.contradiction,
        finding: result.finding,
      });
    } catch (e) {
      await ctx.runMutation(internal.insights.markFailed, {
        insightId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
});

// The configured insight-generation models, surfaced to the Config page.
// `primary` reflects the DB override (set from the Config page) when present,
// otherwise the GEMINI_MODEL env default.
export const modelConfig = query({
  args: {},
  handler: async (ctx) => {
    const override = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", MODEL_SETTING_KEY))
      .unique();
    const envDefault = primaryModel();
    return {
      primary: override?.value || envDefault,
      envDefault,
      isOverridden: !!override?.value,
      fallback: fallbackModel(),
      hasApiKey: !!process.env.GEMINI_API_KEY,
    };
  },
});

// Resolved active model, used by the real generation flow + the chat route.
export const activeModel = internalQuery({
  args: {},
  handler: async (ctx) => {
    const override = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", MODEL_SETTING_KEY))
      .unique();
    return override?.value || primaryModel();
  },
});

export const activeModelPublic = query({
  args: {},
  handler: async (ctx): Promise<string> => {
    const override = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", MODEL_SETTING_KEY))
      .unique();
    return override?.value || primaryModel();
  },
});

// Set (or clear, with an empty string) the active insight-generation model.
export const setInsightModel = mutation({
  args: { model: v.string() },
  handler: async (ctx, { model }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", MODEL_SETTING_KEY))
      .unique();
    const value = model.trim();
    if (!value) {
      if (existing) await ctx.db.delete(existing._id);
      return { ok: true, cleared: true };
    }
    if (existing) await ctx.db.patch(existing._id, { value });
    else await ctx.db.insert("appSettings", { key: MODEL_SETTING_KEY, value });
    return { ok: true, model: value };
  },
});

// Health-check a single Gemini model: sends a tiny prompt and reports whether
// it responded, the HTTP status, latency, and a short sample or error message.
export const testModel = action({
  args: { model: v.optional(v.string()) },
  handler: async (ctx, { model }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const target = (model && model.trim()) || primaryModel();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { model: target, ok: false, error: "GEMINI_API_KEY is not set" };
    }

    const body = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "Reply with exactly: OK" }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 8 },
    });

    const startedAt = Date.now();
    try {
      const res = await fetchWithTimeout(
        geminiUrl(target, apiKey),
        body,
        30_000,
      );
      const latencyMs = Date.now() - startedAt;

      if (!res.ok) {
        const raw = await res.text();
        let message = raw;
        try {
          message =
            (JSON.parse(raw) as { error?: { message?: string } })?.error
              ?.message ?? raw;
        } catch {
          // keep raw text
        }
        return {
          model: target,
          ok: false,
          httpStatus: res.status,
          latencyMs,
          error: message.slice(0, 300),
        };
      }

      const json = (await res.json()) as GeminiJson;
      const sample = extractText(json).trim();
      return {
        model: target,
        ok: true,
        httpStatus: 200,
        latencyMs,
        sample: sample.slice(0, 120),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        model: target,
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: msg.toLowerCase().includes("abort") ? "Timed out" : msg,
      };
    }
  },
});
