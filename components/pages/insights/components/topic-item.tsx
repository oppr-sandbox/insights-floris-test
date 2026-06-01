'use client'

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import { CompletedTopic } from "../data/schema";
import { statuses } from "../../topics/data/data";
import { TopicStatus } from "../../topics/data/schema";

interface TopicItemProps {
    topic: CompletedTopic;
    isSelected: boolean;
    onClick: (topic: CompletedTopic) => void;
}

export default function TopicItem({ topic, isSelected, onClick }: TopicItemProps) {

    const status = statuses[topic.status as TopicStatus];

    return (
        <Card onClick={() => onClick(topic)} className={isSelected ? 'bg-muted/60' : ''}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardDescription className="text-xs">
                        Topic ID: {topic.topicCode}
                    </CardDescription>
                    <CardDescription className="text-xs">
                        <Badge color={status!.color} variant="outline">{status!.value}</Badge>
                    </CardDescription>
                </div>
                <CardTitle className="text-sm">
                    {topic.topicName}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                <CardDescription className="text-sm text-muted-foreground">
                    Initiated By: <span className="font-medium">{topic.initiatedBy}</span> ({topic.initiatedByRole})
                </CardDescription>
                <CardDescription className="text-sm text-muted-foreground">
                    Participation: <span className="font-medium">{topic.feedbacksCount} feedback(s) from {topic.respondentsCount} participant(s)</span>
                </CardDescription>
            </CardContent>
        </Card>
    )
}