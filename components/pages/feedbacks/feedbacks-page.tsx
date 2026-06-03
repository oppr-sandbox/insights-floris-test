'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListChecks, Plus, Search } from "lucide-react"
import { debounce } from "@/utils/helpers/helpers"
import AssignedTopics from "@/components/pages/feedbacks/components/assigned-topics"
import MyFeedbacks from "@/components/pages/feedbacks/components/my-feedbacks"
import OperatorFeedbacksPage from "@/components/pages/feedbacks/components/operator-feedbacks-page"
import { useUserDetails } from "@/providers/UserContextProvider"

export default function FeedbacksPage() {
    const { user } = useUserDetails();
    const isMember = user.role.toUpperCase() === 'MEMBER';

    if (isMember) {
        return <OperatorFeedbacksPage />;
    }

    return <ManagerFeedbacksPage />;
}

function ManagerFeedbacksPage() {
    const pathname = usePathname();
    const searchParams = useSearchParams()
    const viewTab = searchParams.get('view') ?? 'assigned-topics';
    const autoOpenTopicId = searchParams.get('topic');
    const [searchVal, setSearchVal] = useState<string>(searchParams.get('search') ?? '');
    const [showCompleted, setShowCompleted] = useState(false);

    const queryParamSet = useCallback(
        (paramName: string, paramVal?: string) => {
            const params = new URLSearchParams(window.location.search);

            if (!paramVal) {
                params.delete(paramName);
            } else {
                params.set(paramName, paramVal);
            }

            const newUrl =
                params.toString().length > 0
                    ? `${pathname}?${params.toString()}`
                    : pathname;

            window.history.replaceState({}, "", newUrl);
        },
        [pathname]
    );

    const debouncedSetSearch = useMemo(
        () =>
            debounce((value?: string) => {
                queryParamSet("search", value);
            }, 500),
        [queryParamSet]
    );

    useEffect(() => {
        debouncedSetSearch(searchVal);

        return () => {
            debouncedSetSearch.cancel();
        };
    }, [searchVal, debouncedSetSearch]);

    return (
        <main className="flex-1 overflow-y-auto">
            <Tabs
                onValueChange={(value) => {
                    queryParamSet('view', value);
                    setSearchVal('');
                }}
                value={viewTab}>
                <div className="px-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                                My Feedback
                            </h3>
                            <p className="text-body text-medium-grey">
                                Manage feedback for topics you've been assigned to.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex flex-row md:flex-col gap-4 w-full md:max-w-md">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medium-grey w-4 h-4" />
                                <div className="w-full">
                                    <Input
                                        className="ps-10"
                                        type="text"
                                        placeholder="Search topic or feedbacks..."
                                        value={searchVal}
                                        onChange={(event) => { setSearchVal(event.target.value); }}
                                    />
                                </div>
                            </div>
                        </div>
                        {
                            viewTab === 'my-feedbacks' && (
                                <div className="flex justify-center md:justify-start items-center w-full space-x-2 md:max-w-md">
                                    <Switch id="show-completed" checked={showCompleted} onCheckedChange={setShowCompleted}/>
                                    <Label htmlFor="show-completed">Show Completed</Label>
                                </div>
                            )
                        }
                        <div className="flex w-full justify-center md:justify-end items-center gap-1 bg-light-grey rounded-lg p-1">
                            {/*  className="w-full grid grid-cols-2" */}
                            <TabsList>
                                <TabsTrigger value="assigned-topics" className="flex items-center">
                                    <Plus />
                                    Assigned Topics
                                </TabsTrigger>
                                <TabsTrigger value="my-feedbacks" className="flex items-center">
                                    <ListChecks />
                                    My Feedbacks
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </div>
                    <TabsContent value="assigned-topics" className="mb-0">
                        <AssignedTopics searchVal={searchVal} autoOpenTopicId={autoOpenTopicId ?? undefined} />
                    </TabsContent>
                    <TabsContent value="my-feedbacks" className="mb-0">
                        <MyFeedbacks searchVal={searchVal} showCompleted={showCompleted} />
                    </TabsContent>
                </div>
            </Tabs>
        </main>
    )
}
