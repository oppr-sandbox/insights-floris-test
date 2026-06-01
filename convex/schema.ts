import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";

// Multi-tenant application schema is built out in the "schema + auth/multi-tenancy
// core" phase. For now we only register Convex Auth's built-in tables so the
// deployment validates and the auth loop works end-to-end.
export default defineSchema({
  ...authTables,
});
