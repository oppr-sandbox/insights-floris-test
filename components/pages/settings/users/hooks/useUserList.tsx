import { createContext, ReactNode, useContext, useReducer } from "react";
import { InviteUserInput, User } from "../data/schema"
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

    // Invitations aren't used with magic-link auth: users self-provision on first
    // sign-in with an @oppr.ai email. These handlers are kept as no-ops so the UI
    // continues to render.
    const isResendingInvite = false;
    const isCancellingInvite = false;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleResendInvite = async (_data: InviteUserInput) => {
        toast.default('Users sign in directly with their @oppr.ai email — no invitation needed.');
        dispatch({ type: 'CONFIRM_RESEND_INVITE_CLOSE' });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleCancelInvite = async (_id: string) => {
        dispatch({ type: 'CONFIRM_CANCEL_INVITE_CLOSE' });
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