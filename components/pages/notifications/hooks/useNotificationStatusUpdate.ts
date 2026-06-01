"use client"

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { NotificationStatusUpdatePayload } from "../data/schema";

export const useNotificationStatusUpdate = () => {
    const markRead = useMutation(api.notifications.markRead);
    const [isSaving, setIsSaving] = useState(false);

    const updateNotificationStatusAsync = async (data: NotificationStatusUpdatePayload) => {
        setIsSaving(true);
        try {
            const ids = (data.notificationIds ?? []) as Id<"notifications">[];
            await markRead({ ids });
        } catch (e) {
            toast.error("Failed to update notification", {
                description: e instanceof Error ? e.message : undefined,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return {
        isSaving,
        updateNotificationStatusAsync,
    };
};
