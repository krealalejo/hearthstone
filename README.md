# heartshtone

Shared home dashboard for household management — tasks, inventory, shopping list, and history — with real-time persistence and secure multi-user auth.

**Stack:** Nuxt **4**, Vue **3**, Vuetify **4**, Pinia, GSAP **3**, MongoDB (Mongoose **9**), JWT (jose), Zod, Resend, i18n (en/es/ca), TypeScript, Vitest, Capacitor (Android)

---

## Prerequisites

- Node.js **22+**
- pnpm **11+**
- MongoDB instance (local or Atlas)

---

## Quick Start

1. Clone repo and install deps
   ```bash
   pnpm install
   ```
2. Copy env file and fill values
   ```bash
   cp .env.example .env
   ```
3. Start dev server
   ```bash
   pnpm dev
   ```
4. Open `http://localhost:3000`

---

## Commands

| Action           | Command               |
| ---------------- | --------------------- |
| Dev server       | `pnpm dev`            |
| Production build | `pnpm build`          |
| Preview build    | `pnpm preview`        |
| Static generate  | `pnpm generate`       |
| Type check       | `pnpm typecheck`      |
| Run tests        | `pnpm test`           |
| Tests (watch)    | `pnpm test:watch`     |
| Tests (UI)       | `pnpm test:ui`        |
| Tests (coverage) | `pnpm test:coverage`  |
| Android sync     | `pnpm android:sync`   |
| Android open     | `pnpm android:open`   |
| Android run      | `pnpm android:run`    |

---

## Pages

| Path                  | Description                              | Access                                        |
| --------------------- | ---------------------------------------- | --------------------------------------------- |
| `/`                   | Home redirect                            | Public → redirects to `/dashboard` or `/auth` |
| `/auth`               | Login / register with Google OAuth       | Public only                                   |
| `/reset-password`     | Password reset (token-gated)             | Public only                                   |
| `/dashboard`          | Task board with leaderboard              | Protected                                     |
| `/inventory`          | Household inventory management           | Protected                                     |
| `/shopping`           | Shopping list with auto-restock flow     | Protected                                     |
| `/history`            | Checkout / restock history log           | Protected                                     |
| `/history/purchases`  | Per-item purchase breakdown              | Protected                                     |
| `/history/weeks`      | Week-over-week spending summary          | Protected                                     |
| `/household`          | Household settings and member management | Protected                                     |

---

## API Endpoints

| Method                  | Path                          | Description                             | Auth |
| ----------------------- | ----------------------------- | --------------------------------------- | ---- |
| `POST`                  | `/api/auth/register`          | Create account, return JWT cookie       | No   |
| `POST`                  | `/api/auth/login`             | Validate credentials, return JWT cookie | No   |
| `POST`                  | `/api/auth/logout`            | Clear JWT cookie                        | No   |
| `GET`                   | `/api/auth/me`                | Current user from JWT                   | Yes  |
| `POST`                  | `/api/auth/refresh`           | Refresh JWT token                       | Yes  |
| `GET`                   | `/api/auth/google`            | Initiate Google OAuth flow              | No   |
| `GET`                   | `/api/auth/google/callback`   | Google OAuth callback, set JWT cookie   | No   |
| `POST`                  | `/api/auth/forgot-password`   | Send password reset email via Resend    | No   |
| `POST`                  | `/api/auth/reset-password`    | Consume reset token, update password   | No   |
| `GET/POST/PATCH/DELETE` | `/api/tasks`                  | Task CRUD                               | Yes  |
| `GET/POST/PATCH/DELETE` | `/api/inventory`              | Inventory item CRUD                     | Yes  |
| `GET/POST/PATCH/DELETE` | `/api/shopping`               | Shopping list CRUD                      | Yes  |
| `GET/POST`              | `/api/history`                | Checkout / restock history              | Yes  |
| `GET/POST/PATCH/DELETE` | `/api/members`                | Household member management             | Yes  |
| `GET/PATCH`             | `/api/household`              | Household metadata (name, emoji)        | Yes  |

---

## Architecture

```mermaid
graph TD
    Browser["Browser (Vue 3 + Vuetify)"]
    Pinia["Pinia Store"]
    Middleware["Route Middleware (auth / home)"]
    NuxtServer["Nitro Server"]
    AuthAPI["Auth API (/api/auth/*)"]
    DataAPI["Data APIs (tasks / inventory / shopping / history / members / household)"]
    JWTUtils["JWT Utils (jose)"]
    Mongoose["Mongoose Plugin"]
    MongoDB[("MongoDB")]
    Google["Google OAuth"]
    Resend["Resend (email)"]

    Browser --> Middleware
    Middleware --> Browser
    Browser --> Pinia
    Pinia -->|"$fetch"| NuxtServer
    NuxtServer --> AuthAPI
    NuxtServer --> DataAPI
    AuthAPI --> JWTUtils
    DataAPI --> JWTUtils
    AuthAPI --> Mongoose
    DataAPI --> Mongoose
    AuthAPI --> Google
    AuthAPI --> Resend
    Mongoose --> MongoDB
```

Nuxt 4 compat mode — app code in `app/`, server code in `server/`. Vuetify 4 provides the component library with a warm "Quiet Home" theme (sage green + earthy neutrals). GSAP handles page-level animations via `useAnimations` and confetti via `useConfetti`. JWT stored as httpOnly cookie; all data API routes validate via server middleware before hitting MongoDB. Zod schemas validate all request bodies server-side. Capacitor wraps the app for Android distribution.

---

## Source Layout

```
heartshtone/
├── app/
│   ├── assets/css/          # Design tokens and component styles
│   ├── components/          # Shared + feature components
│   │   ├── dashboard/       # TaskModal, TaskRow, Leaderboard
│   │   ├── household/       # ConfirmDialog, InviteDialog
│   │   ├── inventory/       # Item, Modal
│   │   └── shopping/        # Item
│   │   AppAvatar, AppSidebar, AppTabBar, AppToastHost, AppTopbar
│   │   ProfileModal, ProgressBar, ProgressRing, QuantityStepper
│   ├── composables/         # useAnimations, useBootstrap, useColorMode, useConfetti
│   ├── layouts/             # auth.vue, default.vue
│   ├── middleware/          # auth.ts, home.ts
│   ├── pages/               # Route pages
│   │   ├── history/         # index, purchases, weeks
│   │   auth, dashboard, household, inventory, reset-password, shopping
│   ├── plugins/             # gsap.client.ts
│   ├── stores/              # home.ts (Pinia)
│   └── app.vue
├── i18n/
│   └── locales/             # en.json, es.json, ca.json
├── server/
│   ├── api/                 # Nitro API route handlers
│   │   └── auth/            # login, logout, me, refresh, register
│   │                          forgot-password, reset-password
│   │                          google (OAuth initiation + callback)
│   ├── middleware/          # auth.ts (JWT validation)
│   ├── models/              # Mongoose models
│   │                          User, Household, Task, InventoryItem
│   │                          ShoppingItem, HistoryEntry, PendingInvite, PasswordResetToken
│   ├── plugins/             # mongoose.ts (DB connection)
│   └── utils/               # jwt.ts, serialize.ts, validate.ts (Zod schemas)
├── tests/
│   └── unit/                # Vitest unit tests — auth, store, components, pages, server API
├── android/                 # Capacitor Android project
├── nuxt.config.ts
├── package.json
└── .env.example
```

---

## Configuration

| Variable                    | Purpose                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| `NUXT_MONGO_URI`            | MongoDB connection string (e.g. `mongodb://localhost:27017/hearth`)       |
| `NUXT_JWT_SECRET`           | Secret for signing JWT tokens (min 32 chars in production)                |
| `NUXT_GOOGLE_CLIENT_ID`     | Google OAuth client ID (from Google Cloud Console)                        |
| `NUXT_GOOGLE_CLIENT_SECRET` | Google OAuth client secret                                                |
| `NUXT_GOOGLE_REDIRECT_URI`  | OAuth callback URL (must match Google Console — default: `/api/auth/google/callback`) |
| `NUXT_RESEND_API_KEY`       | Resend API key for password reset emails                                  |
| `NUXT_PUBLIC_BASE_URL`      | Public base URL for email links (default: `http://localhost:3000`)        |
