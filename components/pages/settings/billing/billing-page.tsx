"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useBilling } from "./hooks/useBilling";
import type { SubscriptionStatus } from "./data/schema";

const IDEA_STARTER_FEATURES = [
  "Core feedback collection",
  "AI-powered insights",
  "Up to 10 topics",
  "Email support",
];

const IDEA_ENGINE_FEATURES = [
  "Everything in Idea Starter",
  "Unlimited topics",
  "Advanced analytics",
  "Priority support",
  "Team collaboration tools",
  "Custom integrations",
];

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const variants: Record<SubscriptionStatus, { label: string; className: string }> = {
    Active: { label: "Active", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    Trialing: { label: "Trial", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    PastDue: { label: "Past Due", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    Canceled: { label: "Canceled", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    Incomplete: { label: "Incomplete", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    IncompleteExpired: { label: "Expired", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    Unpaid: { label: "Unpaid", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    Paused: { label: "Paused", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  };

  const variant = variants[status] ?? variants.Active;

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getPlanDisplayName(plan: string | undefined) {
  switch (plan) {
    case "idea_starter": return "Idea Starter";
    case "idea_engine": return "Idea Engine";
    default: return "No Plan";
  }
}

export function BillingPage() {
  const searchParams = useSearchParams();
  const {
    subscription,
    isLoading,
    createCheckout,
    isCheckoutLoading,
    createPortal,
    isPortalLoading,
    refetch,
    invalidateAll,
  } = useBilling();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Subscription updated", {
        description: "Your plan has been upgraded successfully.",
      });
      refetch();
    }
  }, [searchParams, refetch]);

  useEffect(() => {
    if (searchParams.get("portal") === "updated") {
      toast.success("Billing updated", {
        description: "Your billing changes have been saved.",
      });
      invalidateAll();
    }
  }, [searchParams, invalidateAll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const isIdeaStarter = subscription?.plan === "idea_starter";
  const isIdeaEngine = subscription?.plan === "idea_engine";
  const hasActivePlan = isIdeaStarter || isIdeaEngine;
  const hasNoPlan = !hasActivePlan;
  const isPastDue = subscription?.status === "PastDue";
  const isCanceled = subscription?.status === "Canceled";
  const isTrialing = subscription?.status === "Trialing";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {isPastDue && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Payment failed</p>
              <p className="text-sm text-muted-foreground">
                Your last payment was unsuccessful. Please update your payment
                method to continue using your plan features.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => createPortal()}
              disabled={isPortalLoading}
            >
              {isPortalLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {getPlanDisplayName(subscription?.plan)}
              </CardDescription>
            </div>
            {subscription && <StatusBadge status={subscription.status} />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasActivePlan && !isCanceled && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Billing period</span>
                <span className="capitalize">{subscription?.interval}</span>
              </div>
              {subscription?.currentPeriodEnd && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {subscription.cancelAtPeriodEnd
                      ? "Access until"
                      : "Next billing date"}
                  </span>
                  <span>{formatDate(subscription.currentPeriodEnd)}</span>
                </div>
              )}
              {isTrialing && subscription?.trialEnd && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trial ends</span>
                  <span>{formatDate(subscription.trialEnd)}</span>
                </div>
              )}
              {subscription?.cancelAtPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  Your subscription will be canceled at the end of the current
                  billing period.
                </p>
              )}
            </>
          )}
        </CardContent>
        {hasActivePlan && !isCanceled && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => createPortal()}
              disabled={isPortalLoading}
            >
              {isPortalLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Manage Subscription
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>

      {(hasNoPlan || isCanceled) && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">Choose a Plan</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <PricingCard
                title="Idea Starter"
                price="€299"
                interval="month"
                features={IDEA_STARTER_FEATURES}
                onSelect={() =>
                  createCheckout({ priceLookupKey: "idea_starter_monthly" })
                }
                isLoading={isCheckoutLoading}
                hasUsedTrial={subscription?.hasUsedTrial}
              />
              <PricingCard
                title="Idea Engine"
                price="€899"
                interval="month"
                features={IDEA_ENGINE_FEATURES}
                badge="Most Popular"
                onSelect={() =>
                  createCheckout({ priceLookupKey: "idea_engine_monthly" })
                }
                isLoading={isCheckoutLoading}
                hasUsedTrial={subscription?.hasUsedTrial}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PricingCard({
  title,
  price,
  interval,
  features,
  badge,
  onSelect,
  isLoading,
  hasUsedTrial,
}: {
  title: string;
  price: string;
  interval: string;
  features: string[];
  badge?: string;
  onSelect: () => void;
  isLoading: boolean;
  hasUsedTrial?: boolean;
}) {
  return (
    <Card className="relative">
      {badge && (
        <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground">
          {badge}
        </Badge>
      )}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold text-foreground">{price}</span>
          <span className="text-muted-foreground">/{interval}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onSelect} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CreditCard className="mr-2 h-4 w-4" />
          {hasUsedTrial ? "Subscribe" : "Start Free Trial"}
        </Button>
      </CardFooter>
    </Card>
  );
}
