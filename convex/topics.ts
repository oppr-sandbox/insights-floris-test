import { query, mutation, internalMutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { requireCompany } from "./lib/auth";
import { generateTopicCode } from "./lib/codes";
import { topicStatus } from "./schema";

const iso = (ms?: number) => (ms != null ? new Date(ms).toISOString() : undefined);

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

async function companyUserCount(
  ctx: QueryCtx,
  companyId: Id<"companies">,
): Promise<number> {
  const users = await ctx.db
    .query("users")
    .withIndex("by_company", (q) => q.eq("companyId", companyId))
    .collect();
  return users.length;
}

async function computeStats(
  ctx: QueryCtx,
  topic: Doc<"topics">,
  totalUsers: number,
) {
  const submitted = await ctx.db
    .query("feedback")
    .withIndex("by_topic_status", (q) =>
      q.eq("topicId", topic._id).eq("status", "SUBMITTED"),
    )
    .collect();

  const respondentIds = new Set(submitted.map((f) => f.userId));
  const respondentsCount = respondentIds.size;
  const totalFeedbacksCount = submitted.length;
  const totalRespondentsCount = topic.isAllUsers
    ? totalUsers
    : (topic.userIds?.length ?? 0);
  const progress =
    totalRespondentsCount > 0
      ? Math.round((respondentsCount / totalRespondentsCount) * 100)
      : 0;

  return {
    submitted,
    respondentsCount,
    totalFeedbacksCount,
    totalRespondentsCount,
    progress,
  };
}

async function recentRespondents(ctx: QueryCtx, submitted: Doc<"feedback">[]) {
  const seen = new Set<string>();
  const ordered = [...submitted].sort(
    (a, b) => (b.dateSubmitted ?? 0) - (a.dateSubmitted ?? 0),
  );
  const result: Array<{ image: string; initials: string; name: string }> = [];
  for (const f of ordered) {
    if (seen.has(f.userId)) continue;
    seen.add(f.userId);
    const u = await ctx.db.get(f.userId);
    const name = userDisplayName(u);
    result.push({
      image: u?.userImage ?? u?.image ?? "",
      initials: initialsOf(name),
      name,
    });
    if (result.length >= 3) break;
  }
  return result;
}

const PUBLIC_STATUSES = new Set(["ACTIVE", "COMPLETED", "PAUSED", "PUBLISHED"]);

export const list = query({
  args: {
    filter: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const filter = args.filter ?? "all";
    const search = (args.search ?? "").trim().toLowerCase();

    const all = await ctx.db
      .query("topics")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    let filtered = all.filter((t) => {
      switch (filter) {
        case "active":
          return t.status === "ACTIVE";
        case "draft":
          return t.status === "DRAFT" && t.userId === user._id;
        case "completed":
          return t.status === "COMPLETED";
        default:
          return (
            PUBLIC_STATUSES.has(t.status) ||
            (t.status === "DRAFT" && t.userId === user._id)
          );
      }
    });

    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.topicCode.toLowerCase().includes(search),
      );
    }

    const statusOrder: Record<string, number> = {
      ACTIVE: 0,
      PUBLISHED: 1,
      PAUSED: 2,
      DRAFT: 3,
      COMPLETED: 4,
      ARCHIVED: 5,
    };
    filtered.sort(
      (a, b) =>
        (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) ||
        b._creationTime - a._creationTime,
    );

    const totalUsers = await companyUserCount(ctx, companyId);

    const topics = await Promise.all(
      filtered.map(async (t) => {
        const stats = await computeStats(ctx, t, totalUsers);
        return {
          id: t._id,
          topicCode: t.topicCode,
          name: t.name,
          description: t.description ?? "",
          status: t.status,
          endDate: iso(t.endDate) ?? "",
          channels: t.channels ?? [],
          progress: stats.progress,
          respondentsCount: stats.respondentsCount,
          totalRespondentsCount: stats.totalRespondentsCount,
          totalFeedbacksCount: stats.totalFeedbacksCount,
          recentRespondents: await recentRespondents(ctx, stats.submitted),
        };
      }),
    );

    return { totalCount: topics.length, pageCount: 1, topics };
  },
});

async function attachmentsFor(ctx: QueryCtx, topic: Doc<"topics">) {
  const ids = topic.attachmentIds ?? [];
  const creator = await ctx.db.get(topic.userId);
  const createdBy = userDisplayName(creator);
  const out = [];
  for (const fid of ids) {
    const file = await ctx.db.get(fid);
    if (!file) continue;
    out.push({
      id: file._id,
      url: (await ctx.storage.getUrl(file.storageId)) ?? "",
      fileName: file.fileName,
      fileExtension: file.fileExtension ?? "",
      fileSize: file.fileSize ?? 0,
      contentType: file.contentType ?? "",
      contentHash: "",
      createdAt: new Date(file._creationTime).toISOString(),
      createdBy,
    });
  }
  return out;
}

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await ctx.db
      .query("topics")
      .withIndex("by_code", (q) => q.eq("topicCode", args.code))
      .unique();
    if (!topic || topic.companyId !== companyId) return null;

    return {
      id: topic._id,
      topicCode: topic.topicCode,
      name: topic.name,
      description: topic.description,
      status: topic.status,
      content: topic.content,
      channels: topic.channels ?? [],
      startDate: iso(topic.startDate),
      endDate: iso(topic.endDate),
      isAllUsers: topic.isAllUsers,
      userIds: topic.userIds ?? [],
      topicAttachments: await attachmentsFor(ctx, topic),
    };
  },
});

async function loadOwnTopic(
  ctx: QueryCtx,
  id: Id<"topics">,
  companyId: Id<"companies">,
) {
  const topic = await ctx.db.get(id);
  if (!topic || topic.companyId !== companyId) return null;
  return topic;
}

export const statistics = query({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await loadOwnTopic(ctx, args.id, companyId);
    if (!topic) return null;
    const totalUsers = await companyUserCount(ctx, companyId);
    const stats = await computeStats(ctx, topic, totalUsers);
    const creator = await ctx.db.get(topic.userId);
    return {
      id: topic._id,
      topicCode: topic.topicCode,
      name: topic.name,
      respondentsCount: stats.respondentsCount,
      totalRespondentsCount: stats.totalRespondentsCount,
      totalFeedbacksCount: stats.totalFeedbacksCount,
      startDate: iso(topic.startDate),
      endDate: iso(topic.endDate),
      createdAt: new Date(topic._creationTime).toISOString(),
      channels: topic.channels ?? [],
      status: topic.status,
      role: creator?.role ?? "",
      displayName: userDisplayName(creator),
    };
  },
});

export const respondents = query({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await loadOwnTopic(ctx, args.id, companyId);
    if (!topic) return [];
    const submitted = await ctx.db
      .query("feedback")
      .withIndex("by_topic_status", (q) =>
        q.eq("topicId", topic._id).eq("status", "SUBMITTED"),
      )
      .collect();

    const counts = new Map<string, number>();
    for (const f of submitted) {
      counts.set(f.userId, (counts.get(f.userId) ?? 0) + 1);
    }
    const out = [];
    for (const [userId, feedbackCount] of counts) {
      const u = await ctx.db.get(userId as Id<"users">);
      const displayName = userDisplayName(u);
      out.push({
        id: userId,
        displayName,
        image: u?.userImage ?? u?.image ?? "",
        initials: initialsOf(displayName),
        role: u?.role ?? "MEMBER",
        feedbackCount,
      });
    }
    out.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return out;
  },
});

export const topicFeedbacks = query({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await loadOwnTopic(ctx, args.id, companyId);
    if (!topic) return [];
    const submitted = await ctx.db
      .query("feedback")
      .withIndex("by_topic_status", (q) =>
        q.eq("topicId", topic._id).eq("status", "SUBMITTED"),
      )
      .collect();

    const out = [];
    for (const f of submitted) {
      const u = await ctx.db.get(f.userId);
      const displayName = userDisplayName(u);

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
          initials: initialsOf(displayName),
          userImage: u?.userImage ?? u?.image ?? "",
        },
        dateSubmitted: iso(f.dateSubmitted) ?? "",
        sentiment: f.sentiment,
        text: f.text,
        textLangCode: f.textLangCode,
        transcribedText: f.transcribeText,
        transcribedTextLangCode: f.transcribeTextLangCode,
        imageFiles,
        audioFile,
      });
    }
    return out;
  },
});

export const contents = query({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await loadOwnTopic(ctx, args.id, companyId);
    if (!topic) return null;
    return {
      id: topic._id,
      description: topic.description ?? "",
      attachments: await attachmentsFor(ctx, topic),
    };
  },
});

export const inactiveCounts = query({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const all = await ctx.db
      .query("topics")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    return {
      draft: all.filter((t) => t.status === "DRAFT" && t.userId === user._id)
        .length,
      paused: all.filter((t) => t.status === "PAUSED").length,
    };
  },
});

export const assigned = query({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const all = await ctx.db
      .query("topics")
      .withIndex("by_company_status", (q) =>
        q.eq("companyId", companyId).eq("status", "ACTIVE"),
      )
      .collect();
    const totalUsers = await companyUserCount(ctx, companyId);

    const assignedTopics = all.filter(
      (t) => t.isAllUsers || (t.userIds ?? []).includes(user._id),
    );

    return Promise.all(
      assignedTopics.map(async (t) => {
        const stats = await computeStats(ctx, t, totalUsers);
        const mine = await ctx.db
          .query("feedback")
          .withIndex("by_topic_user", (q) =>
            q.eq("topicId", t._id).eq("userId", user._id),
          )
          .collect();
        const creator = await ctx.db.get(t.userId);
        return {
          id: t._id,
          topicCode: t.topicCode,
          name: t.name,
          description: t.description ?? "",
          channels: t.channels ?? [],
          initiatedByRole: creator?.role ?? "",
          initiatedBy: userDisplayName(creator),
          startDate: iso(t.startDate),
          endDate: iso(t.endDate),
          respondentsCount: stats.respondentsCount,
          totalRespondentsCount: stats.totalRespondentsCount,
          totalFeedbacksCount: stats.totalFeedbacksCount,
          myFeedbacksCount: mine.length,
          status: t.status,
        };
      }),
    );
  },
});

export const completed = query({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    const all = await ctx.db
      .query("topics")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const totalUsers = await companyUserCount(ctx, companyId);

    const visible = all.filter(
      (t) =>
        (t.status === "COMPLETED" || t.status === "ACTIVE") &&
        (t.isAllUsers || (t.userIds ?? []).includes(user._id)),
    );

    return Promise.all(
      visible.map(async (t) => {
        const stats = await computeStats(ctx, t, totalUsers);
        const creator = await ctx.db.get(t.userId);
        return {
          id: t._id,
          topicCode: t.topicCode,
          topicName: t.name,
          respondentsCount: stats.respondentsCount,
          feedbacksCount: stats.totalFeedbacksCount,
          initiatedByRole: creator?.role ?? "",
          initiatedBy: userDisplayName(creator),
          status: t.status,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    locationId: v.id("locations"),
    disciplineId: v.id("disciplines"),
  },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const location = await ctx.db.get(args.locationId);
    const discipline = await ctx.db.get(args.disciplineId);
    if (!location || location.companyId !== companyId) {
      throw new Error("Invalid location");
    }
    if (!discipline || discipline.companyId !== companyId) {
      throw new Error("Invalid discipline");
    }

    const topicCode = await generateTopicCode(ctx, {
      companyId,
      locationId: args.locationId,
      disciplineId: args.disciplineId,
      locationCode: location.code,
      disciplineCode: discipline.code,
    });

    const id = await ctx.db.insert("topics", {
      topicCode,
      name: args.name,
      status: "DRAFT",
      isAllUsers: true,
      userId: user._id,
      companyId,
      locationId: args.locationId,
      disciplineId: args.disciplineId,
    });

    return { id, topicCode };
  },
});

export const addAttachments = mutation({
  args: {
    id: v.id("topics"),
    files: v.array(
      v.object({
        storageId: v.id("_storage"),
        fileName: v.string(),
        fileExtension: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        contentType: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const topic = await loadOwnTopic(ctx, args.id, companyId);
    if (!topic) throw new Error("Topic not found");

    const fileIds: Id<"files">[] = [];
    for (const f of args.files) {
      const fid = await ctx.db.insert("files", {
        storageId: f.storageId,
        fileName: f.fileName,
        fileExtension: f.fileExtension,
        fileSize: f.fileSize,
        contentType: f.contentType,
        userId: user._id,
        companyId,
      });
      fileIds.push(fid);
    }
    await ctx.db.patch(args.id, {
      attachmentIds: [...(topic.attachmentIds ?? []), ...fileIds],
    });
    return { ok: true };
  },
});

export const update = mutation({
  args: {
    id: v.id("topics"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    channels: v.optional(v.array(v.string())),
    startDate: v.optional(v.union(v.number(), v.null())),
    endDate: v.optional(v.union(v.number(), v.null())),
    isAllUsers: v.optional(v.boolean()),
    userIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await loadOwnTopic(ctx, args.id, companyId);
    if (!topic) throw new Error("Topic not found");

    const patch: Partial<Doc<"topics">> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.description !== undefined) patch.description = args.description;
    if (args.content !== undefined) patch.content = args.content;
    if (args.channels !== undefined) patch.channels = args.channels;
    if (args.startDate !== undefined)
      patch.startDate = args.startDate ?? undefined;
    if (args.endDate !== undefined) patch.endDate = args.endDate ?? undefined;
    if (args.isAllUsers !== undefined) patch.isAllUsers = args.isAllUsers;
    if (args.userIds !== undefined) patch.userIds = args.userIds;

    await ctx.db.patch(args.id, patch);
    return { ok: true };
  },
});

export const publish = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await loadOwnTopic(ctx, args.id, companyId);
    if (!topic) throw new Error("Topic not found");

    const errors: string[] = [];
    if (!topic.name || topic.name.length > 100) errors.push("name");
    if (!topic.description || topic.description.length > 500)
      errors.push("description");
    if (topic.startDate == null) errors.push("startDate");
    if (topic.endDate == null) errors.push("endDate");
    if (topic.startDate != null && topic.endDate != null && topic.endDate <= topic.startDate)
      errors.push("endDate must be after startDate");
    if (!topic.channels || topic.channels.length === 0) errors.push("channels");
    if (!topic.isAllUsers && (topic.userIds?.length ?? 0) === 0)
      errors.push("userIds");
    if (errors.length) {
      throw new Error(`Cannot publish: missing/invalid ${errors.join(", ")}`);
    }

    const now = Date.now();
    const status = topic.startDate! <= now ? "ACTIVE" : "PUBLISHED";
    await ctx.db.patch(args.id, { status });
    return { ok: true, status };
  },
});

export const pause = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await loadOwnTopic(ctx, args.id, companyId);
    if (!topic) throw new Error("Topic not found");
    if (topic.status !== "ACTIVE" && topic.status !== "PUBLISHED") {
      throw new Error("Only active or published topics can be paused");
    }
    await ctx.db.patch(args.id, { status: "PAUSED" });
    return { ok: true };
  },
});

export const archive = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await loadOwnTopic(ctx, args.id, companyId);
    if (!topic) throw new Error("Topic not found");
    await ctx.db.patch(args.id, { status: "ARCHIVED" });
    return { ok: true };
  },
});

export const remove = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, args) => {
    const { companyId } = await requireCompany(ctx);
    const topic = await loadOwnTopic(ctx, args.id, companyId);
    if (!topic) throw new Error("Topic not found");
    if (topic.status !== "DRAFT") {
      throw new Error("Only draft topics can be deleted");
    }
    await ctx.db.delete(args.id);
    return { ok: true };
  },
});

// Lifecycle sweep run by cron: PUBLISHED -> ACTIVE at startDate, ACTIVE -> COMPLETED after endDate.
export const runLifecycle = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const topics = await ctx.db.query("topics").collect();
    for (const t of topics) {
      if (
        t.status === "PUBLISHED" &&
        t.startDate != null &&
        t.startDate <= now
      ) {
        await ctx.db.patch(t._id, { status: "ACTIVE" });
      } else if (
        t.status === "ACTIVE" &&
        t.endDate != null &&
        t.endDate <= now
      ) {
        await ctx.db.patch(t._id, { status: "COMPLETED" });
        await ctx.db.insert("notifications", {
          companyId: t.companyId,
          type: "topic-completed",
          title: "Topic completed",
          body: `Topic ${t.topicCode} — ${t.name} has completed.`,
          payload: { topicId: t._id, topicCode: t.topicCode },
          userIds: t.isAllUsers ? [] : (t.userIds ?? []),
        });
      }
    }
    return { ok: true };
  },
});
