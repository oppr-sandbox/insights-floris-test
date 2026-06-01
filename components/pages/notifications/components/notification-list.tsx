import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, Mail, MailOpen, MoreVertical } from "lucide-react";
import { NotificationData, NotificationStatusUpdatePayload } from "../data/schema";
import NotificationItem from "./notification-item";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useNotificationStatusUpdate } from "../hooks/useNotificationStatusUpdate";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import moment from "moment";
import { EmptyState } from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface NotificationListProps {
    activeTab: string;
    sorting: string;
    isMobile: boolean;
}

export default function NotificationList({ activeTab, sorting, isMobile }: NotificationListProps) {
    const [allChecked, setAllChecked] = useState<boolean | 'indeterminate'>(false);

    const searchParams = useSearchParams();
    const search = searchParams.get('search') ?? '';

    const rawNotifications = useQuery(api.notifications.list);
    const isLoading = rawNotifications === undefined;
    const error = null;
    const refetch = () => undefined;

    const notifications: NotificationData[] = useMemo(
        () =>
            (rawNotifications ?? []).map((n) => ({
                id: n.id,
                payload: n.payload,
                title: n.title,
                description: n.body,
                type: n.type,
                createdDate: n.createdAt,
                readDate: n.read ? n.createdAt : null,
            })),
        [rawNotifications]
    );

    const { updateNotificationStatusAsync } = useNotificationStatusUpdate();
    const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
    const handleSelectedNotif = (id: string) => {
        setSelectedNotifications((prev) => {
            if (prev.includes(id)) {
                return prev.filter((notifId) => notifId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleBulkMarkAsReadUnreadClicked = async (markAsRead: boolean) => {
        const payload: NotificationStatusUpdatePayload = {
            notificationIds: selectedNotifications,
            markAsRead
        }

        await updateNotificationStatusAsync(payload);
    }

    const handleClearSelected = () => {
        setSelectedNotifications([])
    }

    const filteredNotifications = useMemo(() => {
        const handlefilterBy = (notification: NotificationData) => {
            // --- Search Match ---
            const searchMatch = search?.trim()
                ? (() => {
                    const searchValue = search.toLowerCase();
                    return (
                        (notification.payload?.topic?.title ?? "").toLowerCase().includes(searchValue) ||
                        notification.title.toLowerCase().includes(searchValue) ||
                        notification.description.toLowerCase().includes(searchValue)
                    );
                })()
                : true;

            // --- Status Match ---
            const statusCheckers: Record<string, (n: NotificationData) => boolean> = {
                all: () => true,
                unread: (n) => n.readDate === null,
                read: (n) => n.readDate !== null,
            };

            const statusMatch = statusCheckers[activeTab]?.(notification) ??
                notification.readDate === null;

            return searchMatch && statusMatch;
        }

        const sortNewestFirst = (a: NotificationData, b: NotificationData) => {
            const da = moment.utc(a.createdDate);
            const db = moment.utc(b.createdDate);

            return db.diff(da);
        }

        const sortOldestFirst = (a: NotificationData, b: NotificationData) => {
            const da = moment.utc(a.createdDate);
            const db = moment.utc(b.createdDate);

            return da.diff(db);
        }

        const sortByType = (a: NotificationData, b: NotificationData) => {
            const typeComparison = a.type.localeCompare(b.type);
            if (typeComparison !== 0) {
                return typeComparison;
            }

            return moment.utc(b.createdDate).diff(moment.utc(a.createdDate));
        }

        const sortUnreadFirst = (a: NotificationData, b: NotificationData) => {
            const aUnread = a.readDate == null ? 0 : 1;
            const bUnread = b.readDate == null ? 0 : 1;

            if (aUnread !== bUnread) {
                return aUnread - bUnread; // unread first
            }

            // If both are same (both read or unread), sort by newest createdDate
            return moment.utc(b.createdDate).diff(moment.utc(a.createdDate));
        }

        const sortingCheckers: Record<string, (a: NotificationData, b: NotificationData) => number> = {
            'newest-first': sortNewestFirst,
            'oldest-first': sortOldestFirst,
            'by-type': sortByType,
            'unread-first': sortUnreadFirst,
        };

        const sortingFunc = sortingCheckers[sorting]

        setSelectedNotifications([]);

        return notifications?.sort(sortingFunc).filter(handlefilterBy) ?? [];
    }, [activeTab, notifications, search, sorting])

    const getEmptyMessage = () => {
        const titles: Record<string, string> = {
            all: 'No notifications yet.',
            unread: 'No unread notifications yet.',
            read: 'No read notifications yet.',
        };

        const descriptions: Record<string, string> = {
            all: "You don't have any notifications right now.",
            unread: "You've read everything. Great job staying on top of things!",
            read: "You haven't opened any notifications yet."
        };

        const title = titles[activeTab] || titles.all;
        const description = descriptions[activeTab] || titles.all;

        return (
            <EmptyState
                title={title}
                description={description}
                icons={[Bell]}
            />
        )
    };

    useEffect(() => {
        if (filteredNotifications.length > 0) {

            const isAllChecked: boolean | "indeterminate" =
                selectedNotifications.length == filteredNotifications.length ?
                    true :
                    selectedNotifications.length > 0
                        && selectedNotifications.length < filteredNotifications.length
                        ? "indeterminate" : false;
            setAllChecked(isAllChecked);
        }
    }, [filteredNotifications.length, selectedNotifications]);


    if (isLoading) return (
        <Skeleton className="h-26 bg-secondary/20" />
    );

    if (error) return (
        <ErrorState
            title="Unable to load notifications"
            message="We couldn't fetch your notifications. Please try again or contact support if the issue persists."
            action={refetch}
        />
    );

    return (
        <div className="flex flex-col gap-2">
            {selectedNotifications.length > 0 &&
                <div className="sticky top-44 z-50 pb-4 bg-background">
                    <div className={cn('border rounded-md p-4 flex justify-between h-18')}>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                className="cursor-pointer"
                                checked={allChecked}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedNotifications(filteredNotifications.map(n => n.id));
                                    } else {
                                        handleClearSelected()
                                    }
                                }}
                            />
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 ">
                                <span className="text-sm">{selectedNotifications.length} selected</span>
                            </div>
                        </div>

                        {(isMobile && activeTab === "all") ? (
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
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuItem
                                        className="flex justify-between"
                                        onClick={() => handleBulkMarkAsReadUnreadClicked(true)}>
                                        Mark as Read
                                        <MailOpen />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="flex justify-between"
                                        onClick={() => handleBulkMarkAsReadUnreadClicked(false)}>
                                        Mark as Unread
                                        <Mail />
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <ScrollArea className="max-w-72 lg:max-w-full overflow-x-auto" >
                                <div className='flex flex-nowrap gap-2 items-center'>
                                    {activeTab !== 'read' &&
                                        <Button
                                            className="bg-transparent text-accent-foreground border"
                                            onClick={() => handleBulkMarkAsReadUnreadClicked(true)}>
                                            <MailOpen />
                                            <span className="text-xs">
                                                Mark as Read
                                            </span>
                                        </Button>
                                    }
                                    {activeTab !== 'unread' &&
                                        <Button
                                            className="bg-transparent text-accent-foreground border"
                                            onClick={() => handleBulkMarkAsReadUnreadClicked(false)}>
                                            <Mail />
                                            <span className="text-xs">
                                                Mark as Unread
                                            </span>
                                        </Button>
                                    }
                                </div>
                                <ScrollBar className="hidden" orientation="horizontal" />
                            </ScrollArea>
                        )}
                    </div>
                </div>
            }

            <div className="flex flex-col gap-2">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(
                        notification =>
                            <Label key={notification.id} htmlFor={notification.id} className="block">
                                <NotificationItem
                                    notification={notification}
                                    selectedNotifications={selectedNotifications}
                                    setSelected={handleSelectedNotif}
                                    isMobile={isMobile} />
                            </Label>
                    )
                ) : (
                    <div>{getEmptyMessage()}</div>
                )}
            </div>
        </div>
    )
}