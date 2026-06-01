"use client"

import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InviteUserInput } from "../data/schema";
import posthog from "posthog-js";

export const useInviteUserForm = () => {
    const httpClient = createHttpClient();
    const queryClient = useQueryClient();

    const { isPending: isSaving, mutateAsync: inviteUserAsync } = useMutation({
        mutationFn: (data: InviteUserInput) => httpClient.put(`/api/users/invite`, data),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                toast.error(validationError.message, { description: 'Please fill all required fields' });
            }
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        },
        onSuccess: (_data, variables) => {
            posthog.capture('user_invited', { role: variables.role });
            toast.success('Email Sent', { description: 'The invitation email has been delivered to the user.' });
            queryClient.invalidateQueries({
            queryKey: ['settings', 'users'],
            exact: false
        });
        }
    });

    return {
        isSaving,
        inviteUserAsync
    }
}