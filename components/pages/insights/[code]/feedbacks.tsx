'use client'

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { TopicFeedback } from "../../topics/data/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackItem, FeedbackItemProps, FeedbacksSkeleton } from "@/components/feedbacks/feedbacks";
import { MessageSquareQuote, Mic, Type, Image } from "lucide-react";
import ErrorState from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";

export default function Feedbacks({ insightId }: { insightId: string }) {

    const data = useQuery(
        api.insights.feedbacks,
        insightId ? { insightId: insightId as Id<"insights"> } : "skip"
    );
    const feedbacks = data as unknown as TopicFeedback[] | undefined;
    const feedbacksIsLoading = data === undefined;
    const feedbacksError = null;
    const refetch = () => undefined;

    const mapToFeedbackModel = (feedback: TopicFeedback) => {
        const mappedData: FeedbackItemProps = {
            id: feedback.id,
            submittedBy: {
                name: feedback.user.displayName!,
                image: feedback.user.userImage!,
                initials: feedback.user.initials,
                position: ''
            },
            text: feedback.text,
            textLangCode: feedback.textLangCode,
            dateSubmitted: feedback.dateSubmitted,
            audio: feedback.audioFile
                ? {
                    url: feedback.audioFile!.url,
                    transcribedText: feedback.transcribedText!,
                    transcribedTextLangCode: feedback.transcribedTextLangCode
                } : undefined,
            images: feedback.imageFiles ? feedback.imageFiles.map(image => ({ url: image.url })) : undefined
        }

        return mappedData;
    }

    if (feedbacksIsLoading) {
        return (
            <Card>
                <CardContent>
                    <FeedbacksSkeleton />
                </CardContent>
            </Card>
        )
    }

    if (feedbacksError) {
        return (
            <Card className="p-4 text-red-600">
                <CardContent>
                    <ErrorState
                        title="Oops, something went wrong!"
                        message="We're sorry, but an unexpected error has occurred. Please try again or contact support if the issue persists."
                        action={refetch} />
                </CardContent>
            </Card>
        )
    }

    if (!feedbacks || feedbacks.length === 0) {
        return (
            <EmptyState
                title="No Feedbacks"
                description="No feedbacks have been collected for this topic."
                icons={[Type, Mic, Image]}
            />
        )
    }

    return (
        <Card className="py-5 px-1 gap-2">
            <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                    <MessageSquareQuote className="h-5 w-5" />
                    <span className="text-muted-foreground text-sm font-semibold">Total Feedbacks</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 gap-4">
                {feedbacks.map((feedback) => (
                    <FeedbackItem key={feedback.id} feedback={mapToFeedbackModel(feedback)} />
                ))}
            </CardContent>
        </Card>
    )
}