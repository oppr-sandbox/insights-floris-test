import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { InsightDetails } from "../data/schema";
import { Lightbulb, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import FindingsCards, { FindingsStats } from "../components/findings-cards";
import { Badge } from "@/components/ui/badge";
import CopyToClipboardButton from "../components/copy-to-clipboard-button";
import { cn } from "@/lib/utils";

export default function Lessons({ insightDetails }: { insightDetails: InsightDetails }) {

    const stats: FindingsStats = {
        totalFindings: insightDetails.findings?.findings.length ?? 0,
        highPriority: insightDetails.findings?.findings.reduce((accumulator, currentValue) => {
            if (currentValue.priority === "High") {
                return accumulator + 1;
            }
            return accumulator;
        }, 0) ?? 0,
        highImpact: insightDetails.findings?.findings.reduce((accumulator, currentValue) => {
            if (currentValue.impact === "High") {
                return accumulator + 1;
            }
            return accumulator;
        }, 0) ?? 0
    };

    const priorityColor: Record<string, 'destructive' | "warning" | "success" | "default"> = {
        Low: "success",
        Medium: "warning",
        High: "destructive",
    };

    const implementationCostColor: Record<string, string> = {
        Low: "bg-green-100 text-green-800",
        Medium: "bg-yellow-100 text-yellow-800",
        High: "bg-red-100 text-red-800",
    }

    return (
        <TabsContent value="lessons">
            <div className="flex flex-col gap-4">
                <FindingsCards stats={stats} />
                <Card>
                    <CardHeader>
                        <CardDescription className="font-semibold">Summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>{insightDetails.findings?.findings_summary}</p>
                    </CardContent>
                </Card>
                {
                    insightDetails.findings && insightDetails.findings?.findings.map((l, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <CardDescription className="flex items-center justify-between font-semibold">
                                    <div className="flex items-center gap-2">
                                        <Lightbulb className="size-4 text-warning-foreground" /> {l.lesson_title}
                                    </div>
                                    <Badge color={priorityColor[l.priority]} variant="outline">{l.priority}</Badge>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-dark-grey">
                                    <div className="space-y-4"><div><h4 className="text-h4 text-dark-grey font-semibold mb-2">Key Learning</h4>
                                        <p className="text-body text-dark-grey">{l.key_learning}</p>
                                    </div>
                                        <div>
                                            <h4 className="text-h4 text-dark-grey font-semibold mb-3">Supporting Evidence</h4>
                                            <ul className="list-disc list-inside space-y-1">
                                                {
                                                    (l.supporting_evidences ?? []).map((e, i) => (
                                                        <li key={i} className="text-body text-medium-grey">{e.summarized_message}</li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-h4 text-dark-grey font-semibold mb-3">Recommendations</h4>
                                            <ul className="list-disc list-inside space-y-1">
                                                {
                                                    (l.recommendations ?? []).map((recommendation, i) => (
                                                        <li key={i} className="text-body text-medium-grey">{recommendation}</li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-h4 text-dark-grey font-semibold mb-3">Potential Questions to ask IDA</h4>
                                            <div className="grid lg:grid-cols-3 gap-3 mb-4">
                                                {(l.potential_questions ?? []).map((pq, i) => (
                                                    <div
                                                        key={i}
                                                        className="group relative rounded-2xl border border-border/50 bg-accent/20 dark:bg-primary/10 p-4 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-200"
                                                    >
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <p className="text-base font-medium italic text-foreground leading-snug">
                                                                {pq.question}
                                                            </p>
                                                            <CopyToClipboardButton text={pq.question} />
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {pq.context_of_question}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                            <div className="flex items-center space-x-2">
                                                <TrendingUp className="text-green-600" />
                                                <div>
                                                    <p className="text-small text-medium-grey">Impact</p>
                                                    <p className="text-body font-semibold text-dark-grey">{l.impact}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-small text-medium-grey">Applicability</p>
                                                <p className="text-body font-semibold text-dark-grey">{l.applicability}</p>
                                            </div>
                                            <div>
                                                <p className="text-small text-medium-grey">Implementation Cost</p>
                                                <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", implementationCostColor[l.implementation_cost])}>
                                                    {l.implementation_cost}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                }

                {
                    !insightDetails.findings?.findings.length && (
                        <EmptyState
                            icons={[Lightbulb]}
                            title="No record found"
                            description="No generated lessons for this topic."
                        />
                    )
                }
            </div>
        </TabsContent>
    )
}