import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useInsightList } from "../hooks/useInsightList";

export default function ConfirmationPublishDialog() {

    const {
        selectedInsight,
        showConfirmPublish,
        editNoteMode,
        isPublishing,
        dispatch,
        handlePublishInsight,
        handleSaveNote,
    } = useInsightList();

    const [note, setNote] = useState("");

    useEffect(() => {
        if (showConfirmPublish) {
            setNote(selectedInsight?.label ?? "");
        }
    }, [showConfirmPublish, selectedInsight]);

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
                    <AlertDialogTitle>
                        {editNoteMode ? "Edit insight note" : "Publish Insight"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-foreground">
                        {editNoteMode
                            ? "Update the tag/note for this insight."
                            : "Review the details and add an optional note before making this insight visible to all members."}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="rounded-lg border bg-muted/30 p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="col-span-2">
                        <div className="text-xs text-muted-foreground">Insight ID</div>
                        <div className="font-mono font-medium">{selectedInsight.insightCode}</div>
                    </div>
                    <div className="col-span-2">
                        <div className="text-xs text-muted-foreground">Topic</div>
                        <div className="font-medium">{selectedInsight.topicName}</div>
                        <div className="text-xs text-muted-foreground">{selectedInsight.topicCode}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Contributors</div>
                        <div className="font-medium">{selectedInsight.respondentsCount}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Feedback items</div>
                        <div className="font-medium">{selectedInsight.feedbackCount}</div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="insight-note" className="text-sm">
                        Note / tag <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Textarea
                        id="insight-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. 'Focus on labeller fix' or a recommendation — helps tell apart multiple insights for the same topic."
                        className="h-24"
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                        disabled={isPublishing}
                        size="sm"
                        onClick={() =>
                            editNoteMode
                                ? handleSaveNote(note)
                                : handlePublishInsight(note)
                        }>
                        {isPublishing
                            ? (editNoteMode ? 'Saving...' : 'Publishing...')
                            : (editNoteMode ? 'Save note' : 'Publish')}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
