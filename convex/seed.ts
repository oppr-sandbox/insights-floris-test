import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { topicStatus } from "./schema";
import { Infer } from "convex/values";
import { generateTopicCode, generateFeedbackCode } from "./lib/codes";
import { DEFAULT_LENSES } from "./lenses";

// Seeds the sandbox: one company (slug "oppr") plus reference data, so that
// magic-link users land in a real tenant and topic codes resolve. Idempotent.
export const init = internalMutation({
  args: {},
  handler: async (ctx) => {
    let company = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", "oppr"))
      .unique();

    if (!company) {
      const companyId = await ctx.db.insert("companies", {
        name: "Oppr",
        slug: "oppr",
        subdomain: "oppr",
        companyEmail: "hello@oppr.ai",
      });
      company = await ctx.db.get(companyId);
    }
    const companyId = company!._id;

    const existingLocations = await ctx.db
      .query("locations")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    if (existingLocations.length === 0) {
      await ctx.db.insert("locations", {
        companyId,
        name: "Amsterdam",
        code: "AMS",
      });
      await ctx.db.insert("locations", {
        companyId,
        name: "Rotterdam",
        code: "RTM",
      });
    }

    const existingDisciplines = await ctx.db
      .query("disciplines")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    if (existingDisciplines.length === 0) {
      await ctx.db.insert("disciplines", { companyId, name: "IT", code: "IT" });
      await ctx.db.insert("disciplines", {
        companyId,
        name: "Operations",
        code: "OPS",
      });
    }

    const existingLanguages = await ctx.db.query("languages").take(1);
    if (existingLanguages.length === 0) {
      await ctx.db.insert("languages", { name: "English", languageCode: "en" });
      await ctx.db.insert("languages", { name: "Dutch", languageCode: "nl" });
    }

    const existingCountries = await ctx.db.query("countries").take(1);
    if (existingCountries.length === 0) {
      await ctx.db.insert("countries", {
        name: "Netherlands",
        countryCode: "NL",
      });
    }

    const existingLenses = await ctx.db
      .query("lenses")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
    const haveLensKeys = new Set(existingLenses.map((l) => l.key));
    for (const def of DEFAULT_LENSES) {
      if (haveLensKeys.has(def.key)) continue;
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
    }

    return { companyId, slug: "oppr" };
  },
});

type TopicStatus = Infer<typeof topicStatus>;
type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

// Serializes plain paragraphs into a Lexical SerializedEditorState string,
// which is what the topic `content` field stores and the editor JSON.parses.
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

// Realistic industrial sandbox: a Dutch beverage bottling company with a full
// cast of employees and three idea-box topics seeded with text feedback.
// Fully resets the demo data on each run (idempotent) without touching the
// authenticated owner account or its auth records.
export const demo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Company — reuse the "oppr" tenant slug, rebrand the display name.
    let company = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", "oppr"))
      .unique();
    if (!company) {
      const id = await ctx.db.insert("companies", {
        name: "Maasvallei Dranken B.V.",
        slug: "oppr",
        subdomain: "maasvallei",
        companyEmail: "info@maasvallei.nl",
      });
      company = await ctx.db.get(id);
    } else {
      await ctx.db.patch(company._id, {
        name: "Maasvallei Dranken B.V.",
        subdomain: "maasvallei",
        companyEmail: "info@maasvallei.nl",
      });
    }
    const companyId = company!._id;

    // 2. Reset previously-seeded demo data for this company.
    for (const f of await ctx.db
      .query("feedback")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect()) {
      await ctx.db.delete(f._id);
    }
    for (const i of await ctx.db
      .query("insights")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect()) {
      await ctx.db.delete(i._id);
    }
    for (const t of await ctx.db
      .query("topics")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect()) {
      await ctx.db.delete(t._id);
    }
    for (const n of await ctx.db
      .query("notifications")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect()) {
      for (const r of await ctx.db
        .query("notificationReads")
        .withIndex("by_notification_user", (q) =>
          q.eq("notificationId", n._id),
        )
        .collect()) {
        await ctx.db.delete(r._id);
      }
      await ctx.db.delete(n._id);
    }
    // Drop previously-seeded cast (keep the real authenticated owner).
    for (const u of await ctx.db
      .query("users")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect()) {
      if ((u.email ?? "").endsWith("@maasvallei.nl")) await ctx.db.delete(u._id);
    }
    // Reset code counters so topic/feedback codes start clean.
    for (const c of await ctx.db.query("counters").collect()) {
      await ctx.db.delete(c._id);
    }
    // Rebuild reference data (locations + disciplines).
    for (const l of await ctx.db
      .query("locations")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect()) {
      await ctx.db.delete(l._id);
    }
    for (const d of await ctx.db
      .query("disciplines")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect()) {
      await ctx.db.delete(d._id);
    }

    // 3. Reference data.
    if ((await ctx.db.query("languages").take(1)).length === 0) {
      await ctx.db.insert("languages", { name: "English", languageCode: "en" });
      await ctx.db.insert("languages", { name: "Dutch", languageCode: "nl" });
    }
    if ((await ctx.db.query("countries").take(1)).length === 0) {
      await ctx.db.insert("countries", {
        name: "Netherlands",
        countryCode: "NL",
      });
    }

    // 4. Sites (locations).
    const locId: Record<string, Id<"locations">> = {};
    for (const l of [
      { code: "RMD", name: "Roermond Bottling Plant" },
      { code: "VNL", name: "Venlo Distribution Center" },
    ]) {
      locId[l.code] = await ctx.db.insert("locations", {
        companyId,
        name: l.name,
        code: l.code,
      });
    }

    // 5. Departments (disciplines).
    const discId: Record<string, Id<"disciplines">> = {};
    for (const d of [
      { code: "PROD", name: "Production" },
      { code: "MAINT", name: "Maintenance" },
      { code: "QA", name: "Quality" },
      { code: "LOG", name: "Logistics" },
      { code: "HSE", name: "Health & Safety" },
      { code: "ENG", name: "Engineering" },
    ]) {
      discId[d.code] = await ctx.db.insert("disciplines", {
        companyId,
        name: d.name,
        code: d.code,
      });
    }

    // 6. People. The authenticated owner (floris@oppr.ai) is patched in place
    // so auth records stay intact; everyone else is freshly inserted.
    const uid: Record<string, Id<"users">> = {};

    const owner = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "floris@oppr.ai"))
      .unique();
    const ownerPatch = {
      firstName: "Floris",
      lastName: "Wyers",
      displayName: "Floris Wyers",
      role: "OWNER" as const,
      companyId,
      locationId: locId["RMD"],
      disciplineId: discId["ENG"],
    };
    if (owner) {
      await ctx.db.patch(owner._id, ownerPatch);
      uid["floris"] = owner._id;
    } else {
      uid["floris"] = await ctx.db.insert("users", {
        email: "floris@oppr.ai",
        ...ownerPatch,
      });
    }

    const cast: Array<{
      key: string;
      first: string;
      last: string;
      role: "OWNER" | "ADMIN" | "MEMBER";
      disc: string;
      loc: string;
    }> = [
      { key: "rob", first: "Rob", last: "van Dijk", role: "ADMIN", disc: "PROD", loc: "RMD" },
      { key: "sanne", first: "Sanne", last: "de Vries", role: "MEMBER", disc: "PROD", loc: "RMD" },
      { key: "joost", first: "Joost", last: "Bakker", role: "MEMBER", disc: "PROD", loc: "RMD" },
      { key: "eva", first: "Eva", last: "Timmermans", role: "MEMBER", disc: "PROD", loc: "RMD" },
      { key: "fatima", first: "Fatima", last: "El Amrani", role: "MEMBER", disc: "PROD", loc: "RMD" },
      { key: "ahmed", first: "Ahmed", last: "Yılmaz", role: "ADMIN", disc: "MAINT", loc: "RMD" },
      { key: "pieter", first: "Pieter", last: "Janssen", role: "MEMBER", disc: "MAINT", loc: "RMD" },
      { key: "bram", first: "Bram", last: "Smit", role: "MEMBER", disc: "ENG", loc: "RMD" },
      { key: "linda", first: "Linda", last: "Visser", role: "MEMBER", disc: "QA", loc: "RMD" },
      { key: "karin", first: "Karin", last: "Mulder", role: "ADMIN", disc: "HSE", loc: "RMD" },
      { key: "wesley", first: "Wesley", last: "de Boer", role: "MEMBER", disc: "LOG", loc: "VNL" },
    ];
    for (const p of cast) {
      uid[p.key] = await ctx.db.insert("users", {
        email: `${p.key}@maasvallei.nl`,
        firstName: p.first,
        lastName: p.last,
        displayName: `${p.first} ${p.last}`,
        role: p.role,
        companyId,
        locationId: locId[p.loc],
        disciplineId: discId[p.disc],
      });
    }

    // 7. Topics + feedback.
    const makeTopic = async (opts: {
      name: string;
      description: string;
      content: string[];
      creator: string;
      loc: string;
      disc: string;
      status: TopicStatus;
      startDaysAgo: number;
      endDaysFromNow: number;
    }) => {
      const topicCode = await generateTopicCode(ctx, {
        companyId,
        locationId: locId[opts.loc],
        disciplineId: discId[opts.disc],
        locationCode: opts.loc,
        disciplineCode: opts.disc,
      });
      const id = await ctx.db.insert("topics", {
        topicCode,
        name: opts.name,
        description: opts.description,
        content: lexicalDoc(opts.content),
        channels: ["TEXT"],
        status: opts.status,
        startDate: now - opts.startDaysAgo * DAY,
        endDate: now + opts.endDaysFromNow * DAY,
        isAllUsers: true,
        userId: uid[opts.creator],
        companyId,
        locationId: locId[opts.loc],
        disciplineId: discId[opts.disc],
      });
      return { id, topicCode };
    };

    const addFeedback = async (
      topicId: Id<"topics">,
      topicCode: string,
      rows: Array<[string, Sentiment, number, string]>,
    ) => {
      for (const [author, sentiment, daysAgo, text] of rows) {
        const feedbackCode = await generateFeedbackCode(ctx, topicId, topicCode);
        await ctx.db.insert("feedback", {
          feedbackCode,
          userId: uid[author],
          companyId,
          topicId,
          text,
          textLangCode: "en",
          sentiment,
          status: "SUBMITTED",
          dateSubmitted: now - daysAgo * DAY,
        });
      }
    };

    // Hero topic — unplanned downtime on Bottling Line 2.
    const downtime = await makeTopic({
      name: "Reducing unplanned downtime on Bottling Line 2",
      description:
        "We are losing too much production time to unplanned stops on Bottling Line 2. Share what you see causing the stoppages and your ideas to reduce them — from operators, maintenance, engineering and everyone in between.",
      content: [
        "Bottling Line 2 has had the highest unplanned downtime of any line over the past month. The stops are hurting our delivery commitments and creating extra pressure on every shift.",
        "We want ideas from the people closest to the line. What is actually causing the stops? What have you tried that worked? What would you change if it were up to you?",
        "Be specific — the machine, the moment in the shift, the procedure. Every observation helps us find the root cause.",
      ],
      creator: "rob",
      loc: "RMD",
      disc: "PROD",
      status: "ACTIVE",
      startDaysAgo: 14,
      endDaysFromNow: 7,
    });
    await addFeedback(downtime.id, downtime.topicCode, [
      ["joost", "NEGATIVE", 12, "Line 2 stops almost every time we switch to the 0.5L format. The labeller jams within the first hour after a changeover and we lose 20-30 minutes each time clearing it."],
      ["eva", "NEGATIVE", 11, "The labeller is the main problem. After a format change it misfeeds labels constantly. The older Line 1 labeller never does this, so I don't think it's just bad luck."],
      ["fatima", "NEGATIVE", 11, "On nights we get the most stops because there is no maintenance tech on site. When the capper trips we wait until morning. Twice last week we ran at half speed the whole shift."],
      ["sanne", "NEUTRAL", 10, "If you look at when the stops happen, most of them cluster right after a changeover. Once the line is running steady it is actually fine for hours."],
      ["pieter", "NEGATIVE", 10, "We keep getting pulled off the scheduled preventive maintenance to go fix breakdowns. If we were allowed to finish the weekly PM on Line 2 the capper wouldn't fail like this. Skipping PM is a false economy."],
      ["ahmed", "NEGATIVE", 9, "Production won't give us the maintenance window. Every week the PM slot gets cancelled because targets are tight, and then everyone is surprised when the line dies mid-shift. The downtime costs far more than a two-hour PM."],
      ["rob", "NEUTRAL", 9, "We genuinely cannot take Line 2 down for two hours every week right now — the order book is full and we would miss delivery windows. We need a fix that doesn't cost us a big block of production time."],
      ["joost", "NEGATIVE", 8, "Changeovers take far too long. The format change procedure isn't clear and every operator does it slightly differently. Standardising it would cut a lot of the stops on its own."],
      ["wesley", "NEUTRAL", 8, "From the DC side — when Line 2 stops unplanned it backs up the warehouse. We get a flood of pallets at once and then nothing. Steadier output would let us staff the docks properly."],
      ["pieter", "NEGATIVE", 7, "Half my day is spent waiting for spare parts. We don't keep the labeller feed wheels in stock, so when one wears out we wait three days for delivery. Keeping the critical spares on site would save days."],
      ["bram", "NEUTRAL", 7, "I pulled the stop logs: about 60% of unplanned downtime on Line 2 in the last month happened within 90 minutes of a format changeover. That points to changeover setup, not random machine failure."],
      ["eva", "NEGATIVE", 6, "Nobody trained us properly on the new capper settings after the upgrade. We are basically guessing torque values. A proper SOP and a short training session would help a lot."],
      ["linda", "NEUTRAL", 6, "When the line stops and restarts we sometimes get mislabelled bottles that we have to scrap. So the downtime creates a quality and waste cost too, not just lost output."],
      ["karin", "NEGATIVE", 5, "Operators climbing into the labeller to clear jams under time pressure is a safety risk. We've already had two near-misses. Fixing the root cause of the stops is a safety issue, not just a production one."],
      ["fatima", "NEUTRAL", 5, "A simple changeover checklist would help the night shift a lot. We don't have a senior operator on every night, so we are figuring it out as we go."],
      ["sanne", "POSITIVE", 4, "The new lubrication schedule maintenance introduced last month genuinely helped — the conveyor stoppages are noticeably down. The same approach on the labeller could work."],
      ["pieter", "POSITIVE", 3, "Since we started the daily five-minute startup check, the morning breakdowns dropped. Worth making it standard on every shift."],
      ["joost", "NEUTRAL", 3, "Could we get a second set of labeller change parts pre-set so we can swap them in instead of adjusting on the running line? That would cut changeover time massively."],
      ["rob", "NEUTRAL", 2, "I'm open to a short daily maintenance check if it doesn't take the whole line down. Let's find the middle ground between zero PM and a two-hour weekly stop."],
      ["bram", "NEUTRAL", 1, "My recommendation: tackle changeover standardisation plus critical spares for the labeller first. That likely removes the majority of the stops before we even get into the preventive-maintenance debate."],
    ]);

    // Lighter topic 1 — shift handover.
    const handover = await makeTopic({
      name: "Improving the shift handover between day and night shifts",
      description:
        "Information gets lost between shifts and the next team often hits problems blind. How should we run the handover so nothing important falls through the cracks?",
      content: [
        "Right now the handover between shifts is informal and inconsistent. Issues, temporary fixes and warnings don't always make it to the incoming team.",
        "How would you like the handover to work? What information must always be passed on, and in what form — verbal, whiteboard, a shared digital log?",
      ],
      creator: "sanne",
      loc: "RMD",
      disc: "PROD",
      status: "ACTIVE",
      startDaysAgo: 7,
      endDaysFromNow: 14,
    });
    await addFeedback(handover.id, handover.topicCode, [
      ["fatima", "NEGATIVE", 6, "The day-to-night handover is just a quick chat at the door. Half the time we don't hear about an issue until we hit it ourselves at 2am."],
      ["joost", "NEUTRAL", 5, "We use a whiteboard but it gets wiped or only half filled in. A standard handover form would be much better."],
      ["sanne", "NEUTRAL", 4, "I'd like a ten-minute structured overlap between shifts with a fixed checklist, instead of an informal handover that depends on who's on."],
      ["eva", "NEGATIVE", 3, "Important details get lost — for example a machine running on a temporary fix. The next shift absolutely needs to know that before they start."],
      ["pieter", "NEUTRAL", 2, "Maintenance notes don't reach the next shift at all. A shared digital log that everyone can see would solve most of this."],
      ["ahmed", "POSITIVE", 1, "When we trialled the shared log last month it worked really well on the days we actually used it. We should just make it permanent."],
    ]);

    // Lighter topic 2 — CIP water use (completed, no insight yet).
    const cip = await makeTopic({
      name: "Cutting water use in CIP (clean-in-place) cycles",
      description:
        "Our clean-in-place cycles use a lot of water. Where can we safely reduce consumption without compromising hygiene? Ideas from operations, QA, maintenance and engineering welcome.",
      content: [
        "CIP cleaning is one of our largest water consumers on site. We want to reduce water use where it is safe to do so.",
        "Any change has to keep our hygiene validation intact. Share where you think we can recover, reuse or shorten cycles without risk.",
      ],
      creator: "bram",
      loc: "RMD",
      disc: "ENG",
      status: "COMPLETED",
      startDaysAgo: 45,
      endDaysFromNow: -12,
    });
    await addFeedback(cip.id, cip.topicCode, [
      ["bram", "NEUTRAL", 40, "The CIP rinse cycles use more water than the spec actually requires. We could recover the final rinse water and reuse it for the next pre-rinse."],
      ["linda", "NEUTRAL", 35, "Any water reduction must not compromise our hygiene validation. We need to test and re-validate before changing any cycle times."],
      ["pieter", "POSITIVE", 30, "We already shortened one rinse on Line 1 a while back and it saved water with no hygiene issue. We can extend that carefully."],
      ["karin", "NEUTRAL", 22, "Less water on the floor is also a slip-hazard reduction, so this helps safety as well as cost."],
      ["sanne", "POSITIVE", 15, "Operators are on board — nobody enjoys mopping up excess water at the end of a shift."],
    ]);

    return {
      company: "Maasvallei Dranken B.V.",
      users: cast.length + 1,
      topics: [downtime.topicCode, handover.topicCode, cip.topicCode],
      feedbackCount: 20 + 6 + 5,
    };
  },
});
