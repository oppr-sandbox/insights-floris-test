'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/sonner";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
    ChevronDown,
    Download,
    Sparkles,
    Plus,
    BarChart2,
    type LucideIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useUserDetails } from "@/providers/UserContextProvider";
import { formatDateTime } from "@/utils/helpers/helpers";
import { useTopicDetail } from "../hooks/useTopicDetail";
import { ExportTopicDialog } from "./export/export-dialog";

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

type Row = {
    key: string;
    kind: "quick" | "guided";
    icon: LucideIcon;
    title: string;
    method: string;
    status: { label: string; color: BadgeColor };
    date: string;
    href: string;
};

export default function Analysis() {
    const { data } = useTopicDetail();
    const { tenant } = useUserDetails();
    const router = useRouter();

    const topicId = data?.id as Id<"topics"> | undefined;

    const insights = useQuery(api.insights.byTopic, topicId ? { topicId } : "skip");
    const guided = useQuery(api.sessions.guidedByTopic, topicId ? { topicId } : "skip");
    const lenses = useQuery(api.lenses.list, { onlyEnabled: true });
    const methods = (lenses ?? []).filter((l) => l.generatesReport);

    const generateInsight = useMutation(api.insights.generate);
    const createGuided = useMutation(api.sessions.createGuided);
    const [busy, setBusy] = useState(false);

    if (!data || !topicId) return null;

    const handleQuick = async () => {
        setBusy(true);
        try {
            const res = await generateInsight({ topicId });
            toast.success("Generating insight…");
            router.push(`/${tenant}/insights/${res.insightCode}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not generate insight");
        } finally {
            setBusy(false);
        }
    };

    const handleGuided = async (lensKey: string) => {
        setBusy(true);
        try {
            const res = await createGuided({ lensKey, topicIds: [topicId] });
            router.push(`/${tenant}/insights/sessions/${res.id}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not start the analysis");
            setBusy(false);
        }
    };

    const loading = insights === undefined || guided === undefined;

    const rows: Row[] = [
        ...(insights ?? []).map((ins) => ({
            key: `q-${ins.id}`,
            kind: "quick" as const,
            icon: BarChart2,
            title: ins.label ? `${ins.insightCode} · ${ins.label}` : ins.insightCode,
            method: "Quick insight",
            status: insightStatusBadge[ins.status] ?? { label: ins.status, color: "muted" as BadgeColor },
            date: ins.createdOn,
            href: `/${tenant}/insights/${ins.insightCode}`,
        })),
        ...(guided ?? []).map((g) => ({
            key: `g-${g.id}`,
            kind: "guided" as const,
            icon: iconFor(g.lensIcon),
            title: g.title,
            method: g.lensName,
            status: reportStatusBadge[g.reportStatus] ?? { label: g.reportStatus, color: "muted" as BadgeColor },
            date: g.createdAt,
            href: `/${tenant}/insights/sessions/${g.id}`,
        })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));

    return (
        <TabsContent value="analysis" className="space-y-4">
            <Card>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h4 className="font-semibold">Analysis</h4>
                        <p className="text-sm text-muted-foreground">
                            Snapshot the feedback, generate an insight, or run a guided
                            analysis. Every result is a point-in-time snapshot of this topic.
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                        <ExportTopicDialog
                            topicId={data.id}
                            topicCode={data.topicCode}
                            trigger={
                                <Button variant="outline" size="sm">
                                    <Download className="size-4" />
                                    Snapshot
                                </Button>
                            }
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" disabled={busy}>
                                    {busy ? <Spinner className="size-4" /> : <Plus className="size-4" />}
                                    New insight
                                    <ChevronDown className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60">
                                <DropdownMenuLabel>Create</DropdownMenuLabel>
                                <DropdownMenuItem onClick={handleQuick} className="flex-col items-start gap-0.5">
                                    <span className="flex items-center gap-2 font-medium">
                                        <BarChart2 className="size-4" /> Quick insight
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        IDA analyses the feedback for you.
                                    </span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="gap-2">
                                        <Sparkles className="size-4" /> Guided analysis
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="w-64">
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
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            {loading &&
                <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
                    <Spinner /> Loading analyses…
                </div>
            }

            {!loading && rows.length === 0 &&
                <EmptyState
                    icons={[BarChart2, Sparkles]}
                    title="No analyses yet"
                    description={"Generate a quick insight or run a guided\nanalysis to get started."}
                />
            }

            {!loading && rows.length > 0 &&
                <div className="space-y-2">
                    {rows.map((row) => {
                        const Icon = row.icon;
                        return (
                            <button
                                key={row.key}
                                type="button"
                                onClick={() => router.push(row.href)}
                                className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition hover:bg-muted/50"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">{row.title}</p>
                                        <p className="text-xs text-muted-foreground">{row.method}</p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <Badge color={row.status.color} variant="outline">{row.status.label}</Badge>
                                    <span className="hidden text-xs text-muted-foreground sm:inline">
                                        {formatDateTime(row.date)}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            }
        </TabsContent>
    );
}
