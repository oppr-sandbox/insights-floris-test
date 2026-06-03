import { formatDateTime } from "@/utils/helpers/helpers";

export type ReportAttachment = {
    fileName: string;
    fileExtension: string;
    fileSize: number;
    uploadedBy: string;
    uploadedAt?: string;
};

export type ReportFeedback = {
    feedbackCode: string;
    author: string;
    discipline?: string;
    dateSubmitted?: string;
    text?: string;
    transcript?: string;
    hasAudio: boolean;
    images: { url: string; fileName: string }[];
};

export type TopicSnapshot = {
    generatedAt: string;
    generatedBy: string;
    topic: {
        code: string;
        name: string;
        description: string;
        status: string;
        startDate?: string;
        endDate?: string;
        channels: string[];
    };
    counts: { feedbacks: number; respondents: number; attachments: number };
    attachments: ReportAttachment[];
    feedbacks: ReportFeedback[];
};

// Objective plain-text snapshot — no interpretation, summaries or recommendations.
export function toPlainText(s: TopicSnapshot): string {
    const L: string[] = [];
    L.push(s.topic.name);
    L.push("=".repeat(Math.min(s.topic.name.length, 60)));
    L.push(`Topic ID:    ${s.topic.code}`);
    L.push(`Status:      ${s.topic.status}`);
    L.push(`Run window:  ${s.topic.startDate ? formatDateTime(s.topic.startDate) : "—"} -> ${s.topic.endDate ? formatDateTime(s.topic.endDate) : "—"}`);
    L.push(`Channels:    ${s.topic.channels.join(", ") || "—"}`);
    L.push(`Contents:    ${s.counts.feedbacks} feedback · ${s.counts.respondents} respondents · ${s.counts.attachments} files`);
    L.push(`Generated:   ${formatDateTime(s.generatedAt)} by ${s.generatedBy}`);
    if (s.topic.description) {
        L.push("");
        L.push(s.topic.description);
    }

    L.push("");
    L.push("ATTACHED FILES");
    L.push("--------------");
    if (!s.attachments.length) L.push("None.");
    s.attachments.forEach((a) => {
        const size = a.fileSize ? ` (${Math.max(1, Math.round(a.fileSize / 1024))} KB)` : "";
        L.push(`- ${a.fileName}${size} — uploaded by ${a.uploadedBy}${a.uploadedAt ? ` on ${formatDateTime(a.uploadedAt)}` : ""}`);
    });

    L.push("");
    L.push("FEEDBACK");
    L.push("--------");
    if (!s.feedbacks.length) L.push("None.");
    s.feedbacks.forEach((f) => {
        const meta = [f.author, f.discipline, f.dateSubmitted ? formatDateTime(f.dateSubmitted) : null]
            .filter(Boolean)
            .join(" · ");
        L.push("");
        L.push(`[${f.feedbackCode}] ${meta}`);
        if (f.text) L.push(f.text);
        if (f.hasAudio && f.transcript) L.push(`Voice transcript: "${f.transcript}"`);
        f.images.forEach((img) => L.push(`Image: ${img.fileName}`));
    });

    L.push("");
    L.push("—".repeat(40));
    L.push(`Snapshot generated ${formatDateTime(s.generatedAt)} by ${s.generatedBy}. This is an objective point-in-time record.`);
    return L.join("\n");
}
