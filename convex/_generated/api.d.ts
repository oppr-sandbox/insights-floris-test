/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as analysisGuided from "../analysisGuided.js";
import type * as analysisReports from "../analysisReports.js";
import type * as auth from "../auth.js";
import type * as cleanup from "../cleanup.js";
import type * as company from "../company.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as disciplines from "../disciplines.js";
import type * as feedback from "../feedback.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as ingestion from "../ingestion.js";
import type * as insightLab from "../insightLab.js";
import type * as insights from "../insights.js";
import type * as lenses from "../lenses.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_codes from "../lib/codes.js";
import type * as locations from "../locations.js";
import type * as notifications from "../notifications.js";
import type * as reference from "../reference.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as topicExport from "../topicExport.js";
import type * as topicUpload from "../topicUpload.js";
import type * as topics from "../topics.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  analysisGuided: typeof analysisGuided;
  analysisReports: typeof analysisReports;
  auth: typeof auth;
  cleanup: typeof cleanup;
  company: typeof company;
  crons: typeof crons;
  dashboard: typeof dashboard;
  disciplines: typeof disciplines;
  feedback: typeof feedback;
  files: typeof files;
  http: typeof http;
  ingestion: typeof ingestion;
  insightLab: typeof insightLab;
  insights: typeof insights;
  lenses: typeof lenses;
  "lib/auth": typeof lib_auth;
  "lib/codes": typeof lib_codes;
  locations: typeof locations;
  notifications: typeof notifications;
  reference: typeof reference;
  seed: typeof seed;
  sessions: typeof sessions;
  topicExport: typeof topicExport;
  topicUpload: typeof topicUpload;
  topics: typeof topics;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
