# VeriLearn Frontend

VeriLearn is a learning platform frontend built with Next.js 16 (App Router), React 19, TypeScript 5, and Tailwind CSS v4. It ships a working product slice — signup and login against real API route handlers, a course catalogue with search and filtering, a lesson viewer, per-user enrollment and progress tracking, a dashboard and profile — backed by unit tests, Playwright end-to-end tests, and a k6 load testing and CI pipeline.

---

## Features

| Area | What's there |
|---|---|
| Auth | Real signup and login via Route Handlers, `HttpOnly` cookie sessions, HMAC-signed tokens, scrypt-hashed passwords |
| Route protection | `proxy.ts` guards `/dashboard` and `/profile`, redirecting to `/login?from=…` |
| Courses | 6 seeded courses, live text search, level and topic filters, filter state synced to the URL |
| Course detail | Lesson list, enroll button, progress bar, deep links into each lesson |
| Lesson viewer | Breadcrumb, duration badge, mark-as-complete, prev/next navigation, streaming `loading.tsx` skeleton |
| Dashboard | Per-user stats (enrolled, lessons done, certificates) and progress rings for each enrolled course |
| Profile | Live account details and enrollment/progress summary — no hardcoded data |
| Persistence | Enrollment and progress persist to `localStorage`, namespaced per signed-in user |
| Theming | Dark mode across home, courses, and the navbar via Tailwind's `dark:` variant |
| Accessibility | Labelled controls, `role="alert"` error messaging, `aria-expanded`/`aria-controls` on the mobile menu, `aria-label` on progress rings |
| Error states | Route-level `error.tsx`, `loading.tsx`, and a global `not-found.tsx` |
| Testing | Jest + Testing Library unit tests, Playwright e2e specs, k6 load tests |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.4 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS | 4.3 |
| Fonts | Geist Sans & Geist Mono | via `next/font/google` |
| Linting | ESLint with `eslint-config-next` | 9 (flat config) |
| Unit tests | Jest 30 + Testing Library | via `next/jest` |
| E2E tests | Playwright | 1.63 (Chromium) |
| Load Testing | k6 | via Docker / GitHub Actions |
| Metrics Storage | InfluxDB | via Docker |
| Dashboards | Grafana | via Docker |

---

## Project Structure

```
VeriLearn-frontend/
├── app/
│   ├── layout.tsx                     # Root layout — fonts, metadata, Navbar, context providers
│   ├── page.tsx                       # Home page (/)
│   ├── not-found.tsx                  # Global 404
│   ├── globals.css                    # Tailwind v4 import, theme tokens, dark-mode body colours
│   ├── login/page.tsx                 # Sign in (supports ?from= return URLs)
│   ├── signup/page.tsx                # Create account, client-side validation
│   ├── dashboard/                     # page.tsx + loading.tsx + error.tsx (protected)
│   ├── profile/page.tsx               # Account details + live enrollment data (protected)
│   ├── courses/
│   │   ├── page.tsx                   # Catalogue — search, level/topic filters, URL sync
│   │   ├── loading.tsx / error.tsx    # Streaming skeleton + error boundary
│   │   └── [id]/
│   │       ├── page.tsx               # Course detail — lessons, enroll, progress
│   │       └── lessons/[lessonId]/    # page.tsx + loading.tsx — lesson viewer
│   ├── api/auth/
│   │   ├── signup/route.ts            # POST — validate, create user, set session cookie
│   │   ├── login/route.ts             # POST — verify password, set session cookie
│   │   ├── logout/route.ts            # POST — clear session cookie
│   │   └── me/route.ts                # GET  — current session payload (or null)
│   ├── components/Navbar.tsx          # Sticky nav, auth-aware links, mobile menu
│   ├── context/
│   │   ├── AuthContext.tsx            # Session state, login/signup/logout
│   │   ├── EnrollmentContext.tsx      # Per-user enrolled course IDs
│   │   └── ProgressContext.tsx        # Per-user completed lessons + course progress
│   └── lib/
│       ├── auth.ts                    # HMAC-SHA256 token sign/verify
│       ├── users.ts                   # In-memory user store, scrypt password hashing
│       └── courses.ts                 # Course/lesson seed data and tag colours
├── proxy.ts                           # Route protection (Next 16's renamed middleware)
├── __tests__/                         # Jest unit tests
├── e2e/                               # Playwright specs — auth, courses, enroll
├── load-testing/
│   ├── script.js                      # k6 scenarios, thresholds, custom metrics
│   ├── docker-compose.yml             # InfluxDB + Grafana + k6 stack
│   └── grafana/                       # Pre-provisioned dashboard + datasource
├── .github/workflows/load-test.yml    # CI: load test + e2e jobs on PRs to main
├── jest.config.ts / jest.setup.ts
├── playwright.config.ts
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## How It Works

### Routing

Next.js file-system routing maps each `page.tsx` under `app/` to a URL path:

| File | Route | Notes |
|---|---|---|
| `app/page.tsx` | `/` | Marketing home |
| `app/login/page.tsx` | `/login` | Accepts `?from=` to return after sign-in |
| `app/signup/page.tsx` | `/signup` | |
| `app/courses/page.tsx` | `/courses` | Accepts `?q=`, `?level=`, `?topic=` |
| `app/courses/[id]/page.tsx` | `/courses/:id` | 404s on an unknown id |
| `app/courses/[id]/lessons/[lessonId]/page.tsx` | `/courses/:id/lessons/:index` | |
| `app/dashboard/page.tsx` | `/dashboard` | Protected |
| `app/profile/page.tsx` | `/profile` | Protected |
| `app/api/auth/*/route.ts` | `/api/auth/{signup,login,logout,me}` | Route Handlers |

Dynamic route params are a `Promise` in Next 16 and are unwrapped with React's `use()` hook.

### Authentication

Auth is implemented end to end with no third-party auth library:

1. **Signup** (`POST /api/auth/signup`) validates name, email, and an 8-character minimum password on both the client and the server, then creates the user. A duplicate email returns `409`.
2. **Passwords** are hashed with `crypto.scryptSync` and a per-user 16-byte random salt, stored as `salt:derived`, and compared with `crypto.timingSafeEqual` (`app/lib/users.ts`).
3. **Sessions** are `base64url(payload).HMAC-SHA256(payload)` tokens signed with `AUTH_SECRET` (`app/lib/auth.ts`). Verification is constant-time and rejects any tampered payload.
4. **The token is set as an `HttpOnly`, `SameSite=Lax` cookie** (`auth-token`, 7-day max age), so it is never readable from JavaScript.
5. **`AuthProvider`** hydrates the client from `GET /api/auth/me` on first load, then exposes `user`, `loading`, `login`, `signup`, and `logout`.
6. **`proxy.ts`** verifies the cookie before `/dashboard` and `/profile` render, redirecting unauthenticated visitors to `/login?from=<path>`. In Next 16 the `middleware` file convention is deprecated and renamed to `proxy`.

The secret is resolved lazily per sign/verify call, so a missing `AUTH_SECRET` never breaks `next build` — only actual auth requests fail, and only in production.

**Demo accounts** (seeded, password `password123`): `alice@example.com`, `bob@example.com`, `test@example.com`.

> **Known limitation:** the user store is in-memory (`app/lib/users.ts`) and resets on server restart or serverless cold start. There is no database behind this demo app. On a long-running process — local dev, `next start`, Docker, this repo's CI — newly created accounts work for the lifetime of that process.

### State and persistence

Three client contexts wrap the app in `layout.tsx`, nested `Auth → Enrollment → Progress`:

- **`EnrollmentContext`** holds a `Set<number>` of enrolled course IDs, persisted to `localStorage` under `verilearn_enrolled:<email>`.
- **`ProgressContext`** holds a `Set<string>` of `courseId-lessonIndex` keys under `verilearn_progress:<email>`, and derives `courseProgress(courseId, total)` as a percentage.

Both are **namespaced per signed-in email** and re-hydrate during render whenever the identity changes — logging in, logging out, or switching accounts in the same browser — so one user never sees another's data. State is adjusted during render rather than in an effect, following React's [you-might-not-need-an-effect](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes) guidance, which also removes the enroll race where a write could land before hydration finished.

### Search and filtering

`/courses` keeps query text, selected levels, and selected topics in component state and mirrors them into the URL with `router.replace(…, { scroll: false })`, so a filtered view is shareable and survives a reload. Reading `useSearchParams()` requires a `Suspense` boundary, which wraps the filter UI.

### Server vs Client Components

By default, components in the App Router are **React Server Components** — rendered on the server with no client JS cost. Pages needing hooks, event handlers, or browser APIs opt in with `"use client"`: the navbar, all three contexts, and the interactive course, lesson, dashboard, profile, login, and signup pages. Route Handlers under `app/api/` always run on the server.

### Styling and dark mode

Tailwind CSS v4 is imported with `@import "tailwindcss"`. The `@theme inline` block maps the Geist font variables to Tailwind's `--font-sans` / `--font-mono` tokens. Body colours flip under `@media (prefers-color-scheme: dark)`, and components use Tailwind's `dark:` variant, so the theme follows the OS setting.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The page hot-reloads on file save. Sign in with a demo account above, or create one at `/signup`.

### Build for production

```bash
AUTH_SECRET=$(openssl rand -base64 32) npm run build
AUTH_SECRET=… npm run start
```

`next build` produces an optimised production build under `.next/`; `next start` serves it. `AUTH_SECRET` is required at runtime in production (see [Environment Variables](#environment-variables)).

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint flat config (`core-web-vitals` + TypeScript rules) |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |

---

## Testing

### Unit tests (Jest + Testing Library)

Configured through `next/jest` with a `jsdom` environment and `@testing-library/jest-dom` matchers; `e2e/` is excluded so Playwright specs don't run under Jest.

```bash
npm test
```

| File | Covers |
|---|---|
| `__tests__/home.test.tsx` | Hero heading and primary navigation links |
| `__tests__/courses.test.ts` | Course data shape — ids, titles, lesson fields |
| `__tests__/login.test.tsx` | Error message on invalid credentials |
| `__tests__/validation.test.ts` | Signup validation rules and multi-error collection |
| `__tests__/persistence.test.tsx` | Per-user `localStorage` reads/writes and re-hydration on identity change |

### End-to-end tests (Playwright)

`playwright.config.ts` runs Chromium headless against `http://localhost:3000`, starting `npm run dev` itself (reusing an existing server if one is up) and capturing screenshots only on failure.

```bash
npx playwright install chromium   # first run only
npm run test:e2e
```

| Spec | Flow |
|---|---|
| `e2e/auth.spec.ts` | Sign in redirects to the dashboard |
| `e2e/courses.spec.ts` | Clicking a course card loads its detail page |
| `e2e/enroll.spec.ts` | Enrolling swaps the button to "Continue learning" |

---

## Load Testing

The project ships with a complete [k6](https://k6.io) load testing setup under `load-testing/`.

### How the load test works (`load-testing/script.js`)

**Custom metrics**

| Metric | Type | Description |
|---|---|---|
| `page_load_time` | Trend | Tracks response time per page, tagged by route |
| `failed_requests` | Counter | Counts requests that did not return HTTP 200 |
| `success_rate` | Rate | Ratio of successful checks |

**Test function**

Each virtual user (VU) iterates over four pages — `/`, `/login`, `/dashboard`, `/courses` — making a GET request to each, running two checks (status 200, response time < 500 ms), recording metrics, and sleeping 1 second between pages. `BASE_URL` defaults to `http://localhost:3000` and can be overridden to target staging or production.

### Scenarios

| Scenario | Executor | Config | Purpose |
|---|---|---|---|
| `smoke` | constant-vus | 1 VU, 30s | Sanity check — confirms the app responds at all |
| `load` | ramping-vus | 0→20→20→0 over 5m | Simulates normal expected traffic |
| `stress` | ramping-vus | 0→50→50→0 over 9m | Above-normal traffic to find the breaking point |
| `spike` | ramping-vus | 0→100 in 10s, hold 1m, drop in 10s | Sudden traffic burst (e.g. a viral event) |
| `soak` | constant-vus | 10 VUs for 2h | Long run to surface memory leaks or degradation |

Set `K6_SCENARIO=ci` to run only smoke, load, and stress — skipping spike and soak keeps pipeline runs under 15 minutes. Omit it (or set `all`) to run everything locally.

### Thresholds

The test fails if any threshold is breached:

| Metric | Threshold |
|---|---|
| `http_req_duration` p(95) | < 500 ms |
| `http_req_duration` p(99) | < 1500 ms |
| `http_req_failed` rate | < 1% |
| `page_load_time` p(95) | < 600 ms |
| `success_rate` | > 99% |

### Run load tests locally (CLI)

Requires [k6 installed](https://k6.io/docs/get-started/installation/):

```bash
k6 run load-testing/script.js
BASE_URL=https://staging.verilearn.com k6 run load-testing/script.js
```

### Run with Grafana dashboards (Docker)

Starts InfluxDB (metrics on port 8086), Grafana (dashboards on port 3001), and k6:

```bash
cd load-testing
docker compose up
```

- Grafana: [http://localhost:3001](http://localhost:3001) — anonymous admin access, k6 dashboard pre-provisioned
- InfluxDB: [http://localhost:8086](http://localhost:8086)

k6 streams metrics to InfluxDB in real time; Grafana renders the dashboard live as the test runs.

---

## CI/CD

`.github/workflows/load-test.yml` runs on every pull request targeting `main`, with two parallel jobs.

**`load-test`**

1. Checkout, set up Node 20 with npm cache, `npm ci`.
2. Build and start the app in the background with `NODE_ENV=production` and `AUTH_SECRET` (from repository secrets, falling back to a CI-only value).
3. `wait-on http://localhost:3000` with a 60s timeout.
4. Run `grafana/k6-action@v0.3.1` against `load-testing/script.js`, writing JSON results to `load-testing/results.json`.

**`e2e`**

1. Same checkout, Node, and install steps, plus `npx playwright install chromium --with-deps`.
2. Build and start the production server, wait for readiness.
3. Run `npm run test:e2e`, uploading `playwright-report/` and `test-results/` as artifacts if the job fails.

A breached k6 threshold or a failing Playwright spec exits non-zero and fails the PR check.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AUTH_SECRET` | _(dev-only fallback)_ | **Required in production.** Signs session tokens (`app/lib/auth.ts`). Generate with `openssl rand -base64 32`. The app throws on any auth request if unset while `NODE_ENV=production` — this is intentional, not a bug. |
| `BASE_URL` | `http://localhost:3000` | Target URL for the k6 load test |
| `K6_SCENARIO` | _(unset — all scenarios)_ | Set to `ci` to run only smoke, load, and stress |
| `NODE_ENV` | `development` | Set to `production` for optimised builds |

---

## Deployment

The easiest path is [Vercel](https://vercel.com/new) — connect the repository and Vercel detects Next.js automatically. **Set `AUTH_SECRET` in the project's environment variables before deploying**, or auth requests will throw.

For self-hosted deployments:

```bash
npm run build   # produces .next/
npm run start   # serves on port 3000
```

Because the user store is in-memory, serverless deployments will lose accounts created at runtime between cold starts. Wiring `app/lib/users.ts` to a real database is the next step for anything beyond a demo.

See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for Node.js server, Docker, and static export options.

---

## Project History

Shipped to `main`, most recent first:

| Change | Detail |
|---|---|
| Real signup, per-user data isolation, loud `AUTH_SECRET` requirement | `/api/auth/signup` creates real accounts; enrollment and progress namespaced per user; production refuses to sign tokens without a secret |
| Security upgrades | Next upgraded to resolve a critical advisory; `npm audit fix` for transitive dependencies |
| Lint and config cleanup | Remaining ESLint warnings cleared; lint and test configuration fixed |
| Course topic filter repair | Topic filtering fixed and dead code removed |
| Auth token hardening | Session cookies signed and verified with HMAC-SHA256 instead of trusting raw base64 JSON; enroll race on a fresh page load fixed |
| CI hardening (#9) | k6 workflow hardened, JSON results emitted, `AUTH_SECRET` provided to CI builds |
| Dark mode (#8) | Home, courses, and navbar support the `dark:` variant |
| Playwright e2e | Auth, courses, and enroll flows covered end to end |
| Accessibility (#7) | Labels, alert roles, and ARIA attributes across all pages |
| Live profile data | Profile replaced hardcoded values with real enrollment and progress |
| Real authentication | Login/logout/me Route Handlers replacing the mocked flow |
| Courses search and filter | Text search plus level/topic filters with URL sync |
| Lesson viewer | Breadcrumb, duration badge, mark-complete, prev/next, loading skeleton |
| Enrollment persistence | Enrollment and progress written to `localStorage` |
| Initial frontend build | Auth pages, courses, dashboard, lessons, and theming |
| Load testing setup | k6 scenarios, thresholds, InfluxDB + Grafana stack, CI workflow |

---

## Contributing

The project uses a Wave Program model — maintainers post scoped issues that contributors pick up during sprint cycles. Good next steps:

- **Persistence** — replace the in-memory user store with a real database, and move enrollment/progress server-side
- **Auth** — password reset, email verification, session refresh
- **Content** — replace the seeded course data with a CMS or API
- **Testing** — broaden unit coverage, add e2e specs for signup and lesson completion
- **Performance** — tune k6 thresholds, add scenarios, extend the Grafana dashboards
- **Accessibility** — keyboard traps, focus management, and colour-contrast audits as new UI lands
