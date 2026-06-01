import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Replaces the TickerQ per-topic scheduled jobs: a periodic sweep that
// activates scheduled topics and completes topics past their end date.
crons.interval(
  "topic-lifecycle",
  { minutes: 15 },
  internal.topics.runLifecycle,
  {},
);

export default crons;
