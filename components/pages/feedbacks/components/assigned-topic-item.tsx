'use client'

import { Calendar, ChartBar, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { formatDate, remainingDays } from "@/utils/helpers/helpers";
import { cn } from "@/lib/utils";

import { Topic } from "../data/schema";
import { statuses } from "../data/data";
import { channels } from "../../topics/data/data";

interface TopicItemProps {
  topic: Topic
  onClick: (topic: Topic) => void
}

export default function AssignedTopicItem({ topic, onClick } : TopicItemProps) {

    const percentage = Math.round(topic.respondentsCount / topic.totalRespondentsCount  * 100);
    const status = statuses[topic.status];

    const renderRemainingDays = () => {
        const noOfDays = remainingDays(topic.endDate)!;

        if (noOfDays > 5) {
            return <p className="text-success-foreground text-xs font-semibold text-center">{noOfDays} days</p>
        }
        else if (noOfDays <= 5 && noOfDays > 2) {
            return <p className="text-warning-foreground text-xs font-semibold text-center">{noOfDays} days</p>
        }
        else {
            return <p className="text-destructive-foreground text-xs font-semibold text-center">{noOfDays} {noOfDays > 1 ? ' days' : 'day'}</p>
        }
    }

    return (
        <Card onClick={() => onClick(topic)}>
            <CardHeader>
                <CardDescription className="text-xs">Topic ID: {topic.topicCode}</CardDescription>
                <CardTitle className="text-sm">
                    {topic.name}
                </CardTitle>
                <CardAction className="ms-4">
                    {
                        topic.myFeedbacksCount > 0 
                            ? (<div className="bg-success p-1 text-sm text-white rounded-full font-semibold h-5 w-5 flex items-center justify-center">{topic.myFeedbacksCount}</div>)
                            : (<div className="bg-muted p-1 text-sm rounded-full font-semibold h-5 w-5 flex items-center justify-center">{topic.myFeedbacksCount}</div>)
                    }
                </CardAction>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex h-full flex-col space-y-3 bg-muted/50 p-4 rounded-sm">
                    <Badge color={status!.color} variant="outline">{status!.value}</Badge>
                    <p className="text-sm text-muted-foreground line-clamp-2" title={topic.description}>
                        {topic.description}
                    </p>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                            <Calendar size="12" />
                            <p className="text-xs text-muted-foreground">Timeline</p>
                        </div>
                        <p className="text-xs text-foreground font-semibold">{formatDate(topic.startDate)} - {formatDate(topic.endDate)}</p>
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                            <Calendar size="12" />
                            <p className="text-xs text-muted-foreground">No. of Days Till Due</p>
                        </div>
                        {renderRemainingDays()}
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                            <MessageSquare size="12" />
                            <p className="text-xs text-muted-foreground">Channels</p>
                        </div>
                        <div className="flex space-x-2">
                            {
                                topic.channels.map(p => {
                                    const channel = channels[p]
                                    return (
                                        <div key={channel.value} className={cn("rounded-sm p-1", "bg-" + channel.color + "/20")}>
                                            <channel.icon className={cn("size-4", "text-" + channel.color)} />
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                            <ChartBar size="12" />
                            <div className="flex flex-1 justify-between">
                                <p className="text-xs text-muted-foreground">Participation</p>
                                <p className="text-xs text-foreground font-semibold">{percentage}%</p>
                            </div>
                        </div>
                        <div className="flex flex-1 items-center space-x-2">
                            <Progress value={percentage} />
                        </div>
                        <div className="flex flex-1 items-center justify-between">
                            <span className="text-xs text-muted-foreground">{topic.respondentsCount}/{topic.totalRespondentsCount} responded</span>
                            <span className="text-xs text-muted-foreground">{topic.totalFeedbacksCount} total feedbacks</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}