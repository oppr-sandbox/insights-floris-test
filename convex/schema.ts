import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const topicStatus = v.union(
  v.literal("DRAFT"),
  v.literal("PUBLISHED"),
  v.literal("ACTIVE"),
  v.literal("PAUSED"),
  v.literal("COMPLETED"),
  v.literal("ARCHIVED"),
);

export const feedbackStatus = v.union(
  v.literal("DRAFT"),
  v.literal("SUBMITTED"),
);

export const insightStatus = v.union(
  v.literal("GENERATING"),
  v.literal("DRAFT"),
  v.literal("PUBLISHED"),
  v.literal("FAILED"),
);

export const userRole = v.union(
  v.literal("OWNER"),
  v.literal("ADMIN"),
  v.literal("MEMBER"),
);

export default defineSchema({
  ...authTables,

  // Convex Auth's users table, extended with app/profile fields.
  users: defineTable({
    // Convex Auth defaults:
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // App profile:
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    userImage: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    role: v.optional(userRole),
    locationId: v.optional(v.id("locations")),
    disciplineId: v.optional(v.id("disciplines")),
    lastLogin: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("by_company", ["companyId"]),

  companies: defineTable({
    name: v.string(),
    slug: v.string(),
    subdomain: v.optional(v.string()),
    companyEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    street: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    city: v.optional(v.string()),
    languageId: v.optional(v.id("languages")),
    countryId: v.optional(v.id("countries")),
  }).index("by_slug", ["slug"]),

  locations: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    code: v.string(),
  }).index("by_company", ["companyId"]),

  disciplines: defineTable({
    companyId: v.id("companies"),
    name: v.string(),
    code: v.string(),
  }).index("by_company", ["companyId"]),

  languages: defineTable({
    name: v.string(),
    languageCode: v.string(),
  }).index("by_code", ["languageCode"]),

  countries: defineTable({
    name: v.string(),
    countryCode: v.string(),
  }).index("by_code", ["countryCode"]),

  topics: defineTable({
    topicCode: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    channels: v.optional(v.array(v.string())),
    status: topicStatus,
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isAllUsers: v.boolean(),
    userIds: v.optional(v.array(v.id("users"))),
    userId: v.id("users"), // creator
    companyId: v.id("companies"),
    locationId: v.id("locations"),
    disciplineId: v.id("disciplines"),
    attachmentIds: v.optional(v.array(v.id("files"))),
  })
    .index("by_company", ["companyId"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_company_creator", ["companyId", "userId"])
    .index("by_code", ["topicCode"]),

  feedback: defineTable({
    feedbackCode: v.string(),
    userId: v.id("users"),
    companyId: v.id("companies"),
    topicId: v.id("topics"),
    text: v.optional(v.string()),
    textLangCode: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    status: feedbackStatus,
    dateSubmitted: v.optional(v.number()),
    transcribeText: v.optional(v.string()),
    transcribeTextLangCode: v.optional(v.string()),
    imageFileIds: v.optional(v.array(v.id("files"))),
    audioFileId: v.optional(v.id("files")),
  })
    .index("by_topic", ["topicId"])
    .index("by_topic_status", ["topicId", "status"])
    .index("by_user", ["userId"])
    .index("by_topic_user", ["topicId", "userId"])
    .index("by_company", ["companyId"])
    .index("by_code", ["feedbackCode"]),

  insights: defineTable({
    insightCode: v.string(),
    topicId: v.id("topics"),
    companyId: v.id("companies"),
    userId: v.id("users"), // creator
    calculatedAt: v.optional(v.number()),
    status: insightStatus,
    publishedDate: v.optional(v.number()),
    // AI output (deeply-nested JSON; kept flexible like the original JSONB columns)
    summary: v.optional(v.any()),
    sentiment: v.optional(v.any()),
    contradiction: v.optional(v.any()),
    finding: v.optional(v.any()),
    feedbackIds: v.array(v.id("feedback")),
    error: v.optional(v.string()),
    // Free-text tag/note set when publishing, to distinguish multiple
    // insights generated for the same topic.
    label: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_topic", ["topicId"])
    .index("by_code", ["insightCode"]),

  aiChatHistory: defineTable({
    insightId: v.optional(v.id("insights")),
    // Lens-aware chat threads through an analysis session; lensKey separates
    // each "hat" so transcripts never cross-contaminate.
    sessionId: v.optional(v.id("analysisSessions")),
    lensKey: v.optional(v.string()),
    userId: v.id("users"),
    companyId: v.id("companies"),
    role: v.string(), // "user" | "assistant"
    parts: v.any(),
    metadata: v.optional(v.any()),
  })
    .index("by_insight_user", ["insightId", "userId"])
    .index("by_session_user", ["sessionId", "userId"]),

  files: defineTable({
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileExtension: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    contentType: v.optional(v.string()),
    userId: v.id("users"),
    companyId: v.id("companies"),
    // Knowledge-bucket ingestion: documents are parsed to Markdown so the AI
    // can reason over their contents, not just their filename.
    parseStatus: v.optional(v.string()), // PENDING | PARSING | PARSED | FAILED | UNSUPPORTED
    parsedText: v.optional(v.string()), // Markdown representation
    parseError: v.optional(v.string()),
  }).index("by_company", ["companyId"]),

  notifications: defineTable({
    companyId: v.id("companies"),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    payload: v.optional(v.any()),
    userIds: v.array(v.id("users")), // recipients
  }).index("by_company", ["companyId"]),

  notificationReads: defineTable({
    notificationId: v.id("notifications"),
    userId: v.id("users"),
    readAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_notification_user", ["notificationId", "userId"]),

  // Atomic counters backing the human-readable code generators
  // (topic / feedback / insight codes). Key encodes the scope.
  counters: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),

  // Isolated insight-generation test runs from the Config command center.
  // Kept separate from `insights` so prompt/model experiments never touch
  // real data or fire notifications.
  aiRuns: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"),
    topicId: v.id("topics"),
    source: v.string(), // "lab"
    mode: v.string(), // "single" | "stepwise"
    model: v.string(), // requested primary model
    temperature: v.number(),
    promptOverride: v.optional(v.string()),
    status: v.string(), // "running" | "done" | "failed"
    modelUsed: v.optional(v.string()),
    rawOutput: v.optional(v.string()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
  }).index("by_company", ["companyId"]),

  // Streaming dev-log lines for a run; ordered by _creationTime.
  aiRunLogs: defineTable({
    runId: v.id("aiRuns"),
    level: v.string(), // "info" | "step" | "success" | "warn" | "error"
    message: v.string(),
    data: v.optional(v.any()),
  }).index("by_run", ["runId"]),

  // Global key/value app settings (e.g. the active insight-generation model
  // override, set from the Config command center).
  appSettings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  // Configurable conversational "hats" / analysis methodologies (General,
  // Root Cause Analysis, Fishbone, …). A lens is pure data: its `sections`
  // drive both how the bot interviews the user and the schema of the report
  // it generates, so new hats can be added from the Config UI without code.
  lenses: defineTable({
    companyId: v.id("companies"),
    key: v.string(), // slug, unique per company: "general" | "rca" | "fishbone" | custom
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // lucide icon name
    systemPrompt: v.string(),
    // Report chapters; each is a question the bot drives toward and a section
    // in the generated report.
    sections: v.array(
      v.object({
        key: v.string(),
        title: v.string(),
        guidance: v.optional(v.string()),
      }),
    ),
    generatesReport: v.boolean(), // false for free-chat lenses like "General"
    isBuiltIn: v.boolean(),
    isEnabled: v.boolean(),
    sortOrder: v.optional(v.number()),
    temperature: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_company_key", ["companyId", "key"]),

  // A chat workspace over one or more insights under a chosen lens. The
  // single-insight chat is just a session with one insightId; multi-insight
  // analysis is the same model with N>1.
  analysisSessions: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"), // owner
    title: v.optional(v.string()),
    // Conversational mode. "ask" = general, unflavored chat over a slice;
    // "guided" = a lens-driven interview that builds toward a report.
    mode: v.optional(v.string()), // "ask" | "guided"
    // Sources the session reasons over. A session can mix generated insights
    // and raw topics (the latter feed topic + all submitted feedback directly).
    insightIds: v.array(v.id("insights")),
    topicIds: v.optional(v.array(v.id("topics"))),
    // Generated deep-dive reports folded into the conversation's context.
    reportIds: v.optional(v.array(v.id("analysisReports"))),
    lensKey: v.string(),
    // For the auto-created single-insight chat sessions, lets us find/reuse
    // the session for (insight, lens, user) without scanning.
    primaryInsightId: v.optional(v.id("insights")),
    // Anchor topic for guided sessions started from a single topic's Analysis
    // area — lets us list a topic's guided analyses without scanning arrays.
    primaryTopicId: v.optional(v.id("topics")),
    // Documents the user uploads mid-interview to add evidence on request.
    attachmentIds: v.optional(v.array(v.id("files"))),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_company", ["companyId"])
    .index("by_company_user", ["companyId", "userId"])
    .index("by_company_topic", ["companyId", "primaryTopicId"])
    .index("by_owner_lens_primary", ["userId", "lensKey", "primaryInsightId"]),

  // A generated, structured report produced from a session's transcript +
  // context, shaped by the lens's `sections`. Downloadable like the topic
  // snapshot.
  analysisReports: defineTable({
    companyId: v.id("companies"),
    sessionId: v.id("analysisSessions"),
    lensKey: v.string(),
    title: v.string(),
    status: v.string(), // "GENERATING" | "COMPLETE" | "FAILED"
    sections: v.optional(v.any()), // [{ key, title, content }]
    error: v.optional(v.string()),
    generatedBy: v.id("users"),
    generatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_session", ["sessionId"]),
});
