'use client';

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { BarChart2, Check, ChevronRight, FileText, Layers, MessagesSquare, type LucideIcon } from "lucide-react";
import { SessionChat } from "./session-chat";
import { SessionFeedbackPreviewProvider } from "./feedback-preview";
import { GuidedRunner } from "./guided-runner";

export function SessionWorkspace({ sessionId }: { sessionId: string }) {
    const session = useQuery(api.sessions.get, {
        sessionId: sessionId as Id<"analysisSessions">,
    });

    if (session === undefined) {
        return (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
                <Spinner /> Loading analysis…
            </div>
        );
    }

    if (session === null) {
        return (
            <p className="py-24 text-center text-sm text-destructive">
                This analysis could not be found.
            </p>
        );
    }

    const isGuided = session.mode === "guided" || session.generatesReport;
    const sources: { key: string; icon: LucideIcon; label: string }[] = [
        ...session.topics.map((t) => ({ key: `t-${t.id}`, icon: Layers as LucideIcon, label: `${t.topicCode} · ${t.topicName}` })),
        ...session.insights.map((ins) => ({ key: `i-${ins.id}`, icon: BarChart2 as LucideIcon, label: `${ins.insightCode} · ${ins.topicName}` })),
        ...session.reports.map((r) => ({ key: `r-${r.id}`, icon: FileText as LucideIcon, label: r.title })),
    ];

    return (
        <SessionFeedbackPreviewProvider>
            <div className="px-4 space-y-4">
                <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight truncate">
                            {session.title || (isGuided ? session.lensName : "Conversation")}
                        </h3>
                        <Badge variant="outline" className="gap-1">
                            {!isGuided && <MessagesSquare className="size-3" />}
                            {isGuided ? session.lensName : "Ask"}
                        </Badge>
                    </div>
                    {sources.length > 0 && <SourcesPanel sources={sources} />}
                </div>

                {isGuided ? (
                    <GuidedRunner
                        session={{
                            id: session.id,
                            title: session.title,
                            lensName: session.lensName,
                            lensIcon: session.lensIcon,
                            sections: session.sections,
                        }}
                    />
                ) : (
                    <Card>
                        <CardContent>
                            <SessionChat
                                sessionId={sessionId}
                                lensKey={session.lensKey}
                                generatesReport={false}
                                lensName={session.lensName}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </SessionFeedbackPreviewProvider>
    );
}

function SourcesPanel({ sources }: { sources: { key: string; icon: LucideIcon; label: string }[] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="max-w-2xl overflow-hidden rounded-lg border">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-muted/50"
            >
                <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-90")} />
                <MessagesSquare className="size-4 text-muted-foreground" />
                <span className="font-medium">
                    {sources.length} source{sources.length === 1 ? "" : "s"} in this conversation
                </span>
            </button>
            {open &&
                <ul className="space-y-1 border-t p-2">
                    {sources.map((s) => {
                        const Icon = s.icon;
                        return (
                            <li key={s.key} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm">
                                <Check className="size-4 shrink-0 text-success" />
                                <Icon className="size-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{s.label}</span>
                            </li>
                        );
                    })}
                </ul>
            }
        </div>
    );
}
