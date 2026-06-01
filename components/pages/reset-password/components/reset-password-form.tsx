"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessages } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { passwordCriteria } from "../data/data"
import { CircleCheck, CircleX } from "lucide-react"
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog"
import PasswordInput from "@/components/password-input/password-input"
import { redirect } from "next/navigation"
import { useResetPassword } from "../hooks/useResetPassword"
import Img from "next/image"
import { initialValues, ResetPasswordInput, ResetPasswordPayload, resetPasswordSchema } from "../data/schema"

export default function ResetPassswordForm({ tenant, accessToken, refreshToken }: { 
    tenant: string, 
    accessToken: string, 
    refreshToken: string 
}) {

    const { isSaving, resetPasswordAsync } = useResetPassword();

    const form = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: initialValues,
        mode: "onChange",
    });

    const password = form.watch("newPassword");

    const handleResetPasswordClicked = async () => {
        const { newPassword } = form.getValues();

        const payload: ResetPasswordPayload = {
            newPassword,
            accessToken,
            refreshToken
        }

        if (await resetPasswordAsync(payload)) {
            form.reset();
            form.clearErrors();

            setTimeout(() => {
                redirect(`/${tenant}/login`);
            }, 2000);
        }
    }

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="#" className="flex items-center gap-2 self-center">
                    <Img
                        src="/logo.png"
                        alt="Oppr Logo"
                        className="size-8"
                        width={80}
                        height={80}
                    />
                    <div className="text-card-foreground font-bold text-xl">Oppr Insights</div>
                </a>
                <div className="flex flex-col gap-6">
                    <Card className="gap-2">
                        <CardHeader>
                            <CardTitle className="text-center text-lg">Reset Password</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form>
                                    <div className="flex gap-8">
                                        <div className="w-full">
                                            <div className="grid gap-4">
                                                <div className="h-full">
                                                    <FormField
                                                        control={form.control}
                                                        name="newPassword"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <Label htmlFor="newPassword">New Password</Label>
                                                                <FormControl>
                                                                    <PasswordInput {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex flex-col flex-1 gap-1">
                                                    <div className="text-base">Your password must contain:</div>
                                                    <div>
                                                        <ul>
                                                            {passwordCriteria.map((criteria) => {
                                                                let passed = false;

                                                                if (password) {
                                                                    if (criteria === "At least 8 characters long") {
                                                                        passed = password.length >= 8;
                                                                    }
                                                                    if (criteria === "At least one uppercase letter") {
                                                                        passed = /[A-Z]/.test(password);
                                                                    }
                                                                    if (criteria === "At least one lowercase letter") {
                                                                        passed = /[a-z]/.test(password);
                                                                    }
                                                                    if (criteria === "At least one number") {
                                                                        passed = /\d/.test(password);
                                                                    }
                                                                    if (criteria === "At least one special character") {
                                                                        passed = /[^A-Za-z0-9]/.test(password);
                                                                    }
                                                                }

                                                                return (
                                                                    <li key={criteria} className="flex items-center gap-1">
                                                                        {passed ? (
                                                                            <CircleCheck className="text-success" size={15} />
                                                                        ) : (
                                                                            <CircleX className="text-destructive" size={15} />
                                                                        )}

                                                                        <span className="text-sm">
                                                                            {criteria}
                                                                        </span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div className="h-full">
                                                    <FormField
                                                        control={form.control}
                                                        name="confirmPassword"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                                                <FormControl>
                                                                    <PasswordInput {...field} />
                                                                </FormControl>
                                                                <FormMessages />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            <ConfirmationDialog
                                                title="Confirm Password Reset"
                                                description="Are you sure you want to reset your password? You'll need to use your new password the next time you log in."
                                                triggerButton={(
                                                    <Button
                                                        type="button"
                                                        className="w-full mt-4"
                                                        disabled={isSaving || !form.formState.isDirty || !form.formState.isValid}>
                                                        {isSaving ? 'Saving...' : 'Reset Password'}
                                                    </Button>
                                                )}
                                                actionButtonText="Confirm"
                                                onActionButtonClicked={handleResetPasswordClicked}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}