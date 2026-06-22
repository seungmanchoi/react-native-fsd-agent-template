<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Feature--Sliced_Design-FSD-orange?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Harness-purple?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Agents-10_Specialists-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Skills-9_Workflows-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Pattern-Pipeline-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Vibe_Coding-AI_Driven-ff69b4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Harness_Engineering-Production-red?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo_Router-6-000020?style=flat-square&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Zustand-5-433E38?style=flat-square&logo=zustand&logoColor=white" />
  <img src="https://img.shields.io/badge/TanStack_Query-5-FF4154?style=flat-square&logo=reactquery&logoColor=white" />
  <img src="https://img.shields.io/badge/NativeWind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Axios-1.x-5A29E4?style=flat-square&logo=axios&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Hook_Form-7-EC5990?style=flat-square&logo=reacthookform&logoColor=white" />
  <img src="https://img.shields.io/badge/Zod-4-3E67B1?style=flat-square&logo=zod&logoColor=white" />
  <img src="https://img.shields.io/badge/ESLint-9-4B32C3?style=flat-square&logo=eslint&logoColor=white" />
  <img src="https://img.shields.io/badge/Prettier-3-F7B93E?style=flat-square&logo=prettier&logoColor=black" />
  <img src="https://img.shields.io/badge/EAS_Build-CLI-000020?style=flat-square&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Reanimated-4-6236FF?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Lottie-7-00DDB3?style=flat-square&logo=airbnb&logoColor=white" />
  <img src="https://img.shields.io/badge/Flash_List-2-FF6C37?style=flat-square&logo=shopify&logoColor=white" />
  <img src="https://img.shields.io/badge/Bottom_Sheet-5-000000?style=flat-square" />
  <img src="https://img.shields.io/badge/Day.js-1.11-FF5F4C?style=flat-square" />
  <img src="https://img.shields.io/badge/Firebase_Analytics-24-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/AdMob-16-EA4335?style=flat-square&logo=googleads&logoColor=white" />
  <img src="https://img.shields.io/badge/SecureStore-Keychain%20%7C%20Keystore-4630EB?style=flat-square&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Vitest-4-6E9F18?style=flat-square&logo=vitest&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/node-%3E%3D24-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
</p>

**English** | [한국어](./README.ko.md)

# React Native FSD Agent Template

A React Native + Expo + Feature-Sliced Design production template that supports AI agent-based full-lifecycle development.

> **What makes this different?** This template includes 10 Claude Code agents and 9 skills that understand FSD architecture rules. With a single "Make an app" command, the entire pipeline—from ideation to market research, planning, design system, FSD module scaffolding, API integration, screen development, and QA verification—runs automatically. After launch, a **continuous improvement loop** (`/iterate-app`) keeps shipping: it diagnoses the current state, recommends the next highest-value enhancement (ranked by KPI gap, tech debt, and coverage), builds one slice, verifies it, and recommends what to build next.

---

## Full Pipeline

```
Phase 1: Ideation       idea-researcher   Market research, competitor analysis, idea generation
           │
Phase 2: Planning       product-planner   PRD, user stories, FSD module map design
           │
Phase 2.5: Spec Planning  spec-planner    Feature spec docs, phase/task decomposition, progress tracking
           │
Phase 3: Design         design-architect  NativeWind theme, screen layouts
           │
Phase 4: Implementation (Sequential + spec task check)
  4a       feature-builder   FSD modules, Zustand store, TypeScript types
  4b       api-integrator    Axios client, TanStack Query hooks
  4c       ui-developer      Expo Router screens, NativeWind UI
           │
Phase 5: QA (Parallel)
  5a       qa-reviewer       Code quality, TypeScript strict, FSD rules
  5b       app-inspector     Functional/UX inspection, Safe Area, accessibility
           │
Phase 6: Iteration      Fix Loop (max 3 times, pre-launch convergence)
           │
Phase 7: Deployment     /store-deploy → EAS Build → App Store / Google Play
═══════════════════════════════════════════════════════════════════════
Post-launch Continuous Improvement Loop (repeat):
  Assess → Recommend next → Develop one slice → Verify → Reflect
           loop-engineer  (/iterate-app)
```

Data Flow: Context between agents is passed through the `_workspace/` directory. After launch, incremental work uses the `/iterate-app` loop instead of re-running the one-shot pipeline.

---

## Agent Team

| Agent | Role | Trigger |
|---------|-----|-------|
| **idea-researcher** | Market research, app idea generation | "Find app ideas" |
| **product-planner** | PRD, FSD module map, user stories | "Plan the app" |
| **spec-planner** | Feature spec docs, phase/task decomposition, progress tracking | Auto after Phase 2 |
| **design-architect** | Design system, NativeWind theme | "Create design system" |
| **feature-builder** | FSD module scaffolding | "Create feature/entity" |
| **api-integrator** | Axios + TanStack Query + Zustand | "Integrate API" |
| **ui-developer** | NativeWind screens & UI components | "Create screens" |
| **qa-reviewer** | Code quality, TypeScript, FSD rules | Auto at each Phase |
| **app-inspector** | Functional/UX inspection, Safe Area, accessibility | "Inspect app" |
| **loop-engineer** | Post-launch continuous improvement loop, next-enhancement recommendation (KPI gap / tech-debt / coverage ranking) | "What's next" / "iterate" |

---

## Skills

| Skill | Command | Description |
|-----|-------|-----|
| `ideate` | "Find app ideas" | Market research and idea generation |
| `plan-app` | "Plan the app" | PRD writing and FSD module map design |
| `design-system` | "Create design system" | NativeWind theme and screen layout |
| `create-feature` | "Create feature" | FSD feature module scaffolding |
| `create-entity` | "Create entity" | FSD entity domain model creation |
| `create-screen` | "Add screen" | Expo Router screen creation |
| `inspect-app` | "Inspect app" | Full functional/UX inspection |
| `orchestrate` | "Make an app" | Full pipeline orchestration (one-shot build) |
| `iterate-app` | "What's next" / "Improve it" | Post-launch develop → verify → recommend-next loop |

---

## Architecture Pattern

The pipeline mixes two patterns:

- **Phase 1–2**: Sequential Pipeline — Output of each agent becomes input for the next.
- **Phase 2.5**: Spec Planning — PRD is decomposed into feature-specific phases/tasks in `docs/specs/`. This serves as the baseline for implementation tracking.
- **Phase 3**: Design — Design system, theme, and screen layout design.
- **Phase 4**: Fan-out (Sequential) — feature-builder → api-integrator → ui-developer. **Update spec checkboxes on task completion**.
- **Phase 5**: Parallel Execution — qa-reviewer and app-inspector inspect simultaneously.
- **Phase 6**: Fix Loop — Up to 3 iterations (pre-launch convergence); unresolved issues marked as TODO.
- **Post-launch**: Continuous Improvement Loop (`/iterate-app`) — Assess → Recommend next → Develop one slice → Verify → Reflect, repeating. Driven by `loop-engineer`; does **not** re-run the full pipeline. See `.claude/skills/orchestrate/references/loop-engineering.md`.

### Harness Design Principles

Designed based on [Anthropic's official Harness Engineering Guide](https://www.anthropic.com/engineering/harness-design-long-running-apps) and [revfactory/harness](https://github.com/revfactory/harness).

| Principle | Description |
|------|------|
| **Context Reset** | Save artifacts in `_workspace/` between phases then reset context. More effective than compaction. |
| **Sprint-based Decomposition** | Feature-level sprints in Phase 4. Implement → Evaluate → Fix for each sprint. |
| **Independent Evaluator** | Separate Generator (builder/integrator/developer) and Evaluator (reviewer/inspector). |
| **Hard Threshold** | Strict pass/fail criteria. 0 typecheck errors, 0 any types, 0 FSD violations. |
| **4-Axis Design Evaluation** | Design Quality (30%), Originality (25%), Craft (25%), Functionality (20%). |
| **Design Guardrails** | Use Do's & Don'ts to prevent off-brand AI choices. |
| **Active Testing** | Static analysis + `npm run typecheck/lint` + circular dependency detection. |
| **Continuous Improvement Loop** | Post-launch: develop → verify → recommend-next, one slice per cycle, ranked by KPI gap / value / effort / debt / coverage. |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React Native 0.81 + Expo 54 |
| Language | TypeScript 5.9 (strict mode) |
| Routing | Expo Router 6 (file-based) |
| Global State | Zustand 5 |
| Server State | TanStack Query 5 |
| Styling | NativeWind 4 (Tailwind CSS 3.4) |
| Form & Validation | React Hook Form 7 + Zod 4 |
| API Client | Axios (auto token refresh) |
| Animation | Reanimated 4 + Lottie 7 |
| List | FlashList 2 (Shopify) |
| Bottom Sheet | @gorhom/bottom-sheet 5 |
| Date | Day.js |
| Lint & Format | ESLint 9 + Prettier 3 |
| Testing | Vitest 4 |
| Ads | react-native-google-mobile-ads 16 (UMP consent + ATT) |
| Analytics | Firebase Analytics 24 (adapter, auto no-op on Expo Go) |
| Secure Storage | expo-secure-store (Keychain / Keystore) |
| In-App Review | expo-store-review (policy-gated) |
| i18n | i18n-js |
| Build & Deploy | EAS Build / EAS Submit |

---

## Production Modules

Beyond the agent harness, the template ships with **production-ready modules already wired up** for monetization, measurement, and secure auth. Each follows FSD layering and a single-entry-point rule.

### Ads — AdMob (`src/features/ads/`)

UMP (GDPR) consent, iOS ATT, and SDK init run in the **mandatory order**. The root layout awaits **only** `initializeAdsWithConsent()`:

```tsx
// app/_layout.tsx
import { initializeAdsWithConsent } from '@features/ads';
useEffect(() => { void initializeAdsWithConsent(); }, []);
```

```
UMP (GDPR) consent  →  iOS ATT prompt  →  mobileAds().initialize()
```

- Hooks: `useInterstitialAd`, `useRewardedAd`, `useAppOpenAd`, `useAdLifecycle`, `usePremiumGuard`
- Components: `AdBanner`, `AdDevPanel` (dev-only test panel)
- Frequency caps & premium gating via `useAdStore` / `usePremiumStore` (Zustand)
- Dev uses Google **test ad units**; production uses real IDs in `src/shared/config/ads.ts`
- **Never** place ads right before a key action or on a camera/core screen

### Analytics — Firebase (`src/shared/lib/analytics/`)

A thin wrapper with a **Firebase / no-op adapter** — on Expo Go (no native module) it falls back to a no-op automatically, and collection is off in dev.

```ts
import { initAnalytics, logEvent, logScreenView } from '@shared/lib/analytics';
```

- Use the wrapper only — never call `firebase.analytics()` directly
- Event names live in `EAnalyticsEvent` (no magic strings); never put PII in params

### Secure Token Storage (`src/shared/api/client.ts`)

Auth tokens are kept in **Keychain / Keystore via `expo-secure-store`** (`tokenManager`), never in plaintext AsyncStorage. The Axios client auto-refreshes on `401` and queues concurrent requests until the new token arrives.

```ts
import { api, tokenManager, setAuthFailureCallback } from '@shared/api';
```

### In-App Review (`src/shared/store-review/`)

Store-rating prompts are gated by a central policy engine — never call `expo-store-review` directly. `maybeRequest()` fires only when **every** gate passes (3+ days installed, 5+ launches, 3+ key actions, 90+ days since last ask, ≤3/year, 120s post-launch cooldown, UI idle, no recent error).

```ts
import { useStoreReview, REVIEW_TRIGGERS } from '@shared/store-review';
const { maybeRequest } = useStoreReview();
// In a positive action's success callback, while the UI is idle:
await maybeRequest(REVIEW_TRIGGERS.AFTER_TASK_COMPLETE, { uiIsIdle: true });
```

- Policy engine (`canRequestReview`) is a pure, unit-tested function (`policy.test.ts`)
- Trigger IDs come from `REVIEW_TRIGGERS` only (no magic strings); each request logs `request_store_review`
- Counters persist in AsyncStorage (non-sensitive); `recordLaunch()` runs in `_layout.tsx`
- Thresholds & call sites are app-specific — wire them per your PRD

### Config Plugins (`plugins/`)

| Plugin | Role |
|--------|------|
| `withRNFirebaseStaticBuild` | Patches the RN 0.81 + New Arch + static-frameworks iOS build (fixes 3 known errors automatically) |
| `withLocalizedAppName` | Localized home-screen app name (iOS `InfoPlist.strings` / Android `strings.xml`) |
| `withLocalizedAttDescription` | Localized iOS ATT prompt message (no-op on Android) |

---

## Getting Started

### 1. Using the Template

Click the **"Use this template"** button on GitHub or:

```bash
gh repo create my-app --template seungmanchoi/react-native-fsd-agent-template --clone
cd my-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env
```

Edit the `.env` file to set your API URL, etc.

### 4. Running the App

```bash
npm start          # Expo Dev Server (LAN)
npm run ios        # iOS Simulator
npm run android    # Android Emulator
```

### 5. Using AI Agent Harness (Claude Code)

```bash
# Full Pipeline — Make an app from scratch
"Make a coffee subscription app"

# Individual Skills — Add specific features
"Add product list/detail feature. API endpoint is /products"

# → feature-builder: scaffolding src/features/product/
# → api-integrator: creating API functions + useProducts hooks
# → ui-developer: creating product list/detail screens
# → qa-reviewer: FSD rules + type validation
```

---

## Project Structure

```
.
├── .claude/
│   ├── agents/                         # AI Agent definitions
│   │   ├── idea-researcher.md          # Market research, idea generation
│   │   ├── product-planner.md          # PRD, FSD module map
│   │   ├── design-architect.md         # Design system, layouts
│   │   ├── feature-builder.md          # FSD module scaffolding
│   │   ├── api-integrator.md           # API + state management
│   │   ├── ui-developer.md             # UI/Screen development
│   │   ├── spec-planner.md             # Spec docs, phase/task decomposition
│   │   ├── qa-reviewer.md              # Code quality assurance
│   │   ├── app-inspector.md            # Functional/UX inspection
│   │   └── loop-engineer.md            # Post-launch improvement loop, next-enhancement recommendation
│   └── skills/                         # AI Skills
│       ├── ideate/                     # Ideation
│       ├── plan-app/                   # App planning
│       ├── design-system/              # Design system
│       ├── create-feature/             # Feature scaffolding
│       ├── create-entity/              # Entity scaffolding
│       ├── create-screen/              # Screen creation
│       ├── inspect-app/                # App inspection
│       ├── iterate-app/                # Post-launch continuous improvement loop
│       └── orchestrate/                # Full pipeline orchestration
│           └── references/             # harness-principles, loop-engineering, deploy-build-troubleshooting
│
├── docs/
│   ├── specs/                         # Feature spec docs (spec-planner output)
│   │   ├── README.md                  # Progress dashboard
│   │   └── {NN}-{feature}/            # Feature-specific phase files
│   │       ├── phase1-mvp.md
│   │       └── phase2-enhancement.md
│   └── troubleshooting.md             # Build/runtime troubleshooting
│
├── _workspace/                         # Data exchange between agents
│   ├── idea/                           # Phase 1 output
│   ├── plan/                           # Phase 2 output
│   ├── design/                         # Phase 3 output
│   ├── implementation/                 # Phase 4 output
│   └── qa/                             # Phase 5 output
│
├── app/                                # Expo Router (file-based routing)
│   ├── _layout.tsx                     # Root layout (providers + ads/analytics init)
│   ├── (auth)/                         # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   └── (tabs)/                         # Tab group (authenticated)
│       ├── _layout.tsx                 # Bottom tabs
│       ├── index.tsx
│       ├── explore.tsx
│       └── profile.tsx
│
├── src/
│   ├── core/                           # App initialization
│   │   └── providers/                  # QueryProvider, ThemeProvider
│   │
│   ├── features/                       # Business logic features
│   │   ├── auth/                       # Example: authentication
│   │   │   ├── api/                    # API calls
│   │   │   ├── hooks/                  # useLogin, useSignup
│   │   │   ├── types/                  # ILoginRequest, ILoginResponse
│   │   │   └── index.ts                # Public API
│   │   └── ads/                        # AdMob: UMP+ATT consent, ad hooks, premium store
│   │       ├── lib/consent.ts          # initializeAdsWithConsent (UMP→ATT→init)
│   │       ├── hooks/                  # useInterstitialAd, useRewardedAd, useAppOpenAd
│   │       ├── ui/                     # AdBanner, AdDevPanel
│   │       ├── store/                  # ad / premium Zustand stores
│   │       └── index.ts
│   │
│   ├── entities/                       # Domain models
│   │   └── user/                       # Example: user entity
│   │       ├── api/                    # User API
│   │       ├── store/                  # Zustand store
│   │       ├── types/                  # IUser
│   │       └── index.ts                # Public API
│   │
│   ├── widgets/                        # Independent UI blocks
│   │
│   └── shared/                         # Shared code
│       ├── api/                        # Axios client + tokenManager (SecureStore) + 401 refresh
│       ├── config/                     # env, theme, ads (ad unit IDs)
│       ├── lib/
│       │   └── analytics/              # Firebase + no-op adapter (initAnalytics, logEvent)
│       ├── store-review/               # In-app review policy engine + counters
│       ├── types/                      # Common types
│       └── ui/                         # UI components
│
├── plugins/                            # Expo config plugins
│   ├── withRNFirebaseStaticBuild.js    # RN 0.81 + New Arch iOS build patch
│   ├── withLocalizedAppName.js         # Localized home-screen app name
│   └── withLocalizedAttDescription.js  # Localized iOS ATT prompt
├── firebase/                           # GoogleService-*.{plist,json} (gitignored)
├── app.config.ts                       # Expo config (dynamic)
├── tailwind.config.js                  # NativeWind/Tailwind config
├── tsconfig.json                       # TypeScript (path aliases)
├── eslint.config.js                    # ESLint 9 Flat Config
├── vitest.config.ts                    # Vitest test runner config
├── .prettierrc.js                      # Prettier rules
├── eas.json                            # EAS Build profiles
└── CLAUDE.md                           # Claude Code instructions
```

---

## FSD Architecture

**Feature-Sliced Design** is an architectural methodology for organizing frontend code by business domains.

### Layer Hierarchy

```
app (routing) → widgets → features → entities → shared
```

Upper layers can only reference lower layers. Direct references between the same level are prohibited.

### Adding a New Feature

```
src/features/my-feature/
├── api/
│   ├── my-feature.api.ts       # API calls
│   └── index.ts
├── hooks/
│   ├── use-my-feature.ts       # Custom hooks
│   └── index.ts
├── store/                      # (optional) Zustand store
│   ├── my-feature.store.ts
│   └── index.ts
├── types/
│   ├── my-feature.types.ts     # Interfaces, types
│   └── index.ts
├── ui/                         # (optional) Feature-specific UI
│   ├── MyComponent.tsx
│   └── index.ts
└── index.ts                    # Public API (barrel export)
```

### Adding a New Entity

```
src/entities/my-entity/
├── api/                        # Entity API
├── store/                      # Zustand store
├── types/                      # IMyEntity
└── index.ts                    # Public API
```

---

## Path Aliases

| Alias | Path |
|-------|------|
| `@/*` | `./src/*` |
| `@core/*` | `./src/core/*` |
| `@features/*` | `./src/features/*` |
| `@entities/*` | `./src/entities/*` |
| `@widgets/*` | `./src/widgets/*` |
| `@shared/*` | `./src/shared/*` |

```typescript
// Example
import { Button } from '@shared/ui';
import { useLogin } from '@features/auth';
import { useUserStore } from '@entities/user';
```

---

## Available Scripts

```bash
npm start                 # Dev server (LAN mode)
npm run start:local       # Dev server (localhost)
npm run start:tunnel      # Dev server (tunnel)
npm run ios               # Run on iOS
npm run android           # Run on Android
npm run web               # Run on Web
npm run lint              # ESLint 9 check
npm test                  # Vitest unit tests (run once)
npm run test:watch        # Vitest watch mode
npm run typecheck         # TypeScript check
npm run format            # Prettier format
npm run eas:build:dev     # EAS development build
npm run eas:build:preview # EAS preview build
npm run eas:build:prod    # EAS production build
npm run eas:update        # EAS Update (preview branch)
```

---

## Customization

### 1. App Name and Identifier

Edit in `app.config.ts`:

```typescript
name: 'MyApp',              // App name
slug: 'my-app',             // URL slug
scheme: 'myapp',            // Deep link scheme
// iOS
bundleIdentifier: 'com.myapp.app',
// Android
package: 'com.myapp.app',
```

### 2. Theme Colors

Change primary colors in `tailwind.config.js`:

```javascript
colors: {
  primary: {
    500: '#your-color',
    // ...
  },
},
```

Edit detailed theme in `src/shared/config/theme.ts`.

### 3. API URL

`.env` file:

```
API_URL=http://your-api-server:3000
```

### 4. EAS Build Setup

```bash
eas build:configure    # Initial EAS setup
```

Edit build profiles in `eas.json`.

---

## Environment Variables

App config flows through `app.config.ts` → `extra` → `src/shared/config/env.ts`.

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `http://localhost:3000/api/v1` | Backend base URL |
| `NODE_ENV` | `development` | Environment mode |
| `DEBUG` | `false` | Debug flag |
| `LOG_LEVEL` | `debug` | Log verbosity |
| `APP_VERSION` | `1.0.0` | App version (iOS/Android) |

**Firebase secrets** — never commit them (kept in `firebase/`, gitignored):

| Variable | File |
|----------|------|
| `GOOGLE_SERVICE_INFO_PLIST` | `firebase/GoogleService-Info.plist` (iOS) |
| `GOOGLE_SERVICES_JSON` | `firebase/google-services.json` (Android) |

For EAS cloud builds, inject them as secrets:

```bash
eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --type file --value ./firebase/GoogleService-Info.plist
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./firebase/google-services.json
```

---

## Testing

```bash
npm test            # Vitest, run once
npm run test:watch  # Vitest, watch mode
```

- Test files live next to source as `src/**/*.test.ts(x)`
- `npm run typecheck` (0 errors) and `npm run lint` (0 errors) are **Hard Threshold** gates — see `CLAUDE.md`

---

## Naming Conventions

| Type | Prefix | Example |
|------|--------|---------|
| Interface | `I` | `IUserState` |
| Type | `T` | `TButtonVariant` |
| Enum | `E` | `EUserRole` |
| Hook | `use-` | `use-login.ts` |
| Component | PascalCase | `Button.tsx` |
| Util | camelCase | `auth-utils.ts` |

---

## Branch Strategy

```
main      ← Production
  ^
devel     ← Development (default)
  ^
feature/* ← Feature branches
```

---

## Build & Deploy Optimization

### EAS Build Sequence (Mandatory)

```
1. eas build --local        ← Check for build errors locally first
2. eas build                ← Proceed to cloud build after success
3. eas submit               ← Submit to store
```

> Since cloud build credits are limited, catch Gradle/Xcode errors locally first.

### EAS Build Profiles (`eas.json`)

| Profile | Use |
|---------|-----|
| `development-simulator` | iOS Simulator dev build |
| `development` | On-device dev build (dev client) |
| `preview` | Internal distribution |
| `production` | Store release (auto-increments build number) |

### iOS — Firebase Static Build

RN Firebase + RN 0.81 + New Architecture + static frameworks triggers 3 known iOS build errors. The bundled **`withRNFirebaseStaticBuild`** plugin fixes all of them automatically — keep it in `app.config.ts` plugins and run `npx expo prebuild --clean`. See [`docs/troubleshooting.md`](./docs/troubleshooting.md) and `CLAUDE.md` for details.

### .easignore Setup

Exclude unnecessary files from the build archive to reduce upload time:

```
node_modules/
assets/store-screenshots/
fastlane/
scripts/
build-output/
_workspace/
.claude/
plugins/
.git/
.idea/
.vscode/
*.md
```

### App Size Optimization

| Optimization Item | Method | Effect |
|------------|------|------|
| **Image Format** | PNG → WebP, optimal resolution | 50%+ reduction in assets |
| **Unused Fonts** | Remove unnecessary `@expo-google-fonts/*` | 0.5-2MB per font |
| **Unused Packages** | Check `npm ls` and remove | Bundle size reduction |
| **Lottie Optimization** | Remove unnecessary layers, check file size | Potential 1-5MB reduction |

### Android Production Access (Personal Accounts)

Personal Google Play accounts must pass a **Production Access Application** before a new app can go to the production track — after meeting the closed-testing gate (**12+ testers × 14+ days**). The application is a 3-step survey (closed-testing info / app info / production readiness), reviewed by Google (usually within 7 days, emailed to the account owner).

During Phase 7, the **api-integrator** agent fills and submits this survey via Playwright MCP. Answers are written from the developer's **real facts (never fabricated)** following the canonical guide:

- Guide: [`.claude/skills/orchestrate/references/play-production-access-application.md`](./.claude/skills/orchestrate/references/play-production-access-application.md) — full question list, radio options, answer-writing principles, facts checklist, and a worked example.

After approval, promote the already-tested closed-testing (alpha) build to production in the console — no rebuild needed.

---

## Inspired By

- **[revfactory/harness](https://github.com/revfactory/harness)** — Agent Team & Skill Architect meta-skill. Origin of agent team composition, pipeline patterns, and `_workspace/` data flow.
- **[Anthropic Harness Design](https://www.anthropic.com/engineering/harness-design-long-running-apps)** — Official design guide for long-running agent tasks, including Context Reset, Sprint decomposition, Hard Thresholds, and Independent Evaluators.
- **[Feature-Sliced Design](https://feature-sliced.design/)** — Frontend architecture methodology.

---

## License

MIT
