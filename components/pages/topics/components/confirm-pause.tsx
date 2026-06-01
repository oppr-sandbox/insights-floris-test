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

export default function ConfirmationPauseDialog() {

    const { showConfirmPause, isPausing, selectedTopic, dispatch, handlePauseTopic } = useTopicList()

    if (!selectedTopic)
        return null;

    return (
        <AlertDialog open={showConfirmPause} onOpenChange={(open) => {
            if (!open) {
                dispatch({ type: 'CONFIRM_PAUSE_CLOSE' })
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to pause topic: <span className="font-semibold">{selectedTopic.topicCode}</span>?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button 
                        disabled={isPausing}
                        size="sm" 
                        onClick={handlePauseTopic}>
                        { isPausing ? 'Processing...' : 'Confirm' }
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
