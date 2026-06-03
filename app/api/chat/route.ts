import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  // Authenticated via Convex Auth (cookie-based). No token => not signed in.
  const token = await convexAuthNextjsToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const referer = (await headers()).get("referer");
  const baseUrl = referer ? new URL(referer).origin : "";

  const {
    messages,
    sessionId,
  }: {
    messages: UIMessage[];
    sessionId: string;
    lensKey: string;
  } = await req.json();

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  convex.setAuth(token);

  const payload = await convex.query(api.sessions.chatPayload, {
    sessionId: sessionId as Id<"analysisSessions">,
  });
  if (!payload) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Use the active model selected in the Config command center, so chat
  // honours the same override as insight generation (and dodges an
  // overloaded default). Falls back to the env model if unreachable.
  let modelId = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  try {
    modelId = await convex.query(api.ai.activeModelPublic, {});
  } catch {
    // keep env fallback
  }
  const model = google(modelId);

  const system = [
    payload.systemPrompt,
    "",
    "Formatting rules:",
    "- Your name is 'IDA'.",
    "- Use the Feedback Code instead of the Feedback Id when identifying feedbacks.",
    `- When referring to a feedback code, format it like this: "[feedbackCode](${baseUrl}?c=feedbackId)".`,
    "- You can also analyze images attached to a feedback.",
    "",
    "CONTEXT:",
    payload.context,
  ].join("\n");

  // The client seeds a synthetic assistant "greeting" as the first bubble.
  // Gemini requires the conversation to start with a user turn, so drop any
  // leading non-user messages before handing them to the model.
  const firstUser = messages.findIndex((m) => m.role === "user");
  const modelMessages = firstUser >= 0 ? messages.slice(firstUser) : [];

  const result = streamText({
    model,
    system,
    messages: convertToModelMessages(modelMessages),
  });

  return result.toUIMessageStreamResponse({ originalMessages: messages });
}
