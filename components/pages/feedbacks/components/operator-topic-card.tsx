'use client'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { remainingDays } from "@/utils/helpers/helpers";

import { Topic } from "../data/schema";
import { channels } from "../../topics/data/data";
import { Clock, Send } from "lucide-react";

interface OperatorTopicCardProps {
    topic: Topic
    onRespond: (topic: Topic) => void
    onViewDetails: (topic: Topic) => void
}

export default function OperatorTopicCard({ topic, onRespond, onViewDetails }: OperatorTopicCardProps) {

    const hasResponded = topic.myFeedbacksCount > 0;
    const daysLeft = remainingDays(topic.endDate);

    const renderDaysLeft = () => {
        if (daysLeft === null) return null;

        const colorClass = daysLeft > 5
            ? "text-success-foreground"
            : daysLeft > 2
                ? "text-warning-foreground"
                : "text-destructive-foreground";

        return (
            <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className={cn("text-xs font-medium", colorClass)}>
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                </span>
            </div>
        );
    };

    return (
        <Card className="flex flex-col cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onViewDetails(topic)}>
            <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Your feedback is requested</p>
                    {hasResponded
                        ? <Badge color="success" variant="outline">Submitted</Badge>
                        : <Badge color="default" variant="outline">Pending</Badge>
                    }
                </div>
                <CardTitle className="text-lg leading-tight">
                    {topic.name}
                </CardTitle>
                {topic.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {topic.description}
                    </p>
                )}
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                        {topic.channels.map(p => {
                            const channel = channels[p];
                            return (
                                <div key={channel.value} className={cn("rounded-sm p-1", "bg-" + channel.color + "/20")}>
                                    <channel.icon className={cn("size-4", "text-" + channel.color)} />
                                </div>
                            );
                        })}
                    </div>
                    {renderDaysLeft()}
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={(e) => { e.stopPropagation(); onRespond(topic); }}>
                    {hasResponded ? 'View Response' : <><Send className="size-4" /> Respond</>}
                </Button>
            </CardFooter>
        </Card>
    );
}
