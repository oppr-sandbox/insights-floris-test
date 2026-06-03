'use client'

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import { ChevronDown, Download, FileText, Printer, Send, Type } from "lucide-react";
import { formatDateTime } from "@/utils/helpers/helpers";
import { AnalysisReportView } from "./analysis-report";
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
    const L: string[] = [report.title, "=".repeat(Math.min(report.title.length, 60))];
    L.push(`Generated: ${formatDateTime(report.generatedAt)} by ${report.generatedBy}`);
    report.sections.forEach((s) => {
        L.push("", s.title.toUpperCase(), "-".repeat(Math.min(s.title.length, 60)), s.content);
    });
    return L.join("\n");
}

export function ReportPreviewSheet({
    reportId, open, onOpenChange,
}: {
    reportId: string; open: boolean; onOpenChange: (v: boolean) => void;
}) {
    const [armed, setArmed] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    useEffect(() => { if (open) setArmed(true); }, [open]);

    const report = useQuery(
        api.analysisReports.get,
        armed ? { reportId: reportId as Id<"analysisReports"> } : "skip",
    );
    const ready = !!report && report.status === "COMPLETE";

    const handlePrint = () => {
        onOpenChange(false);
        setTimeout(() => window.print(), 200);
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
                    <SheetHeader className="border-b">
                        <SheetTitle>{report?.title ?? "Report"}</SheetTitle>
                        <SheetDescription>
                            {report?.status === "COMPLETE" && report
                                ? `Generated ${formatDateTime(report.generatedAt)} by ${report.generatedBy}`
                                : "Review, export or share this report."}
                        </SheetDescription>
                        {ready &&
                            <div className="flex flex-wrap gap-2 pt-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline">
                                            <Download className="size-4" /> Download <ChevronDown className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onClick={handlePrint}>
                                            <FileText className="size-4" /> PDF (Save as PDF)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handlePrint}>
                                            <Printer className="size-4" /> Print
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => downloadBlob(toPlainText(report!), `${report!.title}.txt`, "text/plain")}>
                                            <Type className="size-4" /> Plain text (.txt)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button size="sm" onClick={() => setShareOpen(true)}>
                                    <Send className="size-4" /> Send to people
                                </Button>
                            </div>
                        }
                    </SheetHeader>

                    <ScrollArea className="h-[calc(100vh-9rem)]">
                        <div className="p-6">
                            <AnalysisReportView reportId={reportId} />
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {ready &&
                <ShareReportDialog reportId={reportId} title={report!.title} open={shareOpen} onOpenChange={setShareOpen} />
            }

            {/* Print-only document; the print stylesheet reveals this. */}
            {ready &&
                <div id="analysis-report" className="hidden print:block">
                    <AnalysisReportPrint report={report!} />
                </div>
            }
        </>
    );
}

type ShareUser = { id: string; displayName: string; email: string; role: string };

function ShareReportDialog({
    reportId, title, open, onOpenChange,
}: {
    reportId: string; title: string; open: boolean; onOpenChange: (v: boolean) => void;
}) {
    const users = useQuery(api.users.list, open ? {} : "skip") as ShareUser[] | undefined;
    const share = useMutation(api.analysisReports.share);
    const [sel, setSel] = useState<Record<string, boolean>>({});
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);

    const selectedIds = useMemo(() => Object.keys(sel).filter((k) => sel[k]), [sel]);

    const handleSend = async () => {
        if (selectedIds.length === 0) return;
        setBusy(true);
        try {
            const link = typeof window !== "undefined" ? window.location.href : "";
            const res = await share({
                reportId: reportId as Id<"analysisReports">,
                userIds: selectedIds as Id<"users">[],
                link,
                note: note.trim() || undefined,
            });
            toast.success(`Shared with ${res.recipients} ${res.recipients === 1 ? "person" : "people"}`, {
                description: "They'll get an in-app notification and an email.",
            });
            setSel({});
            setNote("");
            onOpenChange(false);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not share the report");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Send report to people</DialogTitle>
                    <DialogDescription>
                        Pick who should receive “{title}”. They get an in-app notification and an email with a link.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <ScrollArea className="h-56 rounded-md border p-2">
                        {users === undefined ? (
                            <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground"><Spinner /> Loading…</div>
                        ) : users.length === 0 ? (
                            <p className="p-2 text-sm text-muted-foreground">No people to share with.</p>
                        ) : (
                            <div className="space-y-1">
                                {users.map((u) => (
                                    <label key={u.id} className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/50 cursor-pointer">
                                        <Checkbox checked={!!sel[u.id]} onCheckedChange={() => setSel((p) => ({ ...p, [u.id]: !p[u.id] }))} />
                                        <span className="min-w-0 flex-1 truncate text-sm">
                                            {u.displayName}
                                            <span className="text-muted-foreground"> · {u.email}</span>
                                        </span>
                                        <Badge variant="outline" className="shrink-0 text-[10px]">{u.role}</Badge>
                                    </label>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <div className="space-y-2">
                        <Label htmlFor="share-note">Message (optional)</Label>
                        <Textarea id="share-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a short note…" rows={2} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSend} disabled={selectedIds.length === 0 || busy}>
                        {busy ? <Spinner className="size-4" /> : <Send className="size-4" />}
                        Send to {selectedIds.length || ""}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
