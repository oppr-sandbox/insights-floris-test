import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { InsightDetails } from "../data/schema";
import { formatDate } from "@/utils/helpers/helpers";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TrendingUp } from "lucide-react";
import SentimentsCards from "../components/sentiments-cards";
import { useFeedbackPreview } from "../hooks/useFeedbackPreview";

export default function Sentiments({ insightDetails }: { insightDetails: InsightDetails }) {
    const { dispatch } = useFeedbackPreview();

    const handleFeedbackPreviewClick = (feedbackId: string) => {
        dispatch({ type: "FEEDBACK_PREVIEW_OPEN", payload: feedbackId })
    }

    const renderContent = () => {
        if (!insightDetails.sentiment?.feedback_highlights?.length) {
            return (
                <EmptyState
                    icons={[TrendingUp]}
                    title="No record found"
                    description="No generated sentiment for this topic."
                />
            )
        }
        else {
            return (
                <div className="flex flex-col gap-4">
                    <Card>
                        <CardHeader>
                            <CardDescription className="font-semibold">Summary</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>{insightDetails.sentiment?.sentiment_executive_summary}</p>
                        </CardContent>
                    </Card>
                    <SentimentsCards stats={insightDetails.sentiment.sentiment_analysis} />
                    <Card>
                        <CardHeader>
                            <CardDescription className="font-semibold">Sentiments Timeline</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {
                                    insightDetails.sentiment.feedback_highlights.map((f, i) => (
                                        <div key={i} className="border-l-4 border-gray-200 px-4 py-2 space-y-2 hover:bg-muted/30">
                                            <span
                                                className="cursor-pointer font-medium inline-block"
                                                onClick={() => handleFeedbackPreviewClick(f.feedback_id)}>
                                                {f.feedback_code}
                                            </span>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-xs text-medium-grey">{formatDate(f.timestamp)}</span>
                                                    {f.sentiment.toLowerCase() === 'positive' && <Badge color="success" variant="outline">{f.sentiment}</Badge>}
                                                    {f.sentiment.toLowerCase() === 'negative' && <Badge color="destructive" variant="outline">{f.sentiment}</Badge>}
                                                    {f.sentiment.toLowerCase() === 'neutral' && <Badge color="warning" variant="outline">{f.sentiment}</Badge>}
                                                </div>
                                                <span className="text-sm text-medium-grey">by {f.display_name}</span>
                                            </div>
                                            <p className="text-text-dark-grey italic">"{f.text}"</p>
                                        </div>
                                    ))
                                }
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
        }
    }

    return (
        <TabsContent value="sentiment">
            {renderContent()}
        </TabsContent>
    )
}