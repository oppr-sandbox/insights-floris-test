import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Atomic, transactional sequence increment. Convex mutations run in a
// serializable transaction, so read-modify-write on the counter is safe.
export async function nextSeq(ctx: MutationCtx, key: string): Promise<number> {
  const existing = await ctx.db
    .query("counters")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (existing) {
    const value = existing.value + 1;
    await ctx.db.patch(existing._id, { value });
    return value;
  }
  await ctx.db.insert("counters", { key, value: 1 });
  return 1;
}

const pad = (n: number, width: number) => n.toString().padStart(width, "0");

// {LocationCode}-{DisciplineCode}-TOP-{seq:0000}
export async function generateTopicCode(
  ctx: MutationCtx,
  args: {
    companyId: Id<"companies">;
    locationId: Id<"locations">;
    disciplineId: Id<"disciplines">;
    locationCode: string;
    disciplineCode: string;
  },
): Promise<string> {
  const key = `topic:${args.companyId}:${args.locationId}:${args.disciplineId}`;
  const seq = await nextSeq(ctx, key);
  return `${args.locationCode}-${args.disciplineCode}-TOP-${pad(seq, 4)}`;
}

// {TopicCode}-FBK-{seq:0000}
export async function generateFeedbackCode(
  ctx: MutationCtx,
  topicId: Id<"topics">,
  topicCode: string,
): Promise<string> {
  const seq = await nextSeq(ctx, `feedback:${topicId}`);
  return `${topicCode}-FBK-${pad(seq, 4)}`;
}

// {TopicCode}-INS-{seq:00}
export async function generateInsightCode(
  ctx: MutationCtx,
  topicId: Id<"topics">,
  topicCode: string,
): Promise<string> {
  const seq = await nextSeq(ctx, `insight:${topicId}`);
  return `${topicCode}-INS-${pad(seq, 2)}`;
}
