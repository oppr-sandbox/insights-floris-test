'use client';

import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
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
import { UIMessage, useChat } from "@ai-sdk/react"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { metadata } from "@/app/layout";
import { useUserDetails } from "@/providers/UserContextProvider";
import { UpgradePrompt } from "@/components/upgrade-prompt";

const suggestions = [
    'What are the main problems?',
    'What do you recommend?',
    'Give me a summary.',
    'How is the sentiment?',
];


export default function AiSandboxPage() {

    const { hasActiveSubscription } = useUserDetails();
    const [text, setText] = useState<string>('')

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        sendMessage(
            { text: text },
            { body: { topicId: '2f7c8d2b-1c6e-4c0c-9f0e-7c51e3b8c222' } }
        );

        setText('');
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(
            { text: suggestion },
            { body: { topicId: '2f7c8d2b-1c6e-4c0c-9f0e-7c51e3b8c222' } }
        );
    };

    const { messages, status, sendMessage, setMessages } = useChat();

    useEffect(() => {
        sendMessage(
            { text: '' },
            { body: { topicId: '2f7c8d2b-1c6e-4c0c-9f0e-7c51e3b8c222' } }
        )
    }, [])

    return (
        <main className="px-4 flex flex-col flex-1">
            <div className="mx-auto relative size-full rounded-lg border h-[600px]">
                <div className="flex p-4 flex-col h-full">
                    <h4 className="font-semibold mb-4">Talk with AI about this Topic</h4>
                    <Conversation>
                        <ConversationContent>
                            {messages.map((message) => (
                                <Message from={message.role} key={message.id}>
                                    <MessageContent>
                                        {message.parts.map((part, i) => {
                                            switch (part.type) {
                                                case 'text':
                                                    return (
                                                        <Response key={`${message.id}-${i}`}>
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

                    {!hasActiveSubscription && <UpgradePrompt action="use AI sandbox" />}
                    <PromptInput onSubmit={handleSubmit} className="mt-4">
                        <PromptInputTextarea
                            placeholder="Ask me anything about this topic..."
                            onChange={(e) => setText(e.target.value)}
                            value={text}
                            disabled={!hasActiveSubscription}
                        />
                        <PromptInputToolbar>
                            <PromptInputTools>
                                <PromptInputButton>
                                    <MicIcon size={16} />
                                </PromptInputButton>
                            </PromptInputTools>
                            <PromptInputSubmit disabled={!hasActiveSubscription || !text} status={status} />
                        </PromptInputToolbar>
                    </PromptInput>
                </div>
            </div>
            <div className="hidden ml-4 mr-4 list-outside list-decimal"></div>
        </main>
    )
}