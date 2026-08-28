## Exploration: financiapp-bootstrap

### Current State
`financiapp` has just been bootstrapped as a standard Vue 3 + TypeScript template created with Vite.
- `package.json` contains minimal dependencies: `vue` and standard devDependencies (`vite`, `@vitejs/plugin-vue`, `typescript`, `vue-tsc`).
- `src/` directory has a flat structure: `App.vue`, `main.ts`, `style.css`, a default `components/HelloWorld.vue`, and a few static files.
- Build and development workflows are configured using standard Vite scripts, with `portless` mapped for local domains.

### Affected Areas
- `package.json` — Add Pinia, TailwindCSS v4, Vitest, unplugin-auto-import, unplugin-vue-components, and vite-plugin-pwa.
- `vite.config.ts` — Configure Tailwind v4 Vite plugin, AutoImports, Vue Components, PWA plugin, and Vitest test block.
- `tsconfig.app.json` / `tsconfig.json` — Add types for Vitest, unplugin-auto-import, and vite-plugin-pwa.
- `src/` — Reorganize into a clean architecture with core, infrastructure, and presentation layers.
- `src/main.ts` — Bootstrap Pinia and register PWA update/register flow.
- `src/style.css` — Configure Tailwind CSS v4 `@import` directive.

### Approaches

#### 1. Clean Architecture (Recommended)
Decouples the core domain models and business/financial rules from Vue's reactivity system and components.
- **Pros**:
  - High testability: pure TS core/services can be tested in isolation with 100% test coverage using standard Vitest unit tests (no mounting needed).
  - High maintainability: changes in APIs, storage, or financial formulas only affect infrastructure or core layers, keeping the presentation layer clean.
  - Better typing discipline: strict boundaries prevent mixing framework reactivity and complex calculations.
- **Cons**:
  - Slightly higher setup complexity (more folders and interface/service files).
  - Minor learning curve for developers accustomed to flat/simple Vue templates.
- **Effort**: Medium

#### 2. Flat Vue Structure (Standard template)
Puts all state in Pinia stores under `src/stores/`, business/financial logic in Vue composables (`src/composables/`), and all UI components under `src/components/` and `src/views/`.
- **Pros**:
  - Simpler, faster initial setup.
  - Very familiar to typical Vue developers.
- **Cons**:
  - Harder to test: business logic is bound to Vue's reactivity or composables, requiring mounting or Vue context mocking in tests.
  - Tighter coupling: financial calculations can easily leak into components or Vue-specific stores.
- **Effort**: Low

### Recommendation
Adopt **Approach 1 (Clean Architecture)**. In a financial application like `financiapp`, accuracy and robust testing of interest calculations, balance sheets, and budget logic are critical. Isolating these rules in pure TS classes within `src/core/services/` ensures they remain robust, easily testable, and completely decoupled from future UI modifications.

### Folder Structure Proposal
The proposed file hierarchy is as follows:
```
financiapp/
├── src/
│   ├── core/                  # Domain/Business Logic layer (Framework-agnostic, pure TS)
│   │   ├── entities/          # Pure TypeScript interfaces for financial models (Transaction, Account, Budget)
│   │   ├── services/          # Pure TypeScript business logic and calculations (e.g. InterestCalculator, BudgetEnforcer)
│   │   └── repositories/      # Core interfaces/contracts for data persistence/fetch (e.g. ITransactionRepository)
│   ├── infrastructure/        # External services implementations (framework-agnostic or Vue-agnostic logic)
│   │   ├── api/               # API clients, Axios/Fetch implementations, mock APIs
│   │   ├── storage/           # LocalStorage/IndexedDB adapters for offline caching
│   │   └── repositories/      # Implementations of core/repositories contracts (e.g. ApiTransactionRepository)
│   ├── presentation/          # Presentation layer (Vue-specific)
│   │   ├── assets/            # Tailwind styles, logo assets, visual styles
│   │   ├── components/        # Vue UI components
│   │   │   ├── base/          # Reusable atomic UI (Button, Input, Dropdown, Modal)
│   │   │   ├── features/      # Feature components (TransactionList, BudgetChart, AccountSelector)
│   │   │   └── layout/        # Shell components (Sidebar, Topbar, MainLayout)
│   │   ├── composables/       # Vue Composition API composables (e.g., useTheme, useNetworkStatus)
│   │   ├── router/            # Vue Router config (routes, navigation guards)
│   │   ├── store/             # Pinia state stores (act as bridges invoking Core Services)
│   │   └── views/             # Page components (DashboardView.vue, TransactionsView.vue, SettingsView.vue)
│   ├── App.vue                # Main application wrapper
│   └── main.ts                # Application bootstrapper (mounts App, registers Pinia/Router)
```

### Tooling Setup & Integration

#### 1. Tailwind CSS v4 (Vite Integration)
Install packages:
`bun add tailwindcss @tailwindcss/vite`

Vite config:
```typescript
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
})
```

Inside CSS:
```css
@import "tailwindcss";

/* Theme overrides are defined directly in CSS using @theme block in v4 */
@theme {
  --color-brand-primary: #0284c7;
  --color-brand-secondary: #0f172a;
}
```

#### 2. Pinia
Install packages:
`bun add pinia`

Register in `src/main.ts`:
```typescript
import { createPinia } from 'pinia'
const app = createApp(App)
app.use(createPinia())
```

#### 3. Auto Imports
Install packages:
`bun add -d unplugin-auto-import unplugin-vue-components`

Vite config:
```typescript
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    // ...
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      dirs: ['src/presentation/components'],
      dts: 'src/components.d.ts',
    }),
  ],
})
```

#### 4. PWA (vite-plugin-pwa)
Install packages:
`bun add -d vite-plugin-pwa`

Vite config:
```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // ...
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'FinanciApp',
        short_name: 'FinanciApp',
        description: 'Personal Finance Tracker',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

#### 5. Vitest
Install packages:
`bun add -d vitest jsdom @vue/test-utils`

Vite config:
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

### Risks
- **Over-engineering**: Creating too many layers for simple features (e.g. static views). We can mitigate this by keeping the `core/use-cases` layer optional and focusing on entity models and services.
- **Integration of v4 Tailwind**: Tailwind v4 is relatively new and changes the theme configuration mechanism from JavaScript files (`tailwind.config.js`) to CSS variables. We will handle custom colors and themes directly in `style.css` using the `@theme` directive to align with the new spec.
- **Auto-Imports Complexity**: Using `unplugin-auto-import` can hide where functions come from, which might confuse IDE autocompletion or new developers. Explicitly generating `src/auto-imports.d.ts` and configuring it in `tsconfig.app.json` mitigates this.

### Ready for Proposal
Yes. The setup layout is clearly defined and ready to be built out. The orchestrator can proceed with proposing the package installs and config files edits.
