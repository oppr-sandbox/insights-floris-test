'use client'

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Printer, Type } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/utils/helpers/helpers";
import { AnalysisReportPrint, type AnalysisReport } from "./analysis-report-print";

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

function toPlainText(report: AnalysisReport): string {
    const L: string[] = [];
    L.push(report.title);
    L.push("=".repeat(Math.min(report.title.length, 60)));
    L.push(`Generated: ${formatDateTime(report.generatedAt)} by ${report.generatedBy}`);
    report.sections.forEach((section) => {
        L.push("");
        L.push(section.title.toUpperCase());
        L.push("-".repeat(Math.min(section.title.length, 60)));
        L.push(section.content);
    });
    return L.join("\n");
}

function ExportOption({
    icon: Icon, title, description, onClick,
}: {
    icon: React.ElementType; title: string; description: string; onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
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

export function ReportExportDialog({
    reportId, open, onOpenChange,
}: {
    reportId: string; open: boolean; onOpenChange: (v: boolean) => void;
}) {
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        if (open) setArmed(true);
    }, [open]);

    const report = useQuery(
        api.analysisReports.get,
        armed ? { reportId: reportId as Id<"analysisReports"> } : "skip",
    );

    const loading = armed && report === undefined;
    const ready = !!report && report.status === "COMPLETE";

    const handlePrint = () => {
        onOpenChange(false);
        // Let the dialog overlay unmount before invoking the print view.
        setTimeout(() => window.print(), 150);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Download report</DialogTitle>
                        <DialogDescription>
                            Export this analysis report as a PDF, send it to a printer, or
                            download a plain-text copy.
                        </DialogDescription>
                    </DialogHeader>

                    {loading &&
                        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                            <Spinner /> Preparing report…
                        </div>
                    }
                    {armed && report === null &&
                        <p className="py-6 text-center text-sm text-destructive">Unable to load this report.</p>
                    }
                    {!!report && report.status !== "COMPLETE" &&
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            This report is not ready to download yet.
                        </p>
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
                                onClick={() => downloadBlob(toPlainText(report), `${report.title}.txt`, "text/plain")}
                            />
                        </div>
                    }
                </DialogContent>
            </Dialog>

            {/* Print-only document. Hidden on screen; the print stylesheet reveals it. */}
            {ready &&
                <div id="analysis-report" className="hidden print:block">
                    <AnalysisReportPrint report={report} />
                </div>
            }
        </>
    );
}
