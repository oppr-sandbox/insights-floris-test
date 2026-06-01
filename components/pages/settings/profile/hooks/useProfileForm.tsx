import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { ProfileInput, ResetPasswordPayload } from "../data/schema";
import { Discipline, Location } from "../../naming-conventions/data/schema";

type UploadAvatarResponse = {
    avatar: string;
}

export const useProfileForm = () => {
    const httpClient = createHttpClient();

    const { data: locations, error: errorLocations, isLoading: isLoadingLocations } = useQuery<Location[]>({
        queryKey: ['naming-conventions', 'locations'],
        queryFn: () => httpClient.get('/api/locations')
    });

    const { data: disciplines, error: errorDisciplines, isLoading: isLoadingDisciplines } = useQuery<Discipline[]>({
        queryKey: ['naming-conventions', 'disciplines'],
        queryFn: () => httpClient.get('/api/disciplines')
    });

    const { isPending: isSavingAvatar, mutateAsync: uploadAvatarAsync } = useMutation({
        mutationFn: (data: FormData) => httpClient.put<UploadAvatarResponse>(`/api/users/upload-avatar`, data),
        onSuccess: () => {
            toast.success('Your avatar has been updated.');
        },
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                const validationMessages =
                    validationError.errors &&
                    Object.values(validationError.errors).flat();
                toast.error(`Failed to upload avatar due to the following error: `, {
                    description: validationMessages && validationMessages.length > 0 ? (
                        <ul className="ml-4 list-disc">
                            {validationMessages.map((msg, index) => (
                                <li key={index} className='text-xs'>{msg}</li>
                            ))}
                        </ul>
                    ) : (
                        'Please fill all required fields.'
                    )
                });
            }
            else if (error instanceof InternalServerError) {
                const internalServerError = error as InternalServerError;
                toast.error(internalServerError.message, { description: internalServerError.description });
            }
        }
    });

    const { isPending: isSaving, mutateAsync: updateProfileAsync } = useMutation({
        mutationFn: (data: ProfileInput) => httpClient.patch(`/api/users/update-profile`, data),
        onSuccess: () => {
            toast.success('Your profile has been updated.');
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

    const { isPending: isResetPasswordPending, mutateAsync: resetPassword } = useMutation({
        mutationFn: async (payload: ResetPasswordPayload) => httpClient.post('/api/authentication/request-password-reset', payload),
    });

    const resetPasswordAsync = async (payload: ResetPasswordPayload): Promise<boolean> => {
        try {
            await resetPassword(payload);
            toast.success('Reset password email has been sent to your inbox.');
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
        else if (error instanceof InternalServerError) {
            const internalServerError = error as InternalServerError;
            toast.error(internalServerError.message, { description: internalServerError.description });
        }
    }

    return {
        isLoadingDisciplines,
        disciplines,

        isLoadingLocations,
        locations,

        isSavingAvatar,
        uploadAvatarAsync,

        isSaving,
        updateProfileAsync,

        isResetPasswordPending,
        resetPasswordAsync
    }
}