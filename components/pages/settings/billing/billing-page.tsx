"use client";

import { Check, CreditCard, Sparkles } from "lucide-react";
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

export function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 pt-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-medium">Billing is coming soon</p>
            <p className="text-sm text-muted-foreground">
              Subscriptions aren&apos;t available yet. The plans below are a
              preview of what&apos;s on the way.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Plans</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <PricingCard
            title="Idea Starter"
            price="€299"
            interval="month"
            features={IDEA_STARTER_FEATURES}
          />
          <PricingCard
            title="Idea Engine"
            price="€899"
            interval="month"
            features={IDEA_ENGINE_FEATURES}
            badge="Most Popular"
          />
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  interval,
  features,
  badge,
}: {
  title: string;
  price: string;
  interval: string;
  features: string[];
  badge?: string;
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
        <Button className="w-full" disabled>
          <CreditCard className="mr-2 h-4 w-4" />
          Coming soon
        </Button>
      </CardFooter>
    </Card>
  );
}
