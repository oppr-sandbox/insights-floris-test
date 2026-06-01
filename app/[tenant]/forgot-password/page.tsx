"use client"

import { ForgotPasswordInput, forgotPasswordSchema, initialValues } from "@/components/pages/forgot-password/data/schema";
import { RequestPasswordResetPayload, ResetPasswordType } from "@/components/pages/reset-password/data/schema";
import { useResetPassword } from "@/components/pages/reset-password/hooks/useResetPassword";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormMessages } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

export default function ForgotPasswordPage() {
    const [seconds, setSeconds] = useState<number>(0);
    const [disabled, setDisabled] = useState<boolean>(false);

    const form = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: initialValues,
        mode: "onChange",
    })

    const {
        isPendingRequest,
        isSuccessRequest,
        requestPasswordResetAsync
    } = useResetPassword();

    const handleSendVerificationClick = async () => {
        const email = form.getValues("email").trim();

        if (!email) {
            form.setError("email", { message: "Enter your email address." });
            return;
        }

        const payload: RequestPasswordResetPayload = {
            email,
            type: ResetPasswordType.ForgotPassword,
        };

        if (await requestPasswordResetAsync(payload)) {
            setSeconds(60);
        }
    }

    useEffect(() => {
        if (seconds <= 0) {
            setDisabled(false);
            return;
        }

        setDisabled(true);
        const interval = setInterval(() => {
            setSeconds(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [seconds]);

    return (
        <div className="flex flex-col flex-1 h-[100vh] items-center justify-center">
            <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
                <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                    <div className="flex flex-col justify-center lg:w-1/2">
                        <h2 className="mb-2 text-3xl font-bold tracking-tight">Account Recovery</h2>
                        <p className="text-muted-foreground mb-6">Securely reset your password in three simple steps. We'll email you a secure link to verify your identity and help you set a new password for your account.</p>

                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium">1</div>
                                <div>
                                    <h3 className="font-medium">Enter Email</h3>
                                    <p className="text-muted-foreground text-sm">Provide your account email address</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-primary/20 text-primary flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium">2</div>
                                <div>
                                    <h3 className="font-medium">Check Your Email</h3>
                                    <p className="text-muted-foreground text-sm">Open the password reset link we sent</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-primary/20 text-primary flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium">3</div>
                                <div>
                                    <h3 className="font-medium">New Password</h3>
                                    <p className="text-muted-foreground text-sm">Create a new secure password</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:w-1/2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div data-slot="card-title" className="font-semibold text-2xl">Reset Password</div>
                                        <div data-slot="card-description" className="text-muted-foreground text-sm">Secure your account with a new password</div>
                                    </div>
                                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                                        <Lock />
                                    </div></div>
                                <Separator className="mt-6" />
                            </CardHeader>
                            <CardContent>
                                <FormProvider {...form}>
                                    <form
                                        className="space-y-4"
                                        action={handleSendVerificationClick}>
                                        <Alert variant="info">
                                            <AlertDescription>
                                                Enter the email address associated with your account. We'll send you a link to reset your password.
                                            </AlertDescription>
                                        </Alert>
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Label htmlFor="email">Email Address</Label>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            onChange={field.onChange}
                                                            disabled={disabled}
                                                            id="email"
                                                            placeholder="name@example.com" />
                                                    </FormControl>
                                                    <FormMessages />
                                                </FormItem>
                                            )}
                                        />
                                        {isSuccessRequest && seconds > 0 &&
                                            <CardDescription>You can resend verification email in {seconds} seconds.</CardDescription>
                                        }
                                        <Button
                                            className="w-full"
                                            type="button"
                                            disabled={disabled}
                                            onClick={handleSendVerificationClick}>
                                            {isPendingRequest ? "Sending..." : "Send Verification Email"} <ArrowRight />
                                        </Button>
                                    </form>
                                </FormProvider>
                            </CardContent>
                            <CardFooter className="flex justify-center items-center">
                                <p className="text-muted-foreground text-sm">
                                    Remember your password? <Link href="/login" className="text-primary font-medium">Sign in</Link>
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}