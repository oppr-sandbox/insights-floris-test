"use client"

import ActiveTopics from "@/components/pages/dashboard/components/active-topics";
import RecentActivities from "@/components/pages/dashboard/components/recent-activities";
import SectionCards from "@/components/pages/dashboard/components/section-cards";
import { useUserDetails } from "@/providers/UserContextProvider";

export default function DashboardPage() {

    const { user } = useUserDetails();

    return (
        <div className="px-4 lg:px-4 space-y-4">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-foreground">Welcome{user.lastLogin ? ' back' : ''}, {user.firstName} {user.lastName}!</h1>
                <span className="text-muted-foreground">Here's what's happening with your topics today.</span>
            </div>
            <SectionCards />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ActiveTopics />
                <RecentActivities />
            </div>
        </div>
    )
}