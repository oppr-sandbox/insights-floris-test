import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { InsightDetails } from "../data/schema";
import { TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useFeedbackPreview } from "../hooks/useFeedbackPreview";

export default function Contradictions({ insightDetails }: { insightDetails: InsightDetails }) {

    const { dispatch } = useFeedbackPreview();

    const handleFeedbackPreviewClick = (feedbackId: string) => {
        dispatch({ type: "FEEDBACK_PREVIEW_OPEN", payload: feedbackId })
    }

    return (
        <TabsContent value="contradictions">
            <div className="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <CardDescription className="font-semibold">Summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>{insightDetails.contradiction?.contradiction_summary}</p>
                    </CardContent>
                </Card>
                {
                    insightDetails.contradiction?.contradictions && insightDetails.contradiction.contradictions.map((l, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <CardDescription className="flex items-center justify-between font-semibold">
                                    <div className="flex items-center gap-2">
                                        <TriangleAlert className="size-4 text-orange-600" />
                                        <h1 className="text-lg text-foreground">
                                            {l.title}
                                        </h1>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 bg-red-100 text-red-800">
                                            {l.severity}
                                        </div>
                                        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                                            {l.impact}
                                        </div>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-dark-grey">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-h4 text-dark-grey font-semibold mb-2">Description</h4>
                                            <p className="text-body text-dark-grey">{l.description}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-h4 text-dark-grey font-semibold mb-3">Conflicting Statements</h4>
                                            <div className="space-y-3">
                                                <div className="border-l-4 border-l-red-500 pl-4 py-2 bg-muted/50 rounded-r-lg">
                                                    <span
                                                        className="cursor-pointer font-medium inline-block"
                                                        onClick={() => handleFeedbackPreviewClick(l.feedback_id_a)}>
                                                        {l.feedback_code_a}
                                                    </span>
                                                    <p className="text-body text-foreground">"{l.excerpt_a}"</p>
                                                </div>

                                                <div className="border-l-4 border-l-red-500 pl-4 py-2 bg-muted/50 rounded-r-lg">
                                                    <span
                                                        className="cursor-pointer font-medium inline-block"
                                                        onClick={() => handleFeedbackPreviewClick(l.feedback_id_b)}>
                                                        {l.feedback_code_b}
                                                    </span>
                                                    <p className="text-body text-foreground">"{l.excerpt_b}"</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="text-h4 text-blue-800 font-semibold mb-2">Resolution</h4>
                                            <p className="text-body text-blue-700">{l.resolution}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                }

                {
                    !insightDetails.contradiction && (
                        <EmptyState
                            icons={[TriangleAlert]}
                            title="No record found"
                            description="No generated contradictions for this topic."
                        />
                    )
                }
            </div>
        </TabsContent>
    )
}