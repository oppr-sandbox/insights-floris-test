import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

type Ctx = {
  topic: {
    name: string;
    description: string;
    topicCode: string;
    startDate: string;
    endDate: string;
  };
  feedbacks: Array<{
    feedbackId: string;
    feedbackCode: string;
    displayName: string;
    userId: string;
    dateSubmitted: string;
    text: string;
    transcribedText: string;
    sentiment: string;
  }>;
};

// JSON shape the model must return; mirrors the original .NET InsightResponse.
const OUTPUT_SCHEMA = `{
  "summary": {
    "overview": ["string"],
    "key_points": ["string"],
    "next_steps": ["string"],
    "key_themes": [{ "theme": "string", "mentions": 0, "business_impact": "Low|Medium|High", "sentiment": "Positive|Neutral|Negative", "examples": [{ "feedback_id": "string", "user_id": "string", "text": "string", "sentiment": "string" }], "recommendations": ["string"] }],
    "implementation_strategy": { "short_term": ["string"], "medium_term": ["string"], "long_term": ["string"] }
  },
  "sentiment": {
    "sentiment_executive_summary": "string",
    "sentiment_analysis": { "distribution": { "positive": 0, "neutral": 0, "negative": 0 }, "overall_sentiment_score": 0.0 },
    "feedback_highlights": [{ "highlight_id": "string", "text": "string", "sentiment": "string", "theme": "string", "user_id": "string", "display_name": "string", "feedback_id": "string", "feedback_code": "string" }]
  },
  "contradiction": {
    "contradiction_summary": "string",
    "contradictions": [{ "feedback_id_a": "string", "feedback_code_a": "string", "feedback_id_b": "string", "feedback_code_b": "string", "excerpt_a": "string", "excerpt_b": "string", "title": "string", "description": "string", "resolution": "string", "participants": ["string"], "impact": "Low|Medium|High", "severity": "string" }]
  },
  "finding": {
    "findings_summary": "string",
    "findings": [{ "lesson_title": "string", "key_learning": "string", "supporting_evidences": [{ "feedback_id": "string", "summarized_message": "string" }], "impact": "Low|Medium|High", "applicability": "string", "implementation_cost": "Low|Medium|High", "priority": "Low|Medium|High", "recommendations": ["string"] }]
  }
}`;

function buildPrompt(data: Ctx): string {
  const topicData = [
    `Topic Name: ${data.topic.name}`,
    `Topic Description: ${data.topic.description}`,
    `Topic Code: ${data.topic.topicCode}`,
    `Start Date: ${data.topic.startDate}`,
    `End Date: ${data.topic.endDate}`,
  ].join("\n");

  const feedbackData = data.feedbacks
    .map((f) =>
      [
        "---",
        `Feedback ID: ${f.feedbackId}`,
        `Feedback Code: ${f.feedbackCode}`,
        `Submitted By: "${f.displayName}"`,
        `Created At: ${f.dateSubmitted}`,
        f.text ? `Text: "${f.text}"` : "",
        f.transcribedText ? `Transcribed Text: "${f.transcribedText}"` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  return `You are an expert analyst of employee feedback. Analyze the feedback for this topic and produce structured insights.

**Topic Details:**
${topicData}

---
**Raw Feedback Data:**
(Each item is one piece of feedback collected for this topic. Analyze all relevant content.)
${feedbackData}
---

**Output Format Requirements:**
- Return ONLY valid JSON (no markdown, no code fences, no explanations) that adheres strictly to this schema:
${OUTPUT_SCHEMA}

**Answer Requirements:**
- Provide a concise overview and key points.
- Identify key themes with mentions counts and sentiment.
- Summarize overall sentiment with a distribution.
- List contradictions if any; if none, explain briefly in contradiction_summary.
- Provide actionable findings and next steps.
- Reference feedback using the Feedback Code where relevant.
- Fill every field; if a field has no data, give a short explanation string.`;
}

export const generateInsight = internalAction({
  args: { insightId: v.id("insights") },
  handler: async (ctx, { insightId }) => {
    try {
      const data = await ctx.runQuery(internal.insights.getContext, {
        insightId,
      });
      if (!data) throw new Error("Insight context not found");

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
      const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: buildPrompt(data) }] }],
            generationConfig: {
              temperature: 0,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Gemini API ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();
      const text: string =
        json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      await ctx.runMutation(internal.insights.saveResult, {
        insightId,
        summary: parsed.summary ?? {},
        sentiment: parsed.sentiment ?? parsed.sentiments ?? {},
        contradiction: parsed.contradiction ?? parsed.contradictions ?? {},
        finding: parsed.finding ?? parsed.findings ?? {},
      });
    } catch (e) {
      await ctx.runMutation(internal.insights.markFailed, {
        insightId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
});
