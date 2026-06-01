import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { requireCompany } from "./lib/auth";
import { generateFeedbackCode } from "./lib/codes";

const iso = (ms?: number | null) =>
  ms != null ? new Date(ms).toISOString() : undefined;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function userDisplayName(u: Doc<"users"> | null): string {
  if (!u) return "Unknown";
  return (
    u.displayName ??
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ??
    u.email ??
    "User"
  );
}

async function fileToAttachment(
  ctx: QueryCtx,
  fileId: Id<"files">,
  createdBy: string,
) {
  const file = await ctx.db.get(fileId);
  if (!file) return null;
  return {
    id: file._id,
    url: (await ctx.storage.getUrl(file.storageId)) ?? "",
    fileName: file.fileName,
    fileExtension: file.fileExtension ?? "",
    fileSize: file.fileSize ?? 0,
    contentType: file.contentType ?? "",
    contentHash: "",
    createdAt: new Date(file._creationTime).toISOString(),
    createdBy,
  };
}

const imageInput = v.object({
  storageId: v.id("_storage"),
  fileName: v.string(),
  contentType: v.optional(v.string()),
  fileSize: v.optional(v.number()),
});

export const save = mutation({
  args: {
    id: v.optional(v.id("feedback")),
    topicId: v.id("topics"),
    text: v.optional(v.string()),
    audioStorageId: v.optional(v.id("_storage")),
    audioFileName: v.optional(v.string()),
    transcribeText: v.optional(v.string()),
    removeImageIds: v.optional(v.array(v.id("files"))),
    insertImages: v.optional(v.array(imageInput)),
    submit: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.companyId !== companyId) {
      throw new Error("Topic not found");
    }

    const hasText = !!args.text && args.text.trim().length > 0;
    const hasAudio = !!args.audioStorageId;
    const hasNewImages = (args.insertImages?.length ?? 0) > 0;

    const newFile = async (
      storageId: Id<"_storage">,
      fileName: string,
      contentType?: string,
      fileSize?: number,
    ) =>
      ctx.db.insert("files", {
        storageId,
        fileName,
        fileExtension: fileName.split(".").pop(),
        contentType,
        fileSize,
        userId: user._id,
        companyId,
      });

    let feedback: Doc<"feedback"> | null = null;
    if (args.id) {
      feedback = await ctx.db.get(args.id);
      if (!feedback || feedback.companyId !== companyId) {
        throw new Error("Feedback not found");
      }
      if (feedback.userId !== user._id) {
        throw new Error("You can only edit your own feedback");
      }
    }

    // Validate: need at least one of text/audio/image (consider existing).
    const willHaveText = hasText || (!!feedback && !!feedback.text && !args.text);
    const willHaveAudio = hasAudio || (!!feedback?.audioFileId && !args.audioStorageId);
    const existingImages = feedback?.imageFileIds ?? [];
    const remaining = existingImages.filter(
      (i) => !(args.removeImageIds ?? []).includes(i),
    );
    const willHaveImages = hasNewImages || remaining.length > 0;
    if (!willHaveText && !willHaveAudio && !willHaveImages) {
      throw new Error("Provide text, audio, or an image.");
    }
    if (willHaveImages && !willHaveText && !willHaveAudio) {
      throw new Error("Images must be accompanied by text or audio.");
    }

    // Resolve image set.
    let imageFileIds = remaining;
    if (hasNewImages) {
      const inserted: Id<"files">[] = [];
      for (const img of args.insertImages!) {
        inserted.push(
          await newFile(img.storageId, img.fileName, img.contentType, img.fileSize),
        );
      }
      imageFileIds = [...remaining, ...inserted];
    }
    // Delete removed image file records.
    for (const rid of args.removeImageIds ?? []) {
      const f = await ctx.db.get(rid);
      if (f) {
        await ctx.storage.delete(f.storageId).catch(() => undefined);
        await ctx.db.delete(rid);
      }
    }

    // Audio (replace if a new one provided).
    let audioFileId = feedback?.audioFileId;
    if (hasAudio) {
      if (audioFileId) {
        const old = await ctx.db.get(audioFileId);
        if (old) {
          await ctx.storage.delete(old.storageId).catch(() => undefined);
          await ctx.db.delete(audioFileId);
        }
      }
      audioFileId = await newFile(
        args.audioStorageId!,
        args.audioFileName ?? "recording.webm",
        "audio/webm",
      );
    }

    const submitting = args.submit === true;

    if (feedback) {
      await ctx.db.patch(feedback._id, {
        text: args.text ?? feedback.text,
        transcribeText: args.transcribeText ?? feedback.transcribeText,
        imageFileIds,
        audioFileId,
        ...(submitting
          ? { status: "SUBMITTED" as const, dateSubmitted: Date.now() }
          : {}),
      });
      return { id: feedback._id, feedbackCode: feedback.feedbackCode };
    }

    const feedbackCode = await generateFeedbackCode(
      ctx,
      topic._id,
      topic.topicCode,
    );
    const id = await ctx.db.insert("feedback", {
      feedbackCode,
      userId: user._id,
      companyId,
      topicId: topic._id,
      text: args.text,
      transcribeText: args.transcribeText,
      imageFileIds,
      audioFileId,
      status: submitting ? "SUBMITTED" : "DRAFT",
      dateSubmitted: submitting ? Date.now() : undefined,
    });
    return { id, feedbackCode };
  },
});

export const getById = query({
  args: { id: v.id("feedback") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const f = await ctx.db.get(args.id);
    if (!f || f.companyId !== companyId) return null;
    const u = await ctx.db.get(f.userId);
    const displayName = userDisplayName(u);

    const images = [];
    for (const imgId of f.imageFileIds ?? []) {
      const att = await fileToAttachment(ctx, imgId, displayName);
      if (att) images.push({ id: att.id, url: att.url, fileName: att.fileName });
    }

    let audio = undefined;
    if (f.audioFileId) {
      const att = await fileToAttachment(ctx, f.audioFileId, displayName);
      if (att) audio = { url: att.url, transcription: f.transcribeText ?? "" };
    }

    return {
      id: f._id,
      text: f.text,
      audio,
      images,
      dateSubmitted: iso(f.dateSubmitted),
      user: {
        id: f.userId,
        displayName,
        email: u?.email ?? "",
        userImage: u?.userImage ?? u?.image ?? "",
        initials: initialsOf(displayName),
      },
    };
  },
});

export const myFeedbacks = query({
  args: { showCompleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const rows = await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const out = [];
    for (const f of rows) {
      if (f.companyId !== companyId) continue;
      const topic = await ctx.db.get(f.topicId);
      if (!topic) continue;
      if (!args.showCompleted && topic.status !== "ACTIVE") continue;

      out.push({
        id: f._id,
        feedbackCode: f.feedbackCode,
        feedbackStatus: f.status,
        topicId: f.topicId,
        topicCode: topic.topicCode,
        topicName: topic.name,
        topicStatus: topic.status,
        dateSubmitted: iso(f.dateSubmitted),
        text: f.text,
        transcribedText: f.transcribeText,
        audio: f.audioFileId ?? null,
        images: f.imageFileIds ?? [],
        channels: topic.channels ?? [],
        lastUpdated: new Date(f._creationTime).toISOString(),
      });
    }
    out.sort((a, b) => (b.lastUpdated > a.lastUpdated ? 1 : -1));
    return out;
  },
});
