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

export default function ConfirmationPublishDialog() {

    const {
        selectedInsight,
        showConfirmPublish,
        isPublishing,
        dispatch,
        handlePublishInsight
    } = useInsightList();

    if (!selectedInsight)
        return null;

    return (
        <AlertDialog open={showConfirmPublish} onOpenChange={(open) => {
            if (!open) {
                dispatch({ type: 'CONFIRM_PUBLISH_CLOSE' })
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Publish Insight</AlertDialogTitle>
                    <AlertDialogDescription className="text-foreground">
                        Are you sure you want to publish insight: <span className="font-semibold">{selectedInsight.insightCode}</span>? This will make it visible to all members.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                        disabled={isPublishing}
                        size="sm"
                        onClick={handlePublishInsight}>
                        {isPublishing ? 'Publishing...' : 'Publish'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
