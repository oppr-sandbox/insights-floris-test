'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useForm } from 'react-hook-form'
import { initialValues, SetupAccountInput, setupAccountSchema } from './schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import PasswordInput from '@/components/password-input/password-input'
import { CircleCheck, CircleX } from 'lucide-react'
import { passwordCriteria } from './data'
import posthog from 'posthog-js'

export default function SetupAccountForm({ tenant, token }: { tenant: string; token: string; }) {

    const [state, setState] = useState({
        success: false,
        message: "",
        errors: null as any,
    });

    const form = useForm<SetupAccountInput>({
        resolver: zodResolver(setupAccountSchema),
        defaultValues: initialValues,
        mode: "onChange"
    })

    const { isValid } = form.formState;
    const password = form.watch("password");

    async function handleSubmit(formData: SetupAccountInput) {
        setState({ success: false, message: "", errors: null });

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invite/accept`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Tenant": tenant,
            },
            body: JSON.stringify({
                ...formData,
                token
            }),
        });

        if (!res.ok) {
            const error = await res.json();

            setState({
                success: false,
                message: error?.message ?? "Login failed",
                errors: error?.errors ?? null,
            });
            return;
        }
        
        posthog.capture('invite_accepted', { tenant });

        window.location.href = `/${tenant}/login`;

        setState({ success: true, message: "", errors: null });
    }

    return (

        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="grid gap-6">
                    {
                        !state?.success && state?.message && (
                            <Alert variant="destructive">
                                <AlertDescription>{state!.message}</AlertDescription>
                            </Alert>
                        )
                    }

                    <div className="grid gap-2">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <Label htmlFor="password">Password</Label>
                                    <FormControl>
                                        {/* <Input type="password" {...field} /> */}
                                        <PasswordInput {...field} />
                                    </FormControl>
                                    {/* <FormMessage /> */}
                                </FormItem>
                            )}
                        />

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
                    </div>

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <FormControl>
                                    {/* <Input type="password" {...field} /> */}
                                    <PasswordInput {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={form.formState.isSubmitting || !isValid} className="w-full">
                        {form.formState.isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}