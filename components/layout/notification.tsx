"use client";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Bell } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Notification() {
  const notifications = useQuery(api.notifications.list) ?? [];
  const markAllRead = useMutation(api.notifications.markAllRead);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="size-7 relative">
          <Bell />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="xs:w-80 md:w-120 space-y-2" align="end">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              Notifications
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead({})}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          </div>
          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 md:mt-4 md:text-base">
            You have {unreadCount} unread messages.
          </p>
        </div>
        <ScrollArea>
          <div className="max-h-[300px]">
            {notifications.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No notifications yet.
              </p>
            )}
            {notifications.map((message) => (
              <div
                key={message.id}
                className="relative mx-auto flex w-full max-w-full md:pt-[unset] mb-6"
              >
                <div
                  className={`w-2 h-2 mt-1 me-4 rounded-full ${message.read ? "bg-transparent" : "bg-blue-500"}`}
                ></div>
                <div>
                  <p className="text-zinc-950 dark:text-white font-medium mb-1">
                    {message.title}
                  </p>
                  <p className="text-xs">{message.body}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
