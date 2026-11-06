# Chama-Fi

A mobile-first dashboard for Kenyan chamas: contributions, loans and member standing in one place.
React + TypeScript + Tailwind. All data is mocked in `src/mocks` (no backend).

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

## Test

```bash
npm test           # vitest: API rules + formatters
npm run typecheck  # strict TypeScript
npm run build      # production build
```

## Demo

1. Home as **Member**: November pot dots, savings, next payout.
2. Contributions: "Pay with M-Pesa" (simulated STK push) and watch your badge turn green.
3. Loans: ask for KES 1,000,000 to see the 3x savings rule, then request KES 10,000.
4. Login as **Treasurer**, approve the request, then see Home update.

## Structure

- `src/mocks/db.ts` seed data, `api.ts` async API with delays. Swap `api.ts` for fetch calls later.
- `src/features/*` one folder-level screen per feature.
- `src/components/ui.tsx` shared Card, Button, Badge, Skeleton.
- `src/context.tsx` view toggle, refresh signal, toasts.

## additions

- Demo data persists in `localStorage`; use "Reset demo data" on Home to start over.
- Treasurer view: "Record payment" and "Remind" on the Contributions table.
- Reports page: collection rate, loan book and a monthly collected-vs-due chart.
- Two-step loan rejection and an empty state on Loans.
- PWA: `public/manifest.webmanifest`, `icon.svg`, PNG icons (192, 512, maskable 512, Apple touch 180, favicon 32) and `sw.js` (registered only in production).
  Test installability with `npm run build && npm run preview`, then open Chrome DevTools > Application.

## weekly and monthly chamas

Chamas contribute weekly or monthly. Switch the schedule in **Treasurer** view on Home (it reseeds the demo data).
Periods are month keys (`2026-11`) or ISO week keys (`2026-W45`); see `PLANS` in `src/mocks/db.ts` to change amounts.
Storage key moved to `chama-fi-db-v2`, so old saved demo data is ignored.

## fortnightly chamas and dark mode

- Treasurer view on Home now switches between Weekly, Fortnightly and Monthly. A fortnight is keyed `2026-F23` and shown as weeks 45-46.
- Dark mode: the Light/Dark button in the header. It follows your system setting first, then remembers your choice. Colours are CSS variables in `src/index.css`, so a retheme is one file.

## sign in, roles, new palette

- Sign in or create an account. Sign-up needs the chama code (`UMOJA`) and always creates a plain **member**.
- Demo accounts, password `chama123`: wanjiru@ (member), otieno@ (treasurer), achieng@ (secretary), kiprop@ (chairperson), all `@umoja.co.ke`.
- Permissions live in `src/lib/roles.ts`: chair and treasurer decide loans and change the schedule, the treasurer records payments, the treasurer and secretary send reminders. Officials get a gold "Official" badge.
- Theme control: Auto, Light or Dark. Palette tokens are in `src/index.css`; dark is a velvet purple-blue.
- Statuses use blue and orange plus a symbol (✓ … !), so they work for colour-blind users.
- Mock auth is for the demo only: passwords sit in localStorage, and permissions are enforced in the UI. A real backend must check them on the server.

## password reset

- "Forgot password?" on the sign-in page. Enter your email, then the 6-digit code and a new password.
- Codes last 15 minutes and lock after 5 wrong tries. The reply is the same whether or not the email exists.
- Demo only: no email is sent, so the code is shown on screen. In a real app, email it and never return it from the API.

## profile page

- `/profile` (click your name in the sidebar or the role badge): your details, savings, contribution and loan history, what your role can and cannot do, and change password.

## Manage page for officials

- `/manage` appears in the nav for the chair, treasurer and secretary. It lists who has not paid this period, with **Record payment** (treasurer), **Remind** and **Remind everyone** (treasurer, secretary), a link to pending loans (chair, treasurer) and the **schedule switch** (chair, treasurer).
- Each reminder is logged, and the list shows when a member was last reminded.
- Older late payments can still be recorded from the Contributions page.
