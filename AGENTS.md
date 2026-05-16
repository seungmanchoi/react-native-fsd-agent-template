# AGENTS.md

This file provides Codex guidance for this repository.

## Project Overview

React Native + Expo template with Feature-Sliced Design (FSD) architecture and an AI agent harness for full lifecycle app development.

## Tech Stack

- Framework: React Native 0.81 + Expo 54
- Routing: Expo Router
- State: Zustand for client state, TanStack Query for server state
- Styling: NativeWind
- Forms and validation: React Hook Form + Zod
- API: Axios with token auto-refresh
- TypeScript: strict mode

## Codex Harness Rules

This repository includes Claude-era harness files under `.claude/`. Codex does not execute Claude agents, Claude settings, or Claude permission files as native runtime features. Treat those files as project reference documents only.

When a task maps to a harness role, read the relevant `.claude/agents/*.md` file before implementation and apply the domain rules manually:

| Task Type | Reference |
| --- | --- |
| Idea and market research | `.claude/agents/idea-researcher.md` |
| Product planning and PRD | `.claude/agents/product-planner.md` |
| Specs and task breakdown | `.claude/agents/spec-planner.md` |
| Design system and theme | `.claude/agents/design-architect.md` |
| FSD module scaffolding | `.claude/agents/feature-builder.md` |
| API and state integration | `.claude/agents/api-integrator.md` |
| UI and screens | `.claude/agents/ui-developer.md` |
| Code quality review | `.claude/agents/qa-reviewer.md` |
| Functional and UX inspection | `.claude/agents/app-inspector.md` |

Use Codex skills when they are available for the same workflow:

| Workflow | Codex Skill |
| --- | --- |
| App ideation | `ideate` |
| App planning | `plan-app` |
| Design system | `design-system` |
| FSD feature creation | `create-feature` |
| Entity creation | `create-entity` |
| Screen creation | `create-screen` |
| App inspection | `inspect-app` |
| Full lifecycle app development | `orchestrate` |
| Store deployment | `store-deploy` |

For full app development, follow this pipeline and do not skip QA:

1. Ideation
2. Product planning (must define KPIs — north-star metric + acquisition/activation/retention/monetization)
3. Spec planning and task breakdown
4. Design
5. Implementation
   - 5a feature scaffolding
   - 5b API integration
   - 5c UI screens
   - 5d Firebase Analytics + Crashlytics integration (KPI events from PRD)
6. QA and app inspection
7. Iteration, up to 3 fix loops
8. Deployment through `store-deploy`

Use `_workspace/` for handoff artifacts between phases. Before moving to a later phase, read the previous phase outputs from `_workspace/` and continue from them.

## Hard Thresholds

These are fail conditions:

| Check | Threshold |
| --- | --- |
| `npm run typecheck` errors | 0 |
| `npm run lint` errors | 0 |
| `any` types in production code | 0 |
| FSD layer dependency violations | 0 |
| Missing safe area handling in screens | 0 |
| Missing barrel exports | 0 |
| Broken NativeWind setup | 0 |
| `toISOString().split('T')[0]` for local date | 0 |

### Date and Time Handling

Use `dayjs` for all date and time operations. `dayjs()` returns device local time, which is correct for user-facing dates. Never use `new Date().toISOString().split('T')[0]` as a local date — it returns UTC, which is wrong in UTC+N timezones between midnight and the offset hours.

| Use case | Correct | Forbidden |
| --- | --- | --- |
| Today (YYYY-MM-DD) | `dayjs().format('YYYY-MM-DD')` | `new Date().toISOString().split('T')[0]` |
| N days ago | `dayjs().subtract(N, 'day').format('YYYY-MM-DD')` | Manual Date arithmetic |
| Current hour | `dayjs().hour()` | `new Date().getUTCHours()` |
| Timestamp storage | `new Date().toISOString()` | Local time strings |

Store dates in Zustand as `YYYY-MM-DD` strings or ISO timestamps. Never persist `Date` objects.

After implementation changes, run:

```bash
npm run typecheck
npm run lint
```

Run formatting when code style changes:

```bash
npm run format
```

## iOS Simulator Runbook

This app uses native modules and cannot run in Expo Go:

- `@shopify/react-native-skia`
- `react-native-google-mobile-ads`
- `expo-face-detector`

Use a development build through Expo:

```bash
npx expo run:ios --port 8083
```

Before running iOS:

```bash
node -v
```

Use Node 22.x. Node 24 can crash Expo CLI with `ERR_SOCKET_BAD_PORT`. If needed:

```bash
nvm use 22
```

Check Metro port conflicts:

```bash
lsof -i :8081 | grep LISTEN
```

If 8081 is busy, keep using `--port 8083`.

Check the booted simulator:

```bash
xcrun simctl list devices booted
```

If no simulator is booted, boot an available simulator:

```bash
xcrun simctl boot "iPhone 16 Pro"
```

The `npx expo run:ios --port 8083` command runs prebuild, CocoaPods install, native build, simulator install, and Metro startup.

### iOS Troubleshooting

If the app builds as `x86_64` and fails to install on an arm64 simulator, inspect `ios/Podfile` and generated Pod xcconfig files for `EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64`. Remove the arm64 simulator exclusion when the pods support arm64 simulator builds, then run:

```bash
cd ios
pod install
cd ..
npx expo run:ios --port 8083
```

If MLKit pods from `expo-face-detector` block simulator builds, investigate whether `expo-face-detector` is required for the current run. Do not remove the feature permanently without confirming product impact.

If `RNGoogleMobileAdsModule not found` appears, the app was likely opened in Expo Go. Use `npx expo run:ios` instead.

For a running simulator screenshot:

```bash
xcrun simctl io booted screenshot /tmp/screenshot.png
```

For static checks without building:

```bash
npm run typecheck
npm run lint
```

## ESLint 9 And FlashList v2

- Use ESLint 9 flat config in `eslint.config.js`.
- Do not use `--ext` in the lint script.
- Do not add `estimatedItemSize` to FlashList v2 unless the installed type definitions require it.
- Exclude `_workspace/`, `.claude/`, and `plugins/` from lint and typecheck when they are not production source.

## NativeWind Required Setup

NativeWind requires all of these files to stay aligned:

| File | Required Setting |
| --- | --- |
| `babel.config.js` | `babel-preset-expo` with `jsxImportSource: 'nativewind'`, plus `nativewind/babel` |
| `metro.config.js` | `withNativeWind(config, { input: './global.css' })` |
| `tailwind.config.js` | `presets: [require('nativewind/preset')]`, content paths for `app/` and `src/` |
| `global.css` | Tailwind base, components, utilities imports |
| Root `_layout.tsx` | `import '../global.css';` |
| `nativewind-env.d.ts` | `/// <reference types="nativewind/types" />` |

## Architecture

Use Feature-Sliced Design:

```text
src/
├── core/
├── features/
├── entities/
├── widgets/
└── shared/
    ├── api/
    ├── config/
    ├── lib/
    ├── types/
    └── ui/
```

Dependency direction:

```text
app -> widgets -> features -> entities -> shared
```

Upper layers may reference lower layers only. Lower layers must not import from upper layers.

Feature structure:

```text
features/{name}/
├── api/
├── hooks/
├── store/
├── types/
├── ui/
└── index.ts
```

## Code Conventions

- Do not use `any` in production code.
- Use safe area handling on all screens.
- Prefix interfaces with `I`, type aliases with `T`, and enums with `E`.
- Keep interfaces, types, and enums in separate files when they are shared.
- Use the `@/` alias for app imports.
- Keep public imports behind barrel exports where the local module pattern expects it.

## Analytics And Key Metrics

Every app must collect measurable KPIs from launch. Firebase is the standard.

Required packages:

- `@react-native-firebase/app`
- `@react-native-firebase/analytics`
- `@react-native-firebase/crashlytics`
- `@react-native-firebase/remote-config` (optional)

Standard KPI axes (define all four in the PRD, plus one north-star metric):

| Axis | Examples | Firebase event |
| --- | --- | --- |
| Acquisition | new installs, first open | `first_open` (auto), `app_install` |
| Activation | DAU/WAU, first key action | custom `activation`, `screen_view` (auto) |
| Retention | D1/D7/D30, session length | `session_start`, `user_engagement` (auto) |
| Monetization | ad impressions, IAP revenue, ARPU | `ad_impression` (auto), `purchase` |

Event naming:

- snake_case, verb_noun (`tap_camera_capture`, `view_gallery_grid`)
- Do not reuse Firebase reserved auto-event names.
- Max 25 params per event. Key length ≤ 40, value length ≤ 100.
- Never log PII (email, phone, real name, precise location).

Code layout under FSD:

```text
src/shared/analytics/
├── client.ts           # firebase analytics wrapper — logEvent, setUserProperty
├── events.ts           # event catalog (constants + param types)
├── hooks/
│   └── useScreenTracking.ts
├── types/index.ts
└── index.ts            # barrel export
```

Rules:

- Never call `firebase.analytics()` or `logEvent` directly outside `@/shared/analytics`.
- Define every event name as a constant in `events.ts`. No magic strings.
- Disable collection in dev: gate with `env.IS_PROD`.
- Do not commit `GoogleService-Info.plist` or `google-services.json`. Inject via EAS Secrets and `eas.json` env.

Integration order:

1. Create Firebase project, register iOS and Android apps, download config files.
2. Place config files locally (gitignored), wire EAS Secrets for build-time injection.
3. Install packages, add plugins to `app.config.ts`. Set `useFrameworks: 'static'` for iOS via `expo-build-properties`.
4. Implement `src/shared/analytics/` wrapper, catalog, and screen tracking hook.
5. Initialize Analytics and Crashlytics in root `_layout.tsx` with collection gated on `env.IS_PROD`.
6. Wire events to the KPI map from the PRD.

Hard thresholds for Analytics:

| Check | Threshold |
| --- | --- |
| PRD missing KPI section (north-star + 4 axes) | 0 |
| Direct `firebase.analytics()` calls outside `@/shared/analytics` | 0 |
| `logEvent` called with magic strings (no constant in `events.ts`) | 0 |
| Event params containing PII | 0 |
| Committed `GoogleService-Info.plist` or `google-services.json` | 0 |

## Build And Store Deployment

Use `store-deploy` for store deployment work. Do not use unrelated deployment tooling unless the user explicitly changes this rule.

For production builds:

1. Run a local EAS build first.
2. If local build succeeds, run the cloud EAS build.
3. If cloud credits are unavailable, use the local artifact where appropriate.

Keep `.easignore` configured to exclude unnecessary build archive content such as `node_modules/`, screenshots, generated store assets, docs, scripts, build outputs, Git metadata, IDE metadata, and TypeScript build info.

Store app names and home screen names must match by locale:

- `app.config.ts` `name`
- `app.config.ts` `withLocalizedAppName` plugin values
- `fastlane/metadata/ios/{lang}/name.txt`
- `fastlane/metadata/android/{lang}/title.txt`

Android changelogs must stay within 500 bytes. iOS release notes can be longer, but prefer the Android-safe copy when sharing metadata across stores.

For global store deployment key paths, AdMob setup, package ID rules, localized app names, privacy/support pages, Fastlane conventions, and commit message rules, follow the migrated global Codex rules in:

```text
/Users/seungmanchoi/.codex/global-claude-rules.md
```

## Branch Strategy

```text
main       <- production
devel      <- development
feature/*  <- feature work
```

## Common Commands

```bash
npm install
npm start
npm run ios
npm run android
npm run lint
npm run typecheck
npm run format
```
