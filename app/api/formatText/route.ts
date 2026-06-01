import { validateCookie } from "@/lib/auth";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const promptTemplate = `
  Without changing the context, I want you to format this 
  string into lexical nodes and add styling based on the context of the text 
  and apply proper punctuation marks and casing:
  "{transcribedValue}"
  
  return a json with this interface: 
  interface Node {
    children?: Node[];
    text: string;
    type: 'list' | 'listitem' | 'heading' | 'paragraph' | 'text' | ;
    listType?: 'bullet' | 'number';
    tag?: 'h1' | 'h2' | 'h3';
  }

  rules:
  - 'list', 'listitem', 'heading', and 'paragraph' are parent nodes;
  - Parent nodes needs to have a children to render, the last child node must be text;
  - When the node is 'list' it needs a child or children of 'listitem';
  - 'paragraph', 'heading' and 'listitem' nodes can only have a children of type 'text'
  - 'text' nodes cannot have children and their string value is in the 'text' property

  Do not wrap you response to json markdown wrappers only return the array of nodes.
`;

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || undefined;
  const tenantHeader = request.headers.get("x-tenant") || undefined;
  const user = await validateCookie(cookieHeader, tenantHeader);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { transcribed } = await request.json();

    const prompt = promptTemplate.replace('{transcribedValue}', transcribed);

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: prompt,
    });

    const formattedText = text.replace(/```json|```/g, "").trim();

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
