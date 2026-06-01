'use client'

import { TabsContent } from "@/components/ui/tabs";
import { useTopicDetail } from "../hooks/useTopicDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFileText } from "@tabler/icons-react";
import { Calendar, ChartColumn, Clock, FileText, Image, Mic, UserRoundPen, Users } from "lucide-react";
import { formatDate } from "@/utils/helpers/helpers";
import { TopicChannels, TopicDetail, TopicRespondents, TopicStatistics } from "../../data/schema";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvatarUrl } from "@/lib/utils";
import { ChannelBadge } from "@/components/channels/channels-badge";

const channelConfig: Record<TopicChannels, { label: string; icon: React.ElementType }> = {
    [TopicChannels.Text]: { label: "Text", icon: FileText },
    [TopicChannels.Voice]: { label: "Voice", icon: Mic },
    [TopicChannels.Image]: { label: "Image", icon: Image },
};

const pluralize = (count: number, word: string) =>
    `${word}${count !== 1 ? "s" : ""}`;

export default function Statistics() {
    const {
        data,
        statistics,
        statsIsLoading,
        statsError,
        respondents,
        respIsLoading,
        respError
    } = useTopicDetail();

    if (statsError || respError) return <div>Unable to fetch statistics.</div>;

    return (
        <TabsContent value="statistics">
            <div className="flex flex-col gap-4">
                {statsIsLoading ? <StatsSkeleton /> : statistics && <StatsOverview data={data} stats={statistics} />}
                {respIsLoading ? <RespondentsSkeleton /> : respondents && <Participants participants={respondents} respondentCount={statistics?.respondentsCount} />}
            </div>
        </TabsContent>
    );
}

function StatsOverview({ data, stats }: { data?: TopicDetail, stats: TopicStatistics }) {
    const percentage = Math.round(
        (stats.respondentsCount / stats.totalRespondentsCount) * 100
    );

    return (
        <>
            <Card className="py-5 px-1 gap-2">
                <CardHeader>
                    <CardTitle className="flex gap-2 items-center">
                        <IconFileText /> <span className="text-lg">Topic Overview</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoRow
                            icon={<UserRoundPen className="w-5 h-5 ml-1" />}
                            label="Created by"
                            value={`${stats.displayName} (${stats.role})`}
                        />
                        <InfoRow
                            icon={<Calendar className="w-5 h-5" />}
                            label="Created on"
                            value={formatDate(stats.createdAt)}
                        />
                        <InfoRow
                            icon={<Clock className="w-5 h-5" />}
                            label="Started on"
                            value={formatDate(stats.startDate)}
                        />
                        <InfoRow
                            icon={<Calendar className="w-5 h-5" />}
                            label="Due date"
                            value={formatDate(stats.endDate)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="py-5 px-1 gap-2">
                <CardHeader>
                    <CardTitle className="flex gap-2 items-center">
                        <ChartColumn /> <span className="text-lg">Statistics & Progress</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* Counters */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <StatBox label="Respondents" value={stats.respondentsCount} />
                        <StatBox label="Total Feedbacks" value={stats.totalFeedbacksCount} />
                        <StatBox label="Attachments" value={data?.topicAttachments?.length ?? 0} />
                    </div>

                    {/* Channels */}
                    <div>
                        <h4 className="text-base font-semibold mb-3">
                            Feedback {pluralize(stats.channels?.length ?? 0, "Channel")}
                        </h4>
                        <div className="flex gap-3">
                            {stats.channels?.map((channel) =>
                                <ChannelBadge key={channel} channel={channel} iconClassName="size-4" className="text-sm space-x-2" />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

function Participants({ participants, respondentCount = 0 }: { participants: TopicRespondents[], respondentCount?: number }) {
    return (
        <Card className="py-5 px-1 gap-2">
            <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                    <Users />
                    <span className="text-lg">
                        {pluralize(participants.length, "Participant")} ({respondentCount}/{participants.length})
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {participants.map((resp) => (
                        <div key={resp.id} className="flex items-center gap-3 p-3 bg-muted/25 rounded-lg">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={getAvatarUrl(resp.image, 'x40')} alt={resp.displayName} />
                                <AvatarFallback className="text-base">{resp.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="font-semibold">{resp.displayName}</div>
                                <div className="text-sm text-muted-foreground">{resp.role}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-body font-bold text-primary-accent">{resp.feedbackCount}</div>
                                <div className="text-sm text-muted-foreground">Feedbacks</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/25 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="text-base font-semibold">{value}</div>
            </div>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold text-primary-accent">{value}</div>
            <div className="text-medium-grey">{label}</div>
        </div>
    );
}

function StatsSkeleton() {
    return (
        <>
            <Skeleton className="h-50 w-full bg-secondary/50" />
            <Skeleton className="h-70 w-full bg-secondary/50" />
        </>
    );
}

function RespondentsSkeleton() {
    return <Skeleton className="h-50 w-full bg-secondary/50" />;
}
