'use client'

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { InsightDetails, PromptResponse } from "../data/schema";
import Loading from "./loading";
import NotFound from "./not-found";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Overview from "./overview";
import { Badge } from "@/components/ui/badge";
import { statuses } from "../data/data";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart2, Lightbulb, Loader, Text, TrendingUp, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import Summary from "./summary";
import Sentiments from "./sentiments";
import Contradictions from "./contradictions";
import Lessons from "./lessons";
import { FeedbackPreviewProvider } from "../hooks/useFeedbackPreview";
import InsightActions from "./insight-actions";
import TalkAboutInsight from "./talk-button";
import posthog from "posthog-js";

export default function Details({ code }: { code: string }) {

    const insightDetails = useQuery(api.insights.getByCode, { code }) as InsightDetails | null | undefined;
    const isLoading = insightDetails === undefined;

    const promptBuilder = useQuery(
        api.insights.getChat,
        insightDetails?.id ? { insightId: insightDetails.id as Id<"insights"> } : "skip"
    ) as PromptResponse | undefined;
    const promptBuilderLoading = !!insightDetails?.id && promptBuilder === undefined;

    useEffect(() => {
        if (insightDetails) {
            posthog.capture('insight_viewed', {
                insight_code: code,
                insight_id: insightDetails.id,
                topic_code: insightDetails.topicCode,
                status: insightDetails.status,
            });
        }
    }, [insightDetails?.id]);

    if (isLoading || promptBuilderLoading) {
        return <Loading />
    }

    if (!insightDetails || !promptBuilder) {
        return <NotFound />
    }

    const status = statuses[insightDetails.status];

    const renderContent = () => {
        if (insightDetails.status === 'GENERATING') {
            return (
                <div className="p-4">
                    <EmptyState
                        className="animate-pulse"
                        icons={[Loader]}
                        title="Insights generation still In Progress..."
                        description="This may take a while. We will let you know once done."
                    />
                </div>
            )
        }
        else {
            return (
                <Tabs defaultValue="overview">
                    <div className="sticky top-28 bg-background z-50 py-2 px-4">
                        <TabsList className="w-full grid grid-cols-3 lg:grid-cols-5 h-auto p-1">
                            <TabsTrigger value="overview">
                                <Text /> Overview
                            </TabsTrigger>
                            <TabsTrigger value="summary">
                                <BarChart2 /> Summary
                            </TabsTrigger>
                            <TabsTrigger value="sentiment">
                                <TrendingUp /> Sentiment
                            </TabsTrigger>
                            <TabsTrigger value="contradictions">
                                <TriangleAlert /> Contradictions
                            </TabsTrigger>
                            <TabsTrigger value="lessons">
                                <Lightbulb /> Findings
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <div className="px-4">
                        <FeedbackPreviewProvider insightDetails={insightDetails}>
                            <Overview insightDetails={insightDetails} />
                            <Summary insightDetails={insightDetails} />
                            <Sentiments insightDetails={insightDetails} />
                            <Contradictions insightDetails={insightDetails} />
                            <Lessons insightDetails={insightDetails} />
                        </FeedbackPreviewProvider>
                    </div>
                </Tabs>
            )
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="sticky top-14 pt-2 px-4 flex flex-row justify-between items-center gap-4 bg-background z-50">
                <div className="flex flex-5 flex-col gap-2 min-w-0">
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-sm">Insights ID:</span>
                        <div className="flex gap-2 items-center">
                            <h4 className="text-base font-semibold truncate">{code}</h4>
                            <Badge color={status!.color} variant="outline">{status!.value}</Badge>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground text-sm">Topic ID and Topic Title:</span>
                        <h4 className="text-base font-semibold truncate">{insightDetails.topicCode} - {insightDetails.topicName}</h4>
                    </div>
                </div>
                {/* Button Group */}
                <div className="flex flex-1 flex-row space-x-2 items-center justify-end">
                    {insightDetails.status !== "GENERATING" &&
                        <TalkAboutInsight insightId={insightDetails.id} topicId={insightDetails.topicId} />
                    }
                    <InsightActions
                        insightId={insightDetails.id}
                        status={insightDetails.status}
                        label={insightDetails.label}
                    />
                </div>
            </div>
            {renderContent()}
        </div>
    )
}