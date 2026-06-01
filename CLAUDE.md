# CLAUDE.md — opprinsights.web

Next.js 15 frontend using React 19, TypeScript, Tailwind CSS v4, and shadcn/ui.

This project uses **npm**, not yarn, pnpm, or bun.

## Development Commands

```bash
npm install                # Install dependencies
npm run dev                # Start dev server with Turbopack (http://localhost:3000)
npm run build              # Production build
npm run lint               # ESLint check
npm start                  # Start production server (after build)
```

### Adding shadcn/ui components
```bash
npx shadcn@latest add <component-name>
```

## Code Verification

- After making changes, run `npm run lint` to check for linting errors
- Then run `npm run build` to verify the project compiles
- If the build fails, fix the errors before considering the task done

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router (React 19, React Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with CSS custom properties (oklch color space, light/dark themes)
- **UI Components**: shadcn/ui (new-york style) with Lucide icons
- **Data Fetching**: TanStack Query v5 (React Query)
- **Forms**: React Hook Form v7 + Zod v4 validation
- **Rich Text Editor**: Lexical
- **Charts**: Recharts
- **Real-time**: SignalR (`@microsoft/signalr`)
- **AI**: Vercel AI SDK v5 + Google Gemini
- **Toasts**: Sonner

### Path Aliases
ALWAYS use `@/*` to import from the project root (e.g., `@/components/ui/button`, `@/lib/utils`).
NEVER use relative imports like `../../../../components/button`.

### Directory Structure

```
opprinsights.web/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (fonts, providers, toaster)
│   ├── globals.css               # Tailwind v4 + CSS custom properties
│   ├── manifest.ts               # PWA manifest
│   ├── providers/
│   │   └── ReactQueryProvider.tsx
│   ├── [tenant]/                 # All routes are tenant-scoped
│   │   ├── login/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── accept-invite/
│   │   └── (protected)/          # Route group requiring auth
│   │       ├── layout.tsx        # Protected layout (UserContext + Sidebar + Header)
│   │       ├── dashboard/
│   │       ├── topics/
│   │       ├── feedbacks/
│   │       ├── insights/
│   │       ├── notifications/
│   │       ├── ai-sandbox/
│   │       └── settings/
│   └── api/                      # Next.js Route Handlers (server-side AI calls)
│       ├── chat/route.ts         # Gemini streaming chat
│       ├── transcribe/route.ts   # Google Cloud Speech-to-Text
│       ├── translate/route.ts    # Gemini translation
│       └── formatText/route.ts   # Gemini Lexical node formatter
├── components/
│   ├── ui/                       # shadcn/ui primitives (NEVER modify manually)
│   ├── layout/                   # App shell: sidebar, header, nav, theme toggle
│   ├── ai-elements/              # AI chat UI components
│   ├── data-table/               # TanStack Table wrapper
│   ├── editor/                   # Full Lexical rich-text editor subsystem
│   ├── pages/                    # Feature-level page components
│   │   ├── dashboard/
│   │   ├── feedbacks/
│   │   ├── insights/
│   │   ├── notifications/
│   │   ├── reset-password/
│   │   └── settings/
│   │       └── topics/
│   ├── attachments/
│   ├── channels/
│   ├── confirmation-dialog/
│   ├── feedbacks/                # Shared feedback display components
│   └── password-input/
├── hooks/
│   └── use-mobile.ts             # useIsMobile() viewport hook
├── lib/
│   ├── auth.ts                   # Server-side cookie validation
│   ├── subdomains.ts             # Tenant subdomain resolution
│   └── utils.ts                  # cn(), getAvatarUrl(), urlToBlob()
├── providers/
│   ├── NotificationProvider.tsx  # SignalR connection context
│   └── UserContextProvider.tsx   # Current user, role, permissions
├── utils/
│   ├── api/createHttpClient.ts   # Fetch-based HTTP client with auto token refresh
│   ├── auth/permissions.ts       # Role-to-permission mapping
│   ├── exceptions/AuthErrors.ts  # ForbiddenError, UnauthorizedError
│   └── helpers/helpers.ts        # debounce, date formatting, cookie access, WAV encoding
├── middleware.ts                 # Route protection (cookie check) + tenant extraction
└── public/                       # Static assets (logos, favicons, PWA icons)
```

## Routing

All routes are under `[tenant]` — the tenant slug is the first URL segment (e.g., `/acme/dashboard`).

### Public routes (no auth required)
`login`, `forgot-password`, `reset-password`, `accept-invite`, `change-password`, `auth/logout`, `forbidden`, `not-found`

### Protected routes (require `access_token` cookie)
`dashboard`, `topics`, `topics/[code]`, `feedbacks`, `insights`, `insights/[code]`, `notifications`, `ai-sandbox`, `settings/*`

### Layout Hierarchy
```
Root layout (ReactQueryProvider, NotificationProvider, ThemeProvider, Toaster)
  └── [tenant] layout
        ├── Public auth pages (login, reset-password, etc.)
        └── (protected) layout (UserContextProvider, SidebarProvider, AppSidebar, SiteHeader)
              └── settings/ layout (NavSecondary settings menu)
```

## Component Patterns

### Feature-Folder Structure
Each feature under `components/pages/[feature]/` follows this pattern:
- `components/` — UI components (presentational, props-driven)
- `data/schema.ts` — TypeScript types + Zod schemas
- `data/data.ts` — Lookup tables, enum mappings
- `hooks/use[Feature].tsx` — Context provider + custom hook
- `[feature]-page.tsx` — Top-level page component

### Provider + Hook Pattern
Features with shared state use a React Context provider paired with a custom hook:
```tsx
// Provider wraps the feature page
<TopicDetailProvider topicCode={code}>
  <TopicDetailPage />
</TopicDetailProvider>

// Children consume via hook
const { topic, updateTopic, publishTopic } = useTopicDetail();
```

### State Management (no global state library)
| Layer | Technology |
|---|---|
| Server/async state | TanStack Query v5 |
| User/auth context | React Context (`UserContextProvider`) |
| Real-time connection | React Context (`NotificationProvider`) |
| Feature state | React Context + `useReducer` per feature |
| Local component state | `useState` / `useRef` |

## API Communication

### `createHttpClient` (`utils/api/createHttpClient.ts`)
Custom fetch wrapper used throughout the app:
- Reads tenant from `window.location.pathname`, sets `X-Tenant` header automatically
- Sends cookies with every request (`credentials: "include"`)
- On 401: auto-refreshes token via `POST /api/authentication/refresh`, then retries
- On refresh failure: redirects to `/{tenant}/login`
- Methods: `get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>`

```typescript
const httpClient = createHttpClient();
const topics = await httpClient.get<Topic[]>('/api/topics');
await httpClient.post('/api/topics', payload);
```

### Next.js API Routes (server-side)
AI-related calls go through Next.js Route Handlers which call Google APIs server-side:
- `POST /api/chat` — Gemini streaming chat
- `POST /api/transcribe` — Google Cloud Speech-to-Text
- `POST /api/translate` — Gemini translation
- `POST /api/formatText` — Gemini text formatting to Lexical nodes

## Authentication & Middleware

### `middleware.ts`
Runs on every non-static request:
1. Extracts tenant from first path segment
2. If no `access_token` cookie on a protected route → redirect to `/{tenant}/login`
3. If `access_token` exists on `/login` → redirect to `/{tenant}/dashboard`

The middleware only checks cookie existence, not validity. Actual validation happens server-side.

### Role-Based Access Control
- Roles: `OWNER`, `ADMIN`, `MEMBER`
- `UserContextProvider` exposes `allowedPages` and `hasPermission()` based on the user's role
- Sidebar nav items and UI elements are filtered by permissions
- Permission definitions are in `utils/auth/permissions.ts`

## Styling

- Tailwind CSS v4 with `@import "tailwindcss"` syntax (no `tailwind.config.js`)
- Theme uses oklch color space with light/dark mode via `next-themes` (class-based)
- Extended semantic tokens: `--success`, `--warning`, `--tertiary`
- Typography: Geist Sans + Geist Mono (via `next/font/google`)
- Class merging: `cn()` from `lib/utils.ts` (clsx + tailwind-merge)
- Variants: `class-variance-authority` (cva)

## Forms & Validation

All forms use React Hook Form + Zod:
```tsx
const form = useForm<T>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
  mode: "onBlur", // or "onChange"
});
```

Server-side validation errors are mapped to form fields via `setMultipleErrors()` from `utils/helpers/helpers.ts`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Client-visible backend API URL |
| `NEXT_PUBLIC_NOTIFICATION_URL` | SignalR hub URL |
| `PUBLIC_API_URL` | Server-side backend URL (for proxy rewrites in next.config.ts) |
| `FILE_URL` | GCS file proxy target URL |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Root domain for multi-tenant routing |
| `GEMINI_API_KEY` | Google Gemini API key (server-side, runtime secret) |

## UI Components

ALWAYS use shadcn/ui components when building UI. Check `components/ui/` for existing components before creating custom ones.

**NEVER manually edit files in `components/ui/`** — they are managed by the shadcn CLI.

Custom extensions beyond standard shadcn:
- `badge.tsx` — Extended with `color` prop and `solid`/`outline` variants
- `empty-state.tsx` — Animated empty state with icon tray
- `error-state.tsx` — Error display
- `dropzone.tsx` — File drag-and-drop
- `spinner.tsx` — Loading spinner
- `list-loading.tsx` — List skeleton state

### Icon Libraries
- **Primary**: `lucide-react` (via shadcn)
- **Secondary**: `@tabler/icons-react` (used in some places)
- Prefer Lucide for new work to keep consistency

## Rules

- NEVER use relative imports — always use `@/*` path alias
- NEVER modify `components/ui/` files manually
- NEVER fetch data directly in components — use TanStack Query hooks or context providers
- NEVER store secrets in `NEXT_PUBLIC_*` variables — those are exposed to the browser
- Components should be presentational: receive data via props, emit events via callbacks
- Use the Provider + Hook pattern for feature-level shared state
- All API calls go through `createHttpClient` (client-side) or `lib/auth.ts` helpers (server-side)
- File naming: kebab-case for files (`site-header.tsx`), PascalCase for React components
- Hook naming: `use[PascalCase].tsx` or `use-[kebab-case].ts`

## Commenting Policy

Code should be self-documenting. Only add comments where they explain WHY, not WHAT.
- No commented-out code (delete it)
- No obvious comments ("increment counter", "set state")
- No comments that repeat what the code does
- If you need a comment to explain WHAT the code does, consider refactoring instead

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
