import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireCompany } from "./lib/auth";
import { callGemini, fallbackModel } from "./ai";
import { buildSessionContext } from "./sessions";

type Section = { key: string; title: string; guidance?: string };

function extractText(json: unknown): string {
  const j = json as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (j.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON");
  }
}

// Create a report and kick off generation in the background.
export const generate = mutation({
  args: { sessionId: v.id("analysisSessions") },
  handler: async (ctx, { sessionId }) => {
    const { user, companyId } = await requireCompany(ctx);
    const session = await ctx.db.get(sessionId);
    if (!session || session.companyId !== companyId) throw new Error("Session not found");
    const lens = await ctx.db
      .query("lenses")
      .withIndex("by_company_key", (q) =>
        q.eq("companyId", companyId).eq("key", session.lensKey),
      )
      .unique();
    if (!lens || !lens.generatesReport) throw new Error("This lens does not generate reports");

    const reportId = await ctx.db.insert("analysisReports", {
      companyId,
      sessionId,
      lensKey: session.lensKey,
      title: `${lens.name} report`,
      status: "GENERATING",
      generatedBy: user._id,
      generatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.analysisReports.run, { reportId });
    return { reportId };
  },
});

export const inputs = internalQuery({
  args: { reportId: v.id("analysisReports") },
  handler: async (ctx, { reportId }) => {
    const report = await ctx.db.get(reportId);
    if (!report) return null;
    const session = await ctx.db.get(report.sessionId);
    if (!session) return null;
    const lens = await ctx.db
      .query("lenses")
      .withIndex("by_company_key", (q) =>
        q.eq("companyId", session.companyId).eq("key", session.lensKey),
      )
      .unique();
    if (!lens) return null;

    const messages = await ctx.db
      .query("aiChatHistory")
      .withIndex("by_session_user", (q) => q.eq("sessionId", report.sessionId))
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
      sections: lens.sections as Section[],
      temperature: lens.temperature ?? 0.2,
      context: await buildSessionContext(ctx, session),
      transcript,
    };
  },
});

export const saveResult = internalMutation({
  args: {
    reportId: v.id("analysisReports"),
    status: v.string(),
    sections: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { reportId, status, sections, error }) => {
    await ctx.db.patch(reportId, { status, sections, error });
  },
});

export const run = internalAction({
  args: { reportId: v.id("analysisReports") },
  handler: async (ctx, { reportId }) => {
    try {
      const data = await ctx.runQuery(internal.analysisReports.inputs, { reportId });
      if (!data) throw new Error("Report inputs not found");

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
      const active = await ctx.runQuery(internal.ai.activeModel, {});
      const models = [active, fallbackModel()].filter((m, i, a) => a.indexOf(m) === i);

      const chapters = data.sections
        .map((s) => `- "${s.key}": ${s.title}${s.guidance ? ` — ${s.guidance}` : ""}`)
        .join("\n");

      const prompt = [
        `You are producing a "${data.lensName}" report for an industrial operational-excellence team.`,
        "Fill each chapter below using ONLY the facilitated conversation transcript and the source data.",
        "Be specific and concrete; cite Feedback Codes (e.g. [RMD-QA-TOP-0001-001]) where they support a point.",
        "If a chapter genuinely has no supporting information, say so in one short sentence rather than inventing content.",
        "",
        "CHAPTERS — return a JSON object whose keys are EXACTLY these section keys and whose values are the chapter content as a markdown string:",
        chapters,
        "",
        "=== FACILITATED CONVERSATION ===",
        data.transcript || "(no conversation captured yet)",
        "",
        "=== SOURCE DATA (topics, feedback, prior insights) ===",
        data.context,
        "",
        'Output strictly as JSON: { "section_key": "markdown content", ... } with no commentary.',
      ].join("\n");

      const body = JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: data.temperature,
          responseMimeType: "application/json",
        },
      });

      const { json } = await callGemini({
        apiKey,
        models,
        body,
        deadlineMs: Date.now() + 240_000,
      });
      const parsed = parseJson(extractText(json));

      const sections = data.sections.map((s) => ({
        key: s.key,
        title: s.title,
        content: typeof parsed[s.key] === "string" ? (parsed[s.key] as string) : JSON.stringify(parsed[s.key] ?? ""),
      }));

      await ctx.runMutation(internal.analysisReports.saveResult, {
        reportId,
        status: "COMPLETE",
        sections,
      });
    } catch (e) {
      await ctx.runMutation(internal.analysisReports.saveResult, {
        reportId,
        status: "FAILED",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
});

export const list = query({
  args: { sessionId: v.id("analysisSessions") },
  handler: async (ctx, { sessionId }) => {
    const { companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("analysisReports")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .collect();
    return rows
      .filter((r) => r.companyId === companyId)
      .map((r) => ({
        id: r._id,
        title: r.title,
        status: r.status,
        generatedAt: new Date(r.generatedAt).toISOString(),
        hasContent: !!r.sections,
      }));
  },
});

export const get = query({
  args: { reportId: v.id("analysisReports") },
  handler: async (ctx, { reportId }) => {
    const { companyId } = await requireCompany(ctx);
    const r = await ctx.db.get(reportId);
    if (!r || r.companyId !== companyId) return null;
    const generatedByUser = await ctx.db.get(r.generatedBy);
    return {
      id: r._id,
      sessionId: r.sessionId,
      title: r.title,
      status: r.status,
      sections: (r.sections as { key: string; title: string; content: string }[] | undefined) ?? [],
      error: r.error,
      generatedAt: new Date(r.generatedAt).toISOString(),
      generatedBy:
        generatedByUser?.displayName ??
        generatedByUser?.email ??
        "Unknown",
    };
  },
});

// Share a completed report with people in the tool: drops an in-app
// notification (deep-linked to the session) and emails them. `link` is the
// absolute URL to the report, built client-side from the current origin.
export const share = mutation({
  args: {
    reportId: v.id("analysisReports"),
    userIds: v.array(v.id("users")),
    link: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { reportId, userIds, link, note }) => {
    const { user, companyId } = await requireCompany(ctx);
    if (userIds.length === 0) throw new Error("Pick at least one recipient");
    const report = await ctx.db.get(reportId);
    if (!report || report.companyId !== companyId) throw new Error("Report not found");

    const sharer =
      user.displayName ??
      ([user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        user.email ||
        "A colleague");

    const emails: string[] = [];
    for (const uid of userIds) {
      const u = await ctx.db.get(uid);
      if (u && u.companyId === companyId && u.email) emails.push(u.email);
    }

    await ctx.db.insert("notifications", {
      companyId,
      type: "report-shared",
      title: `${sharer} shared a report: ${report.title}`,
      body: note?.trim() || `Open the ${report.title} to review the findings.`,
      payload: { sessionId: report.sessionId, reportId, link },
      userIds,
    });

    if (emails.length) {
      await ctx.scheduler.runAfter(0, internal.analysisReports.sendShareEmails, {
        emails,
        title: report.title,
        link,
        note: note?.trim() || undefined,
        sharer,
      });
    }

    return { ok: true, recipients: userIds.length };
  },
});

// Sends the share emails out-of-band. Mirrors auth.ts: only sends if
// AUTH_RESEND_KEY is configured, otherwise logs (safe no-op in dev).
export const sendShareEmails = internalAction({
  args: {
    emails: v.array(v.string()),
    title: v.string(),
    link: v.string(),
    note: v.optional(v.string()),
    sharer: v.string(),
  },
  handler: async (_ctx, { emails, title, link, note, sharer }) => {
    const key = process.env.AUTH_RESEND_KEY;
    const subject = `${sharer} shared "${title}" with you`;
    const html =
      `<p>${sharer} shared the <strong>${title}</strong> with you on Oppr Insights.</p>` +
      (note ? `<blockquote>${note}</blockquote>` : "") +
      `<p><a href="${link}">Open the report</a></p>`;

    if (!key) {
      console.log(
        `\n===== REPORT SHARE (dev — no AUTH_RESEND_KEY) =====\n` +
          `to:      ${emails.join(", ")}\nsubject: ${subject}\nlink:    ${link}\n` +
          `==================================================\n`,
      );
      return;
    }

    for (const email of emails) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.AUTH_EMAIL_FROM ?? "Oppr Insights <onboarding@resend.dev>",
          to: [email],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        console.error(`Resend share failed for ${email}: ${res.status} ${await res.text()}`);
      }
    }
  },
});

export const remove = mutation({
  args: { reportId: v.id("analysisReports") },
  handler: async (ctx, { reportId }) => {
    const { companyId } = await requireCompany(ctx);
    const r = await ctx.db.get(reportId);
    if (!r || r.companyId !== companyId) throw new Error("Report not found");
    await ctx.db.delete(reportId);
    return { ok: true };
  },
});
