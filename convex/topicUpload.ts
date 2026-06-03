import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { generateTopicCode, generateFeedbackCode } from "./lib/codes";

// ───────────────────────────────────────────────────────────────────────────
// DEV-SEED ONLY. Public + unauthenticated helpers used by the local topic
// uploader (topics/<project>/scripts/upload.mjs) to bulk-import a fully
// authored topic with document attachments, voice notes and image feedback.
// Safe to delete once the demo content is loaded.
// ───────────────────────────────────────────────────────────────────────────

// These are public + unauthenticated for the local uploader scripts, which run
// an anonymous ConvexHttpClient. Hard-disable them unless the deployment opts in
// via ALLOW_DEV_UPLOAD=true, so they can never be invoked on production.
function assertDevUpload() {
  if (process.env.ALLOW_DEV_UPLOAD !== "true") {
    throw new Error("Dev topic upload is disabled on this deployment");
  }
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    assertDevUpload();
    return ctx.storage.generateUploadUrl();
  },
});

function lexicalDoc(paragraphs: string[]): string {
  return JSON.stringify({
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: paragraphs.map((text) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        children: text
          ? [
              {
                type: "text",
                text,
                format: 0,
                style: "",
                mode: "normal",
                detail: 0,
                version: 1,
              },
            ]
          : [],
      })),
    },
  });
}

const DAY = 24 * 60 * 60 * 1000;

type FileRef = { storageId: string; fileName: string; contentType?: string; fileSize?: number };

export const importTopic = mutation({
  // The whole payload is passed as a single object built by the uploader.
  args: { payload: v.any() },
  handler: async (ctx, { payload }) => {
    assertDevUpload();
    const now = Date.now();

    const company = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", payload.company?.slug ?? "oppr"))
      .unique();
    if (!company) throw new Error("Company not found — run seed:demo first");
    const companyId = company._id;

    // 1. Ensure new disciplines.
    const discByCode: Record<string, Id<"disciplines">> = {};
    for (const d of await ctx.db
      .query("disciplines")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect()) {
      discByCode[d.code] = d._id;
    }
    for (const d of payload.newDisciplines ?? []) {
      if (!discByCode[d.code]) {
        discByCode[d.code] = await ctx.db.insert("disciplines", {
          companyId,
          name: d.name,
          code: d.code,
        });
      }
    }

    // 2. Locations map.
    const locByCode: Record<string, Id<"locations">> = {};
    for (const l of await ctx.db
      .query("locations")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect()) {
      locByCode[l.code] = l._id;
    }

    // 3. Ensure new users; build email -> id map.
    const usersByEmail: Record<string, Id<"users">> = {};
    for (const u of await ctx.db
      .query("users")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect()) {
      if (u.email) usersByEmail[u.email] = u._id;
    }
    for (const u of payload.newUsers ?? []) {
      if (!usersByEmail[u.email]) {
        usersByEmail[u.email] = await ctx.db.insert("users", {
          email: u.email,
          firstName: u.first,
          lastName: u.last,
          displayName: `${u.first} ${u.last}`,
          role: u.role,
          companyId,
          locationId: locByCode[u.loc],
          disciplineId: discByCode[u.disc],
        });
      }
    }

    const emailForKey = (key: string) =>
      key === "floris" ? "floris@oppr.ai" : `${key}@maasvallei.nl`;
    const userIdForKey = (key: string) => {
      const id = usersByEmail[emailForKey(key)];
      if (!id) throw new Error(`Unknown user key: ${key} (${emailForKey(key)})`);
      return id;
    };

    const t = payload.topic;
    const locationId = locByCode[t.loc];
    const disciplineId = discByCode[t.disc];
    if (!locationId) throw new Error(`Unknown location: ${t.loc}`);
    if (!disciplineId) throw new Error(`Unknown discipline: ${t.disc}`);

    // 4. Idempotency: remove a previously-imported topic with the same name.
    const existing = (
      await ctx.db
        .query("topics")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .collect()
    ).filter((x) => x.name === t.name);
    for (const old of existing) {
      for (const fb of await ctx.db
        .query("feedback")
        .withIndex("by_topic", (q) => q.eq("topicId", old._id))
        .collect()) {
        for (const fid of [
          ...(fb.imageFileIds ?? []),
          ...(fb.audioFileId ? [fb.audioFileId] : []),
        ]) {
          const file = await ctx.db.get(fid);
          if (file) {
            await ctx.storage.delete(file.storageId).catch(() => undefined);
            await ctx.db.delete(fid);
          }
        }
        await ctx.db.delete(fb._id);
      }
      for (const fid of old.attachmentIds ?? []) {
        const file = await ctx.db.get(fid);
        if (file) {
          await ctx.storage.delete(file.storageId).catch(() => undefined);
          await ctx.db.delete(fid);
        }
      }
      for (const ins of await ctx.db
        .query("insights")
        .withIndex("by_topic", (q) => q.eq("topicId", old._id))
        .collect()) {
        await ctx.db.delete(ins._id);
      }
      await ctx.db.delete(old._id);
    }

    const creatorId = userIdForKey(t.creatorKey);

    // 5. Attachment file records. Documents (attachments) are sent through the
    // knowledge-bucket parser; feedback media (images/audio) are not.
    const newFile = async (
      f: FileRef,
      userId: Id<"users">,
      parse = false,
    ) => {
      const fileId = await ctx.db.insert("files", {
        storageId: f.storageId as Id<"_storage">,
        fileName: f.fileName,
        fileExtension: f.fileName.split(".").pop(),
        contentType: f.contentType,
        fileSize: f.fileSize,
        userId,
        companyId,
        ...(parse ? { parseStatus: "PENDING" } : {}),
      });
      if (parse) {
        await ctx.scheduler.runAfter(0, internal.ingestion.parseFile, { fileId });
      }
      return fileId;
    };

    const attachmentIds: Id<"files">[] = [];
    for (const a of (payload.attachments ?? []) as FileRef[]) {
      attachmentIds.push(await newFile(a, creatorId, true));
    }

    // 6. Topic.
    const topicCode = await generateTopicCode(ctx, {
      companyId,
      locationId,
      disciplineId,
      locationCode: t.loc,
      disciplineCode: t.disc,
    });
    const topicId = await ctx.db.insert("topics", {
      topicCode,
      name: t.name,
      description: t.description,
      content: lexicalDoc(t.contentParagraphs ?? []),
      channels: t.channels ?? ["TEXT"],
      status: t.status,
      startDate: now - (t.startDaysAgo ?? 7) * DAY,
      endDate: now + (t.endDaysFromNow ?? 7) * DAY,
      isAllUsers: true,
      userId: creatorId,
      companyId,
      locationId,
      disciplineId,
      attachmentIds,
    });

    // 7. Feedback.
    let count = 0;
    for (const fb of payload.feedback ?? []) {
      const authorId = userIdForKey(fb.authorKey);
      const imageFileIds: Id<"files">[] = [];
      for (const img of (fb.images ?? []) as FileRef[]) {
        imageFileIds.push(await newFile(img, authorId));
      }
      let audioFileId: Id<"files"> | undefined;
      if (fb.audio) {
        audioFileId = await newFile(fb.audio as FileRef, authorId);
      }
      const feedbackCode = await generateFeedbackCode(ctx, topicId, topicCode);
      await ctx.db.insert("feedback", {
        feedbackCode,
        userId: authorId,
        companyId,
        topicId,
        text: fb.text,
        textLangCode: fb.text ? "en" : undefined,
        transcribeText: fb.transcript,
        transcribeTextLangCode: fb.transcript ? "en" : undefined,
        sentiment: fb.sentiment,
        status: "SUBMITTED",
        dateSubmitted: now - (fb.daysAgo ?? 1) * DAY,
        imageFileIds: imageFileIds.length ? imageFileIds : undefined,
        audioFileId,
      });
      count++;
    }

    return { topicCode, topicId, attachments: attachmentIds.length, feedback: count };
  },
});
