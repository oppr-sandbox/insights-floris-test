'use client'

/* eslint-disable @next/next/no-img-element */
import {
    File, FileImage, FileSpreadsheet, FileText, Image as ImageIcon,
    Mail, Mic, Paperclip, Type,
} from "lucide-react";
import { formatDateTime } from "@/utils/helpers/helpers";
import { cn } from "@/lib/utils";
import type { ReportAttachment, ReportFeedback, TopicSnapshot } from "./report-format";

const statusColor: Record<string, string> = {
    ACTIVE: "text-emerald-700 bg-emerald-50 border-emerald-200",
    PUBLISHED: "text-emerald-700 bg-emerald-50 border-emerald-200",
    PAUSED: "text-amber-700 bg-amber-50 border-amber-200",
    COMPLETED: "text-slate-700 bg-slate-100 border-slate-200",
    DRAFT: "text-slate-700 bg-slate-100 border-slate-200",
};

function fileIcon(ext: string): { Icon: React.ElementType; cls: string } {
    const e = ext.toLowerCase();
    if (["csv", "xls", "xlsx"].includes(e)) return { Icon: FileSpreadsheet, cls: "text-emerald-600" };
    if (["eml", "msg"].includes(e)) return { Icon: Mail, cls: "text-sky-600" };
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(e)) return { Icon: FileImage, cls: "text-violet-600" };
    if (["pdf"].includes(e)) return { Icon: FileText, cls: "text-rose-600" };
    if (["md", "txt", "doc", "docx"].includes(e)) return { Icon: FileText, cls: "text-slate-600" };
    return { Icon: File, cls: "text-slate-500" };
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
    return (
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", className)}>
            {children}
        </span>
    );
}

function AttachmentRow({ a }: { a: ReportAttachment }) {
    const { Icon, cls } = fileIcon(a.fileExtension);
    const size = a.fileSize ? `${Math.max(1, Math.round(a.fileSize / 1024))} KB` : "";
    return (
        <div className="flex items-center gap-3 break-inside-avoid rounded-md border border-slate-200 bg-slate-50 p-2.5">
            <Icon className={cn("size-5 shrink-0", cls)} />
            <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-slate-800">{a.fileName}</p>
                <p className="text-xs text-slate-500">
                    {[size, `Uploaded by ${a.uploadedBy}`, a.uploadedAt ? formatDateTime(a.uploadedAt) : null]
                        .filter(Boolean).join(" · ")}
                </p>
            </div>
        </div>
    );
}

function FeedbackBlock({ f }: { f: ReportFeedback }) {
    const meta = [f.author, f.discipline, f.dateSubmitted ? formatDateTime(f.dateSubmitted) : null]
        .filter(Boolean).join(" · ");
    return (
        <div className="mt-4 break-inside-avoid border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-slate-900">{f.feedbackCode}</span>
                <span className="text-xs text-slate-500">{meta}</span>
                <span className="grow" />
                {f.hasAudio && <Badge className="text-sky-700 bg-sky-50 border-sky-200"><Mic className="size-3.5" />Voice</Badge>}
                {!!f.images.length && <Badge className="text-violet-700 bg-violet-50 border-violet-200"><ImageIcon className="size-3.5" />{f.images.length} image{f.images.length > 1 ? "s" : ""}</Badge>}
            </div>
            {f.text && <p className="mt-2 text-[13px] leading-relaxed text-slate-800">{f.text}</p>}
            {f.hasAudio && f.transcript &&
                <p className="mt-2 rounded-r border-l-2 border-sky-300 bg-sky-50/60 py-1 pl-3 text-[13px] italic text-slate-700">
                    Voice transcript: &ldquo;{f.transcript}&rdquo;
                </p>
            }
            {!!f.images.length &&
                <div className="mt-2 flex flex-wrap gap-2">
                    {f.images.map((img, i) => (
                        <img key={i} src={img.url} alt={img.fileName} className="max-h-48 rounded border border-slate-200" />
                    ))}
                </div>
            }
        </div>
    );
}

const channelChip: Record<string, { Icon: React.ElementType; cls: string; label: string }> = {
    TEXT: { Icon: Type, cls: "text-slate-700 bg-slate-100 border-slate-200", label: "Text" },
    VOICE: { Icon: Mic, cls: "text-sky-700 bg-sky-50 border-sky-200", label: "Voice" },
    IMAGE: { Icon: ImageIcon, cls: "text-violet-700 bg-violet-50 border-violet-200", label: "Image" },
};

export function TopicReport({ snapshot }: { snapshot: TopicSnapshot }) {
    const s = snapshot;
    return (
        <div className="mx-auto max-w-3xl bg-white p-10 text-slate-900">
            {/* Cover */}
            <div className="break-after-page">
                <div className="mb-6 h-1.5 w-24 rounded-full bg-violet-600" />
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">Topic Report</p>
                <p className="mt-6 text-sm text-slate-500">Topic ID: {s.topic.code}</p>
                <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-900">{s.topic.name}</h1>

                <dl className="mt-8 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3 text-sm">
                    <dt className="text-slate-500">Status</dt>
                    <dd><Badge className={statusColor[s.topic.status] ?? "text-slate-700 bg-slate-100 border-slate-200"}>{s.topic.status}</Badge></dd>
                    <dt className="text-slate-500">Run window</dt>
                    <dd className="text-slate-800">{s.topic.startDate ? formatDateTime(s.topic.startDate) : "—"} → {s.topic.endDate ? formatDateTime(s.topic.endDate) : "—"}</dd>
                    <dt className="text-slate-500">Channels</dt>
                    <dd className="flex flex-wrap gap-1.5">
                        {s.topic.channels.map((c) => {
                            const chip = channelChip[c];
                            if (!chip) return <Badge key={c} className="text-slate-700 bg-slate-100 border-slate-200">{c}</Badge>;
                            const { Icon } = chip;
                            return <Badge key={c} className={chip.cls}><Icon className="size-3.5" />{chip.label}</Badge>;
                        })}
                    </dd>
                    <dt className="text-slate-500">Contents</dt>
                    <dd className="text-slate-800">{s.counts.feedbacks} feedback · {s.counts.respondents} respondents · {s.counts.attachments} files</dd>
                    <dt className="text-slate-500">Generated</dt>
                    <dd className="text-slate-800">{formatDateTime(s.generatedAt)} by {s.generatedBy}</dd>
                </dl>

                {s.topic.description &&
                    <p className="mt-8 text-sm leading-relaxed text-slate-700">{s.topic.description}</p>
                }
                <p className="mt-10 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    Objective point-in-time snapshot — no analysis or recommendations. If the topic is still
                    collecting feedback, a later export may differ. Generated {formatDateTime(s.generatedAt)} by {s.generatedBy}.
                </p>
            </div>

            {/* Attached files */}
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Paperclip className="size-5 text-violet-600" /> Attached files
            </h2>
            {s.attachments.length
                ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{s.attachments.map((a) => <AttachmentRow key={a.fileName} a={a} />)}</div>
                : <p className="mt-2 text-sm text-slate-500">No files attached.</p>}

            {/* Feedback */}
            <h2 className="mt-10 break-before-page text-lg font-bold text-slate-900">Feedback ({s.counts.feedbacks})</h2>
            {s.feedbacks.length
                ? s.feedbacks.map((f) => <FeedbackBlock key={f.feedbackCode} f={f} />)
                : <p className="mt-2 text-sm text-slate-500">No feedback collected.</p>}

            <p className="mt-10 border-t border-slate-200 pt-3 text-xs text-slate-400">
                Snapshot generated {formatDateTime(s.generatedAt)} by {s.generatedBy}.
            </p>
        </div>
    );
}
