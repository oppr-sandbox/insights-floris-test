export const passwordCriteria = [
  "At least 8 characters long",
  "At least one uppercase letter",
  "At least one lowercase letter",
  "At least one number",
  "At least one special character",
];

export const plans = [
  { key: "idea_starter_monthly" as const, label: "Idea Starter", price: "€299", interval: "/month", description: "Core feedback collection and AI insights" },
  { key: "idea_engine_monthly" as const, label: "Idea Engine", price: "€899", interval: "/month", description: "Advanced analytics, priority support, full platform access" },
];
