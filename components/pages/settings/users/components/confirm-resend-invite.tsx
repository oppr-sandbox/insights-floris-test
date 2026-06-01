import { 
    AlertDialog, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useUserList } from "../hooks/useUserList"

export function ConfirmResendInviteDialog() {
    const { selectedUser, showConfirmResendInvite, isResendingInvite, dispatch, handleResendInvite } = useUserList();

    return (
        <AlertDialog open={showConfirmResendInvite} onOpenChange={(open) => {
            if (!open) {
                dispatch({ type: 'CONFIRM_RESEND_INVITE_CLOSE' })
            }
        }}>
            {selectedUser &&
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to resend invitation to <span className="font-semibold">{selectedUser.displayName}</span>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isResendingInvite}>Cancel</AlertDialogCancel>
                        <Button
                            disabled={isResendingInvite}
                            variant="default"
                            size="sm"
                            onClick={() => handleResendInvite({
                                firstName: selectedUser.firstName,
                                lastName: selectedUser.lastName,
                                email: selectedUser.email,
                                role: selectedUser.position
                            })}>
                            Resend Invite
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            }
        </AlertDialog>
    )
}