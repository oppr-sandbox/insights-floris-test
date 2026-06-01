"use client"

import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { NotificationStatusUpdatePayload } from "../data/schema";

export const useNotificationStatusUpdate = () => {
    const httpClient = createHttpClient();

    const { isPending: isSaving, mutateAsync: updateNotificationStatusAsync } = useMutation({
        mutationFn: (data: NotificationStatusUpdatePayload) => httpClient.post(`/api/notifications/update-status`, data),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                toast.error(validationError.message, { description: 'Please fill all required fields' });
            }
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        }
    });

    return {
        isSaving,
        updateNotificationStatusAsync
    }
}