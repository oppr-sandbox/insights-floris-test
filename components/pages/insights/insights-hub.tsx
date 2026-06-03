'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserDetails } from "@/providers/UserContextProvider";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    BarChart2,
    ChevronDown,
    ChevronRight,
    FileText,
    Layers,
    MessagesSquare,
    Plus,
    Search,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { formatDateTime } from "@/utils/helpers/helpers";
import { ReportPreviewSheet } from "@/components/pages/analysis/report-preview-sheet";

function iconFor(name: string): LucideIcon {
    const icons = LucideIcons as unknown as Record<string, LucideIcon>;
    const resolved = icons[name];
    return typeof resolved === "function" ? resolved : Sparkles;
}

type BadgeColor = "default" | "success" | "warning" | "muted" | "destructive";

const insightStatusBadge: Record<string, { label: string; color: BadgeColor }> = {
    GENERATING: { label: "Generating", color: "muted" },
    DRAFT: { label: "Draft", color: "warning" },
    PUBLISHED: { label: "Published", color: "success" },
    FAILED: { label: "Failed", color: "destructive" },
};

const reportStatusBadge: Record<string, { label: string; color: BadgeColor }> = {
    DRAFT: { label: "In progress", color: "warning" },
    GENERATING: { label: "Generating", color: "muted" },
    COMPLETE: { label: "Report ready", color: "success" },
    FAILED: { label: "Failed", color: "destructive" },
};

// ---- shared types mirroring insights.hub ----
type HubInsight = { id: string; insightCode: string; label: string; status: string; createdAt: string };
type HubDeepDive = {
    sessionId: string;
    title: string;
    lensName: string;
    lensIcon: string;
    reportId?: string;
    reportStatus: string;
    createdAt: string;
    updatedAt?: string;
};
type HubConversation = { sessionId: string; title: string; createdAt: string; updatedAt?: string };
type HubTopic = {
    topicId: string;
    topicCode: string;
    topicName: string;
    status: string;
    feedbackCount: number;
    insights: HubInsight[];
    deepDives: HubDeepDive[];
    conversations: HubConversation[];
    lastActivityAt: string;
};

type ItemRow = {
    key: string;
    kind: "insight" | "deepdive" | "conversation";
    icon: LucideIcon;
    typeLabel: string;
    topicCode: string;
    topicName: string;
    status: { label: string; color: BadgeColor } | null;
    reportId?: string;
    date: string;
    href: string;
};

// Flatten a topic's insights + deep dives + conversations into one typed,
// icon-tagged row list with friendly numbered labels ("Insight 2", "Root Cause
// Analysis 1", "Conversation 1") — shared by the per-topic view and the recent
// feed. Numbering is oldest-first within each type (deep dives within each lens).
function itemRows(topic: HubTopic, canManage: boolean, tenant: string): ItemRow[] {
    const rows: ItemRow[] = [];

    const visInsights = topic.insights.filter((i) => canManage || i.status === "PUBLISHED");
    visInsights.forEach((i, idx) => {
        const num = visInsights.length - idx; // desc list → oldest = 1
        rows.push({
            key: `q-${i.id}`,
            kind: "insight",
            icon: BarChart2,
            typeLabel: `Insight ${num}${i.label ? ` · ${i.label}` : ""}`,
            topicCode: topic.topicCode,
            topicName: topic.topicName,
            status: insightStatusBadge[i.status] ?? { label: i.status, color: "muted" },
            date: i.createdAt,
            href: `/${tenant}/insights/${i.insightCode}`,
        });
    });

    const visDives = topic.deepDives.filter((d) => canManage || d.reportStatus === "COMPLETE");
    const lensTotal: Record<string, number> = {};
    visDives.forEach((d) => { lensTotal[d.lensName] = (lensTotal[d.lensName] ?? 0) + 1; });
    const lensSeen: Record<string, number> = {};
    visDives.forEach((d) => {
        const total = lensTotal[d.lensName];
        const seen = lensSeen[d.lensName] ?? 0;
        lensSeen[d.lensName] = seen + 1;
        const num = total - seen; // desc → oldest = 1
        rows.push({
            key: `g-${d.sessionId}`,
            kind: "deepdive",
            icon: iconFor(d.lensIcon),
            typeLabel: total > 1 ? `${d.lensName} ${num}` : d.lensName,
            topicCode: topic.topicCode,
            topicName: topic.topicName,
            status: reportStatusBadge[d.reportStatus] ?? { label: d.reportStatus, color: "muted" },
            reportId: d.reportStatus === "COMPLETE" ? d.reportId : undefined,
            date: d.updatedAt ?? d.createdAt,
            href: `/${tenant}/insights/sessions/${d.sessionId}`,
        });
    });

    topic.conversations.forEach((c, idx) => {
        const named = c.title && c.title !== "Conversation";
        rows.push({
            key: `c-${c.sessionId}`,
            kind: "conversation",
            icon: MessagesSquare,
            typeLabel: named ? c.title : `Conversation ${topic.conversations.length - idx}`,
            topicCode: topic.topicCode,
            topicName: topic.topicName,
            status: null,
            date: c.updatedAt ?? c.createdAt,
            href: `/${tenant}/insights/sessions/${c.sessionId}`,
        });
    });

    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function ItemButton({
    row, showTopic, onClick, onOpenReport,
}: {
    row: ItemRow; showTopic?: boolean; onClick: () => void; onOpenReport?: (reportId: string) => void;
}) {
    const Icon = row.icon;
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition hover:bg-muted/50"
        >
            <span className="hidden w-24 shrink-0 text-xs text-muted-foreground sm:inline">
                {formatDateTime(row.date)}
            </span>
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
                {showTopic ? (
                    <>
                        <p className="truncate font-medium">{row.topicCode} · {row.topicName}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.typeLabel}</p>
                    </>
                ) : (
                    <p className="truncate font-medium">{row.typeLabel}</p>
                )}
            </div>
            {row.reportId && onOpenReport ? (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpenReport(row.reportId!); }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/40 px-2 py-0.5 text-xs font-medium text-success transition hover:bg-success/10"
                >
                    <FileText className="size-3" /> Report ready
                </button>
            ) : row.status ? (
                <Badge color={row.status.color} variant="outline" className="shrink-0">{row.status.label}</Badge>
            ) : null}
        </div>
    );
}

function topicSummary(topic: HubTopic, canManage: boolean): string {
    const ins = topic.insights.filter((i) => canManage || i.status === "PUBLISHED").length;
    const dives = topic.deepDives.filter((d) => canManage || d.reportStatus === "COMPLETE").length;
    const convos = topic.conversations.length;
    const parts: string[] = [];
    if (ins) parts.push(`${ins} insight${ins === 1 ? "" : "s"}`);
    if (dives) parts.push(`${dives} deep dive${dives === 1 ? "" : "s"}`);
    if (convos) parts.push(`${convos} conversation${convos === 1 ? "" : "s"}`);
    if (parts.length === 0) return `Nothing generated yet · ${topic.feedbackCount} feedback`;
    return `${parts.join(" · ")} · ${topic.feedbackCount} feedback`;
}

export default function InsightsHub() {
    const { hasPermission } = useUserDetails();
    const canManage = hasPermission("insights:manage");

    const [talk, setTalk] = useState<{ open: boolean; topicId?: string }>({ open: false });
    const [reportId, setReportId] = useState<string | null>(null);

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="px-4 space-y-4">
                <div className="flex justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Insights</h3>
                        <p className="text-sm text-muted-foreground">
                            Generated insights and deep dives per topic, plus conversations across your data.
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setTalk({ open: true })}>
                        <MessagesSquare className="size-4" />
                        Talk
                    </Button>
                </div>

                <Tabs defaultValue="topics" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="topics">
                            <Layers className="size-4" />
                            By topic
                        </TabsTrigger>
                        <TabsTrigger value="conversations">
                            <MessagesSquare className="size-4" />
                            Conversations
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="topics">
                        <ByTopic
                            canManage={canManage}
                            onTalk={(topicId) => setTalk({ open: true, topicId })}
                            onOpenReport={setReportId}
                        />
                    </TabsContent>
                    <TabsContent value="conversations">
                        <Conversations onNew={() => setTalk({ open: true })} />
                    </TabsContent>
                </Tabs>
            </div>

            <TalkPicker
                open={talk.open}
                seedTopicId={talk.topicId}
                onOpenChange={(o) => setTalk((p) => ({ ...p, open: o }))}
            />

            {reportId &&
                <ReportPreviewSheet
                    reportId={reportId}
                    open={!!reportId}
                    onOpenChange={(o) => { if (!o) setReportId(null); }}
                />
            }
        </main>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// By topic
// ─────────────────────────────────────────────────────────────────────────
function ByTopic({
    canManage, onTalk, onOpenReport,
}: {
    canManage: boolean; onTalk: (topicId: string) => void; onOpenReport: (reportId: string) => void;
}) {
    const router = useRouter();
    const { tenant } = useUserDetails();
    const topics = useQuery(api.insights.hub, {}) as HubTopic[] | undefined;
    const conversations = useQuery(api.sessions.conversations, {}) as Conversation[] | undefined;
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const recent = useMemo(() => {
        if (!topics) return [];
        return topics
            .flatMap((t) => itemRows(t, canManage, tenant))
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .slice(0, 6);
    }, [topics, canManage, tenant]);

    const multiTopic = useMemo(
        () => (conversations ?? []).filter((c) => c.multiTopic),
        [conversations],
    );

    if (topics === undefined) {
        return (
            <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
                <Spinner /> Loading…
            </div>
        );
    }
    if (topics.length === 0) {
        return (
            <EmptyState
                icons={[BarChart2, Sparkles]}
                title="Nothing to analyse yet"
                description={"Once topics have feedback, generate an insight\nor run a deep dive to see it here."}
            />
        );
    }

    return (
        <div className="space-y-6">
            {recent.length > 0 &&
                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Recently generated</h4>
                    <div className="space-y-2">
                        {recent.map((row) => (
                            <ItemButton
                                key={row.key}
                                row={row}
                                showTopic
                                onClick={() => router.push(row.href)}
                                onOpenReport={onOpenReport}
                            />
                        ))}
                    </div>
                </section>
            }

            <section className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">By topic</h4>
                <div className="space-y-3">
                    {topics.map((t) => {
                        const isOpen = expanded[t.topicId] ?? false;
                        const Chevron = isOpen ? ChevronDown : ChevronRight;
                        return (
                            <Card key={t.topicId}>
                                <CardContent className="p-0">
                                    <button
                                        type="button"
                                        onClick={() => setExpanded((p) => ({ ...p, [t.topicId]: !isOpen }))}
                                        className="flex w-full items-center gap-3 p-4 text-left"
                                    >
                                        <Chevron className="size-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{t.topicName}</p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {t.topicCode} · {topicSummary(t, canManage)}
                                            </p>
                                        </div>
                                    </button>

                                    {isOpen &&
                                        <div className="space-y-3 border-t p-4">
                                            <TopicActions
                                                topicId={t.topicId}
                                                canManage={canManage}
                                                onTalk={() => onTalk(t.topicId)}
                                            />
                                            <TopicElements topic={t} canManage={canManage} onOpenReport={onOpenReport} />
                                        </div>
                                    }
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {multiTopic.length > 0 &&
                <section className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">Across multiple topics</h4>
                    <div className="space-y-2">
                        {multiTopic.map((c) => (
                            <div
                                key={c.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => router.push(`/${tenant}/insights/sessions/${c.id}`)}
                                onKeyDown={(e) => { if (e.key === "Enter") router.push(`/${tenant}/insights/sessions/${c.id}`); }}
                                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/50"
                            >
                                <span className="hidden w-24 shrink-0 text-xs text-muted-foreground sm:inline">
                                    {formatDateTime(c.updatedAt ?? c.createdAt)}
                                </span>
                                <MessagesSquare className="size-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{c.title}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {c.sources.join(" · ")}
                                    </p>
                                </div>
                                <Badge variant="outline" className="shrink-0">{c.topicCount} topics</Badge>
                            </div>
                        ))}
                    </div>
                </section>
            }
        </div>
    );
}

function TopicActions({
    topicId,
    canManage,
    onTalk,
}: {
    topicId: string;
    canManage: boolean;
    onTalk: () => void;
}) {
    const router = useRouter();
    const { tenant } = useUserDetails();
    const lenses = useQuery(api.lenses.list, { onlyEnabled: true });
    const methods = (lenses ?? []).filter((l) => l.generatesReport);
    const generateInsight = useMutation(api.insights.generate);
    const createGuided = useMutation(api.sessions.createGuided);
    const [busy, setBusy] = useState(false);

    const handleQuick = async () => {
        setBusy(true);
        try {
            const res = await generateInsight({ topicId: topicId as Id<"topics"> });
            toast.success("Generating insight…");
            router.push(`/${tenant}/insights/${res.insightCode}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not generate insight");
            setBusy(false);
        }
    };

    const handleGuided = async (lensKey: string) => {
        setBusy(true);
        try {
            const res = await createGuided({ lensKey, topicIds: [topicId as Id<"topics">] });
            router.push(`/${tenant}/insights/sessions/${res.id}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not start the deep dive");
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {canManage &&
                <>
                    <Button size="sm" onClick={handleQuick} disabled={busy}>
                        {busy ? <Spinner className="size-4" /> : <BarChart2 className="size-4" />}
                        Create insight
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" disabled={busy}>
                                <Sparkles className="size-4" />
                                New deep dive
                                <ChevronDown className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                            <DropdownMenuLabel>Guided method</DropdownMenuLabel>
                            {methods.length === 0 &&
                                <DropdownMenuItem disabled>No methods configured</DropdownMenuItem>
                            }
                            {methods.map((m) => {
                                const Icon = iconFor(m.icon);
                                return (
                                    <DropdownMenuItem
                                        key={m.key}
                                        onClick={() => handleGuided(m.key)}
                                        className="flex-col items-start gap-0.5"
                                    >
                                        <span className="flex items-center gap-2 font-medium">
                                            <Icon className="size-4" /> {m.name}
                                        </span>
                                        {m.description &&
                                            <span className="text-xs text-muted-foreground">{m.description}</span>
                                        }
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            }
            <Button size="sm" variant="outline" onClick={onTalk}>
                <MessagesSquare className="size-4" />
                Talk
            </Button>
        </div>
    );
}

function TopicElements({
    topic, canManage, onOpenReport,
}: {
    topic: HubTopic; canManage: boolean; onOpenReport: (reportId: string) => void;
}) {
    const router = useRouter();
    const { tenant } = useUserDetails();
    const rows = useMemo(() => itemRows(topic, canManage, tenant), [topic, canManage, tenant]);

    if (rows.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No {canManage ? "" : "published "}results yet.
            </p>
        );
    }

    const groups: { label: string; kind: ItemRow["kind"] }[] = [
        { label: "Insights", kind: "insight" },
        { label: "Deep dives", kind: "deepdive" },
        { label: "Talks", kind: "conversation" },
    ];

    return (
        <div className="space-y-3">
            {groups.map(({ label, kind }) => {
                const group = rows.filter((r) => r.kind === kind);
                if (group.length === 0) return null;
                return (
                    <div key={kind} className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                        {group.map((row) => (
                            <ItemButton
                                key={row.key}
                                row={row}
                                onClick={() => router.push(row.href)}
                                onOpenReport={onOpenReport}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Conversations
// ─────────────────────────────────────────────────────────────────────────
type Conversation = {
    id: string;
    title: string;
    startedBy: string;
    sources: string[];
    topicCount: number;
    multiTopic: boolean;
    messageCount: number;
    createdAt: string;
    updatedAt?: string;
};

function Conversations({ onNew }: { onNew: () => void }) {
    const router = useRouter();
    const { tenant } = useUserDetails();
    const data = useQuery(api.sessions.conversations, {}) as Conversation[] | undefined;
    const [sort, setSort] = useState<"newest" | "oldest">("newest");

    const sorted = useMemo(() => {
        const list = [...(data ?? [])];
        const at = (c: Conversation) => c.updatedAt ?? c.createdAt;
        list.sort((a, b) => (sort === "newest" ? (at(a) < at(b) ? 1 : -1) : at(a) < at(b) ? -1 : 1));
        return list;
    }, [data, sort]);

    if (data === undefined) {
        return (
            <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
                <Spinner /> Loading…
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "oldest")}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest first</SelectItem>
                        <SelectItem value="oldest">Oldest first</SelectItem>
                    </SelectContent>
                </Select>
                <Button size="sm" onClick={onNew}>
                    <Plus className="size-4" />
                    New conversation
                </Button>
            </div>

            {sorted.length === 0 ? (
                <EmptyState
                    icons={[MessagesSquare]}
                    title="No conversations yet"
                    description={"Use Talk to start a conversation across\ntopics, insights and reports."}
                    action={{ label: "New conversation", onClick: onNew }}
                />
            ) : (
                <div className="space-y-2">
                    {sorted.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => router.push(`/${tenant}/insights/sessions/${c.id}`)}
                            className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition hover:bg-muted/50"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <MessagesSquare className="size-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 space-y-1">
                                    <p className="truncate font-medium">{c.title}</p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        Started by {c.startedBy} · {c.messageCount} message{c.messageCount === 1 ? "" : "s"}
                                    </p>
                                    {c.sources.length > 0 &&
                                        <div className="flex flex-wrap gap-1">
                                            {c.sources.map((s, i) => (
                                                <Badge key={`${i}-${s}`} variant="outline" className="text-[10px] font-normal">{s}</Badge>
                                            ))}
                                        </div>
                                    }
                                </div>
                            </div>
                            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                                {formatDateTime(c.updatedAt ?? c.createdAt)}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Talk — source picker
// ─────────────────────────────────────────────────────────────────────────
function TalkPicker({
    open,
    seedTopicId,
    onOpenChange,
}: {
    open: boolean;
    seedTopicId?: string;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();
    const { tenant } = useUserDetails();
    const allTopics = useQuery(api.insights.hub, open ? {} : "skip") as HubTopic[] | undefined;
    const createAsk = useMutation(api.sessions.createAsk);
    // Talk launched from inside a topic is scoped to that topic only.
    const topics = allTopics && seedTopicId ? allTopics.filter((t) => t.topicId === seedTopicId) : allTopics;
    const scoped = !!seedTopicId;

    const [topicSel, setTopicSel] = useState<Record<string, boolean>>({});
    const [insightSel, setInsightSel] = useState<Record<string, boolean>>({});
    const [reportSel, setReportSel] = useState<Record<string, boolean>>({});
    const [title, setTitle] = useState("");
    const [query, setQuery] = useState("");
    const [busy, setBusy] = useState(false);

    const displayTopics = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q || !topics) return topics;
        return topics.filter(
            (t) =>
                t.topicCode.toLowerCase().includes(q) ||
                t.topicName.toLowerCase().includes(q) ||
                t.insights.some((i) => i.insightCode.toLowerCase().includes(q) || (i.label ?? "").toLowerCase().includes(q)) ||
                t.deepDives.some((d) => d.lensName.toLowerCase().includes(q)),
        );
    }, [topics, query]);

    // Pre-select the seed topic's raw feedback whenever the dialog opens for one.
    const seedKey = open ? seedTopicId ?? "none" : "closed";
    const [appliedSeed, setAppliedSeed] = useState<string>("");
    if (open && appliedSeed !== seedKey) {
        setAppliedSeed(seedKey);
        setTopicSel(seedTopicId ? { [seedTopicId]: true } : {});
        setInsightSel({});
        setReportSel({});
        setTitle("");
        setQuery("");
    }

    const counts = useMemo(() => {
        const t = Object.values(topicSel).filter(Boolean).length;
        const i = Object.values(insightSel).filter(Boolean).length;
        const r = Object.values(reportSel).filter(Boolean).length;
        return { t, i, r, total: t + i + r };
    }, [topicSel, insightSel, reportSel]);

    const handleCreate = async () => {
        if (counts.total === 0) return;
        setBusy(true);
        try {
            const res = await createAsk({
                topicIds: Object.keys(topicSel).filter((k) => topicSel[k]) as Id<"topics">[],
                insightIds: Object.keys(insightSel).filter((k) => insightSel[k]) as Id<"insights">[],
                reportIds: Object.keys(reportSel).filter((k) => reportSel[k]) as Id<"analysisReports">[],
                scopeTopicId: seedTopicId as Id<"topics"> | undefined,
                title: title.trim() || undefined,
            });
            onOpenChange(false);
            router.push(`/${tenant}/insights/sessions/${res.id}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not start the conversation");
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Talk to your data</DialogTitle>
                    <DialogDescription>
                        {scoped
                            ? "This conversation stays within this topic. Pick its raw feedback, insights and reports."
                            : "Choose what the conversation can see — raw topics, generated insights and reports from anywhere."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <Label>Sources</Label>
                    {topics === undefined ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Spinner /> Loading…
                        </div>
                    ) : topics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No topics available yet.</p>
                    ) : (
                        <>
                            {!scoped &&
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search topics, insights, methods…"
                                        className="pl-8"
                                    />
                                </div>
                            }
                            <ScrollArea className="h-72 rounded-md border">
                                <div className="space-y-3 p-3">
                                    {(displayTopics ?? []).length === 0 &&
                                        <p className="p-2 text-sm text-muted-foreground">No matches.</p>
                                    }
                                    {(displayTopics ?? []).map((t) => {
                                        const completedReports = t.deepDives.filter(
                                            (d) => d.reportId && d.reportStatus === "COMPLETE",
                                        );
                                        const usableInsights = t.insights.filter((i) => i.status !== "FAILED" && i.status !== "GENERATING");
                                        const lensTotal: Record<string, number> = {};
                                        completedReports.forEach((d) => { lensTotal[d.lensName] = (lensTotal[d.lensName] ?? 0) + 1; });
                                        const lensSeen: Record<string, number> = {};
                                        return (
                                            <div key={t.topicId} className="space-y-1.5">
                                                <p className="text-sm font-medium">{t.topicCode} — {t.topicName}</p>
                                                <label className="ml-1 flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/50 cursor-pointer">
                                                    <Checkbox
                                                        checked={!!topicSel[t.topicId]}
                                                        onCheckedChange={() =>
                                                            setTopicSel((p) => ({ ...p, [t.topicId]: !p[t.topicId] }))
                                                        }
                                                    />
                                                    <Layers className="size-4 text-muted-foreground" />
                                                    <span className="text-sm">Raw feedback &amp; documents</span>
                                                </label>
                                                {usableInsights.map((i, idx) => (
                                                    <label key={i.id} className="ml-1 flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/50 cursor-pointer">
                                                        <Checkbox
                                                            checked={!!insightSel[i.id]}
                                                            onCheckedChange={() =>
                                                                setInsightSel((p) => ({ ...p, [i.id]: !p[i.id] }))
                                                            }
                                                        />
                                                        <BarChart2 className="size-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            Insight {usableInsights.length - idx}
                                                            {i.label && <span className="text-muted-foreground"> · {i.label}</span>}
                                                        </span>
                                                    </label>
                                                ))}
                                                {completedReports.map((d) => {
                                                    const total = lensTotal[d.lensName];
                                                    const seen = lensSeen[d.lensName] ?? 0;
                                                    lensSeen[d.lensName] = seen + 1;
                                                    const num = total - seen;
                                                    return (
                                                        <label key={d.reportId} className="ml-1 flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/50 cursor-pointer">
                                                            <Checkbox
                                                                checked={!!reportSel[d.reportId!]}
                                                                onCheckedChange={() =>
                                                                    setReportSel((p) => ({ ...p, [d.reportId!]: !p[d.reportId!] }))
                                                                }
                                                            />
                                                            <FileText className="size-4 text-muted-foreground" />
                                                            <span className="text-sm">{total > 1 ? `${d.lensName} ${num}` : d.lensName} <span className="text-muted-foreground">· report</span></span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="talk-title">Title (optional)</Label>
                        <Input
                            id="talk-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Cross-topic root cause"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={counts.total === 0 || busy}>
                        {busy && <Spinner className="size-4" />}
                        Start conversation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
