import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireCompany } from "./lib/auth";
import { callGemini, fallbackModel } from "./ai";

// Cap stored Markdown so a single huge document can't blow the AI context.
const MAX_CHARS = 100_000;

type Kind = "text" | "pdf" | "image" | "unsupported";

// Gemini's inline-data ingestion natively supports PDF, images and plain text.
// Office formats (docx/xlsx/pptx) are not accepted and need a converter such as
// Microsoft markitdown — tracked on the Roadmap page.
function classify(contentType?: string, ext?: string): Kind {
  const ct = (contentType ?? "").toLowerCase();
  const e = (ext ?? "").toLowerCase().replace(/^\./, "");
  if (ct.startsWith("text/") || ct === "application/json" || ct === "message/rfc822" ||
    ["txt", "md", "markdown", "csv", "tsv", "json", "log", "eml"].includes(e)) return "text";
  if (ct === "application/pdf" || e === "pdf") return "pdf";
  if (["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"].includes(ct) ||
    ["png", "jpg", "jpeg", "webp", "heic", "heif"].includes(e)) return "image";
  return "unsupported";
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function extractText(json: unknown): string {
  const j = json as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

const CONVERT_PROMPT = (fileName: string) =>
  [
    `Convert the attached document named "${fileName}" into clean, faithful Markdown.`,
    "Preserve the structure: headings, lists, and especially TABLES (render them as GitHub-flavoured Markdown tables).",
    "Do not summarise, paraphrase, or omit content — transcribe it.",
    "If it is an image, transcribe all visible text and briefly describe key non-text visuals (charts, diagrams).",
    "Output only the Markdown content, with no surrounding commentary or code fences.",
  ].join("\n");

// Dev helper: re-run parsing for files that previously failed or were marked
// unsupported (e.g. after extending the classifier). Run with
// `npx convex run ingestion:reparseUnsupported`.
export const reparseUnsupported = internalMutation({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.query("files").collect();
    let rescheduled = 0;
    for (const f of files) {
      if (f.parseStatus === "UNSUPPORTED" || f.parseStatus === "FAILED") {
        await ctx.db.patch(f._id, { parseStatus: "PENDING", parseError: undefined });
        await ctx.scheduler.runAfter(0, internal.ingestion.parseFile, { fileId: f._id });
        rescheduled++;
      }
    }
    return { rescheduled };
  },
});

export const fileInfo = internalQuery({
  args: { fileId: v.id("files") },
  handler: async (ctx, { fileId }) => {
    const file = await ctx.db.get(fileId);
    if (!file) return null;
    return {
      storageId: file.storageId,
      fileName: file.fileName,
      fileExtension: file.fileExtension,
      contentType: file.contentType,
    };
  },
});

export const setState = internalMutation({
  args: {
    fileId: v.id("files"),
    status: v.string(),
    parsedText: v.optional(v.string()),
    parseError: v.optional(v.string()),
  },
  handler: async (ctx, { fileId, status, parsedText, parseError }) => {
    await ctx.db.patch(fileId, { parseStatus: status, parsedText, parseError });
  },
});

export const parseFile = internalAction({
  args: { fileId: v.id("files") },
  handler: async (ctx, { fileId }) => {
    const file = await ctx.runQuery(internal.ingestion.fileInfo, { fileId });
    if (!file) return;

    const kind = classify(file.contentType, file.fileExtension);
    if (kind === "unsupported") {
      await ctx.runMutation(internal.ingestion.setState, { fileId, status: "UNSUPPORTED" });
      return;
    }

    await ctx.runMutation(internal.ingestion.setState, { fileId, status: "PARSING" });
    try {
      const blob = await ctx.storage.get(file.storageId);
      if (!blob) throw new Error("File missing from storage");

      let markdown: string;
      if (kind === "text") {
        markdown = await blob.text();
      } else {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
        const active = await ctx.runQuery(internal.ai.activeModel, {});
        const models = [active, fallbackModel()].filter((m, i, a) => a.indexOf(m) === i);
        const base64 = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
        const mimeType = file.contentType || (kind === "pdf" ? "application/pdf" : "image/png");
        const body = JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: CONVERT_PROMPT(file.fileName) },
            ],
          }],
          generationConfig: { temperature: 0 },
        });
        const { json } = await callGemini({
          apiKey,
          models,
          body,
          deadlineMs: Date.now() + 120_000,
          perCallTimeoutMs: 115_000,
        });
        markdown = extractText(json);
      }

      await ctx.runMutation(internal.ingestion.setState, {
        fileId,
        status: "PARSED",
        parsedText: markdown.slice(0, MAX_CHARS),
      });
    } catch (e) {
      await ctx.runMutation(internal.ingestion.setState, {
        fileId,
        status: "FAILED",
        parseError: e instanceof Error ? e.message : String(e),
      });
    }
  },
});

// Re-run ingestion for a single file (UI retry on failure).
export const reparse = mutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, { fileId }) => {
    const { companyId } = await requireCompany(ctx);
    const file = await ctx.db.get(fileId);
    if (!file || file.companyId !== companyId) throw new Error("File not found");
    await ctx.db.patch(fileId, { parseStatus: "PENDING", parseError: undefined });
    await ctx.scheduler.runAfter(0, internal.ingestion.parseFile, { fileId });
    return { ok: true };
  },
});
