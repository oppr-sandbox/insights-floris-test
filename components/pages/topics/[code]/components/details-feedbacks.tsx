'use client'

import { useMemo, useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { useTopicDetail } from "../hooks/useTopicDetail"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image, MessageSquareQuote, Mic, Type, ArrowDownUp, Users } from "lucide-react"
import { FeedbackItem, FeedbackItemProps, FeedbacksSkeleton } from "@/components/feedbacks/feedbacks"
import { TopicFeedback } from "../../data/schema"
import { EmptyState } from "@/components/ui/empty-state"
import { getAvatarUrl } from "@/lib/utils"

type ViewMode = "chronological" | "byPerson"

function roleLabel(user: TopicFeedback["user"]): string | undefined {
    if (user.discipline) return user.discipline
    if (!user.role) return undefined
    return user.role.charAt(0) + user.role.slice(1).toLowerCase()
}

function mapToFeedbackModel(feedback: TopicFeedback): FeedbackItemProps {
    return {
        id: feedback.id,
        sentiment: feedback.sentiment,
        submittedBy: {
            name: feedback.user.displayName!,
            image: feedback.user.userImage!,
            initials: feedback.user.initials,
            position: '',
            role: roleLabel(feedback.user),
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
        images: feedback.imageFiles?.length ? feedback.imageFiles.map(image => ({ url: image.url })) : undefined
    }
}

const byDateAsc = (a: TopicFeedback, b: TopicFeedback) =>
    (a.dateSubmitted ?? "").localeCompare(b.dateSubmitted ?? "")

export default function Feedbacks() {
    const { feedbacks, feedbacksIsLoading, feedbacksError } = useTopicDetail()
    const [view, setView] = useState<ViewMode>("chronological")

    const chronological = useMemo(
        () => [...(feedbacks ?? [])].sort(byDateAsc),
        [feedbacks],
    )

    const groups = useMemo(() => {
        const map = new Map<string, { user: TopicFeedback["user"]; items: TopicFeedback[] }>()
        for (const f of feedbacks ?? []) {
            const key = f.user.id
            if (!map.has(key)) map.set(key, { user: f.user, items: [] })
            map.get(key)!.items.push(f)
        }
        const arr = [...map.values()]
        arr.forEach(g => g.items.sort(byDateAsc))
        arr.sort((a, b) =>
            b.items.length - a.items.length ||
            a.user.displayName.localeCompare(b.user.displayName))
        return arr
    }, [feedbacks])

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

    return (
        <TabsContent value="feedbacks">
            <Card className="py-5 px-1 gap-2">
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="flex gap-2 items-center">
                            <MessageSquareQuote className="size-5" />
                            <span className="text-lg">Current Feedbacks</span>
                            <span className="text-sm font-normal text-muted-foreground">({feedbacks.length})</span>
                        </CardTitle>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={view}
                            onValueChange={(v) => v && setView(v as ViewMode)}
                        >
                            <ToggleGroupItem value="chronological" className="gap-1.5 px-3">
                                <ArrowDownUp className="size-4" />
                                Chronological
                            </ToggleGroupItem>
                            <ToggleGroupItem value="byPerson" className="gap-1.5 px-3">
                                <Users className="size-4" />
                                By person
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                    {view === "chronological" &&
                        chronological.map((feedback) => (
                            <FeedbackItem key={feedback.id} feedback={mapToFeedbackModel(feedback)} />
                        ))
                    }
                    {view === "byPerson" &&
                        groups.map((group) => (
                            <div key={group.user.id} className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={getAvatarUrl(group.user.userImage ?? "", 'x32')} alt={group.user.displayName} />
                                        <AvatarFallback className="text-sm">{group.user.initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold truncate">{group.user.displayName}</span>
                                            {roleLabel(group.user) &&
                                                <span className="text-xs text-muted-foreground rounded-sm bg-muted px-1.5 py-0.5">
                                                    {roleLabel(group.user)}
                                                </span>
                                            }
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {group.items.length} {group.items.length === 1 ? "feedback" : "feedbacks"}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3 border-l border-border-grey pl-3 ml-4">
                                    {group.items.map((feedback) => (
                                        <FeedbackItem key={feedback.id} feedback={mapToFeedbackModel(feedback)} />
                                    ))}
                                </div>
                            </div>
                        ))
                    }
                </CardContent>
            </Card>
        </TabsContent>
    )
}
