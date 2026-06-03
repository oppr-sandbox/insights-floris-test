'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserDetails } from "@/providers/UserContextProvider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, RotateCw, Send, Trash2 } from "lucide-react";

export default function InsightActions({
    insightId,
    status,
    label,
}: {
    insightId: string;
    status: string;
    label?: string;
}) {
    const router = useRouter();
    const { tenant, hasPermission } = useUserDetails();

    const publish = useMutation(api.insights.publish);
    const remove = useMutation(api.insights.remove);
    const updateLabel = useMutation(api.insights.updateLabel);
    const regenerate = useMutation(api.insights.regenerate);

    const [publishOpen, setPublishOpen] = useState(false);
    const [noteOpen, setNoteOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [labelVal, setLabelVal] = useState(label ?? "");
    const [busy, setBusy] = useState(false);

    if (!hasPermission("insights:manage")) return null;

    const id = insightId as Id<"insights">;
    const canDelete = status === "DRAFT" || status === "FAILED";

    const run = async (fn: () => Promise<unknown>, ok: string, onDone?: () => void) => {
        setBusy(true);
        try {
            await fn();
            toast.success(ok);
            onDone?.();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Action failed");
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            {status === "DRAFT" &&
                <Button size="sm" onClick={() => { setLabelVal(label ?? ""); setPublishOpen(true); }}>
                    <Send className="size-4" /> Publish
                </Button>
            }
            {status === "FAILED" &&
                <Button size="sm" variant="outline" disabled={busy}
                    onClick={() => run(() => regenerate({ id }), "Regenerating insight…")}>
                    {busy ? <Spinner className="size-4" /> : <RotateCw className="size-4" />} Regenerate
                </Button>
            }

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label="Insight actions">
                        <MoreVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {(status === "PUBLISHED" || status === "DRAFT") &&
                        <DropdownMenuItem onClick={() => { setLabelVal(label ?? ""); setNoteOpen(true); }}>
                            Edit note
                        </DropdownMenuItem>
                    }
                    {canDelete &&
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                            <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                    }
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Publish insight</DialogTitle>
                        <DialogDescription>
                            Published insights become visible to members on topics they&apos;re part of. Add an optional note to tell this snapshot apart.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="publish-note">Note (optional)</Label>
                        <Input id="publish-note" value={labelVal} onChange={(e) => setLabelVal(e.target.value)} placeholder="e.g. Post-recalibration snapshot" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPublishOpen(false)}>Cancel</Button>
                        <Button disabled={busy} onClick={() =>
                            run(() => publish({ id, label: labelVal.trim() || undefined }), "Insight published", () => setPublishOpen(false))
                        }>
                            {busy && <Spinner className="size-4" />} Publish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="edit-note">Note</Label>
                        <Input id="edit-note" value={labelVal} onChange={(e) => setLabelVal(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
                        <Button disabled={busy} onClick={() =>
                            run(() => updateLabel({ id, label: labelVal.trim() }), "Note saved", () => setNoteOpen(false))
                        }>
                            {busy && <Spinner className="size-4" />} Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this insight?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This permanently removes the insight. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() =>
                            run(() => remove({ id }), "Insight deleted", () => {
                                setDeleteOpen(false);
                                router.push(`/${tenant}/insights`);
                            })
                        }>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
