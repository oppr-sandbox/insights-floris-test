"use client"

import { MoreVertical, RefreshCw, Tag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Insight } from "../data/schema"
import { useInsightList } from "../hooks/useInsightList"
import { InsightStatus } from "../data/data"

export function ItemActions({ insight }: { insight: Insight }) {

    const { dispatch, handleRegenerateInsight } = useInsightList();

    const publishItem = (
        <DropdownMenuItem
            className="flex justify-between"
            onClick={(e) => {
                e.stopPropagation()
                dispatch({ type: 'CONFIRM_PUBLISH', payload: insight })
            }}>
            Publish
        </DropdownMenuItem>
    )

    const regenerateItem = (
        <DropdownMenuItem
            className="flex justify-between"
            onClick={(e) => {
                e.stopPropagation()
                handleRegenerateInsight(insight)
            }}>
            Regenerate
            <RefreshCw />
        </DropdownMenuItem>
    )

    const editNoteItem = (
        <DropdownMenuItem
            className="flex justify-between"
            onClick={(e) => {
                e.stopPropagation()
                dispatch({ type: 'EDIT_NOTE', payload: insight })
            }}>
            Edit note
            <Tag />
        </DropdownMenuItem>
    )

    const deleteItem = (
        <DropdownMenuItem
            variant="destructive"
            className="flex justify-between"
            onClick={(e) => {
                e.stopPropagation()
                dispatch({ type: 'CONFIRM_DELETE', payload: insight })
            }}>
            Delete Permanently
            <Trash2 />
        </DropdownMenuItem>
    )

    const renderMenuItems = () => {
        if (insight.status === InsightStatus.Draft) {
            return (
                <DropdownMenuContent align="end" className="w-[200px]">
                    {publishItem}
                    {editNoteItem}
                    <DropdownMenuSeparator />
                    {deleteItem}
                </DropdownMenuContent>
            )
        }
        if (insight.status === InsightStatus.Published) {
            return (
                <DropdownMenuContent align="end" className="w-[200px]">
                    {editNoteItem}
                </DropdownMenuContent>
            )
        }
        if (insight.status === InsightStatus.Failed) {
            return (
                <DropdownMenuContent align="end" className="w-[200px]">
                    {regenerateItem}
                    <DropdownMenuSeparator />
                    {deleteItem}
                </DropdownMenuContent>
            )
        }
        if (insight.status === InsightStatus.Generating) {
            // Recovery path for a run that is stuck on generating.
            return (
                <DropdownMenuContent align="end" className="w-[200px]">
                    {regenerateItem}
                </DropdownMenuContent>
            )
        }
        return null
    }

    const hasMenu =
        insight.status === InsightStatus.Draft ||
        insight.status === InsightStatus.Published ||
        insight.status === InsightStatus.Failed ||
        insight.status === InsightStatus.Generating

    if (!hasMenu) return null

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
