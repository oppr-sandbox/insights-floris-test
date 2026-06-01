"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessages,
} from "@/components/ui/form";

import { emailSchema, EmailInput } from "./schemas";

type Organization = { slug: string; name: string };

type Step = "email" | "pick-org";

export default function LoginFlow() {
  const [step, setStep] = useState<Step>("email");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  function redirectToTenantLogin(org: Organization) {
    window.location.href = `/${org.slug}/login?email=${encodeURIComponent(email)}`;
  }

  async function handleEmailSubmit(data: EmailInput) {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/authentication/organizations?email=${encodeURIComponent(data.email)}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const result = await res.json();
      const organizations: Organization[] = result.organizations ?? [];
      setEmail(data.email);

      if (organizations.length === 0) {
        setError("No organizations found for this email address.");
        return;
      }

      if (organizations.length === 1) {
        redirectToTenantLogin(organizations[0]);
        return;
      }

      setOrgs(organizations);
      setStep("pick-org");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    setError("");
    setStep("email");
    setOrgs([]);
  }

  if (step === "email") {
    return (
      <Form {...emailForm}>
        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
          <div className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">Email</Label>
                  <FormControl>
                    <Input
                      placeholder="you@company.com"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessages />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={emailForm.formState.isSubmitting || loading}
            >
              {emailForm.formState.isSubmitting || loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding organizations...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <div className="grid gap-4">
      <Button variant="ghost" size="sm" className="w-fit" onClick={goBack}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>
      <p className="text-sm text-muted-foreground">
        Select an organization for <span className="font-medium">{email}</span>
      </p>
      <div className="grid gap-2">
        {orgs.map((org) => (
          <button
            key={org.slug}
            type="button"
            onClick={() => redirectToTenantLogin(org)}
            className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
          >
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{org.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
