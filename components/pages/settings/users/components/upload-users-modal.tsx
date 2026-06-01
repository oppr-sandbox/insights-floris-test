"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { initialValues, InviteUserInput, inviteUserSchema } from "../data/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function UploadUsersModal() {
    const form = useForm<InviteUserInput>({
        resolver: zodResolver(inviteUserSchema),
        defaultValues: initialValues,
        mode: "onChange"
    })

    return (
        <Dialog>
            <Form {...form}>
                <form>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline">
                            <Upload />
                            Upload Users
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[26rem]">
                        <DialogHeader>
                            <DialogTitle>Upload Users</DialogTitle>
                            <DialogDescription>
                                Select a .CSV file containing the list of users to be created.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            <div className="grid w-full max-w-sm items-center gap-3">
                                <Label htmlFor="csv">CSV</Label>
                                <Input id="csv" type="file" />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="button">Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </form>
            </Form>
        </Dialog>
    )
}