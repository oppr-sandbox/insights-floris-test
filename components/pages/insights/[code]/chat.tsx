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
import { MicIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { InsightDetails, PromptResponse } from "../data/schema";
import { useMutation } from "@tanstack/react-query";
import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { toast } from "@/components/ui/sonner";
import { useFeedbackPreview } from "../hooks/useFeedbackPreview";
import { useUserDetails } from "@/providers/UserContextProvider";

const suggestions = [
    'What are the main problems?',
    'What do you recommend?',
    'Give me a summary.',
    'How is the sentiment?',
];

type ChatRequest = {
    initialState: PromptResponse;
    insight: InsightDetails;
}

export default function Chat(chatRequest: ChatRequest) {

    const { tenant } = useUserDetails();
    const [text, setText] = useState<string>('');
    const [dots, setDots] = useState("");

    const { dispatch } = useFeedbackPreview();

    const httpClient = createHttpClient();

    const { isPending, mutateAsync: saveMessageAsync } = useMutation({
        mutationFn: (data: any) => httpClient.post('/api/insights/chat', data),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                toast.error(validationError.message, { description: 'Please fill all required fields' });
            }
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        }
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        console.log(tenant)

        sendMessage(
            { text: text },
            { 
                headers: { 'X-Tenant': tenant },
                body: { prompt: chatRequest.initialState.prompt, insightId: chatRequest.insight.id } 
            }
        );

        await saveMessageAsync({
            insightId: chatRequest.insight.id,
            role: 'user',
            parts: [
                {
                    type: "text",
                    text: text
                }
            ]
        })

        setText('');
    };

    const handleSuggestionClick = async (suggestion: string) => {
        sendMessage(
            { text: suggestion },
            { 
                headers: { 'X-Tenant': tenant },
                body: { prompt: chatRequest.initialState.prompt, insightId: chatRequest.insight.id } 
            }
        );

        await saveMessageAsync({
            insightId: chatRequest.insight.id, role: 'user', parts: [
                {
                    type: "text",
                    text: suggestion
                }
            ]
        })
    };

    const { messages, status, sendMessage } = useChat({
        messages: chatRequest.initialState.messages.length > 1 ? chatRequest.initialState.messages : [
            {
                id: '1',
                parts: [{ "type": "text", "text": `Hello! IDA here, your expert system for analyzing topic and feedbacks` }],
                role: 'assistant'
            }
        ]
    });

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest("a[href][data-feedback]") as HTMLAnchorElement | null;

            if (link) {
                e.preventDefault();
                const [_, feedbackId] = link.href.split('=')

                dispatch({ type: "FEEDBACK_PREVIEW_OPEN", payload: feedbackId })
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => (prev.length < 3 ? prev + "." : ""));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <TabsContent value="chat">
            <Card>
                <CardContent>
                    <div className="flex flex-col flex-1">
                        <div className="mx-auto relative size-full rounded-lg min-h-80 h-[calc(100vh-20.75rem)] lg:h-[calc(100vh-18.75rem)]">
                            <div className="flex flex-col h-full">
                                <h4 className="font-semibold mb-4">Talk with IDA about this Topic</h4>
                                <Conversation>
                                    <ConversationContent>
                                        {messages.map((message) => (
                                            <Message from={message.role} key={message.id}>
                                                <MessageContent>
                                                    {message.parts.map((part, i) => {
                                                        switch (part.type) {
                                                            case 'text':
                                                                return (
                                                                    <Response components={{
                                                                        a: MarkdownLink
                                                                    }} key={`${message.id}-${i}`}>
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
                                        placeholder="Ask me anything about this topic..."
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
                        <div className="hidden ml-4 mr-4 list-outside list-decimal"></div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}