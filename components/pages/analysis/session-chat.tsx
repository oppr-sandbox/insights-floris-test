'use client';

import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { MarkdownLink, Response } from "@/components/ai-elements/response";
import {
    PromptInput,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
    PromptInputButton,
    PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { MicIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserDetails } from "@/providers/UserContextProvider";
import { useSessionFeedbackPreview } from "./feedback-preview";

const GENERAL_SUGGESTIONS = [
    'What themes appear across these insights?',
    'Where do the insights agree or conflict?',
    'Give me a combined summary.',
    'What should we prioritise?',
];

const REPORT_SUGGESTIONS = [
    'Start the analysis',
    'Summarise what we have covered',
    "What's still missing?",
];

const GENERAL_GREETING =
    'Hello! IDA here. I can analyse all of the selected insights and their feedback together — ask me anything.';

type SessionChatProps = {
    sessionId: string;
    lensKey: string;
    generatesReport?: boolean;
    lensName?: string;
};

export function SessionChat({ sessionId, lensKey, generatesReport, lensName }: SessionChatProps) {
    const { tenant } = useUserDetails();
    const [text, setText] = useState<string>('');
    const [dots, setDots] = useState("");

    const { dispatch } = useSessionFeedbackPreview();

    const saveChatMessage = useMutation(api.sessions.saveChatMessage);

    const seededRef = useRef(false);

    const { messages, status, sendMessage, setMessages } = useChat({
        onFinish: ({ message }) => {
            void saveChatMessage({
                sessionId: sessionId as Id<"analysisSessions">,
                role: message.role,
                parts: message.parts,
            });
        },
    });

    const history = useQuery(api.sessions.getChat, {
        sessionId: sessionId as Id<"analysisSessions">,
    });

    useEffect(() => {
        if (history === undefined) return;
        if (seededRef.current) return;
        seededRef.current = true;

        if (history.length > 0) {
            setMessages(history.map((m) => ({
                id: m.id,
                role: m.role,
                parts: m.parts,
            })) as UIMessage[]);
            return;
        }

        const greeting = generatesReport && lensName
            ? `I'll guide you through a ${lensName} across the selected insights. Tell me about the problem to begin.`
            : GENERAL_GREETING;
        setMessages([
            {
                id: 'greeting',
                role: 'assistant',
                parts: [{ type: 'text', text: greeting }],
            },
        ] as UIMessage[]);
    }, [history, generatesReport, lensName, setMessages]);

    const send = async (value: string) => {
        sendMessage(
            { text: value },
            {
                headers: { 'X-Tenant': tenant },
                body: { sessionId, lensKey },
            },
        );
        await saveChatMessage({
            sessionId: sessionId as Id<"analysisSessions">,
            role: 'user',
            parts: [{ type: "text", text: value }],
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!text) return;
        const value = text;
        setText('');
        await send(value);
    };

    const handleSuggestionClick = async (suggestion: string) => {
        await send(suggestion);
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest("a[href][data-feedback]") as HTMLAnchorElement | null;

            if (link) {
                e.preventDefault();
                const [, feedbackId] = link.href.split('=');
                dispatch({ type: "FEEDBACK_PREVIEW_OPEN", payload: feedbackId });
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [dispatch]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => (prev.length < 3 ? prev + "." : ""));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const suggestions = generatesReport ? REPORT_SUGGESTIONS : GENERAL_SUGGESTIONS;

    return (
        <div className="flex flex-col flex-1">
            <div className="relative size-full rounded-lg min-h-80 h-[calc(100vh-22rem)]">
                <div className="flex flex-col h-full">
                    <Conversation>
                        <ConversationContent>
                            {messages.map((message) => (
                                <Message from={message.role} key={message.id}>
                                    <MessageContent>
                                        {message.parts.map((part, i) => {
                                            switch (part.type) {
                                                case 'text':
                                                    return (
                                                        <Response components={{ a: MarkdownLink }} key={`${message.id}-${i}`}>
                                                            {part.text}
                                                        </Response>
                                                    );
                                                default:
                                                    return null;
                                            }
                                        })}
                                    </MessageContent>
                                </Message>
                            ))}
                            {status === "submitted" &&
                                <Message from="system">
                                    <MessageContent className="font-medium italic animate-pulse w-24">
                                        Thinking{dots}
                                    </MessageContent>
                                </Message>
                            }
                        </ConversationContent>
                        <ConversationScrollButton />
                    </Conversation>

                    <Suggestions className="mt-4">
                        {suggestions.map((suggestion) => (
                            <Suggestion
                                key={suggestion}
                                onClick={handleSuggestionClick}
                                suggestion={suggestion}
                            />
                        ))}
                    </Suggestions>

                    <PromptInput onSubmit={handleSubmit} className="mt-4">
                        <PromptInputTextarea
                            placeholder="Ask me anything about these insights..."
                            onChange={(e) => setText(e.target.value)}
                            value={text}
                        />
                        <PromptInputToolbar>
                            <PromptInputTools>
                                <PromptInputButton>
                                    <MicIcon size={16} />
                                </PromptInputButton>
                            </PromptInputTools>
                            <PromptInputSubmit disabled={!text} status={status} />
                        </PromptInputToolbar>
                    </PromptInput>
                </div>
            </div>
        </div>
    );
}
