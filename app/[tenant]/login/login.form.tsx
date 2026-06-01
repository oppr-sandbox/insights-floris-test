'use client'

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuthActions } from "@convex-dev/auth/react"

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
import { Alert, AlertDescription } from "@/components/ui/alert"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type LoginInput = z.infer<typeof schema>;

export default function LoginForm({ defaultEmail }: { tenant: string; defaultEmail?: string }) {
  const { signIn } = useAuthActions();

  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail ?? "" },
    mode: "onBlur",
  });

  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit({ email }: LoginInput) {
    setError("");
    try {
      await signIn("magic-link", { email });
      setSentTo(email);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not send the sign-in link. Please try again."
      );
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We sent a sign-in link to <span className="font-medium">{sentTo}</span>.
              Click it to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="outline" onClick={() => setSentTo(null)}>
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome to Oppr Insights</CardTitle>
          <CardDescription>
            Sign in with your @oppr.ai email — we&apos;ll email you a magic link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid gap-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="email">Email</Label>
                        <FormControl>
                          <Input
                            autoFocus
                            placeholder="you@oppr.ai"
                            {...field}
                          />
                        </FormControl>
                        <FormMessages />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting ? "Sending link..." : "Send magic link"}
                </Button>
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
