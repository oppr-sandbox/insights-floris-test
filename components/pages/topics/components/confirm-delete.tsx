import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useTopicList } from "./hooks/useTopicList";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ConfirmationDeleteDialog() {

    const [text, setText] = useState('');
    const {
        selectedTopic,
        showConfirmDelete,
        isDeleting,
        dispatch,
        handleDeleteTopic
    } = useTopicList();

    if (!selectedTopic)
        return null;

    const renderMessageContent = () => {
        if (selectedTopic.totalFeedbacksCount > 0) {
            return (
                <>
                    <p>There are <span className="font-semibold">{selectedTopic.totalFeedbacksCount}</span> feedbacks also connected to the topic, as well as insights.</p>
                    <p>Better to Archive a topic for later use.</p>
                    <p className="mt-4">Otherwise type <span className="font-semibold">{selectedTopic.topicCode}</span> to confirm deletion.</p>
                </>
            )
        }
        else {
            return (
                <p>Please type <span className="font-semibold">{selectedTopic.topicCode}</span> to confirm deletion.</p>
            )
        }
    }

    return (
        <AlertDialog open={showConfirmDelete} onOpenChange={(open) => {
            if (!open) {
                dispatch({ type: 'CONFIRM_DELETE_CLOSE' })
                setText('')
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                    <AlertDialogDescription className="text-foreground">
                        Are you sure you want to delete topic: <span className="font-semibold">{selectedTopic.topicCode}</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-1 text-sm">
                        {renderMessageContent()}
                    </div>
                    <div>
                        <Input
                            value={text}
                            onChange={(e) => setText(e.currentTarget.value)}
                            type="text"
                            placeholder="Type the topic code here.." />
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                        disabled={text !== selectedTopic.topicCode || isDeleting}
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteTopic}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
