"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { initialValues, InviteUserInput, inviteUserSchema } from "../data/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessages } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useInviteUserForm } from "../hooks/useInviteUserForm";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roles } from "../data/data";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { toast } from "@/components/ui/sonner";
import { useUserDetails } from "@/providers/UserContextProvider";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default function InviteUserModal() {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const form = useForm<InviteUserInput>({
        resolver: zodResolver(inviteUserSchema),
        defaultValues: initialValues,
        mode: "onChange"
    })

    const { hasActiveSubscription } = useUserDetails();
    const { isSaving, inviteUserAsync } = useInviteUserForm();

    const handleOpenInviteUserClicked = () => {
        setIsOpen(true);
        form.reset();
        form.clearErrors();
    }

    const handleSaveClicked = async () => {
        const formValues = form.getValues();
        const payload = inviteUserSchema.parse({
            firstName: formValues.firstName.trim(),
            lastName: formValues.lastName.trim(),
            email: formValues.email.trim(),
            role: formValues.role
        });

        toast.promise(inviteUserAsync(payload), {
            loading: "Sending invitation email...",
        });
        form.reset();
        form.clearErrors();
        setIsOpen(false);
    }

    if (!hasActiveSubscription) {
        return <UpgradePrompt action="invite users" />;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <Form {...form}>
                <form>
                    <DialogTrigger asChild>
                        <Button type="button" onClick={handleOpenInviteUserClicked}>
                            <UserPlus />
                            Invite User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[45rem]">
                        <DialogHeader>
                            <DialogTitle>Invite User</DialogTitle>
                            <DialogDescription>
                                Enter the required information to add a new user.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-full">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label htmlFor="firstName">
                                                <div className="flex items-center">
                                                    First Name<span className="text-destructive">*</span>
                                                </div>
                                            </Label>
                                            <FormControl>
                                                <Input {...field} autoComplete="off" />
                                            </FormControl>
                                            <FormMessages />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="h-full">
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label htmlFor="lastName">
                                                <div className="flex items-center">
                                                    Last Name<span className="text-destructive">*</span>
                                                </div>
                                            </Label>
                                            <FormControl>
                                                <Input {...field} autoComplete="off" />
                                            </FormControl>
                                            <FormMessages />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="h-full">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label htmlFor="email">
                                                <div className="flex items-center">
                                                    Email<span className="text-destructive">*</span>
                                                </div>
                                            </Label>
                                            <FormControl>
                                                <Input {...field} autoComplete="off" />
                                            </FormControl>
                                            <FormMessages />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="h-full">
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label htmlFor="role">Role</Label>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl className="w-full">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select role" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="w-full">
                                                        {roles
                                                            .filter(role => role.value !== 'OWNER')
                                                            .map(role =>
                                                                <SelectItem key={role.value} value={role.value}>
                                                                    {role.value}
                                                                </SelectItem>
                                                            )}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessages />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <ConfirmationDialog
                                title="Send Invitation"
                                description="Are you sure you want to invite this user? They will receive an email with instructions to join."
                                triggerButton={(
                                    <Button type="button"
                                        disabled={isSaving || !form.formState.isDirty || !form.formState.isValid}>
                                        {isSaving ? 'Saving...' : 'Invite'}
                                    </Button>
                                )}
                                actionButtonText="Confirm"
                                onActionButtonClicked={handleSaveClicked}
                            />
                        </DialogFooter>
                    </DialogContent>
                </form>
            </Form>
        </Dialog>
    )
}