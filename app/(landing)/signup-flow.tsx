"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, CircleX, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormMessages,
} from "@/components/ui/form";
import PasswordInput from "@/components/password-input/password-input";
import { cn } from "@/lib/utils";

import { signupSchema, SignupInput } from "./schemas";
import { passwordCriteria, plans } from "./data";

export default function SignupFlow() {
  const [error, setError] = useState("");

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      companyName: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      plan: "idea_starter_monthly",
    },
    mode: "onChange",
  });

  const password = form.watch("password");
  const selectedPlan = form.watch("plan");

  async function handleSubmit(data: SignupInput) {
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/registration/checkout`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: data.companyName,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            priceLookupKey: data.plan,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();

        if (err?.errors) {
          const entries = Object.entries(err.errors) as [string, string[]][];
          for (const [field, messages] of entries) {
            const fieldName = field.toLowerCase();
            if (fieldName in form.getValues()) {
              form.setError(fieldName as keyof SignupInput, {
                message: messages[0],
              });
            }
          }
          if (!entries.some(([f]) => f.toLowerCase() in form.getValues())) {
            setError(err?.message ?? "Registration failed.");
          }
          return;
        }

        setError(err?.message ?? "Registration failed.");
        return;
      }

      const result = await res.json();
      window.location.href = result.checkoutUrl;
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  function checkCriteria(criteria: string): boolean {
    if (!password) return false;
    switch (criteria) {
      case "At least 8 characters long":
        return password.length >= 8;
      case "At least one uppercase letter":
        return /[A-Z]/.test(password);
      case "At least one lowercase letter":
        return /[a-z]/.test(password);
      case "At least one number":
        return /\d/.test(password);
      case "At least one special character":
        return /[^A-Za-z0-9]/.test(password);
      default:
        return false;
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <Label>Organization Name</Label>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} />
                </FormControl>
                <FormMessages />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <Label>First Name</Label>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessages />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <Label>Last Name</Label>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessages />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <Label>Email</Label>
                <FormControl>
                  <Input placeholder="you@company.com" {...field} />
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
                <Label>Password</Label>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-1">
            <ul className="space-y-1">
              {passwordCriteria.map((criteria) => (
                <li key={criteria} className="flex items-center gap-1">
                  {checkCriteria(criteria) ? (
                    <CircleCheck className="text-success" size={15} />
                  ) : (
                    <CircleX className="text-destructive" size={15} />
                  )}
                  <span className="text-sm">{criteria}</span>
                </li>
              ))}
            </ul>
          </div>

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <Label>Confirm Password</Label>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plan"
            render={({ field }) => (
              <FormItem>
                <Label>Plan</Label>
                <div className="grid gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => field.onChange(plan.key)}
                      className={cn(
                        "flex items-center justify-between rounded-md border p-3 text-left text-sm transition-colors",
                        selectedPlan === plan.key
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div>
                        <span className="font-medium">{plan.label}</span>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {plan.description}
                        </p>
                      </div>
                      <span className="font-semibold whitespace-nowrap">
                        {plan.price}
                        <span className="text-muted-foreground font-normal text-xs">
                          {plan.interval}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              "Continue to Checkout"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
