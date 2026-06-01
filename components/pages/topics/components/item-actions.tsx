"use client"

import { Archive, Lightbulb, Link, MoreVertical, Trash2 } from "lucide-react"
import { IconPlayerPauseFilled } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Topic, TopicStatus } from "../data/schema"
import { useTopicList } from "./hooks/useTopicList"
import { useRouter } from "next/navigation"
import { useUserDetails } from "@/providers/UserContextProvider"
import { toast } from "@/components/ui/sonner"

export function ItemActions({ topic }: { topic: Topic }) {

    const router = useRouter();
    const { dispatch } = useTopicList();
    const { tenant, hasActiveSubscription } = useUserDetails()

    const renderEditMenu = () => {
        return (
            <DropdownMenuItem onClick={() => router.push(`/${tenant}/topics/${topic.topicCode}?mode=edit`)}>
                Edit
            </DropdownMenuItem>
        )
    }

    const renderPauseMenu = () => {
        return (
            <DropdownMenuItem
                className="flex justify-between"
                disabled={!hasActiveSubscription}
                onClick={(e) => {
                    e.stopPropagation()
                    dispatch({ type: 'CONFIRM_PAUSE', payload: topic })
                }}>
                Pause
                <IconPlayerPauseFilled />
            </DropdownMenuItem>
        )
    }

    const renderPublishMenu = () => {
        return (
            <DropdownMenuItem
                className="flex justify-between"
                disabled={!hasActiveSubscription}
                onClick={(e) => {
                    e.stopPropagation()
                    dispatch({ type: 'CONFIRM_PUBLISH', payload: topic })
                }}>
                Publish
            </DropdownMenuItem>
        )
    }

    const renderGenerateInsightMenu = () => {
        return (
            <DropdownMenuItem
                className="flex justify-between"
                disabled={!hasActiveSubscription}
                onClick={(e) => {
                    e.stopPropagation()
                    dispatch({ type: 'CONFIRM_GENERATE_INSIGHT', payload: topic })
                }}>
                Generate Insight
                <Lightbulb />
            </DropdownMenuItem>
        )
    }

    const renderCopyFeedbackLinkMenu = () => {
        return (
            <DropdownMenuItem
                className="flex justify-between"
                onClick={(e) => {
                    e.stopPropagation()
                    const url = `${window.location.origin}/${tenant}/feedbacks?topic=${topic.id}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Feedback link copied!');
                }}>
                Copy Feedback Link
                <Link className="size-4" />
            </DropdownMenuItem>
        )
    }

    const renderArchiveMenu = () => {
        return (
            <DropdownMenuItem
                variant="destructive"
                className="flex justify-between"
                disabled={!hasActiveSubscription}
                onClick={(e) => {
                    e.stopPropagation()
                    dispatch({ type: 'CONFIRM_ARCHIVE', payload: topic })
                }}>
                Archive
                <Archive />
            </DropdownMenuItem>
        )
    }

    const renderDeleteMenu = () => {
        return (
            <DropdownMenuItem
                variant="destructive"
                className="flex justify-between"
                disabled={!hasActiveSubscription}
                onClick={(e) => {
                    e.stopPropagation()
                    dispatch({ type: 'CONFIRM_DELETE', payload: topic })
                }}>
                Delete Permanently
                <Trash2 />
            </DropdownMenuItem>
        )
    }

    const renderMenuItems = () => {
        if (topic.status === TopicStatus.Draft) {
            return (
                <DropdownMenuContent align="end" className="w-[200px]">
                    {renderEditMenu()}
                    {renderPublishMenu()}
                    <DropdownMenuSeparator />
                    {renderArchiveMenu()}
                    {renderDeleteMenu()}
                </DropdownMenuContent>
            )
        }
        else if (topic.status === TopicStatus.Paused) {
            return (
                <DropdownMenuContent align="end" className="w-[200px]">
                    {renderEditMenu()}
                    {renderPublishMenu()}
                    <DropdownMenuSeparator />
                    {renderArchiveMenu()}
                    {renderDeleteMenu()}
                </DropdownMenuContent>
            )
        }
        else if (topic.status === TopicStatus.Published) {
            return (
                <DropdownMenuContent align="end" className="w-[200px]">
                    {renderCopyFeedbackLinkMenu()}
                    {renderPauseMenu()}
                    <DropdownMenuSeparator />
                    {renderArchiveMenu()}
                    {renderDeleteMenu()}
                </DropdownMenuContent>
            )
        }
        else if (topic.status === TopicStatus.Active || topic.status === TopicStatus.Completed) {
            return (
                <DropdownMenuContent align="end" className="w-[200px]">
                    {renderCopyFeedbackLinkMenu()}
                    {renderPauseMenu()}
                    {renderGenerateInsightMenu()}
                    <DropdownMenuSeparator />
                    {renderArchiveMenu()}
                    {renderDeleteMenu()}
                </DropdownMenuContent>
            )
        }
        else {
            return (
                <DropdownMenuContent align="end" className="w-[200px]">
                    {renderArchiveMenu()}
                    {renderDeleteMenu()}
                </DropdownMenuContent>
            )
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="data-[state=open]:bg-muted size-8"
                >
                    <MoreVertical />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            {renderMenuItems()}
        </DropdownMenu>
    )
}