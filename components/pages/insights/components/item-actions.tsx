"use client"

import { MoreVertical, Trash2 } from "lucide-react"
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

    const { dispatch } = useInsightList();

    const renderPublishMenu = () => {
        return (
            <DropdownMenuItem
                className="flex justify-between"
                onClick={(e) => {
                    e.stopPropagation()
                    dispatch({ type: 'CONFIRM_PUBLISH', payload: insight })
                }}>
                Publish
            </DropdownMenuItem>
        )
    }

    const renderDeleteMenu = () => {
        return (
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
    }

    const renderMenuItems = () => {
        if (insight.status === InsightStatus.Draft || 
            insight.status === InsightStatus.Failed) {
            return (
                <DropdownMenuContent align="end" className="w-[200px]">
                    {renderPublishMenu()}
                    <DropdownMenuSeparator />
                    {renderDeleteMenu()}
                </DropdownMenuContent>
            )
        }
    }

    return (
        <>
            {insight.status !== InsightStatus.Generating &&
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
            }
        </>
    )
}