'use client'

import { TabsContent } from "@/components/ui/tabs"
import { useTopicDetail } from "../hooks/useTopicDetail"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Image, MessageSquareQuote, Mic, Type } from "lucide-react"
import { FeedbackItem, FeedbackItemProps, FeedbacksSkeleton } from "@/components/feedbacks/feedbacks"
import { TopicFeedback } from "../../data/schema"
import { EmptyState } from "@/components/ui/empty-state"

export default function Feedbacks() {
    const { feedbacks, feedbacksIsLoading, feedbacksError } = useTopicDetail()

    if (feedbacksIsLoading) {
        return (
            <TabsContent value="feedbacks">
                <FeedbacksSkeleton />
            </TabsContent>
        )
    }

    if (feedbacksError) {
        return (
            <TabsContent value="feedbacks">
                <Card className="py-5 px-1 justify-center items-center text-red-600">
                    Unable to fetch feedbacks!
                </Card>
            </TabsContent>
        )
    }

    if (!feedbacks || feedbacks.length === 0) {
        return (
            <TabsContent value="feedbacks">
                <EmptyState
                    title="No Feedbacks"
                    description="No feedbacks have been collected for this topic."
                    icons={[Type, Mic, Image]}
                />
            </TabsContent>
        )
    }

    const mapToFeedbackModel = (feedback: TopicFeedback) => {
        const mappedData: FeedbackItemProps = {
            id: feedback.id,
            sentiment: feedback.sentiment,
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
                    transcribedTextLangCode: feedback.transcribedTextLangCode,
                } : undefined,
            images: feedback.imageFiles ? feedback.imageFiles.map(image => ({ url: image.url })) : undefined
        }

        return mappedData
    }

    return (
        <TabsContent value="feedbacks">
            <Card className="py-5 px-1 gap-2">
                <CardHeader>
                    <CardTitle className="flex gap-2 items-center">
                        <MessageSquareQuote />
                        <span className="text-lg">Current Feedbacks</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                    {feedbacks.map((feedback) => (
                        <FeedbackItem key={feedback.id} feedback={mapToFeedbackModel(feedback)} />
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
    )
}
