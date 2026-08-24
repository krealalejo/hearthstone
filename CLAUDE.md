# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm preview      # preview production build
pnpm typecheck    # run nuxt typecheck
pnpm test         # run vitest (once)
pnpm test:watch   # vitest watch mode
```

Run a single test file:

```bash
pnpm vitest run tests/unit/auth.test.ts
```

## Environment

Copy `.env.example` → `.env` and fill in:

- `NUXT_MONGO_URI` — MongoDB connection string
- `NUXT_JWT_SECRET` — min 32 chars, used for both access and refresh tokens

## Architecture

**Stack:** Nuxt 3 with `compatibilityVersion: 4` (uses `app/` directory layout), Vue 3, Vuetify 3, Pinia, GSAP, Mongoose, `jose` JWT.

**Nuxt 4 layout** — all frontend code lives under `app/` (pages, components, composables, layouts, middleware, plugins, stores). Server code lives under `server/`.

### Auth flow

- Login/register/logout/refresh are public; all other `/api/*` routes are protected by `server/middleware/auth.ts`
- Tokens stored as HTTP-only cookies: `access_token` (1h), `refresh_token` (30d)
- Server middleware attaches `event.context.user = { userId, householdId, role }` for downstream handlers
- Client `app/middleware/auth.ts` calls `/api/auth/me` to gate protected pages; `app/middleware/home.ts` redirects `/` based on `store.authed`

### State management

Single Pinia store (`app/stores/home.ts` → `useHomeStore`) holds all app state: auth, household, members, tasks, inventory, shopping, history, toasts.

All mutating actions use **optimistic updates with rollback** — local state updates immediately, API call follows, reverts on failure with a toast notification.

Auto-restock logic: when `inventory.qty <= inventory.min`, a shopping item is added optimistically with a temp ID, then replaced with the real persisted ID after the API call.

### Server API

- All handlers live in `server/api/` named `<resource>.<method>.ts`
- Use `serializeLean()` from `server/utils/serialize.ts` to convert Mongoose `_id` → `id` string before returning documents
- `useRuntimeConfig(event)` — always pass `event` to get env-overridden config values

### Design system

"Quiet Home" — CSS custom properties defined in `app/assets/css/tokens.css` (`--bg`, `--surface`, `--ink`, `--accent`, `--hairline`, `--shadow-*`, `--font-display`, `--font-ui`, `--ease`). Vuetify theme colors are defined inline in `nuxt.config.ts`.

GSAP is registered as a client-only plugin (`app/plugins/gsap.client.ts`) and wrapped in `app/composables/useAnimations.ts`. Import `useAnimations()` in components, not `$gsap` directly.

### Code style

**No comments.** Never write `//` or `<!-- -->` comments in code. Names and structure must be self-explanatory. The only exception: a non-obvious WHY (hidden constraint, subtle invariant, specific bug workaround) that would genuinely surprise a reader — one short line max.
