'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import {
    CheckCircle2,
    Circle,
    CircleDot,
    FileText,
    Paperclip,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useSessionFeedbackPreview } from "./feedback-preview";
import { ReportPreviewSheet } from "./report-preview-sheet";
import { KnowledgeStatus } from "@/components/attachments/knowledge-status";

function iconFor(name: string): LucideIcon {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    const resolved = icons[name];
    return typeof resolved === "function" ? resolved : Sparkles;
}

// Reveals an assistant message word-by-word, like a typewriter. Only used for a
// freshly-arrived message; once done it just renders the full text, so reactive
// re-renders never re-animate. Streamdown handles partial markdown safely.
function TypewriterResponse({ text, onDone }: { text: string; onDone: () => void }) {
    const tokens = useMemo(() => text.split(/(\s+)/), [text]);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (count >= tokens.length) {
            onDone();
            return;
        }
        const id = setTimeout(() => setCount((c) => c + 2), 28);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count, tokens.length]);

    return (
        <Response components={{ a: MarkdownLink }}>
            {tokens.slice(0, count).join("")}
        </Response>
    );
}

type Section = { key: string; title: string; guidance?: string };
type ChapterStatus = { key: string; status: "todo" | "partial" | "done" };
type StepMeta = {
    suggestions?: string[];
    chapters?: ChapterStatus[];
    targetSection?: string;
    readyToGenerate?: boolean;
};

type GuidedSession = {
    id: string;
    title: string;
    lensName: string;
    lensIcon: string;
    sections: Section[];
};

const STATUS_ICON: Record<string, { icon: LucideIcon; className: string }> = {
    done: { icon: CheckCircle2, className: "text-success" },
    partial: { icon: CircleDot, className: "text-warning" },
    todo: { icon: Circle, className: "text-muted-foreground/50" },
};

export function GuidedRunner({ session }: { session: GuidedSession }) {
    const sessionId = session.id as Id<"analysisSessions">;
    const { dispatch } = useSessionFeedbackPreview();

    const history = useQuery(api.sessions.getChat, { sessionId });
    const documents = useQuery(api.sessions.documents, { sessionId });
    const reports = useQuery(api.analysisReports.list, { sessionId });
    const step = useAction(api.analysisGuided.step);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const addDocument = useMutation(api.sessions.addDocument);
    const generateReport = useMutation(api.analysisReports.generate);
    const reparse = useMutation(api.ingestion.reparse);

    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [pendingUser, setPendingUser] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [reportId, setReportId] = useState<string | null>(null);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [dots, setDots] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const kickedRef = useRef(false);
    const animatedRef = useRef<Set<string>>(new Set());

    const lastAssistantId = (() => {
        if (!history) return null;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role === "assistant") return history[i].id;
        }
        return null;
    })();

    const lastMeta: StepMeta | undefined = (() => {
        if (!history) return undefined;
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role === "assistant" && history[i].metadata) {
                return history[i].metadata as StepMeta;
            }
        }
        return undefined;
    })();

    const suggestions = (!busy && lastMeta?.suggestions) || [];
    const chapters = lastMeta?.chapters ?? session.sections.map((s) => ({ key: s.key, status: "todo" as const }));
    const statusByKey = new Map(chapters.map((c) => [c.key, c.status]));
    const readyToGenerate = !!lastMeta?.readyToGenerate;

    const runStep = async (userMessage?: string) => {
        setBusy(true);
        setPendingUser(userMessage ?? null);
        try {
            await step({ sessionId, userMessage });
        } catch {
            toast.error("IDA couldn't respond — please try again.");
        } finally {
            setBusy(false);
            setPendingUser(null);
        }
    };

    useEffect(() => {
        if (!history || kickedRef.current) return;
        if (history.length === 0) {
            kickedRef.current = true;
            void runStep();
        }
    }, [history]);

    useEffect(() => {
        const interval = setInterval(() => setDots((p) => (p.length < 3 ? p + "." : "")), 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest("a[href][data-feedback]") as HTMLAnchorElement | null;
            if (link) {
                e.preventDefault();
                const [, feedbackId] = link.href.split("=");
                dispatch({ type: "FEEDBACK_PREVIEW_OPEN", payload: feedbackId });
            }
        };
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!text || busy) return;
        const value = text;
        setText("");
        await runStep(value);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(true);
        try {
            const url = await generateUploadUrl();
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await res.json();
            await addDocument({
                sessionId,
                storageId,
                fileName: file.name,
                fileExtension: file.name.split(".").pop(),
                fileSize: file.size,
                contentType: file.type,
            });
            toast.success(`Added ${file.name}`);
            await runStep(`I've uploaded a document for you to use: ${file.name}`);
        } catch {
            toast.error("Could not upload that file.");
        } finally {
            setUploading(false);
        }
    };

    const handleGenerate = async () => {
        toast.default("Generating report…");
        try {
            const res = await generateReport({ sessionId });
            setReportId(res.reportId);
            setReportDialogOpen(true);
        } catch {
            toast.error("Could not generate the report.");
        }
    };

    const openReport = (id: string) => {
        setReportId(id);
        setReportDialogOpen(true);
    };

    const Icon = iconFor(session.lensIcon);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                {/* Conversation */}
                <Card className="order-2 lg:order-1">
                    <CardContent className="flex flex-col">
                        <div className="relative size-full rounded-lg min-h-80 h-[calc(100vh-20rem)]">
                            <div className="flex flex-col h-full">
                                <Conversation>
                                    <ConversationContent>
                                        {(history ?? []).map((m) => {
                                            const text = (m.parts as { type?: string; text?: string }[])
                                                .filter((p) => p.type === "text")
                                                .map((p) => p.text ?? "")
                                                .join("");
                                            const animate =
                                                m.role === "assistant" &&
                                                m.id === lastAssistantId &&
                                                !animatedRef.current.has(m.id);
                                            return (
                                                <Message from={m.role as "user" | "assistant" | "system"} key={m.id}>
                                                    <MessageContent>
                                                        {animate ? (
                                                            <TypewriterResponse
                                                                text={text}
                                                                onDone={() => animatedRef.current.add(m.id)}
                                                            />
                                                        ) : (
                                                            <Response components={{ a: MarkdownLink }}>{text}</Response>
                                                        )}
                                                    </MessageContent>
                                                </Message>
                                            );
                                        })}
                                        {pendingUser &&
                                            <Message from="user">
                                                <MessageContent>{pendingUser}</MessageContent>
                                            </Message>
                                        }
                                        {busy &&
                                            <Message from="system">
                                                <MessageContent className="font-medium italic animate-pulse w-24">
                                                    Thinking{dots}
                                                </MessageContent>
                                            </Message>
                                        }
                                    </ConversationContent>
                                    <ConversationScrollButton />
                                </Conversation>

                                {/* Suggested answers — numbered, stacked, pick to send */}
                                {suggestions.length > 0 &&
                                    <ol className="mt-3 space-y-1.5">
                                        {suggestions.map((s, i) => (
                                            <li key={`${i}-${s}`}>
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => runStep(s)}
                                                    className="flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                        {i + 1}
                                                    </span>
                                                    <span className="whitespace-normal">{s}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ol>
                                }

                                <PromptInput onSubmit={handleSubmit} className="mt-3">
                                    <PromptInputTextarea
                                        placeholder="Answer here, or pick a suggestion above…"
                                        onChange={(e) => setText(e.target.value)}
                                        value={text}
                                    />
                                    <PromptInputToolbar>
                                        <PromptInputTools>
                                            <PromptInputButton
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                            >
                                                {uploading ? <Spinner className="size-4" /> : <Paperclip size={16} />}
                                                Upload
                                            </PromptInputButton>
                                        </PromptInputTools>
                                        <PromptInputSubmit disabled={!text || busy} status={busy ? "submitted" : undefined} />
                                    </PromptInputToolbar>
                                </PromptInput>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleUpload}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Checklist */}
                <Card className="order-1 lg:order-2 self-start">
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Icon className="size-4 text-primary" />
                            <h4 className="font-semibold">{session.lensName}</h4>
                        </div>
                        <ol className="space-y-1.5">
                            {session.sections.map((section) => {
                                const status = statusByKey.get(section.key) ?? "todo";
                                const { icon: StatusIcon, className } = STATUS_ICON[status] ?? STATUS_ICON.todo;
                                const active = lastMeta?.targetSection === section.key && status !== "done";
                                return (
                                    <li
                                        key={section.key}
                                        className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-sm ${active ? "bg-muted" : ""}`}
                                    >
                                        <StatusIcon className={`mt-0.5 size-4 shrink-0 ${className}`} />
                                        <span className={status === "done" ? "text-foreground" : "text-muted-foreground"}>
                                            {section.title}
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>

                        {documents && documents.length > 0 &&
                            <div className="space-y-1.5 border-t pt-3">
                                <p className="text-xs font-medium text-muted-foreground">Documents</p>
                                {documents.map((d) => (
                                    <div key={d.id} className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Paperclip className="size-3 shrink-0" />
                                            <span className="truncate">{d.fileName}</span>
                                        </div>
                                        <KnowledgeStatus
                                            status={d.parseStatus}
                                            onRetry={() => reparse({ fileId: d.id as Id<"files"> })}
                                        />
                                    </div>
                                ))}
                            </div>
                        }

                        <Button
                            type="button"
                            className="w-full"
                            variant={readyToGenerate ? "default" : "outline"}
                            disabled={busy || !history || history.length === 0}
                            onClick={handleGenerate}
                        >
                            <FileText className="size-4" />
                            Generate report
                        </Button>
                        {!readyToGenerate &&
                            <p className="text-center text-xs text-muted-foreground">
                                Lights up once the chapters are covered — you can generate early too.
                            </p>
                        }

                        {reports && reports.length > 0 &&
                            <div className="space-y-1 border-t pt-3">
                                <p className="text-xs font-medium text-muted-foreground">Reports</p>
                                {reports.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => openReport(r.id)}
                                        className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs hover:bg-muted/50"
                                    >
                                        <FileText className="size-3 shrink-0 text-muted-foreground" />
                                        <span className="flex-1 truncate">{r.title}</span>
                                        {r.status !== "COMPLETE" &&
                                            <Badge variant="outline" className="shrink-0 text-[10px]">{r.status}</Badge>
                                        }
                                    </button>
                                ))}
                            </div>
                        }
                    </CardContent>
                </Card>
            </div>

            {reportId &&
                <ReportPreviewSheet
                    reportId={reportId}
                    open={reportDialogOpen}
                    onOpenChange={setReportDialogOpen}
                />
            }
        </div>
    );
}
