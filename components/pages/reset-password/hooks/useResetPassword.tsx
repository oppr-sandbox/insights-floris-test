import { createHttpClient, InternalServerError, NotFoundError, ValidationError } from "@/utils/api/createHttpClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { RequestPasswordResetPayload, ResetPasswordPayload } from "../data/schema";

export const useResetPassword = () => {
    const httpClient = createHttpClient();

    const { isPending: isPendingRequest, isSuccess: isSuccessRequest, mutateAsync: requestPasswordReset } = useMutation({
        mutationFn: async (payload: RequestPasswordResetPayload) => httpClient.post('/api/authentication/request-password-reset', payload),
    });

    const { isPending: isSaving, mutateAsync: resetPassword } = useMutation({
        mutationFn: (payload: ResetPasswordPayload) => httpClient.post(`/api/authentication/reset-password`, payload),
    });

    const requestPasswordResetAsync = async (payload: RequestPasswordResetPayload) => {
        try {
            await requestPasswordReset(payload);
            toast.success('Reset password email has been sent to your inbox.');
            return true;

        } catch (error) {
            handleError(error);
            return false;
        }
    }

    const resetPasswordAsync = async (payload: ResetPasswordPayload): Promise<boolean> => {
        try {
            await resetPassword(payload);
            toast.success('Your password has been updated successfully.');
            return true;

        } catch (error) {
            handleError(error);
            return false;
        }
    }

    const handleError = (error: unknown) => {
        if (error instanceof ValidationError) {
            const validationError = error as ValidationError;
            const errorMessages: string[] = []

            for (const key in validationError.errors) {
                if (validationError.errors.hasOwnProperty(key)) {
                    for (const message of validationError.errors[key]) {
                        errorMessages.push(message);
                    }
                }
            }

            toast.error(validationError.message, {
                description: (
                    <ul className='ml-4 list-disc'>
                        {errorMessages.map((message, i) => (
                            <li key={i} className='text-xs'>
                                {message}
                            </li>
                        ))}
                    </ul>
                ),
            });
        }
        else if (error instanceof NotFoundError) {
            toast.error(error.message);
        }
        else if (error instanceof InternalServerError) {
            const internalServerError = error as InternalServerError;
            toast.error(internalServerError.message, { description: internalServerError.description });
        }
    }

    return {
        isPendingRequest,
        isSuccessRequest,
        requestPasswordResetAsync,

        isSaving,
        resetPasswordAsync
    }
}