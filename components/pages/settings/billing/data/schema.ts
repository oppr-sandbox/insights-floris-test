export type BillingSubscription = {
  plan: string;
  interval: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  hasUsedTrial: boolean;
};

export type CheckoutResponse = {
  checkoutUrl: string;
};

export type PortalResponse = {
  portalUrl: string;
};

export type SubscriptionStatus =
  | "Incomplete"
  | "IncompleteExpired"
  | "Trialing"
  | "Active"
  | "PastDue"
  | "Canceled"
  | "Unpaid"
  | "Paused";
