import { createContext, ReactNode, useContext, useReducer } from "react";
import { InviteUserInput, User } from "../data/schema"
import { createHttpClient, InternalServerError, ValidationError } from "@/utils/api/createHttpClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";

type State = {
    selectedUser: User | undefined;
    showConfirmResendInvite: boolean;
    showConfirmCancelInvite: boolean;
}

type Action =
    | { type: 'CONFIRM_RESEND_INVITE'; payload: User }
    | { type: 'CONFIRM_RESEND_INVITE_CLOSE'; }
    | { type: 'CONFIRM_CANCEL_INVITE'; payload: User }
    | { type: 'CONFIRM_CANCEL_INVITE_CLOSE'; }

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'CONFIRM_RESEND_INVITE':
            return { ...state, selectedUser: action.payload, showConfirmResendInvite: true }

        case 'CONFIRM_RESEND_INVITE_CLOSE':
            return { ...state, showConfirmResendInvite: false }

        case 'CONFIRM_CANCEL_INVITE':
            return { ...state, selectedUser: action.payload, showConfirmCancelInvite: true }

        case 'CONFIRM_CANCEL_INVITE_CLOSE':
            return { ...state, showConfirmCancelInvite: false }

        default:
            return state;
    }
}

const initialState: State = {
    selectedUser: undefined,
    showConfirmResendInvite: false,
    showConfirmCancelInvite: false
}

type UserListContextType = {
    dispatch: React.Dispatch<Action>;
    isResendingInvite: boolean;
    isCancellingInvite: boolean;
    handleResendInvite: (data: InviteUserInput) => void;
    handleCancelInvite: (id: string) => Promise<void>;
} & State

const UserListContext = createContext<UserListContextType | undefined>(undefined);

export const UserListProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const httpClient = createHttpClient();
    const queryClient = useQueryClient();

    const { isPending: isResendingInvite, mutateAsync: resendInviteAsync } = useMutation({
        mutationFn: (data: InviteUserInput) => httpClient.put(`/api/users/invite`, data),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                const validationMessages =
                    validationError.errors &&
                    Object.values(validationError.errors).flat();

                toast.error(`Resending of user invite failed due to following errors: `, {
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
            else if (error instanceof Error) {
                toast.error('Failed to resend invitation', { description: error.message, });
            }
        },
        onSuccess: () => {
            toast.success('Invite Resent', { description: 'A new invitation email has been sent to the user.' });
            dispatch({ type: 'CONFIRM_RESEND_INVITE_CLOSE' });
            queryClient.invalidateQueries({ queryKey: ['settings', 'users'] });
        }
    });

    const { isPending: isCancellingInvite, mutateAsync: cancelInviteAsync } = useMutation({
        mutationFn: (id: string) => httpClient.post(`/api/users/${id}/cancel-invite`, undefined),
        onError: (error) => {
            if (error instanceof ValidationError) {
                const validationError = error as ValidationError;
                const validationMessages =
                    validationError.errors &&
                    Object.values(validationError.errors).flat();

                toast.error(`Cancellation of user invite failed due to following errors: `, {
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
            else if (error instanceof Error) {
                toast.error('Failed to cancel invitation', { description: error.message, });
            }
        },
        onSuccess: () => {
            toast.success('Invite Cancelled', { description: 'The invitation was successfully cancelled.' });
            dispatch({ type: 'CONFIRM_CANCEL_INVITE_CLOSE' });
            queryClient.invalidateQueries({ queryKey: ['settings', 'users'] });
        }
    });

    const handleResendInvite = async (data: InviteUserInput) => {
        toast.promise(resendInviteAsync(data), {
            loading: "Resending invitation email...",
        });
    }

    const handleCancelInvite = async (id: string) => {
        toast.promise(cancelInviteAsync(id), {
            loading: "Processing invitation cancellation...",
        });
    }

    return (
        <UserListContext.Provider value={{
            ...state,
            isResendingInvite,
            isCancellingInvite,
            dispatch,
            handleResendInvite,
            handleCancelInvite
        }}>
            {children}
        </UserListContext.Provider>
    );
}

export const useUserList = () => {
    const context = useContext(UserListContext);

    if (!context) {
        throw new Error('useUserList must be used within a UserListProvider');
    }

    return context;
};