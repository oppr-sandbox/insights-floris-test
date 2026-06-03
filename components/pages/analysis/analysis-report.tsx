'use client'

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Spinner } from "@/components/ui/spinner";
import { Response } from "@/components/ai-elements/response";
import { formatDateTime } from "@/utils/helpers/helpers";

export function AnalysisReportView({ reportId }: { reportId: string }) {
    const report = useQuery(api.analysisReports.get, {
        reportId: reportId as Id<"analysisReports">,
    });

    if (report === undefined) {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Spinner /> Loading report…
            </div>
        );
    }

    if (report === null) {
        return (
            <p className="py-16 text-center text-sm text-destructive">
                This report could not be found.
            </p>
        );
    }

    if (report.status === "GENERATING") {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Spinner /> Generating report…
            </div>
        );
    }

    if (report.status === "FAILED") {
        return (
            <p className="py-16 text-center text-sm text-destructive">
                {report.error ?? "Report generation failed."}
            </p>
        );
    }

    return (
        <div className="mx-auto max-w-3xl text-slate-900 dark:text-slate-100">
            <div className="mb-6 h-1.5 w-24 rounded-full bg-violet-600" />
            <h1 className="text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100">
                {report.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Generated {formatDateTime(report.generatedAt)} by {report.generatedBy}
            </p>

            <div className="mt-8 space-y-8">
                {report.sections.map((section) => (
                    <section key={section.key}>
                        <h2 className="text-lg font-bold text-violet-600">{section.title}</h2>
                        <div className="mt-2 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
                            <Response>{section.content}</Response>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
