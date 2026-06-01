import { extractAccessToken, validateCookie } from "@/lib/auth";
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
  const referer = (await headers()).get("referer");
  const url = new URL(referer!);

  const cookieHeader =
    req.headers.get("cookie") || (await headers()).get("cookie") || undefined;
  const tenantHeader =
    req.headers.get("x-tenant") ||
    (await headers()).get("x-tenant") ||
    undefined;
  const user = await validateCookie(cookieHeader, tenantHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    messages,
    prompt,
    insightId,
  }: {
    messages: UIMessage[];
    prompt: string;
    insightId: string;
  } = await req.json();

  /**
   * STEP 1: Extract all image URLs from the prompt
   */
  const fileRegex = /(https?:\/\/[^\s"']+\?(?:[^\s"']*)?)/gi;

  const files = prompt.match(fileRegex) || [];
  // Extract all images
  const imageUrls = files.filter((url) =>
    /\.(png|jpe?g|gif|webp)(?:\?|$)/i.test(url),
  );
  // Extract all Audio
  const audioUrls = files.filter((url) => /\/blob(?:\?|$)/i.test(url)); // your Azure audio files end with /blob

  /**
   * STEP 2: Build the full instruction prompt
   */
  const newPrompt = `
    ${prompt}

    Follow these instructions:
    0. Your name is 'IDA'
    1. You are an expert on analyzing topics and feedbacks, giving recommendations, and providing insights regarding the topic.
    2. If the question is out of context, politely inform the user and do not answer.
    3. Use the Feedback Code instead of Feedback Id when identifying feedbacks.
    4. When referring to a feedback code, format it like this: "[feedbackCode](${url}?c=feedbackId)".
    5. You can also analyze images and audio files attached to a feedback
  `;

  /**
   * STEP 3: Determine model
   * Use gemini-2.5-pro if there's any image, otherwise use gemini-2.5-flash
   */
  const model = google(
    files.length > 0 ? "gemini-2.5-pro" : "gemini-2.5-flash",
  );

  /**
   * STEP 4: Prepare the multimodal input parts
   */
  const userParts: any[] = [{ type: "text", text: newPrompt }];

  // Attach all image URLs
  for (const image of imageUrls) {
    userParts.push({
      type: "file",
      mediaType: "image/jpeg", // safe default
      data: image, // pass the image URL directly
    });
  }

  // Attach all audio URLs
  for (const audio of audioUrls) {
    userParts.push({
      type: "file",
      mediaType: "audio/webm", // safe default
      data: audio, // pass the image URL directly
    });
  }

  /**
   * STEP 5: Convert previous UI messages to ModelMessages
   * and append our multimodal user message in the correct format
   */
  const modelMessages: ModelMessage[] = [
    ...convertToModelMessages(messages),
    {
      role: "user",
      content: userParts,
    },
  ];

  /**
   * STEP 6: Stream multimodal response
   */
  const result = streamText({
    model,
    system: "You are IDA, an expert feedback analysis AI.",
    messages: modelMessages,
  });

  /**
   * STEP 7: Stream to UI and persist on finish
   */
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages }) => {
      /**
       * STEP 8: Save message back to the database via API
       */
      saveMessage(
        cookieHeader!,
        tenantHeader!,
        messages[messages.length - 1],
        insightId,
      );
    },
  });
}

// Message Saving to the api
async function saveMessage(
  cookieHeader: string,
  tenant: string,
  message: UIMessage,
  insightId: string,
) {
  try {
    const accessToken = extractAccessToken(cookieHeader);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Tenant": tenant,
    };

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/insights/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        insightId: insightId,
        role: message.role,
        metadata: message.metadata,
        parts: message.parts,
      }),
    });

  } catch (error) {
    console.error("Failed to save message:", error);
  }
}
