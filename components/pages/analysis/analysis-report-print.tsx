'use client'

import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Response } from "@/components/ai-elements/response";
import { formatDateTime } from "@/utils/helpers/helpers";

export type AnalysisReport = NonNullable<FunctionReturnType<typeof api.analysisReports.get>>;

export function AnalysisReportPrint({ report }: { report: AnalysisReport }) {
    return (
        <div className="mx-auto max-w-3xl bg-white p-10 text-slate-900">
            {/* Cover */}
            <div className="break-after-page">
                <div className="mb-6 h-1.5 w-24 rounded-full bg-violet-600" />
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
                    Analysis Report
                </p>
                <h1 className="mt-6 text-2xl font-bold leading-tight text-slate-900">
                    {report.title}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Generated {formatDateTime(report.generatedAt)} by {report.generatedBy}
                </p>
            </div>

            {/* Chapters */}
            <div className="space-y-8">
                {report.sections.map((section) => (
                    <section key={section.key} className="break-inside-avoid">
                        <h2 className="text-lg font-bold text-violet-600">{section.title}</h2>
                        <div className="mt-2 text-[13px] leading-relaxed text-slate-800">
                            <Response>{section.content}</Response>
                        </div>
                    </section>
                ))}
            </div>

            <p className="mt-10 border-t border-slate-200 pt-3 text-xs text-slate-400">
                Generated {formatDateTime(report.generatedAt)} by {report.generatedBy}.
            </p>
        </div>
    );
}
