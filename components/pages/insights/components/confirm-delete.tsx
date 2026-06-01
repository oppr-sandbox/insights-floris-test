import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useInsightList } from "../hooks/useInsightList";

export default function ConfirmationDeleteDialog() {

    const {
        selectedInsight,
        showConfirmDelete,
        isDeleting,
        dispatch,
        handleDeleteInsight
    } = useInsightList();

    if (!selectedInsight)
        return null;

    return (
        <AlertDialog open={showConfirmDelete} onOpenChange={(open) => {
            if (!open) {
                dispatch({ type: 'CONFIRM_DELETE_CLOSE' })
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                    <AlertDialogDescription className="text-foreground">
                        Are you sure you want to delete insight: <span className="font-semibold">{selectedInsight.insightCode}?</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                        disabled={isDeleting}
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteInsight}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
