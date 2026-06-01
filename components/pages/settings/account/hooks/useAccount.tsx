import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { ChangePasswordPayload } from "../data/schema";

type ChangePasswordResponse = {
    accessToken: string;
    refreshToken: string;
}

export const useAccount = () => {
    const httpClient = createHttpClient();

    const { isPending: isSaving, mutateAsync: changePasswordAsync } = useMutation({
        mutationFn: (payload: ChangePasswordPayload) => httpClient.post<ChangePasswordResponse>(`/api/authentication/change-password`, payload),
        onSuccess: () => {
            toast.success('Your password has been updated.');
        },
        onError: (error) => {
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
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        }
    });

    return {
        isSaving,
        changePasswordAsync
    }
}