'use client'

import moment from "moment";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Insight } from "../data/schema";
import { statuses } from "../data/data";
import { formatDate } from "@/utils/helpers/helpers";
import { useUserDetails } from "@/providers/UserContextProvider";
import { ItemActions } from "./item-actions";

interface InsightItemProps {
    insight: Insight
    onClick: (insight: Insight) => void
    isPublished?: boolean
}

export default function InsightItem({ insight, onClick, isPublished = false }: InsightItemProps) {

    const { hasPermission } = useUserDetails();

    const status = isPublished == false ? statuses[insight.status] : null;

    return (
        <Card onClick={() => onClick(insight)}>
            <CardHeader>
                <CardDescription className="text-xs">Insight ID: {insight.topicCode}</CardDescription>
                <CardTitle className="text-sm">
                    {insight.topicName}
                </CardTitle>
                <CardAction className="ms-4">
                    {
                        hasPermission('insights:manage') && (
                            <ItemActions insight={insight} />
                        )
                    }
                </CardAction>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
                {
                    isPublished == false && (
                        <Badge color={status!.color} variant="outline">{status!.value}</Badge>
                    )
                }
            </CardContent>
            <CardContent className="flex-1 space-y-2">
                <CardDescription className="grid grid-cols-2 text-sm text-muted-foreground">
                    Feedback Count: <span className="text-foreground font-semibold">{insight.feedbackCount}</span>
                </CardDescription>
                <CardDescription className="grid grid-cols-2 text-sm text-muted-foreground">
                    Created By: <span className="text-foreground font-semibold">{insight.createdBy}</span>
                </CardDescription>
                <CardDescription className="grid grid-cols-2 text-sm text-muted-foreground">
                    Created On: <span className="text-foreground font-semibold">{formatDate(insight.createdOn)}</span>
                </CardDescription>
            </CardContent>
        </Card>
    )
}