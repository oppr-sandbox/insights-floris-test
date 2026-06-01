import { 
    AlertDialog, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
import { useTopicList } from "./hooks/useTopicList";
import { Button } from "@/components/ui/button";

export default function ConfirmationPublishDialog() {

    const { showConfirmPublish, isPublishing, selectedTopic, dispatch, handlePublishTopic } = useTopicList()

    if (!selectedTopic)
        return null;

    return (
        <AlertDialog open={showConfirmPublish} onOpenChange={(open) => {
            if (!open) {
                dispatch({ type: 'CONFIRM_PUBLISH_CLOSE' })
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to publish topic: <span className="font-semibold">{selectedTopic.topicCode}</span>?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button 
                        disabled={isPublishing}
                        size="sm" 
                        onClick={handlePublishTopic}>
                        { isPublishing ? 'Publishing...' : 'Confirm' }
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
