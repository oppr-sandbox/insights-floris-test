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
  })
    .index("by_company", ["companyId"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_topic", ["topicId"])
    .index("by_code", ["insightCode"]),

  aiChatHistory: defineTable({
    insightId: v.id("insights"),
    userId: v.id("users"),
    companyId: v.id("companies"),
    role: v.string(), // "user" | "assistant"
    parts: v.any(),
    metadata: v.optional(v.any()),
  }).index("by_insight_user", ["insightId", "userId"]),

  files: defineTable({
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileExtension: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    contentType: v.optional(v.string()),
    userId: v.id("users"),
    companyId: v.id("companies"),
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
});
