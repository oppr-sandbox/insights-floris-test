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

export default function ConfirmationArchiveDialog() {

    const { showConfirmArchive, isArchiving, selectedTopic, dispatch, handleArchiveTopic } = useTopicList()

    if (!selectedTopic)
        return null;

    return (
        <AlertDialog open={showConfirmArchive} onOpenChange={(open) => {
            if (!open) {
                dispatch({ type: 'CONFIRM_ARCHIVE_CLOSE' })
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to archive topic: <span className="font-semibold">{selectedTopic.topicCode}</span>?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button 
                        disabled={isArchiving}
                        variant="destructive" 
                        size="sm" 
                        onClick={handleArchiveTopic}>
                        { isArchiving ? 'Archiving...' : 'Archive' }
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
