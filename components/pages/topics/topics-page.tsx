'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation"

import { useQuery } from "@tanstack/react-query";

import { Search } from "lucide-react"
import { IconGridDots, IconList, IconPlus } from "@tabler/icons-react"

import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import TopicList from "@/components/pages/topics/components/topic-list";

import { createHttpClient } from "@/utils/api/createHttpClient";
import { debounce } from "@/utils/helpers/helpers";
import CreateTopicModal from "./components/create-topic-modal";
import { useUserDetails } from "@/providers/UserContextProvider";
import { UpgradePrompt } from "@/components/upgrade-prompt";

type InactiveCount = {
    draft: number;
    paused: number;
}

export default function TopicsPage() {

    const { hasActiveSubscription } = useUserDetails();
    const httpClient = createHttpClient();
    const searchParams = useSearchParams()
    const pathname = usePathname();
    const viewTab = searchParams.get('view') ?? 'cards';
    const statusFilter = searchParams.get('filter') ?? 'all';
    const [searchVal, setSearchVal] = useState<string>(searchParams.get('search') ?? '');
    const [openCreateModal, setOpenCreateModal] = useState(false);

    const { data: inactiveCount } = useQuery<InactiveCount>({
        queryKey: ['topics', 'inactive'],
        queryFn: () => httpClient.get('/api/topics/inactive')
    });

    const renderWarningMessage = (inactiveCount:InactiveCount ) => {
        return `It looks like you have ${[
                inactiveCount.draft > 0 ? `${inactiveCount.draft} draft` : null,
                inactiveCount.paused > 0 ? `${inactiveCount.paused} paused` : null
            ]
            .filter(Boolean)
            .join(" and ")
        } topic${(inactiveCount.draft + inactiveCount.paused) > 1 ? "s" : ""}. Do you want to continue creating a new topic?`
    }

    const handleClick = async () => {
        setOpenCreateModal(true);
    };

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
                }}
                value={viewTab}>
                <div className="px-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Topics</h3>
                            <p className="text-body text-medium-grey">
                                Manage and track feedback collection topics across your organization
                            </p>
                        </div>
                        {hasActiveSubscription ? (
                            inactiveCount && (inactiveCount.draft > 0 || inactiveCount.paused > 0) ? (
                                <ConfirmationDialog
                                    title="Confirm Action"
                                    description={renderWarningMessage(inactiveCount)}
                                        triggerButton={
                                        <Button>
                                            <IconPlus />
                                            Create New Topic
                                        </Button>
                                    }
                                    actionButtonText="Continue"
                                    onActionButtonClicked={handleClick}
                                />
                            ) : (
                                <Button onClick={handleClick}>
                                    <IconPlus />
                                    Create New Topic
                                </Button>
                            )
                        ) : (
                            <UpgradePrompt action="create topics" />
                        )}
                    </div>
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex w-full flex-col lg:flex-row gap-4">
                            <div className="relative w-full lg:max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medium-grey w-4 h-4" />
                                <Input
                                    className="ps-10"
                                    type="text"
                                    placeholder="Search topics..."
                                    value={searchVal}
                                    onChange={(event) => { setSearchVal(event.target.value); }} />
                            </div>
                            <ToggleGroup
                                onValueChange={(value) => queryParamSet('filter', value)}
                                value={statusFilter}
                                variant="outline"
                                type="single"
                                className="w-full lg:max-w-md">
                                <ToggleGroupItem value="all" className="w-full">
                                    All
                                </ToggleGroupItem>
                                <ToggleGroupItem value="active" className="w-full">
                                    Active
                                </ToggleGroupItem>
                                <ToggleGroupItem value="draft" className="w-full">
                                    Draft
                                </ToggleGroupItem>
                                <ToggleGroupItem value="completed" className="w-full">
                                    Completed
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                        <div className="flex flex-1 flex-col w-full items-center lg:items-end">
                            <div className="bg-light-grey rounded-lg p-1">
                                <TabsList>
                                    <TabsTrigger value="cards">
                                        <IconGridDots />
                                        Cards
                                    </TabsTrigger>
                                    <TabsTrigger value="table">
                                        <IconList />
                                        Table
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>
                    </div>
                    <TopicList onCreateTopicClick={handleClick} />
                </div>
            </Tabs>
            <CreateTopicModal open={openCreateModal} onOpenChange={setOpenCreateModal} />
        </main>
    )
}