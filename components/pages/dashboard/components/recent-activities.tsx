
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

import ActivityItem from "./activity-item";

import { Activity } from "../data/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityIcon } from "lucide-react";

export default function RecentActivities() {

    const activies: Activity[] = [
        {
            id: '1234676',
            template: '**{user.name}** added new feedback on **{topic.title}**.',
            type: 'submitted-feedback',
            metaData: {
                user: {
                    name: 'Alice Johnson'
                },
                topic: {
                    title: 'AMS-OPS-TPC-0001: XP-FR-102 Phase 2',
                    path: '/topics',
                }
            }
        },
        {
            id: '12346789',
            template: 'AI Insight generated for [{topic.title}]({topic.path}).',
            type: 'generated-insights',
            metaData: {
                topic: {
                    title: 'AMS-OPS-TPC-0001: XP-FR-102 Phase 2',
                    path: '/topics',
                }
            }
        },
        {
            id: '1234987456',
            template: '**{user.name}** added new feedback on **{topic.title}**.',
            type: 'submitted-feedback',
            metaData: {
                user: {
                    name: 'Bob Martinez'
                },
                topic: {
                    title: 'AMS-OPS-TPC-0003: Recycled PET Compound Development',
                    path: '/topics',
                }
            }
        }
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity Stream</CardTitle>
                <CardDescription>
                    Latest feedback submissions and insight generations across your topics.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {/* {activies.map(activity => <ActivityItem key={activity.id} activity={activity} />)} */}
                <EmptyState
                    title="No Recent Activities Yet"
                    description="Recent activities are not available yet. Check back soon."
                    icons={[ActivityIcon]}
                />
            </CardContent>
        </Card>
    )
}