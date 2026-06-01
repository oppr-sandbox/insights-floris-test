import { NextRequest, NextResponse } from "next/server";
import { SpeechClient } from "@google-cloud/speech";
import { validateCookie } from "@/lib/auth";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

export async function POST(request: NextRequest) {
    const headers = {
        "accept-language":
            request.headers.get("accept-language") || "en-US,en;q=0.5",
    };
    const negotiator = new Negotiator({ headers });
    const languages = negotiator.languages();
    const locales = ["en-US", "nl-NL", "nl", "en-GB"];
    const defaultLocale = "en-US";

    // Determine the user's preferred language using the locale matcher.
    const matchLanguage = match(languages, locales, defaultLocale);

    const cookieHeader = request.headers.get("cookie") || undefined;
    const tenantHeader = request.headers.get("x-tenant") || undefined;
    const user = await validateCookie(cookieHeader, tenantHeader);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("audio") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded." },
                { status: 400 }
            );
        }

        // To read the file content, you can use file.arrayBuffer() or file.stream()
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer); // Convert to Node.js Buffer if needed

        const client = new SpeechClient();

        const [response] = await client.recognize({
            audio: {
                content: buffer.toString("base64"),
            },
            config: {
                encoding: "LINEAR16", // Matches browser recording
                // sampleRateHertz: 48000, // Default from MediaRecorder in Chrome
                languageCode: matchLanguage,
                alternativeLanguageCodes: ["nl-NL", "en-GB", "en-US"],
                enableAutomaticPunctuation: true,
                enableWordConfidence: true,
            },
        });

        const transcription = response.results
            ?.map((result: any) => result.alternatives[0].transcript)
            .join("\n");

        return NextResponse.json(
            { transcript: transcription },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { error: "Failed to upload file." },
            { status: 500 }
        );
    }
}
