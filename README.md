# MenuMint

Beautiful digital menus for restaurants: a menu builder, a branding studio, a QR studio, analytics and subscriptions, built with a custom "Liquid Glass" design system.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Radix primitives (shadcn-style) · Motion · Supabase (Auth, Postgres, Storage, RLS) · Stripe · Zod · React Hook Form · Recharts · `qrcode` + `jsqr` · Playwright

## Quick start (local demo mode)

```bash
npm install
npm run dev          # http://localhost:3000
```

If no Supabase variables are set, the app runs in **demo mode**:

- Data is saved to `./.data/db.json` and uploads go to `./.data/uploads`.
- Auth is real. Passwords are hashed with scrypt, and sessions use random tokens stored as hashes in an httpOnly cookie.
- A banner on every dashboard page says demo mode is on.
- A demo restaurant, **Saffron & Sage**, is seeded on first run. Log in with `demo@menumint.app` / `mint-demo-2026`, or open the public menu at `/m/saffron-sage`.
- The demo restaurant's analytics are **generated sample data**. Each event is flagged `isDemo` and labelled as sample data in the UI. New restaurants start with zero events.
- `npm run db:reset` resets the demo database (add `--uploads` to also delete uploaded files).

Demo mode is for local development only. It stores everything in one JSON file, so don't use it in production.

## Production setup

Copy `.env.example` to `.env.local` and fill it in.

### Supabase
1. Create a project and apply `supabase/migrations/20261030000000_init.sql` with `supabase db push`, or paste it into the SQL editor. This creates the schema, RLS policies, the RPCs (`save_menu_content`, `publish_menu`, `restaurant_members`, …) and the public `media` storage bucket with its policies.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. The service role key is server-only and is used only for analytics ingestion, public published content and Stripe webhooks.
3. In Auth → URL configuration, add `https://menumint.vertexstudio.studio/auth/callback` as a redirect URL (or `<APP_URL>/auth/callback` for other environments).
4. Optional: create `demo@menumint.app` and run `supabase/seed.sql` to load the demo restaurant.

### Stripe (use test mode first)
1. Create three recurring prices (Starter, Pro, Business). The amounts shown in the app ($9 / $19 / $39) are only proposals; set the real ones in Stripe.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO` and `STRIPE_PRICE_BUSINESS`.
3. Point a webhook at `https://menumint.vertexstudio.studio/api/stripe/webhook` with these events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`. Set `STRIPE_WEBHOOK_SECRET`.
   For local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. Enable the Customer Portal in Stripe so customers can change plans and cancel.

Plan state changes **only** through verified webhooks. Entitlements are always checked on the server (`src/lib/services/*`, server actions); client-side checks only change what the UI shows.

## Architecture

```
src/
  app/
    (marketing)/          landing, privacy, terms
    (auth)/               login, signup, forgot/reset password
    onboarding/           9-step wizard (progress saved to the profile)
    dashboard/            overview, menus (+ editor/preview), qr, analytics, branding, billing, settings, orders*, customers*
    m/[slug]/[menuSlug]   public customer menus (SEO metadata + JSON-LD)
    q/[code]              stable QR redirect (records the scan, then 302s to the current destination)
    print/qr/[id]         print-ready table cards
    api/                  upload, uploads (demo file server), track, stripe/webhook
    actions/              server actions: validated (Zod), authorised, plan-checked
  components/glass/       MenuMint Glass design system
  components/public-menu/ MenuView, used for public pages, every live preview and the marketing demos
  lib/data/               Repo interface + local (demo) and Supabase implementations
  lib/services/           authorisation context, entitlements, analytics aggregation
  proxy.ts                route protection and Supabase session refresh (Next 16 "proxy")
supabase/                 migrations + seed
tests/e2e/                Playwright suites
```

**Draft and publish model:** the editor saves the working draft to categories and items. Publishing takes a snapshot (`published_content`), and public pages only ever read that snapshot.

**Privacy:** analytics store only the event type, menu/item/QR ids, a coarse device class and the referring host. They store no IPs, user agents or cookies, and they respect DNT/GPC.

\* Orders and Customers are labelled **optional modules**. They explain what they would do but have no backend yet.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e     # builds and starts a production server on :3100 with an isolated .data-test store
```

The Playwright suites cover marketing pages and links, sign-up, login, logout, password reset, protected routes, onboarding through publishing to the public menu, uploads, the menu builder (autosave, persistence, undo/redo, availability, duplicate, archive, reorder, validation, draft preview, publish), menu CRUD, QR rendering with a jsQR scan test, PNG/SVG downloads, contrast blocking, stable redirects, the print sheet, scan analytics, branding publishing, cross-tenant authorisation, upload validation, plan limits, billing without Stripe keys, demo plan switching and mobile layouts.

## Status of integrations

| Area | Status |
| --- | --- |
| Demo-mode persistence, auth, uploads | Implemented and tested end-to-end |
| Supabase schema + RLS | Implemented; migrations applied to the live project (`menumint`, us-west-2). |
| Supabase repo/auth adapters | Implemented and type-checked. Clerk handles auth; Supabase stores data. |
| Stripe Checkout / Portal / webhooks | Implemented. **Not tested: no Stripe keys were available.** Without keys the UI says so and checkout stays disabled. |
| Orders, Customers | Not implemented (clearly labelled optional modules) |
