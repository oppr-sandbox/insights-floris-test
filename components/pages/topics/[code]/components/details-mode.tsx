'use client'

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Statistics from "./details-statistics";
import Contents from "./details-content";
import { usePathname, useSearchParams } from "next/navigation";
import Feedbacks from "./details-feedbacks";
import { setQueryParam } from "@/utils/helpers/helpers";

export function DetailsMode({ className }: { className?: string | undefined }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const currentTab = searchParams.get('tab') ?? 'statistics';

    return (
        <Tabs value={currentTab} onValueChange={(value) => { setQueryParam(pathname, 'tab', value) }} >
            <div className="sticky top-28 bg-background z-50 py-2 px-4">
                <TabsList className=" w-full grid grid-cols-1 md:grid-cols-3 h-auto p-1">
                    <TabsTrigger value="statistics">
                        Statistics
                    </TabsTrigger>
                    <TabsTrigger value="contents">
                        Contents
                    </TabsTrigger>
                    <TabsTrigger value="feedbacks">
                        Feedbacks
                    </TabsTrigger>
                    {/* <TabsTrigger value="export">
                        Export
                    </TabsTrigger> */}
                </TabsList>
            </div>
            <div className="px-4">
                <Statistics />
                <Contents />
                <Feedbacks />
                {/* <Export /> */}
            </div>
        </Tabs>
    )
}
