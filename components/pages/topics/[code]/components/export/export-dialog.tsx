'use client'

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileText, Printer, Type } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { TopicReport } from "./topic-report";
import { toPlainText, type TopicSnapshot } from "./report-format";

function downloadBlob(content: string, fileName: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function ExportOption({
    icon: Icon, title, description, onClick, disabled,
}: {
    icon: React.ElementType; title: string; description: string; onClick: () => void; disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </button>
    );
}

export function ExportTopicDialog({
    topicId,
    topicCode,
    trigger,
}: {
    topicId: string;
    topicCode: string;
    trigger?: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [armed, setArmed] = useState(false);

    const snapshot = useQuery(
        api.topicExport.snapshot,
        armed ? { topicId: topicId as Id<"topics"> } : "skip",
    ) as TopicSnapshot | null | undefined;

    const loading = armed && snapshot === undefined;
    const ready = !!snapshot;

    const handleOpenChange = (v: boolean) => {
        setOpen(v);
        if (v) setArmed(true);
    };

    const handlePrint = () => {
        setOpen(false);
        // Let the dialog overlay unmount before invoking the print view.
        setTimeout(() => window.print(), 150);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    {trigger ?? (
                        <Button variant="outline" size="sm" className="items-center">
                            <Download className="size-3" />
                            Download
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Quick download</DialogTitle>
                        <DialogDescription>
                            An objective point-in-time snapshot — topic details, attached files and every
                            feedback (voice notes as transcript). No analysis or recommendations.
                        </DialogDescription>
                    </DialogHeader>

                    {loading &&
                        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                            <Spinner /> Preparing snapshot…
                        </div>
                    }
                    {armed && snapshot === null &&
                        <p className="py-6 text-center text-sm text-destructive">Unable to load this topic.</p>
                    }
                    {ready &&
                        <div className="grid gap-2">
                            <ExportOption
                                icon={FileText}
                                title="PDF"
                                description="Opens your browser print dialog — choose “Save as PDF”."
                                onClick={handlePrint}
                            />
                            <ExportOption
                                icon={Printer}
                                title="Print"
                                description="Send the formatted report straight to a printer."
                                onClick={handlePrint}
                            />
                            <ExportOption
                                icon={Type}
                                title="Plain text"
                                description="Download a .txt file."
                                onClick={() => downloadBlob(toPlainText(snapshot!), `${topicCode}-report.txt`, "text/plain")}
                            />
                        </div>
                    }
                </DialogContent>
            </Dialog>

            {/* Print-only document. Hidden on screen; the print stylesheet reveals it. */}
            {ready &&
                <div id="topic-report" className="hidden print:block">
                    <TopicReport snapshot={snapshot!} />
                </div>
            }
        </>
    );
}
