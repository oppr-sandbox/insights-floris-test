"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProfileInput, profileSchema, ResetPasswordPayload } from "../data/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessages } from "@/components/ui/form";
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useProfileForm } from "../hooks/useProfileForm";
import moment from "moment";
import { useUserDetails } from "@/providers/UserContextProvider";
import { getAvatarUrl } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { roles } from "../../users/data/data";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Combobox } from "@/components/ui/combo-box";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorState from "@/components/ui/error-state";

export default function ProfileForm() {
    const { user, isLoading, error, refetch, updateUserAvatar } = useUserDetails();
    const [image, setImage] = useState<string | undefined>(getAvatarUrl(user.avatar, 'x160'));
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const {
        disciplines,
        locations,
        isSavingAvatar,
        uploadAvatarAsync,
        isSaving,
        updateProfileAsync,
        resetPasswordAsync
    } = useProfileForm();

    const form = useForm<ProfileInput>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user?.firstName ?? '',
            lastName: user?.lastName ?? '',
            phoneNumber: user?.phone ?? '',
            locationId: user?.locationId ?? '',
            disciplineId: user?.disciplineId ?? ''
        },
        mode: "onChange"
    });

    const { isDirty, isValid, dirtyFields } = form.formState;
    const hasChanges = Object.keys(dirtyFields).length > 0;

    const fullName = `${user.firstName} ${user.lastName}`
    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    const lastLoginDate = moment(user.lastLogin);
    const formattedLastLogin = `${lastLoginDate.fromNow()} (${lastLoginDate.format("MMM D, YYYY [at] h:mm A")})`;
    const role = roles.find((role) =>
        role.value.toUpperCase() === user.role.toUpperCase()
    )

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            const response = await uploadAvatarAsync(formData);
            if (response.avatar) {
                updateUserAvatar(response.avatar + `?v=${moment().toString()}`);
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                setImage(event.target?.result as string)
            }
        }
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleSaveClick = async () => {
        const formValues = form.getValues();

        const payload = profileSchema.parse({
            firstName: formValues.firstName.trim(),
            lastName: formValues.lastName.trim(),
            email: user.email.trim(),
            phoneNumber: formValues.phoneNumber ? formValues.phoneNumber.trim() : undefined,
            disciplineId: formValues.disciplineId ? formValues.disciplineId : undefined,
            locationId: formValues.locationId ? formValues.locationId : undefined,
        });

        await updateProfileAsync(payload);
        form.reset(payload);
        queryClient.invalidateQueries({
            queryKey: ['profile', 'me'],
            exact: true
        });
    }

    const handleChangePasswordClick = async () => {
        const request: ResetPasswordPayload = {
            email: user.email
        }
        try {
            await resetPasswordAsync(request);
            sessionStorage.setItem('resetCaller', 'true');
        } catch (error) { }
    }

    useEffect(() => {
        if (user) {
            form.reset({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phone ?? '',
                locationId: user.locationId ?? '',
                disciplineId: user.disciplineId ?? ''
            });
        }
    }, [form, user]);

    if (isLoading) return (
        <Skeleton className="h-80 bg-muted" />
    )

    if (error) return (
        <ErrorState
            title="User Profile Unavailable"
            message="We couldn't fetch your profile details. Please try again or contact support if the issue persists."
            action={refetch}
        />
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>
                    Manage your personal information and default location/discipline settings.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4 xl:flex-row">
                    <div className="flex flex-col items-center gap-2 mb-6 w-full xl:w-64">
                        <div className="relative w-30 h-30 md:w-40 md:h-40 group col-span-1">
                            {!isSavingAvatar && (
                                <>
                                    <Avatar
                                        className="w-full h-full rounded-full cursor-pointer"
                                        onClick={handleAvatarClick}
                                    >
                                        <AvatarImage src={image} alt={fullName} />
                                        <AvatarFallback className="rounded-full text-3xl">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                                        onClick={handleAvatarClick}
                                    >
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>

                                    <Input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </>
                            )}

                            {isSavingAvatar && (
                                <div className="absolute inset-0 flex items-center justify-center bg-primary/40 rounded-full">
                                    <Spinner variant="bars" size={60} />
                                </div>
                            )}
                        </div>
                        <h1>{user.email}</h1>
                        <Badge color={role?.color}>{role?.value}</Badge>
                    </div>
                    <div className="flex flex-col flex-1 gap-8">
                        <Form {...form}>
                            <form className="flex flex-col flex-1 gap-8 ">
                                <div className="flex flex-col gap-4">
                                    <h4 className="font-semibold">Profile Information</h4>
                                    <div className="grid xl:grid-cols-2 gap-4">
                                        <div className="h-full">
                                            <FormField
                                                control={form.control}
                                                name="firstName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label htmlFor="firstName">First Name</Label>
                                                        <FormControl>
                                                            <Input {...field} readOnly={isLoading || isSaving} />
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
                                                        <Label htmlFor="lastName">Last Name</Label>
                                                        <FormControl>
                                                            <Input {...field} readOnly={isLoading || isSaving} />
                                                        </FormControl>
                                                        <FormMessages />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="h-full">
                                            <FormField
                                                control={form.control}
                                                name="phoneNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                                        <FormControl>
                                                            <Input {...field} readOnly={isLoading || isSaving} />
                                                        </FormControl>
                                                        <FormMessages />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <h4 className="font-semibold">Topic Configuration</h4>
                                    <div className="grid xl:grid-cols-2 gap-4">
                                        <div className="h-full">
                                            <FormField
                                                control={form.control}
                                                name="locationId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label htmlFor="locationId">Default Location</Label>
                                                        <FormControl>
                                                            <Combobox
                                                                placeholder="Select location..."
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                disabled={isLoading || isSaving}
                                                                items={locations?.map(loc => ({
                                                                    value: loc.id,
                                                                    label: `${loc.code} - ${loc.name}`,
                                                                })) ?? []}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            This will be your default location for creating topics.
                                                        </FormDescription>
                                                        <FormMessages />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="h-full">
                                            <FormField
                                                control={form.control}
                                                name="disciplineId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Label htmlFor="disciplineId">Default Discipline</Label>
                                                        <FormControl>
                                                            <Combobox
                                                                placeholder="Select discipline..."
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                disabled={isLoading || isSaving}
                                                                items={disciplines?.map(disc => ({
                                                                    value: disc.id,
                                                                    label: `${disc.code} - ${disc.name}`,
                                                                })) ?? []}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            This will be your default discipline for creating topics.
                                                        </FormDescription>
                                                        <FormMessages />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-row lg:flex-row justify-end md:items-center lg:items-center gap-2 mt-8">
                                    <ConfirmationDialog
                                        title="Save Profile Changes"
                                        description="Do you want to save the updates to your profile?"
                                        triggerButton={(
                                            <Button type="button"
                                                disabled={isSaving || (isDirty && !isValid) || !hasChanges}>
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        )}
                                        actionButtonText="Save"
                                        onActionButtonClicked={handleSaveClick}
                                    />
                                </div>
                            </form>

                        </Form>

                        <div className="flex flex-col gap-4">
                            <div>
                                <CardTitle>Security</CardTitle>
                                <CardDescription>
                                    Keep your account secure by updating your password.
                                </CardDescription>
                            </div>
                            <div className="flex flex-col xl:flex-row xl:items-center gap-2">
                                <ConfirmationDialog
                                    title="Confirm Change Password"
                                    description="This will send an email containing instructions on how to reset your password. Are you sure you want to proceed?"
                                    triggerButton={(
                                        <Button type="button">
                                            Change Password
                                        </Button>
                                    )}
                                    actionButtonText="Confirm"
                                    onActionButtonClicked={handleChangePasswordClick}
                                />
                            </div>
                            <div className="flex flex-col items-end text-sm text-muted-foreground font-normal">
                                Last Login: {formattedLastLogin}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}