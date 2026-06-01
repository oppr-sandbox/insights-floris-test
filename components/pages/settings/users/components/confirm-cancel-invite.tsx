import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useUserList } from "../hooks/useUserList"

export function ConfirmCancelInviteDialog() {
    const { selectedUser, showConfirmCancelInvite, isCancellingInvite, dispatch, handleCancelInvite } = useUserList();

    return (
        <AlertDialog open={showConfirmCancelInvite} onOpenChange={(open) => {
            if (!open) {
                dispatch({ type: 'CONFIRM_CANCEL_INVITE_CLOSE' })
            }
        }}>
            {selectedUser &&
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel invitation to <span className="font-semibold">{selectedUser.displayName}</span>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancellingInvite}>Cancel</AlertDialogCancel>
                        <Button
                            disabled={isCancellingInvite}
                            variant="default"
                            size="sm"
                            onClick={() => handleCancelInvite(selectedUser.id)}>
                            Confirm
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            }
        </AlertDialog>
    )
}