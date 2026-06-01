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

export default function ConfirmationGenerateInsightDialog() {

    const { showConfirmGenerateInsight, isGeneratingInsight, selectedTopic, dispatch, handleGenerateInsight } = useTopicList()

    if (!selectedTopic)
        return null;

    return (
        <AlertDialog open={showConfirmGenerateInsight} onOpenChange={(open) => {
            if (!open) {
                dispatch({ type: 'CONFIRM_GENERATE_INSIGHT_CLOSE' })
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to generate insights for the selected topic?: <span className="font-semibold">{selectedTopic.topicCode}</span>?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                        disabled={isGeneratingInsight}
                        size="sm"
                        onClick={handleGenerateInsight}>
                        {isGeneratingInsight ? 'Generating...' : 'Confirm'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
