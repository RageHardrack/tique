# Tique — Personal Finance & Wealth Management App

<a href="https://github.com/Gentleman-Programming/gentle-ai">
  <img width="220" src="https://raw.githubusercontent.com/Gentleman-Programming/gentle-ai/main/docs/assets/brand/built-with-gentle-ai.png" alt="Built with Gentle-AI" />
</a>

**Tique** (named after the Greek deity of fortune, prosperity and destiny) is the SPA/PWA for
wealth management, multi-currency accounts and financial tracking inside the **Lascar** ecosystem.
It talks to the **Guilliman** backend through a centralized HTTP client (`ApiClient`) and is styled
with **Nuxt UI v4** using the Lascar Blog palette (Deep Navy `#0B0F19`, Steel Blue `#4D7EA8`, Soft
Gold `#E0DDCF`, Antique Ivory `#FAF7F2`), with full light and dark mode support.

> **The product interface stays in Spanish.** This documentation is in English, but every screen
> the user sees —and every route, like `/movimientos`, `/presupuestos` or `/plantillas`— keeps its
> Spanish naming. English is for docs, PRs and this changelog.

`ApiClient` attaches the session token to every call, because Guilliman reads the user from the
token rather than from the URL or the body. If the API answers 401 to a call that carried a token
(the session expired; the JWT lasts 7 days and is not refreshed), Tique closes the session and
sends you back to login.

---

## Quick path

```bash
cd tique
bun install
cp .env.example .env   # set VITE_API_BASE_URL
bun run dev            # http://tique.localhost:1355
```

| Variable            | Description                        | Recommended local value                  |
| :------------------ | :--------------------------------- | :--------------------------------------- |
| `VITE_API_BASE_URL` | Base endpoint of the Guilliman API | `http://guilliman.localhost:1355/api/v1` |

The app needs a running Guilliman backend. From the workspace, the `lascar-local-dev` skill shortcut
`init-tique` starts both.

## Commands

```bash
bun run dev        # Dev server behind Portless (HTTP, port 1355)
bun run build      # vue-tsc typecheck + production build
bun run test       # Vitest unit suites
bun run test:e2e   # Playwright (needs a running backend and a seeded user)
bun run test:e2e:ui
bun run format     # Prettier over src/
```

---

## Modules and capabilities

- **Multi-currency accounts**: bank accounts, digital wallets and cash, with real-time conversion
  into the base currency (USD, PEN, VES) and configurable rates.
- **Daily exchange rate per transaction (VES / USD)**: captures the rate of the moment on
  bolivar operations, with a live USD preview, manual override, and deterministic protection of the
  historical purchasing power inside monthly budgets against inflation. The field is prefilled with
  the official daily (BCV) rate when you open the movement and keeps following it when the daily
  sync answers later, unless you type a rate of your own.
- **Reconciliation & real balance adjustment**: direct comparison between the book balance and the
  real bank or wallet balance, with atomic adjustment movements and discrepancy calculation.
- **Visual analytics**: interactive SVG donut chart for expense distribution by category, and a Net
  Cash Flow card with the automatic monthly savings rate.
- **Daily quick add (mobile quick-add & FAB)**: ergonomic one-hand floating button, bottom sheet
  with a large numeric touch input, automatic detection of frequent expenses, and PWA Web App
  Shortcuts (`Nuevo Gasto`, `Nuevo Ingreso`). It also records transfers between your own accounts,
  with an editable destination amount when the currencies differ, and lists your templates for a
  one-tap prefill.
- **Monthly budgets**: goals and spending limits per category with dynamic progress bars
  (Green `< 75%`, Yellow `75% - 99%`, Red `>= 100%`) and remaining budget.
- **Savings goals (sinking funds)**: special funds and medium/long-term targets with visual
  progress, remaining amount, deadlines, and deposits/withdrawals straight against bank accounts.
- **Subscriptions & fixed payments**: recurring payments with urgency badges (`Vence hoy`,
  `Vence en X días`), alerts, and atomic charge execution with automatic due-date advance.
  Charges can be paid in another currency or debited from a different account.
- **Movement templates (`/plantillas`)**: each user saves their repeated movements —expense,
  income or a transfer between two of their own accounts— with account, category and optional
  amount. Quick add lists them by recent use; tapping one prefills type, accounts, category, note
  and amount, always editable, and the template is only marked as used once the movement is
  created. **They are not schedulable**: no frequency and no due dates, that stays with
  Subscriptions.
- **Installment debts & Cashea scheme (14 days)**: biweekly financing engine
  (`BIWEEKLY_14_DAYS`), weekly and monthly schemes, with 0% or agreed-rate amortization, a
  chronological breakdown of installments, and automatic payment deadlines.
- **Credit card intelligence**: credit limits, dynamic utilization percentage, available line,
  closing days, payment deadlines, and an estimated monthly minimum payment.
- **Real net worth dashboard & assets/liabilities breakdown**: executive view of total net worth
  after subtracting debts and consumed credit lines, with visibility into available operating
  liquidity.
- **Unified financial calendar**: interactive monthly and weekly views of payment commitments,
  grouping subscriptions, loan/Cashea installments, and card closing and payment dates with
  projected totals.
- **Predictive category suggestions & budget alerts**: smart category autocomplete while you type
  a note, based on history and semantic rules, plus proactive alerts when a category crosses 80%
  (Warning) or 100% (Exceeded) of its budget.
- **Loans & debts engine**: money you lent (_Me Deben / Asset_) and debts you owe (_Debo /
  Liability_), with partial and total amortizations atomically reconciled with the bank, progress
  bars, and outstanding balance calculations.
- **SUNAT tax module (Peru — 4th and 5th category)**: live projection engine for employment income
  (independent workers issuing receipts and employees on payroll). Automatic 20% deduction in 4th
  category, the legal 7 UIT deduction, tracking of deductible expenses up to 3 UIT (restaurants,
  hotels, rent, professional services), progressive brackets from 8% to 30%, and the 8% withholdings
  applied against the balance due or in your favor. See
  [docs/SUNAT_TAX_ARCHITECTURE_GUIDE.md](docs/SUNAT_TAX_ARCHITECTURE_GUIDE.md).
- **Native UI confirmation dialogs**: centralized modal confirmation (`useConfirm`) with no native
  browser alerts or blocks, with contextual variants (`danger`, `warning`, `info`).
- **Precise dates and time zones**: the `DateFormatter` engine strictly preserves the selected
  calendar day (`YYYY-MM-DD`), immune to UTC offsets.
- **Proactive payment reminders**: prominent dashboard banner for subscriptions and services about
  to expire or already overdue, with a direct record-payment action and web notification support.
- **Mass bank statement import (CSV / Excel)**: guided step-by-step importer with automatic
  delimiter and column detection, interactive header mapping, smart duplicate detection, and
  preview with multi-select.
- **Periodic financial reports & AI export**: multi-window analysis with presets (monthly,
  bi-monthly, quarterly, semi-annual, full year, and a custom manual range), Income vs Expenses
  trend chart, official PDF export, CSV export, and a structured Markdown (.md) context download
  formatted with prompts and instructions for AI chats (Gemini, Claude, ChatGPT).
- **Search, filters and CSV export**: real-time text search, combined filters by type, account,
  category and dates, and history export in CSV (RFC 4180).

---

## Tech stack

| Layer           | Technology                                                                                                                        |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`, strict TypeScript)                                                |
| UI components   | [Nuxt UI (`@nuxt/ui`)](https://ui.nuxt.com/) v4, as a Vite plugin                                                                 |
| Styles          | [Tailwind CSS v4](https://tailwindcss.com/) + `@tailwindcss/vite`                                                                 |
| Global state    | [Pinia](https://pinia.vuejs.org/) (setup stores)                                                                                  |
| Routing         | [Vue Router](https://router.vuejs.org/) (`createWebHistory`)                                                                      |
| Offline/PWA     | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (`autoUpdate`)                                                               |
| Build           | [Vite](https://vitejs.dev/) + `vue-tsc`                                                                                           |
| Package manager | [Bun](https://bun.sh/)                                                                                                            |
| Local ports     | [Portless](https://portless.org/) (`PORTLESS_PORT=1355 PORTLESS_HTTPS=0 portless run ...`)                                        |
| Unit tests      | [Vitest](https://vitest.dev/) + jsdom + Vue Test Utils — 65 spec files                                                            |
| E2E tests       | [Playwright](https://playwright.dev/) — 17 specs with an authentication fixture, run on Desktop Chrome and Pixel 7; not run in CI |
| Formatting      | Prettier with the workspace import order (no ESLint)                                                                              |

Architecture, in short: the financial logic lives in pure TypeScript classes under `core/services`,
never inside components. Views and components render and dispatch; Pinia stores connect the UI to
`ApiClient` and the services. `ApiClient` does not import Pinia or the router — the session is
injected at bootstrap through `registerApiAuth`.

---

## Branching and releases

Tique follows GitFlow with two long-lived branches:

| Branch | Role                                                                 |
| :----- | :------------------------------------------------------------------- |
| `dev`  | Integration branch. Ordinary work lands here directly; no PR needed. |
| `main` | Production. It only moves forward through a merged release PR.       |

- `feat/*` and `fix/*` branches start from `dev`. `hotfix/*` starts from `main`, is PR'd back into
  `main`, and then merged into `dev`.
- Changes reach `main` only through a release PR from `dev`. Never push to `main` directly — not
  even on request; the rule says to remind you.
- The version and the release notes come from the `[Unreleased]` section of `CHANGELOG.md`: the
  release PR moves those entries under a new version heading (`## [X.Y.Z] - YYYY-MM-DD`) and tags
  `vX.Y.Z`.
- Merging the release PR into `main` is what publishes the image and creates the GitHub Release.
- Documentation, PRs and changelogs are written in English; the product UI stays in Spanish, and
  the Discord changelog is neutral Spanish.

---

## Deployment

The image is published to GHCR (`ghcr.io/ragehardrack/tique`) by the deploy workflow on every push
to `main`; local builds are never deployed, the VPS pulls the pre-built image.

- **Dockerfile**: build with `oven/bun:1.4-alpine` (the `VITE_API_BASE_URL` build ARG) and served by
  `nginx:alpine` on port 80, with the SPA fallback in `nginx.conf`.
- **Compose**: the service is still named `financiapp` (the container is `lascar-financiapp`), the
  historical name of this product. Run it from the workspace root:

```bash
docker compose up -d financiapp
```

It is reached through nginx-proxy via `VIRTUAL_HOST=${FINANCIAPP_DOMINIO}` and restarted by
Watchtower when a new image lands. See `docs/projects/infra.md` in the workspace for the full
topology.

- **CI** (`.github/workflows/ci.yml`): on push and PR to `main` or `dev`, installs with Bun 1.4 and
  runs `bun run test` and `bun run build`.
