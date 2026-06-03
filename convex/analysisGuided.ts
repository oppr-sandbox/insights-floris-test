import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireCompany } from "./lib/auth";
import { callGemini, fallbackModel } from "./ai";
import { buildSessionContext } from "./sessions";

type Section = { key: string; title: string; guidance?: string };
type ChapterStatus = { key: string; status: "todo" | "partial" | "done" };
type StepResult = {
  reply: string;
  targetSection: string;
  suggestions: string[];
  chapters: ChapterStatus[];
  readyToGenerate: boolean;
};

function extractText(json: unknown): string {
  const j = json as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("Model did not return valid JSON");
  }
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    targetSection: { type: "STRING" },
    suggestions: { type: "ARRAY", items: { type: "STRING" } },
    chapters: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          key: { type: "STRING" },
          status: { type: "STRING", enum: ["todo", "partial", "done"] },
        },
        required: ["key", "status"],
      },
    },
    readyToGenerate: { type: "BOOLEAN" },
  },
  required: ["reply", "targetSection", "suggestions", "chapters", "readyToGenerate"],
};

export const stepInputs = internalQuery({
  args: { sessionId: v.id("analysisSessions") },
  handler: async (ctx, { sessionId }) => {
    const { companyId } = await requireCompany(ctx);
    const session = await ctx.db.get(sessionId);
    if (!session || session.companyId !== companyId) return null;
    const lens = await ctx.db
      .query("lenses")
      .withIndex("by_company_key", (q) =>
        q.eq("companyId", companyId).eq("key", session.lensKey),
      )
      .unique();
    if (!lens) return null;

    const messages = await ctx.db
      .query("aiChatHistory")
      .withIndex("by_session_user", (q) => q.eq("sessionId", sessionId))
      .collect();
    const transcript = messages
      .map((m) => {
        const parts = (m.parts as { type?: string; text?: string }[]) ?? [];
        const text = parts.filter((p) => p.type === "text").map((p) => p.text).join(" ");
        return text ? `${m.role.toUpperCase()}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");

    return {
      lensName: lens.name,
      systemPrompt: lens.systemPrompt,
      sections: lens.sections as Section[],
      temperature: lens.temperature ?? 0.3,
      context: await buildSessionContext(ctx, session),
      transcript,
    };
  },
});

export const saveTurn = internalMutation({
  args: {
    sessionId: v.id("analysisSessions"),
    userMessage: v.optional(v.string()),
    reply: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, { sessionId, userMessage, reply, metadata }) => {
    const { user, companyId } = await requireCompany(ctx);
    const s = await ctx.db.get(sessionId);
    if (!s || s.companyId !== companyId) throw new Error("Session not found");
    if (userMessage) {
      await ctx.db.insert("aiChatHistory", {
        sessionId,
        lensKey: s.lensKey,
        userId: user._id,
        companyId,
        role: "user",
        parts: [{ type: "text", text: userMessage }],
      });
    }
    await ctx.db.insert("aiChatHistory", {
      sessionId,
      lensKey: s.lensKey,
      userId: user._id,
      companyId,
      role: "assistant",
      parts: [{ type: "text", text: reply }],
      metadata,
    });
    await ctx.db.patch(sessionId, { updatedAt: Date.now() });
  },
});

// One turn of the guided interview. Returns a structured payload (reply +
// suggested answer chips + chapter checklist) and persists the turn so the
// runner re-renders reactively.
export const step = action({
  args: {
    sessionId: v.id("analysisSessions"),
    userMessage: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, userMessage }): Promise<StepResult> => {
    const data = await ctx.runQuery(internal.analysisGuided.stepInputs, { sessionId });
    if (!data) throw new Error("Session not found");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const active = await ctx.runQuery(internal.ai.activeModel, {});
    const models = [active, fallbackModel()].filter((m, i, a) => a.indexOf(m) === i);

    const chapters = data.sections
      .map((s) => `- "${s.key}": ${s.title}${s.guidance ? ` — ${s.guidance}` : ""}`)
      .join("\n");

    const prompt = [
      data.systemPrompt,
      "",
      "You are facilitating this as a GUIDED, STRUCTURED interview — not open-ended chat.",
      "Rules for every turn:",
      "- Ask exactly ONE focused question at a time, working through the chapters in order.",
      "- Propose 2–5 concrete candidate answers in `suggestions`, grounded in the feedback and data in context, so the user can click instead of typing. Make them specific (cite what the feedback shows). Never include a generic 'other' option — the UI always offers free text and document upload.",
      "- Reflect briefly on the user's last answer before asking the next question.",
      "- In `chapters`, return the status of EVERY chapter key: 'done' (well covered), 'partial' (touched but thin), or 'todo' (not yet addressed).",
      "- Set `targetSection` to the chapter key your question addresses.",
      "- Set `readyToGenerate` to true only once every chapter is at least 'partial' and the essentials are 'done'.",
      "- Keep `reply` concise and conversational. Use the Feedback Code when citing feedback.",
      "",
      "CHAPTERS:",
      chapters,
      "",
      "=== SOURCE DATA (topics, feedback, prior insights, uploaded documents) ===",
      data.context,
      "",
      "=== CONVERSATION SO FAR ===",
      data.transcript || "(none yet — open the interview)",
      "",
      userMessage
        ? `=== LATEST USER MESSAGE ===\n${userMessage}`
        : "=== START ===\nNo messages yet. Open the interview with a warm one-line intro and your first question.",
    ].join("\n");

    const body = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: data.temperature,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const { json } = await callGemini({
      apiKey,
      models,
      body,
      deadlineMs: Date.now() + 60_000,
      perCallTimeoutMs: 55_000,
    });
    const parsed = parseJson(extractText(json)) as unknown as StepResult;

    const result: StepResult = {
      reply: typeof parsed.reply === "string" ? parsed.reply : "Let's continue.",
      targetSection: parsed.targetSection ?? "",
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 6) : [],
      chapters: Array.isArray(parsed.chapters)
        ? parsed.chapters
        : data.sections.map((s) => ({ key: s.key, status: "todo" as const })),
      readyToGenerate: !!parsed.readyToGenerate,
    };

    await ctx.runMutation(internal.analysisGuided.saveTurn, {
      sessionId,
      userMessage,
      reply: result.reply,
      metadata: {
        suggestions: result.suggestions,
        chapters: result.chapters,
        targetSection: result.targetSection,
        readyToGenerate: result.readyToGenerate,
      },
    });

    return result;
  },
});
