'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"
import { setMultipleErrors } from "@/utils/helpers/helpers"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormMessages } from "@/components/ui/form"
import PasswordInput from "@/components/password-input/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { LoginInput, loginSchema } from "./schema"
import posthog from "posthog-js"

export default function LoginForm({ tenant, defaultEmail } : { tenant: string; defaultEmail?: string }) {

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail ?? "", password: "" },
    mode: "onBlur",
  });

  const [state, setState] = useState({
    success: false,
    message: "",
    errors: null as any,
  });

  useEffect(() => {
    if (state.errors) {
      setMultipleErrors(form.setError, state.errors);
    }
    if (state.success) {
      window.location.href = `/${tenant}/dashboard`;
    }
  }, [state]);

  async function handleSubmit(formData: LoginInput) {

    setState({ success: false, message: "", errors: null });

    try {
        
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/authentication/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant": tenant,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();

        posthog.capture('user_login_failed', {
          tenant,
          reason: error?.message ?? 'Login failed',
        });

        setState({
          success: false,
          message: error?.message ?? "Login failed",
          errors: error?.errors ?? null,
        });

        return;
      }

      posthog.capture('user_logged_in', { tenant });

      setState({ success: true, message: "", errors: null });
    }
    catch (error) {
      posthog.captureException(error);
      setState({
        success: false,
        message: "Login failed",
        errors: { message: "Internal server error" },
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid gap-6">
                <div className="grid gap-6">
                  {
                    state.message && (
                      <Alert variant="destructive">
                        <AlertDescription>{state.message}</AlertDescription>
                      </Alert>
                    )
                  }

                  <div className="grid gap-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="email">Email</Label>
                          <FormControl>
                            <Input autoFocus={!defaultEmail} {...field} />
                          </FormControl>
                          <FormMessages />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="password">Password</Label>
                          <FormControl>
                            <PasswordInput type="password" autoFocus={!!defaultEmail} {...field} />
                          </FormControl>
                          <FormMessages />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Link href={`/${tenant}/forgot-password`}
                    className="ml-auto text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </Link>

                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    {form.formState.isSubmitting ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="flex items-center justify-center">
        <span className="font-normal">Powered by</span>
        <Link href="https://www.oppr.ai" target="_blank" className="ms-1 font-semibold text-primary">Oppr.ai</Link>
      </div>
    </div>
  )
}
