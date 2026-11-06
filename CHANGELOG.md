# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.0] - 2026-11-06

### Changed

- **api**: every request now carries the session token, so the backend reads the user from the token instead of from the URL or the body.
- **auth**: an expired session signs you out and returns you to the login screen; a rejected password without a token still shows a normal error.

## [0.6.0] - 2026-11-06

### Added

- **templates**: new movement templates view (`/plantillas`) where you save your recurring expenses, income or transfers between your own accounts, with account, category and optional amount.
- **quick-add**: record transfers between your own accounts, with the destination amount editable when the currencies differ.
- **quick-add**: your templates are listed by recent use and one tap prefills type, accounts, category, note and amount, always editable; a template is only marked as used once the movement exists.

## [0.5.2] - 2026-10-26

### Fixed

- **transactions**: the VES exchange rate is prefilled with the official daily (BCV) rate again when you open a movement, and it keeps following the official value until you type a rate of your own.
- **rates**: official rates are fetched at most once a day and refreshed when a transaction form opens, so a late response no longer leaves the field stuck on a stale value.

## [0.5.1] - 2026-10-09

### Fixed

- **pwa**: the service worker updates itself instead of staying pinned to the previous precached bundle when you dismiss the update prompt.

## [0.5.0] - 2026-10-08

### Changed

- **budgets**: the current month follows the calendar rollover automatically, without needing to reload the app.

### Fixed

- **budgets**: per-category spending and overspend alerts are limited to the month of the movement instead of summing the whole history.

## [0.4.0] - 2026-09-26

### Added

- **reports**: export an AI-ready Markdown context, formatted with prompts and instructions, to analyze your finances in a chat (Gemini, Claude, ChatGPT).

## [0.3.2] - 2026-09-24

### Fixed

- **layout**: the sidebar stays sticky while scrolling again, after replacing `overflow-x-hidden` with `overflow-x-clip`.

## [0.3.1] - 2026-09-17

### Fixed

- **calendar**: multi-currency amounts are converted in the calendar totals, and subscription estimates are shown converted into the base currency.

## [0.3.0] - 2026-09-17

### Added

- **subscriptions**: a smart pay modal to charge a subscription in another currency or debited from a different account.

## [0.2.0] - 2026-09-17

### Added

- **goals**: savings capacity calculator and purchase timeline simulator.

## [0.1.1] - 2026-09-17

### Fixed

- **subscriptions**: due dates share the reminder calculation, so they no longer shift by a day across time zones.

## [0.1.0] - 2026-09-17

### Added

- **app**: first release of Tique as an installable PWA (Vue 3, Vite, Nuxt UI, Tailwind CSS) covering accounts, movements, budgets, savings goals, subscriptions, loans, categories, reports, admin user management and the SUNAT tax module.
- **accounts**: multi-currency bank accounts, wallets and cash with live conversion to the base currency (USD, PEN, VES) and reconciliation against the real balance.
- **transactions**: transaction-level exchange rates with a live USD preview for VES movements, multi-currency transfers between your own accounts, and search and filters for general or uncategorized movements.
- **finance**: installment plans, credit cards with limit and utilization tracking, and the unified financial calendar.
- **budgets**: monthly 50/30/20 budget planning with progress bars and overspend alerts.
- **goals**: priority classification, badges and sorting for savings goals.
- **analytics**: constrained category distribution layout with a responsive Top 5 + Others breakdown sheet.
- **dates**: dayjs-based date engine that preserves the selected calendar day (`YYYY-MM-DD`) across time zones.
- **navigation**: mobile-first navigation shell, optimized top header and 7-day responsive calendar.
- **preferences**: the base currency you choose is persisted and restored across sessions.
- **reports**: periodic reports with PDF and CSV export.
- **categories**: custom searchable select that no longer traps focus inside modals, plus predictive category suggestions.
- **ui**: centralized confirmation dialogs instead of native browser alerts.

### Fixed

- **build**: the production `VITE_API_BASE_URL` is injected into the Docker image build.
- **reports**: analytics, reports and exports use the exchange rate recorded on each transaction.
- **transactions**: a cleared category is sent as `null` instead of being left undefined, and tax metadata is synced and reset when the category changes.
- **transactions**: deleting a movement from the list works again.
- **api**: delete requests no longer send a `Content-Type` header the server rejected.
- **budgets**: multi-currency transactions are normalized and alert wording is cleaned up.
- **tax**: the SUNAT module is only visible to active users with a Peru tax profile.
