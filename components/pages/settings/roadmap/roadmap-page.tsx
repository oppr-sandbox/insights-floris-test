import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Clock,
    FileText,
    FileCode2,
    Braces,
    ExternalLink,
    Database,
} from "lucide-react";

type BadgeColor = "default" | "success" | "warning" | "muted" | "destructive";

function StatusBadge({ kind }: { kind: "live" | "planned" | "considered" }) {
    const map: Record<string, { label: string; color: BadgeColor; icon: typeof CheckCircle2 }> = {
        live: { label: "Live", color: "success", icon: CheckCircle2 },
        planned: { label: "Planned", color: "warning", icon: Clock },
        considered: { label: "Considered", color: "muted", icon: Clock },
    };
    const { label, color, icon: Icon } = map[kind];
    return (
        <Badge color={color} variant="outline" className="gap-1 font-normal">
            <Icon className="size-3" /> {label}
        </Badge>
    );
}

export default function RoadmapPage() {
    return (
        <div className="flex flex-1 flex-col gap-4">
            <div>
                <h3 className="text-2xl font-semibold tracking-tight">Document ingestion & roadmap</h3>
                <p className="text-sm text-muted-foreground">
                    How uploaded documents become part of the knowledge bucket, and what&apos;s planned next.
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Database className="size-4 text-primary" /> Knowledge bucket (current)
                        </CardTitle>
                        <CardDescription>
                            When you attach a document to a topic, or upload one during a guided analysis,
                            it is converted to Markdown by Gemini and stored so the AI can reason over its
                            contents — not just its filename.
                        </CardDescription>
                    </div>
                    <StatusBadge kind="live" />
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p className="font-medium">Parsed automatically today:</p>
                    <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                        <li>PDF documents (text and scanned — via Gemini OCR)</li>
                        <li>Images (PNG, JPEG, WebP, HEIC/HEIF)</li>
                        <li>Plain text, Markdown, CSV/TSV and JSON</li>
                    </ul>
                    <p className="text-xs text-muted-foreground">
                        Tables are preserved as Markdown tables. Very large documents are truncated to
                        ~100,000 characters to protect the model&apos;s context window.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="space-y-1">
                        <CardTitle>Office formats (DOCX, XLSX, PPTX)</CardTitle>
                        <CardDescription>
                            These aren&apos;t accepted by Gemini&apos;s inline ingestion, so they currently
                            show as <span className="font-medium">Not parsed</span> and are referenced by
                            filename only.
                        </CardDescription>
                    </div>
                    <StatusBadge kind="planned" />
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        Planned: integrate Microsoft&apos;s{" "}
                        <a
                            href="https://github.com/microsoft/markitdown"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                            markitdown <ExternalLink className="size-3" />
                        </a>{" "}
                        to convert Office files (and more) to Markdown. markitdown is a Python library, so it
                        can&apos;t run inside Convex&apos;s JavaScript runtime — it would run as a small
                        external service (or serverless worker) that the ingestion step calls before handing
                        the Markdown back to the knowledge bucket.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Output format</CardTitle>
                    <CardDescription>
                        We convert every document to one representation so it can be embedded in prompts and
                        rendered consistently. We chose Markdown; the alternatives below remain open.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                        <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-medium">Markdown</p>
                                <StatusBadge kind="live" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Chosen. Embeds cleanly into the AI prompts we already build, renders natively
                                in the app, and preserves headings, lists and tables (as GitHub-flavoured
                                tables).
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                        <FileCode2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-medium">HTML</p>
                                <StatusBadge kind="considered" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Higher-fidelity for complex tables and layout (merged cells, styling, nested
                                structures). Heavier to embed in prompts; a good upgrade when faithful table
                                reproduction matters in exported reports.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Braces className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-medium">Structured JSON</p>
                                <StatusBadge kind="considered" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Field-level extraction (e.g. spec sheets, forms, lab results) into typed data
                                we could query and chart directly. Best when documents are templated rather
                                than free-form.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
