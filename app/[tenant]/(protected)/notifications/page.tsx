"use client"

import { Input } from "@/components/ui/input";
import { ArrowUpNarrowWide, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { createHttpClient } from "@/utils/api/createHttpClient";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname, useSearchParams } from "next/navigation";
import { debounce } from "@/utils/helpers/helpers";
import { NotificationStats } from "@/components/pages/notifications/data/schema";
import NotificationCards from "@/components/pages/notifications/components/notification-cards";
import NotificationList from "@/components/pages/notifications/components/notification-list";
import ErrorState from "@/components/ui/error-state";

export default function NotificationsPage() {
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    const httpClient = createHttpClient();
    const pathname = usePathname();

    const search = searchParams.get('search') ?? ''
    const statusFilter = searchParams.get('filter') ?? 'unread'
    const [activeTab, setActiveTab] = useState<string>(statusFilter);
    const [sorting, setSorting] = useState<string>('newest-first');
    const [searchVal, setSearchVal] = useState<string>(search);

    const { data: notificationStats, error, isLoading, refetch } = useQuery<NotificationStats>({
        queryKey: ['notifications', 'stats'],
        queryFn: () => httpClient.get('/api/notifications/stats')
    })

    const renderCards = () => {
        return notificationStats && !isLoading ? (
            <NotificationCards notificationStats={notificationStats} />
        ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Skeleton className="h-23 bg-secondary/20" />
                <Skeleton className="h-23 bg-secondary/20" />
                <Skeleton className="h-23 bg-secondary/20" />
                <Skeleton className="h-23 bg-secondary/20" />
            </div>
        )
    }

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

    const handleTabChanged = (value: string) => {
        setActiveTab(value);
        queryParamSet('filter', value);
    }

    useEffect(() => {
        debouncedSetSearch(searchVal);

        if ((activeTab === '' || activeTab !== 'all') && sorting === 'unread-first') {
            setSorting('newest-first');
        }

        return () => {
            debouncedSetSearch.cancel();
        };
    }, [searchVal, debouncedSetSearch, activeTab, sorting]);

    if (error) return (
        <ErrorState
            title="Notifications Unavailable"
            message="We couldn't load your notifications. Please try again or contact support if the issue persists."
            action={refetch}
        />
    );

    return (
        <div className="px-4">
            <div className="flex flex-row md:flex-col justify-between md:items-start items-center gap-4 py-4">
                <div>
                    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                        Notifications
                    </h3>
                </div>
            </div>
            <div className="flex-1">
                {renderCards()}
            </div>
            <div className="sticky top-16 flex flex-col space-y-4 bg-background z-50 py-4">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medium-grey w-4 h-4" />
                        <Input
                            className="ps-10"
                            type="text"
                            placeholder="Search notifications..."
                            value={searchVal}
                            onChange={(e) => { setSearchVal(e.target.value); }} />
                    </div>
                    <div className="relative">
                        <ArrowUpNarrowWide className="absolute left-3 top-1/2 transform -translate-y-1/2 text-medium-grey w-4 h-4" />
                        <Select value={sorting} onValueChange={(value) => setSorting(value)}>
                            <SelectTrigger className="ps-10 w-[180px]">
                                <SelectValue placeholder="Sort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest-first">Newest First</SelectItem>
                                <SelectItem value="oldest-first">Oldest First</SelectItem>
                                <SelectItem value="by-type">By Type</SelectItem>
                                {(activeTab === '' || activeTab === "all") && <SelectItem value="unread-first">Unread First</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="relative">
                    <ToggleGroup
                        value={statusFilter}
                        onValueChange={handleTabChanged}
                        variant="outline"
                        type="single"
                        className="w-full">
                        <ToggleGroupItem value="unread" >
                            <span>
                                Unread
                            </span>
                            {notificationStats && !isLoading ? (
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/40 text-secondary-foreground">
                                    {notificationStats.unread}
                                </div>
                            ) : (
                                <Skeleton className="w-8.25 h-5.5 rounded-full bg-primary/40" />
                            )}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="read" >
                            <span>
                                Read
                            </span>
                            {notificationStats && !isLoading ? (
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/40 text-secondary-foreground">
                                    {notificationStats.read}
                                </div>
                            ) : (
                                <Skeleton className="w-8.25 h-5.5 rounded-full bg-primary/40" />
                            )}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="all" >
                            <span>
                                All
                            </span>
                            {notificationStats && !isLoading ? (
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/40 text-secondary-foreground">
                                    {notificationStats.total}
                                </div>
                            ) : (
                                <Skeleton className="w-8.25 h-5.5 rounded-full bg-primary/40" />
                            )}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>
            <NotificationList
                activeTab={activeTab}
                sorting={sorting}
                isMobile={isMobile} />
        </div>
    )
}