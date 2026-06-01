"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/providers/NotificationProvider";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Bell } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "../ui/sonner";
import { useUserDetails } from "@/providers/UserContextProvider";

type NotificationMessage = {
  title: string;
  body: string;
};

export default function Notification() {
  const { subscribe, unsubscribe, connectionState } = useNotification();
  const { user } = useUserDetails();
  const [messages, setMessages] = useState<NotificationMessage[]>([]);

  useEffect(() => {
    if (connectionState === 'Connected') {
        const handleNotification = (
          _topic: string,
          message: NotificationMessage
        ) => {
          setMessages((prev) => [...prev, message]);

          toast.default(message.title, { description: message.body });
        };

        subscribe("notifications-" + user.companyId, handleNotification);

        return () => unsubscribe("notifications-" + user.companyId);
    }
  }, [connectionState, user]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="size-7 relative">
          <Bell />
          {
            messages.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {messages.length}
                </div>
            )
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="xs:w-80 md:w-120 space-y-2" align="end">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
                Notifications
            </p>
            <Button variant="ghost" size="sm">
                Mark all as read
            </Button>
          </div>
          <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 md:mt-4 md:text-base">
            You have {messages.length} unread messages.
          </p>
        </div>
        <ScrollArea>
            <div className="max-h-[300px]">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className="relative mx-auto flex w-full max-w-full md:pt-[unset] mb-6"
                    >
                        <div className="w-2 h-2 mt-1 me-4 rounded-full bg-blue-500"></div>
                        <div>
                          <p className="text-zinc-950 dark:text-white font-medium mb-1">
                              {message.title}
                          </p>
                          <p className="text-xs">
                            {message.body}
                          </p>
                        </div>
                    </div>
                    ))}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
