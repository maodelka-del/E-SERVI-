# E-SERVICES

Une marketplace de services numériques sénégalaise (style Fiverr/ComeUp) connectant clients et freelancers autour de services comme la création de CV, design, développement web, présentations, traductions, etc.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, exposed at `/api`)
- `pnpm --filter @workspace/e-services run dev` — run the frontend (port 21930, exposed at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Wouter routing, Framer Motion, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Auth: JWT (stored in localStorage under `eservices_token`)
- Payments: DiamoPay (demo mode by default)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — Generated Zod validation schemas
- `lib/db/src/schema/` — Drizzle ORM table definitions (users, services, orders, reviews, messages, notifications)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware
- `artifacts/e-services/src/pages/` — React page components
- `artifacts/e-services/src/components/` — Shared UI components (Navbar, Footer, ServiceCard)
- `artifacts/e-services/src/contexts/AuthContext.tsx` — JWT auth state management

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks + Zod schemas
- Escrow system: commission (10%) split at order completion, `freelancerAmount = amount * 0.90`
- JWT stored in localStorage; `setAuthTokenGetter` injects token into all API calls automatically
- Route guard via `ProtectedRoute` component that redirects to `/login` if not authenticated
- Seed data uses bcrypt hash for password "password" (all test accounts)
- Service status flow: `pending` → approved (status = `active`) before appearing publicly

## Product

- Clients can browse/search services by category, price, delivery time; order and pay via DiamoPay escrow
- Freelancers can create service listings, manage orders, deliver work, receive secure payments
- Order workflow: pending → paid → in_progress → delivered → (revision | completed)
- Real-time messaging thread per order
- Review system after order completion
- Admin dashboard: user management (ban/unban), service approval, revenue stats

## Test accounts

All passwords are "password":
- `admin@eservices.sn` — Admin (access `/admin`)
- `mamadou@eservices.sn` — Freelancer Expert (design)
- `fatou@eservices.sn` — Freelancer Confirmé (web dev)
- `ibrahima@eservices.sn` — Freelancer Confirmé (rédaction)
- `aissatou@eservices.sn` — Client

## User preferences

- Language: French (UI) / English (code/comments)
- Colors: dark green (primary), amber/orange (accent), near-white (bg), near-black (dark bg)
- Currency: FCFA (formatted with `toLocaleString("fr-SN")`)

## Gotchas

- After schema changes: `pnpm --filter @workspace/db run push` then restart API server
- After OpenAPI changes: `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks
- Mutation param names come from Orval — use `id` not `serviceId`/`orderId` for path params (except `useSendMessage` which uses `orderId`)
- `useGetFreelancerProfile` requires `queryKey` in options when passing `enabled`
- Test password hash is `$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` (= "password")

## Render Deployment (single Web Service)

Deploy as one service — Express serves the built React frontend + all API routes.

**Build command:**
```
npm install -g pnpm && pnpm install --frozen-lockfile && pnpm run typecheck:libs && BASE_PATH=/ PORT=3000 NODE_ENV=production pnpm --filter @workspace/e-services run build && pnpm --filter @workspace/api-server run build
```

**Start command:**
```
NODE_ENV=production node artifacts/api-server/dist/index.mjs
```

**Required environment variables on Render:**
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Render Postgres or external) |
| `JWT_SECRET` | Random secret for JWT signing (generate with `openssl rand -hex 32`) |
| `PORT` | Provided automatically by Render — do not set manually |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | From Replit object storage (copy from Replit secrets) |
| `PRIVATE_OBJECT_DIR` | From Replit object storage |
| `PUBLIC_OBJECT_SEARCH_PATHS` | From Replit object storage |

**Notes:**
- `NODE_ENV=production` tells Express to serve the built frontend from `artifacts/e-services/dist/public`
- The SPA fallback serves `index.html` for all non-API routes
- After DB provisioning, run migrations: `pnpm --filter @workspace/db run push`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
