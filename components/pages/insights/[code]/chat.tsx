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
    PromptInputSubmit
} from "@/components/ai-elements/prompt-input";
import { MicIcon, MessageSquarePlus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/sonner";
import { InsightDetails } from "../data/schema";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useFeedbackPreview } from "../hooks/useFeedbackPreview";
import { useUserDetails } from "@/providers/UserContextProvider";
import { formatDateTime } from "@/utils/helpers/helpers";

const GENERAL_SUGGESTIONS = [
    'What are the main problems?',
    'What do you recommend?',
    'Give me a summary.',
    'How is the sentiment?',
];

const GENERAL_GREETING = 'Hello! IDA here — ask me anything about this insight and its feedback.';

function AskThread({ sessionId }: { sessionId: Id<"analysisSessions"> }) {
    const { tenant } = useUserDetails();
    const [text, setText] = useState<string>('');
    const [dots, setDots] = useState("");
    const { dispatch } = useFeedbackPreview();

    const saveChatMessage = useMutation(api.sessions.saveChatMessage);
    const seededRef = useRef(false);

    const { messages, status, sendMessage, setMessages } = useChat({
        onFinish: ({ message }) => {
            void saveChatMessage({ sessionId, role: message.role, parts: message.parts });
        },
    });

    const history = useQuery(api.sessions.getChat, { sessionId });

    useEffect(() => {
        if (history === undefined || seededRef.current) return;
        seededRef.current = true;
        if (history.length > 0) {
            setMessages(history.map((m) => ({ id: m.id, role: m.role, parts: m.parts })) as UIMessage[]);
            return;
        }
        setMessages([{ id: 'greeting', role: 'assistant', parts: [{ type: 'text', text: GENERAL_GREETING }] }] as UIMessage[]);
    }, [history, setMessages]);

    const send = async (value: string) => {
        sendMessage(
            { text: value },
            { headers: { 'X-Tenant': tenant }, body: { sessionId, lensKey: 'general' } },
        );
        await saveChatMessage({ sessionId, role: 'user', parts: [{ type: "text", text: value }] });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!text) return;
        const value = text;
        setText('');
        await send(value);
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
        const interval = setInterval(() => setDots(prev => (prev.length < 3 ? prev + "." : "")), 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col flex-1">
            <div className="mx-auto relative size-full rounded-lg min-h-80 h-[calc(100vh-22rem)]">
                <div className="flex flex-col h-full">
                    <Conversation>
                        <ConversationContent>
                            {messages.map((message) => (
                                <Message from={message.role} key={message.id}>
                                    <MessageContent>
                                        {message.parts.map((part, i) => part.type === 'text' ? (
                                            <Response components={{ a: MarkdownLink }} key={`${message.id}-${i}`}>
                                                {part.text}
                                            </Response>
                                        ) : null)}
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
                        {GENERAL_SUGGESTIONS.map((suggestion) => (
                            <Suggestion key={suggestion} onClick={send} suggestion={suggestion} />
                        ))}
                    </Suggestions>

                    <PromptInput onSubmit={handleSubmit} className="mt-4">
                        <PromptInputTextarea
                            placeholder="Ask me anything about this insight..."
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

export default function Chat({ insight }: { insight: InsightDetails }) {
    const insightId = insight.id as Id<"insights">;
    const threads = useQuery(api.sessions.askThreadsForInsight, { insightId });
    const createAsk = useMutation(api.sessions.createAsk);

    const [activeId, setActiveId] = useState<Id<"analysisSessions"> | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (threads && threads.length > 0 && !activeId) {
            setActiveId(threads[0].id as Id<"analysisSessions">);
        }
    }, [threads, activeId]);

    const startNew = async () => {
        setCreating(true);
        try {
            const res = await createAsk({ insightIds: [insightId] });
            setActiveId(res.id);
        } catch {
            toast.error("Could not start a conversation");
        } finally {
            setCreating(false);
        }
    };

    return (
        <TabsContent value="chat">
            <Card>
                <CardContent>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h4 className="font-semibold">Talk with IDA</h4>
                        <div className="flex items-center gap-2">
                            {threads && threads.length > 0 &&
                                <Select
                                    value={activeId ?? undefined}
                                    onValueChange={(v) => setActiveId(v as Id<"analysisSessions">)}
                                >
                                    <SelectTrigger size="sm" className="min-w-52">
                                        <SelectValue placeholder="Select a conversation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {threads.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.title} · {formatDateTime(t.updatedAt ?? t.createdAt)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            }
                            <Button variant="outline" size="sm" onClick={startNew} disabled={creating}>
                                {creating ? <Spinner className="size-4" /> : <Plus className="size-4" />}
                                New conversation
                            </Button>
                        </div>
                    </div>

                    {threads === undefined &&
                        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
                            <Spinner /> Loading conversations…
                        </div>
                    }

                    {threads && !activeId &&
                        <EmptyState
                            icons={[MessageSquarePlus]}
                            title="Start a conversation"
                            description={"Talk to this insight and its feedback.\nYour conversations are saved here."}
                            action={{ label: "New conversation", onClick: startNew }}
                        />
                    }

                    {activeId &&
                        <AskThread key={activeId} sessionId={activeId} />
                    }
                </CardContent>
            </Card>
        </TabsContent>
    );
}
