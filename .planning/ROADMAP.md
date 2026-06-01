# Roadmap: Hearth

## Overview

Hearth is a shared home dashboard (Nuxt 4 + Vue 3 + Vuetify + Pinia + GSAP). Phase 1 migrates from hardcoded seed data and localStorage to a real MongoDB backend with JWT authentication via Nuxt server (Nitro) API routes.

## Phases

- [ ] **Phase 1: MongoDB + JWT Backend** - Replace seed data with real MongoDB persistence; add Nuxt server API routes for auth (JWT) and full CRUD; remove localStorage fallback

## Phase Details

### Phase 1: MongoDB + JWT Backend

**Goal**: Eliminate all hardcoded test data and localStorage state. Add Nuxt/Nitro server API routes backed by MongoDB. Implement secure user auth with JWT (httpOnly cookie) and bcrypt password hashing. Pinia store hydrates from `$fetch` calls to server endpoints.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, DATA-01, DATA-02, DATA-03, DATA-04, API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08, API-09, API-10, ENV-01, ENV-02, ENV-03
**Success Criteria** (what must be TRUE):

1. User can register and login; JWT stored as httpOnly cookie; unauthenticated requests to API routes return 401
2. All app data (tasks, inventory, shopping, history, members) loads from MongoDB via API — no seed() call, no localStorage fallback
3. Checkout, task toggle, inventory updates all persist to MongoDB and survive page reload
4. `.env.example` exists with MONGO_URI and JWT_SECRET placeholders; real `.env` gitignored

**Plans**: 4 plans

Plans:

- [ ] 01-01-PLAN.md — MongoDB models + env config (ENV-01, ENV-02, ENV-03, DATA-01)
- [ ] 01-02-PLAN.md — Auth API routes + JWT middleware (AUTH-01–05, API-01–04)
- [ ] 01-03-PLAN.md — Data API routes CRUD (API-05–10, DATA-04)
- [ ] 01-04-PLAN.md — Pinia store refactor + page hydration (DATA-02, DATA-03)

## Progress

| Phase                    | Plans Complete | Status      | Completed |
| ------------------------ | -------------- | ----------- | --------- |
| 1. MongoDB + JWT Backend | 0/4            | Not started | -         |
