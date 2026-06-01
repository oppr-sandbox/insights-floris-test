import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  type ModelMessage,
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
    prompt,
  }: {
    messages: UIMessage[];
    prompt: string;
    insightId: string;
  } = await req.json();

  const fileRegex = /(https?:\/\/[^\s"']+\?(?:[^\s"']*)?)/gi;
  const files = prompt.match(fileRegex) || [];
  const imageUrls = files.filter((url) =>
    /\.(png|jpe?g|gif|webp)(?:\?|$)/i.test(url),
  );

  const newPrompt = `
    ${prompt}

    Follow these instructions:
    0. Your name is 'IDA'
    1. You are an expert on analyzing topics and feedbacks, giving recommendations, and providing insights regarding the topic.
    2. If the question is out of context, politely inform the user and do not answer.
    3. Use the Feedback Code instead of Feedback Id when identifying feedbacks.
    4. When referring to a feedback code, format it like this: "[feedbackCode](${baseUrl}?c=feedbackId)".
    5. You can also analyze images attached to a feedback.
  `;

  const model = google(process.env.GEMINI_MODEL ?? "gemini-2.5-flash");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userParts: any[] = [{ type: "text", text: newPrompt }];
  for (const image of imageUrls) {
    userParts.push({ type: "file", mediaType: "image/jpeg", data: image });
  }

  const modelMessages: ModelMessage[] = [
    ...convertToModelMessages(messages),
    { role: "user", content: userParts },
  ];

  const result = streamText({
    model,
    system: "You are IDA, an expert feedback analysis AI.",
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse({ originalMessages: messages });
}
