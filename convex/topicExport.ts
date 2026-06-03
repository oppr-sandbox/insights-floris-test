import { query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { requireCompany } from "./lib/auth";

const iso = (ms?: number | null) =>
  ms != null ? new Date(ms).toISOString() : undefined;

function displayName(u: Doc<"users"> | null): string {
  if (!u) return "Unknown";
  return (
    u.displayName ??
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ??
    u.email ??
    "User"
  );
}

// Builds a single, self-consistent, objective snapshot of a topic for export:
// meta, attached files (referenced, not their contents), and all submitted
// feedback. No insights, summaries or recommendations — just a clear record of
// what was collected. `generatedAt` documents the moment, so a download of a
// still-running topic is an explicit point-in-time copy.
export const snapshot = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, { topicId }) => {
    const { user, companyId } = await requireCompany(ctx);
    const topic = await ctx.db.get(topicId);
    if (!topic || topic.companyId !== companyId) return null;

    const disciplineNames = new Map<string, string | undefined>();
    const disciplineFor = async (id?: Id<"disciplines">) => {
      if (!id) return undefined;
      if (!disciplineNames.has(id)) {
        disciplineNames.set(id, (await ctx.db.get(id))?.name);
      }
      return disciplineNames.get(id);
    };

    const attachments: {
      fileName: string;
      fileExtension: string;
      fileSize: number;
      uploadedBy: string;
      uploadedAt?: string;
    }[] = [];
    for (const fid of topic.attachmentIds ?? []) {
      const file = await ctx.db.get(fid);
      if (!file) continue;
      const uploader = await ctx.db.get(file.userId);
      attachments.push({
        fileName: file.fileName,
        fileExtension: file.fileExtension ?? file.fileName.split(".").pop() ?? "",
        fileSize: file.fileSize ?? 0,
        uploadedBy: displayName(uploader),
        uploadedAt: iso(file._creationTime),
      });
    }

    const submitted = await ctx.db
      .query("feedback")
      .withIndex("by_topic_status", (q) =>
        q.eq("topicId", topicId).eq("status", "SUBMITTED"),
      )
      .collect();
    submitted.sort((a, b) => (a.dateSubmitted ?? 0) - (b.dateSubmitted ?? 0));

    const feedbacks = [];
    for (const f of submitted) {
      const u = await ctx.db.get(f.userId);
      const images: { url: string; fileName: string }[] = [];
      for (const imgId of f.imageFileIds ?? []) {
        const file = await ctx.db.get(imgId);
        if (!file) continue;
        images.push({
          url: (await ctx.storage.getUrl(file.storageId)) ?? "",
          fileName: file.fileName,
        });
      }
      feedbacks.push({
        feedbackCode: f.feedbackCode,
        author: displayName(u),
        discipline: await disciplineFor(u?.disciplineId),
        dateSubmitted: iso(f.dateSubmitted),
        text: f.text,
        transcript: f.transcribeText,
        hasAudio: !!f.audioFileId,
        images,
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      generatedBy: displayName(user),
      topic: {
        code: topic.topicCode,
        name: topic.name,
        description: topic.description ?? "",
        status: topic.status,
        startDate: iso(topic.startDate),
        endDate: iso(topic.endDate),
        channels: topic.channels ?? [],
      },
      counts: {
        feedbacks: feedbacks.length,
        respondents: new Set(submitted.map((f) => f.userId)).size,
        attachments: attachments.length,
      },
      attachments,
      feedbacks,
    };
  },
});
