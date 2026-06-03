import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireCompany, isManager } from "./lib/auth";

export type LensSection = { key: string; title: string; guidance?: string };

type DefaultLens = {
  key: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  sections: LensSection[];
  generatesReport: boolean;
  sortOrder: number;
};

// Built-in lenses seeded for every company. Edit/extend from the Config UI;
// `restoreDefaults` only fills in missing built-ins, it never overwrites edits.
export const DEFAULT_LENSES: DefaultLens[] = [
  {
    key: "general",
    name: "General",
    description: "Open-ended Q&A about this topic and its feedback.",
    icon: "MessagesSquare",
    generatesReport: false,
    sortOrder: 0,
    sections: [],
    systemPrompt: [
      "Your name is IDA. You are an expert analyst of employee feedback for the topic in context.",
      "Answer the user's questions about the topic, its feedback and any generated insights.",
      "Use the Feedback Code (not the id) when referring to a piece of feedback.",
      "If a question is out of context, politely say so rather than guessing.",
    ].join("\n"),
  },
  {
    key: "rca",
    name: "Root Cause Analysis",
    description: "A facilitated 5-Whys root cause analysis that builds toward a structured RCA report.",
    icon: "Search",
    generatesReport: true,
    sortOrder: 1,
    sections: [
      { key: "problem_definition", title: "Problem definition", guidance: "What is happening, where, since when, and the measurable impact." },
      { key: "evidence", title: "Context & evidence", guidance: "Evidence from the feedback and data that establishes the problem." },
      { key: "immediate_causes", title: "Immediate causes", guidance: "The direct, observable causes of the problem." },
      { key: "five_whys", title: "5-Whys analysis", guidance: "The chain of 'why' questions from symptom down to root cause." },
      { key: "root_cause", title: "Root cause(s)", guidance: "The validated underlying root cause(s)." },
      { key: "contributing_factors", title: "Contributing factors", guidance: "Systemic or contributing factors that allowed the problem." },
      { key: "corrective_actions", title: "Corrective actions", guidance: "Containment and permanent corrective actions." },
      { key: "preventive_actions", title: "Preventive actions", guidance: "Actions to prevent recurrence." },
      { key: "verification", title: "Verification & metrics", guidance: "How the fix will be verified and which metrics prove success." },
    ],
    systemPrompt: [
      "Your name is IDA. You are an operational-excellence facilitator running a Root Cause Analysis (5-Whys).",
      "Ground every step in the feedback and data provided in context.",
      "Interview the user ONE focused question at a time, building toward a complete RCA. Do not dump all questions at once.",
      "Work through, in order: problem definition, evidence, immediate causes, the 5-Whys chain, the validated root cause, contributing factors, corrective and preventive actions, and verification.",
      "Reflect back what you've learned, confirm before moving on, and surface gaps. When every section can be answered, tell the user the analysis is ready to generate as a report.",
      "Use the Feedback Code (not the id) when citing feedback.",
    ].join("\n"),
  },
  {
    key: "fishbone",
    name: "Fishbone (Ishikawa)",
    description: "A facilitated 6M cause-and-effect analysis that builds toward a structured fishbone report.",
    icon: "GitFork",
    generatesReport: true,
    sortOrder: 2,
    sections: [
      { key: "problem_statement", title: "Problem statement", guidance: "The effect/problem at the head of the fishbone." },
      { key: "people", title: "People (Man)", guidance: "Causes related to people: skills, staffing, training, shifts, communication." },
      { key: "machine", title: "Machine", guidance: "Causes related to equipment, tooling, maintenance, settings." },
      { key: "method", title: "Method", guidance: "Causes related to process, procedures, work instructions." },
      { key: "material", title: "Material", guidance: "Causes related to inputs, components, suppliers, specifications." },
      { key: "measurement", title: "Measurement", guidance: "Causes related to inspection, gauges, data quality, calibration." },
      { key: "environment", title: "Environment (Mother Nature)", guidance: "Causes related to workplace conditions, layout, temperature, housekeeping." },
      { key: "prioritized_causes", title: "Prioritized causes", guidance: "The most likely root causes drawn across all categories." },
      { key: "recommended_actions", title: "Recommended actions", guidance: "Recommended next steps and actions." },
    ],
    systemPrompt: [
      "Your name is IDA. You are an operational-excellence facilitator running an Ishikawa (fishbone) cause-and-effect analysis.",
      "First agree the precise problem statement (the effect). Then explore causes category by category across the 6Ms: People, Machine, Method, Material, Measurement, Environment.",
      "Interview the user ONE focused question at a time, grounded in the feedback and data in context. Do not list all categories at once.",
      "For each category, elicit concrete potential causes and supporting evidence. Afterward, help prioritize the most likely root causes and recommend actions.",
      "When every category and the prioritization can be answered, tell the user the analysis is ready to generate as a report.",
      "Use the Feedback Code (not the id) when citing feedback.",
    ].join("\n"),
  },
];

function toDto(d: {
  _id: Id<"lenses">;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  systemPrompt: string;
  sections: LensSection[];
  generatesReport: boolean;
  isBuiltIn: boolean;
  isEnabled: boolean;
  sortOrder?: number;
  temperature?: number;
}) {
  return {
    id: d._id,
    key: d.key,
    name: d.name,
    description: d.description ?? "",
    icon: d.icon ?? "Sparkles",
    systemPrompt: d.systemPrompt,
    sections: d.sections,
    generatesReport: d.generatesReport,
    isBuiltIn: d.isBuiltIn,
    isEnabled: d.isEnabled,
    sortOrder: d.sortOrder ?? 0,
    temperature: d.temperature,
  };
}

const sortLenses = <T extends { sortOrder?: number; name: string }>(rows: T[]) =>
  rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));

export const list = query({
  args: { onlyEnabled: v.optional(v.boolean()) },
  handler: async (ctx, { onlyEnabled }) => {
    const { companyId } = await requireCompany(ctx);
    let rows = await ctx.db
      .query("lenses")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    if (onlyEnabled) rows = rows.filter((r) => r.isEnabled);
    return sortLenses(rows).map(toDto);
  },
});

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const { companyId } = await requireCompany(ctx);
    const row = await ctx.db
      .query("lenses")
      .withIndex("by_company_key", (q) => q.eq("companyId", companyId).eq("key", key))
      .unique();
    return row ? toDto(row) : null;
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("lenses")),
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    systemPrompt: v.string(),
    sections: v.array(
      v.object({ key: v.string(), title: v.string(), guidance: v.optional(v.string()) }),
    ),
    generatesReport: v.boolean(),
    isEnabled: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    temperature: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user, companyId } = await requireCompany(ctx);
    const now = Date.now();
    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (!existing || existing.companyId !== companyId) throw new Error("Lens not found");
      await ctx.db.patch(args.id, {
        name: args.name,
        description: args.description,
        icon: args.icon,
        systemPrompt: args.systemPrompt,
        sections: args.sections,
        generatesReport: args.generatesReport,
        isEnabled: args.isEnabled ?? existing.isEnabled,
        sortOrder: args.sortOrder ?? existing.sortOrder,
        temperature: args.temperature,
        updatedAt: now,
      });
      return { id: args.id };
    }

    const clash = await ctx.db
      .query("lenses")
      .withIndex("by_company_key", (q) => q.eq("companyId", companyId).eq("key", args.key))
      .unique();
    if (clash) throw new Error(`A lens with key "${args.key}" already exists`);

    const id = await ctx.db.insert("lenses", {
      companyId,
      key: args.key,
      name: args.name,
      description: args.description,
      icon: args.icon,
      systemPrompt: args.systemPrompt,
      sections: args.sections,
      generatesReport: args.generatesReport,
      isBuiltIn: false,
      isEnabled: args.isEnabled ?? true,
      sortOrder: args.sortOrder,
      temperature: args.temperature,
      createdBy: user._id,
      updatedAt: now,
    });
    return { id };
  },
});

export const setEnabled = mutation({
  args: { id: v.id("lenses"), isEnabled: v.boolean() },
  handler: async (ctx, { id, isEnabled }) => {
    const { companyId } = await requireCompany(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.companyId !== companyId) throw new Error("Lens not found");
    await ctx.db.patch(id, { isEnabled, updatedAt: Date.now() });
    return { ok: true };
  },
});

export const remove = mutation({
  args: { id: v.id("lenses") },
  handler: async (ctx, { id }) => {
    const { companyId } = await requireCompany(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.companyId !== companyId) throw new Error("Lens not found");
    if (row.isBuiltIn) throw new Error("Built-in lenses can't be deleted — disable it instead");
    await ctx.db.delete(id);
    return { ok: true };
  },
});

// Idempotently seed the built-in lenses for every company. Only inserts
// missing built-ins; never overwrites user edits. Dev/seed convenience —
// also exposed so the Config UI can offer "restore defaults".
export const restoreDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const { user, companyId } = await requireCompany(ctx);
    if (!isManager(user)) throw new Error("Not authorized");
    let created = 0;
    {
      const existing = await ctx.db
        .query("lenses")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .collect();
      const haveKeys = new Set(existing.map((l) => l.key));
      for (const def of DEFAULT_LENSES) {
        if (haveKeys.has(def.key)) continue;
        await ctx.db.insert("lenses", {
          companyId,
          key: def.key,
          name: def.name,
          description: def.description,
          icon: def.icon,
          systemPrompt: def.systemPrompt,
          sections: def.sections,
          generatesReport: def.generatesReport,
          isBuiltIn: true,
          isEnabled: true,
          sortOrder: def.sortOrder,
          updatedAt: Date.now(),
        });
        created++;
      }
    }
    return { created };
  },
});
