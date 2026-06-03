"use client"

import RecentActivities from "@/components/pages/dashboard/components/recent-activities";
import RunningTopics from "@/components/pages/dashboard/components/running-topics";
import SectionCards from "@/components/pages/dashboard/components/section-cards";
import { useUserDetails } from "@/providers/UserContextProvider";

export default function DashboardPage() {

    const { user } = useUserDetails();
    const isManager = user.role.toUpperCase() !== "MEMBER";

    return (
        <div className="px-4 lg:px-4 space-y-6">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <span className="text-muted-foreground">
                    {isManager
                        ? "How the whole feedback program is running."
                        : "What's running across the topics you're part of."}
                </span>
            </div>
            <SectionCards />
            <section className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Running topics</h4>
                <RunningTopics />
            </section>
            <RecentActivities />
        </div>
    )
}
