import { QueryObserverResult, RefetchOptions, useQuery } from "@tanstack/react-query";
import { FeedbackItemProps } from "../feedbacks";
import { useState } from "react";
import { useUserDetails } from "@/providers/UserContextProvider";

export type Translation = {
    translation: string;
    translate: (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<any, Error>>
    isTranslating: boolean;
    isTranslated: boolean
    handleShowTranslation: () => void;
};

export const useFeedbackItem = (feedback: FeedbackItemProps) => {
    const { tenant } = useUserDetails();
    const [showText, setShowText] = useState<boolean>(false);
    const [showTranscript, setShowTranscript] = useState<boolean>(false);

    // Query for translating the written text
    const {
        data: textTranslation,
        refetch: translateText,
        isFetching: loadingText,
        isFetched: textFetched,
    } = useQuery({
        queryKey: ['translate', feedback.id, 'text'],
        gcTime: 0,
        queryFn: async () => {
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { 
                    'X-Tenant': tenant,
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    originalLang: feedback.textLangCode,
                    targetLang: "en",
                    textVal: feedback.text,
                }),
            });
            if (!res.ok) throw new Error("Translation failed");
            return res.json();
        },
        enabled: false,
    });

    const showTextTranslation = async () => {
        setShowText(!showText);
        if (!text.isTranslated) await text.translate();
    }

    const text: Translation = {
        translation: textTranslation,
        translate: translateText,
        isTranslating: loadingText,
        isTranslated: textFetched,
        handleShowTranslation: showTextTranslation
    };

    // Query for translating the audio transcription
    const {
        data: transcriptTranslation,
        refetch: translateTranscript,
        isFetching: loadingTranscript,
        isFetched: transcriptFetched,
    } = useQuery({
        queryKey: ['translate', feedback.id, 'transcript'],
        gcTime: 0,
        queryFn: async () => {
            const res = await fetch("/api/translate", {
                method: "POST",
                headers: { 
                    'X-Tenant': tenant,
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    originalLang: feedback.audio!.transcribedTextLangCode,
                    targetLang: "en-US",
                    textVal: feedback.audio!.transcribedText,
                }),
            });
            if (!res.ok) throw new Error("Translation failed");
            return res.json();
        },
        enabled: false,
    });

    const showTranscriptTranslation = async () => {
        setShowTranscript(!showTranscript);
        if (!transcript.isTranslated) await transcript.translate();
    }

    const transcript: Translation = {
        translation: transcriptTranslation,
        translate: translateTranscript,
        isTranslating: loadingTranscript,
        isTranslated: transcriptFetched,
        handleShowTranslation: showTranscriptTranslation
    };

    return {
        text,
        showText,
        transcript,
        showTranscript,
    }
}