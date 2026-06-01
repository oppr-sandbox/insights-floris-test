import { validateCookie } from "@/lib/auth";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const promptTemplate = `
  Translate the following text from {originalLang} to {targetLang}. 
  Please make the translation as contextually close to the original as possible.
  Return only the translated text.

  "{textVal}"
`;

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || undefined;
  const tenantHeader = request.headers.get("x-tenant") || undefined;
  const user = await validateCookie(cookieHeader, tenantHeader);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { originalLang, targetLang, textVal } = await request.json();

    const prompt = promptTemplate
      .replace('{originalLang}', originalLang)
      .replace('{targetLang}', targetLang)
      .replace('{textVal}', textVal);

    const { text } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt: prompt,
    });

    const formattedText = text.trim();

    let parsed;
    try {
      parsed = JSON.parse(formattedText);
    } catch {
      parsed = formattedText; // fallback if not valid JSON
    }

    return NextResponse.json(parsed, { status: 200 });

  } catch (error) {
    console.error("Error formatting of the text:", error);
    return NextResponse.json(
      { error: "Failed to format text." },
      { status: 500 }
    );
  }
}
