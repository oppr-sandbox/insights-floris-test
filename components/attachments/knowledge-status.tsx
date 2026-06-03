'use client'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Database, CircleAlert, FileQuestion, RotateCw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BadgeColor = "default" | "success" | "warning" | "muted" | "destructive";

const CONFIG: Record<string, { label: string; color: BadgeColor; icon?: LucideIcon; spinner?: boolean; tip: string }> = {
    PENDING: {
        label: "Queued",
        color: "muted",
        icon: Clock,
        tip: "Waiting to be added to the knowledge bucket.",
    },
    PARSING: {
        label: "Parsing…",
        color: "muted",
        spinner: true,
        tip: "Reading the document and adding it to the knowledge bucket.",
    },
    PARSED: {
        label: "In knowledge bucket",
        color: "success",
        icon: Database,
        tip: "Parsed — the AI can now reason over this document's contents.",
    },
    FAILED: {
        label: "Parse failed",
        color: "destructive",
        icon: CircleAlert,
        tip: "Couldn't read this document. Retry, or see the Roadmap for format support.",
    },
    UNSUPPORTED: {
        label: "Not parsed",
        color: "warning",
        icon: FileQuestion,
        tip: "This format isn't parsed yet (e.g. Office files). See the Roadmap for upcoming support.",
    },
};

export function KnowledgeStatus({
    status,
    onRetry,
    className,
}: {
    status?: string;
    onRetry?: () => void;
    className?: string;
}) {
    const cfg = status ? CONFIG[status] : undefined;
    if (!cfg) return null;
    const Icon = cfg.icon;

    return (
        <div className="flex items-center gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge color={cfg.color} variant="outline" className={cn("gap-1 font-normal", className)}>
                        {cfg.spinner ? <Spinner className="size-3" /> : Icon ? <Icon className="size-3" /> : null}
                        {cfg.label}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-56 text-xs">{cfg.tip}</TooltipContent>
            </Tooltip>
            {status === "FAILED" && onRetry &&
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 text-muted-foreground"
                    onClick={onRetry}
                    aria-label="Retry parsing"
                >
                    <RotateCw className="size-3" />
                </Button>
            }
        </div>
    );
}
