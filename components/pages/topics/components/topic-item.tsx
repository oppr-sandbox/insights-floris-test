'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IconCalendar, IconChartBar, IconMessage, IconUsers } from "@tabler/icons-react";
import { Topic, TopicStatus } from "../data/schema";
import { channels, statuses } from "../data/data";
import Link from "next/link";
import { formatDate, formattedRemainingDays } from "@/utils/helpers/helpers";
import { useUserDetails } from "@/providers/UserContextProvider";
import { cn, getAvatarUrl } from "@/lib/utils";
import { ItemActions } from "./item-actions";
import { useRouter } from "next/navigation";

interface TopicItemProps {
    topic: Topic
}

export default function TopicItem({ topic }: TopicItemProps) {

    const { tenant } = useUserDetails();
    const { hasPermission } = useUserDetails();
    const router = useRouter();

    const percentage = Math.round(topic.respondentsCount / topic.totalRespondentsCount * 100);
    const moreRespondents = topic.respondentsCount - (topic.recentRespondents ?? []).length
    const status = statuses[topic.status];

    const handleCardClick = () => {
        router.push(`/${tenant}/topics/${topic.topicCode}`);
    }

    return (
        <Card
            className="cursor-pointer"
            onClick={handleCardClick}>
            <CardHeader>
                <CardDescription className="text-xs">Topic ID: {topic.topicCode}</CardDescription>
                <CardTitle className="text-sm">
                    <Link href={`/topics/${topic.topicCode}`} className="hover:underline">
                        {topic.name}
                    </Link>
                </CardTitle>
                <CardAction className="ms-4">
                    {
                        hasPermission('topics:manage') && (
                            <ItemActions topic={topic} />
                        )
                    }
                </CardAction>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="flex h-full flex-col space-y-3 bg-muted/50 p-4 rounded-sm">
                    <Badge color={status!.color} variant="outline">{status!.value}</Badge>
                    <p className="text-sm text-muted-foreground line-clamp-2" title={topic.description}>
                        {topic.description}
                    </p>

                    {/* Respondents */}
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                            <IconUsers size="12" />
                            <p className="text-xs text-muted-foreground">Respondents</p>
                        </div>
                        <div className="flex space-x-2 items-center">
                            <div className="*:data-[slot=avatar]:ring-background flex -space-x-1 *:data-[slot=avatar]:ring-1">
                                {
                                    topic.recentRespondents?.map((respondent, index) => (
                                        <Avatar className="h-6 w-6" key={index}>
                                            <AvatarImage src={getAvatarUrl(respondent.image, 'x24')} alt={respondent.name} />
                                            <AvatarFallback>{respondent.initials}</AvatarFallback>
                                        </Avatar>
                                    ))
                                }
                            </div>
                            {
                                moreRespondents > 0 && (
                                    <span className="text-xs font-semibold text-foreground">
                                        +{moreRespondents} more
                                    </span>
                                )
                            }
                        </div>
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                            <IconCalendar size="12" />
                            <p className="text-xs text-muted-foreground">Due</p>
                        </div>
                        <p className="text-xs text-foreground font-semibold">{formatDate(topic.endDate)}</p>
                    </div>

                    {
                        topic.status !== TopicStatus.Completed && (
                            <div className="flex items-center justify-between space-x-2">
                                <div className="flex items-center space-x-2">
                                    <IconCalendar size="12" />
                                    <p className="text-xs text-muted-foreground">No. of Days Till Due</p>
                                </div>
                                <p className="text-xs text-foreground font-semibold">{formattedRemainingDays(topic.endDate)}</p>
                            </div>
                        )
                    }

                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                            <IconMessage size="12" />
                            <p className="text-xs text-muted-foreground">Channels</p>
                        </div>
                        <div className="flex space-x-2">
                            {
                                topic.channels.map(p => {
                                    const channel = channels[p]
                                    return (
                                        <div key={channel.value} className={cn("rounded-sm p-1", "bg-" + channel.color + "/20")} title={channel.value}>
                                            <channel.icon className={cn("size-4", "text-" + channel.color)} />
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>

                    {
                        topic.status === 'ACTIVE' && (
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                    <IconChartBar size="12" />
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
                        )
                    }

                    {
                        topic.status === 'COMPLETED' && (
                            <div className="flex items-center space-x-2">
                                <IconChartBar size="12" className="text-success-foreground" />
                                <span className="text-xs font-semibold text-success-foreground">Completed</span>
                                <div className="text-xs text-muted-foreground">
                                    <span>
                                        {topic.respondentsCount} participants
                                    </span>
                                    <span className="mx-1">•</span>
                                    <span>
                                        {topic.totalFeedbacksCount} feedbacks collected
                                    </span>
                                </div>
                            </div>
                        )
                    }
                </div>
            </CardContent>
        </Card>
    )
}