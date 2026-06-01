'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import AllInsights from "@/components/pages/insights/components/all-insights";
import PublishedInsights from "@/components/pages/insights/components/published-insights";
import TopicListModal from "@/components/pages/insights/components/topic-list-modal";
import { useUserDetails } from "@/providers/UserContextProvider";
import { InsightListProvider } from "@/components/pages/insights/hooks/useInsightList";
import ConfirmationDeleteDialog from "@/components/pages/insights/components/confirm-delete";
import ConfirmationPublishDialog from "@/components/pages/insights/components/confirm-publish";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default function InsightsPage() {

    const [open, setOpen] = useState(false);
    const { hasPermission, hasActiveSubscription } = useUserDetails();

    return (
        <>
            <InsightListProvider>
                <main className="flex-1 overflow-y-auto">
                    <Tabs defaultValue={hasPermission('insights:manage') ? 'all' : 'published'}>
                        <div className="px-4 space-y-4">
                            <div className="flex justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                                        Insights Overview
                                    </h3>
                                </div>
                                {hasPermission('insights:manage') && (
                                    hasActiveSubscription
                                        ? <Button type="button" onClick={() => setOpen(true)}>New Insight</Button>
                                        : <UpgradePrompt action="generate insights" />
                                )}
                            </div>
                            <TabsList className="w-full flex items-center justify-center">
                                {hasPermission('insights:manage') &&
                                    <TabsTrigger value="all" className="flex items-center">
                                        All Insights
                                    </TabsTrigger>
                                }
                                <TabsTrigger value="published" className="flex items-center">
                                    Published
                                </TabsTrigger>
                            </TabsList>
                            {hasPermission('insights:manage') &&
                                <TabsContent value="all" className="mb-0">
                                    <AllInsights />
                                </TabsContent>
                            }
                            <TabsContent value="published" className="mb-0">
                                <PublishedInsights />
                            </TabsContent>
                        </div>
                    </Tabs>
                </main>
                <TopicListModal open={open} setOpen={setOpen} />
                <ConfirmationDeleteDialog />
                <ConfirmationPublishDialog />
            </InsightListProvider>
        </>
    )
}