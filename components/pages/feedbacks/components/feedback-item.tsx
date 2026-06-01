'use client'

import moment from "moment";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

import { cn } from "@/lib/utils";

import { Feedback } from "../data/schema";
import { feedbackStatuses } from "../data/data";
import { channels } from "../../topics/data/data";

interface FeedbackItemProps {
  feedback: Feedback
  onClick: (topic: Feedback) => void
}

export default function FeedbackItem({ feedback, onClick } : FeedbackItemProps) {

    const status = feedbackStatuses[feedback.feedbackStatus];

    return (
        <Card onClick={() => onClick(feedback)}>
            <CardHeader>
                <CardDescription className="text-xs">Topic ID: {feedback.topicCode}</CardDescription>
                <CardTitle className="text-sm">
                    {feedback.topicName}
                </CardTitle>
                <div className="flex space-x-2">
                    {
                        feedback.channels.map(p => {
                            const channel = channels[p]
                            return (
                                <div key={channel.value} className={cn("rounded-sm p-1", "bg-" + channel.color + "/20")}>
                                    <channel.icon className={cn("size-4", "text-" + channel.color)} />
                                </div>
                            )
                        })
                    }
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                <Badge color={status!.color} variant="outline">{status!.value}</Badge>
                {
                    (feedback.text || feedback.transcribedText) && (
                        <p className="line-clamp-3">{feedback.text || feedback.transcribedText}</p>
                    )
                }
            </CardContent>
            <CardFooter className="flex flex-row justify-between">
                {
                    feedback.dateSubmitted && (
                        <span className="text-sm text-muted-foreground">
                            {moment(feedback.dateSubmitted).fromNow()}
                        </span>
                    )
                }
            </CardFooter>
        </Card>
    )
}
