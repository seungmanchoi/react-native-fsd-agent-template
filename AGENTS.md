# AGENTS.md

Codex entry point for this repository. **The single source of truth is `CLAUDE.md` — read it in full before starting any task.** It is larger than Codex's AGENTS.md size limit, so it is not duplicated here; this file keeps the pass/fail rules and the flows that must never be skipped.

## Project

React Native + Expo template with Feature-Sliced Design (FSD) and an AI agent harness for the full app lifecycle (idea → plan → spec → design → build → QA → deploy → iterate).

- React Native 0.86 + Expo SDK 57 (React 19.2, New Architecture, Hermes) · TypeScript 6 strict
- Expo Router 57 — import navigation from `expo-router`, never `@react-navigation/*`
- Zustand (client state) · TanStack Query (server state) · NativeWind 4 (Tailwind 3.4) · React Hook Form + Zod · Axios with token refresh
- AdMob `react-native-google-mobile-ads` **17.0.0 pinned** (UMP + ATT) · RN Firebase 26 (Analytics + Crashlytics, modular API) · expo-secure-store · expo-store-review

## Harness in Codex

| Claude harness | Codex copy (generated — never edit) |
| --- | --- |
| `.claude/agents/<name>.md` | `.codex/agents/<name>.toml` |
| `.claude/skills/<name>/` | `.agents/skills/<name>/` |

Edit only the `.claude/` sources, then run `npm run sync:codex`. When a task maps to a role, read that agent's instructions first:

| Task | Agent |
| --- | --- |
| Idea / market research | `idea-researcher` |
| PRD / KPIs | `product-planner` |
| Specs / task breakdown | `spec-planner` |
| Design system / theme | `design-architect` |
| FSD module scaffolding | `feature-builder` |
| API, state, Analytics, Secure Storage, Store Review, AdMob | `api-integrator` |
| Screens / UI | `ui-developer` |
| Code quality gate | `qa-reviewer` |
| Functional / UX inspection | `app-inspector` |
| Post-launch iteration loop | `loop-engineer` |

Full-app builds follow the `orchestrate` skill's phases; post-launch work uses `iterate-app`. Claude-only tools named in those docs map to Codex equivalents (subagents, skills, asking the user in chat, a browser tool for console automation). Inter-agent artifacts live in `_workspace/` (gitignored).

## Hard Thresholds (any violation = FAIL)

**Quality**
- `npm run typecheck` 0 errors · `npm run lint` 0 errors · `any` 0 · FSD layer violations 0 (`app → widgets → features → entities → shared`)
- Every screen wrapped in `SafeAreaView` (`react-native-safe-area-context`) · barrel `index.ts` per slice · NativeWind setup intact (babel preset + `nativewind/babel`, `withNativeWind` metro, `global.css`, `nativewind-env.d.ts`)
- Only Tailwind classes defined in `tailwind.config.js` (undefined classes are silently ignored). Brand color = `primary`; body text = `text-text-*`
- No `toISOString().split('T')[0]` for "today" — use `dayjs().format('YYYY-MM-DD')`
- React Compiler lint rules are on: no ref reads/writes or `Date.now()` during render

**Secure storage**
- Tokens/secrets only in SecureStore via `tokenManager` (`keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`) — never AsyncStorage/MMKV/persist/`extra`/`.env`, never in logs or analytics

**Store review**
- Only `useStoreReview().maybeRequest(REVIEW_TRIGGERS.X)` (policy engine `canRequestReview`, `uiIsIdle` gate) — no direct `expo-store-review`, no custom pre-prompt, no branching on the return value, never from error handlers

**Ads (AdMob)**
- Only `initializeAdsWithConsent()` (UMP → ATT → `setRequestConfiguration` → `initialize`), called non-blocking from the root layout. No direct `AdsConsent.*` / `mobileAds()` / `expo-tracking-transparency` calls
- Every ad load (`createForAdRequest`, `load()`, `<BannerAd>`) waits for `useAdsReady()` / `isAdsReady()` (consent + SDK init)
- ATT purpose string: says what (advertising identifier), why (relevance + install measurement), a concrete example, and the outcome of declining. Rewrite it per app in `app.config.ts` **and** the `plugins/withLocalizedAttDescription.js` locale table. "This identifier will be used to deliver personalized ads to you." is an automatic rejection
- `.lproj/InfoPlist.strings` count = Xcode-registered count · AdMob GDPR/IDFA messages published · privacy-options entry point (`showAdsConsentForm()`) when `privacyOptionsRequired` — subscribe with `onAdConsentResult()`, a foreground consent retry can flip it
- One banner per screen, never hidden/covered · full-screen `show()` only through the `canShow*` gates (shared cooldown, daily caps) · rewards only in `EARNED_REWARD` · load retries use backoff · real-ID internal builds only on registered test devices (`TEST_DEVICE_IDS`)

**Analytics**
- KPIs (north star + acquisition/activation/retention/monetization) defined in the PRD
- Only the `@shared/lib/analytics` wrapper — never `@react-native-firebase/*` directly; RN Firebase v26 removed the namespaced `analytics()` API
- Event names from `EAnalyticsEvent` only · no PII in params · `GoogleService-Info.plist` / `google-services.json` never committed
- Collection only when `IS_PROD`: `firebase.json` keeps native Analytics collection off (`analytics_auto_collection_enabled: false`, never remove it) and `initAnalytics()` turns it on in production. Do not add `crashlytics_auto_collection_enabled: false` — production first-launch crashes before JS would never upload

**Build environment**
- Store binaries must have `extra.appEnv` absent or `production` (see below)

## Flows That Must Not Be Skipped

- **APP_ENV**: `IS_DEV`/`IS_PROD` come from `APP_ENV` (`development` | `preview` | `production`) set by the EAS profile; the dev npm scripts pin `APP_ENV=development`. Unset means dev bundle → development, release bundle → production (local fastlane builds, which must also export `API_URL` and other profile env). Never put `APP_ENV` in `.env`, never use `NODE_ENV` for app environments.
- **Firebase config**: files live in `./firebase/` (gitignored). EAS cloud builds get file env vars named exactly `GOOGLE_SERVICE_INFO_PLIST` / `GOOGLE_SERVICES_JSON` (`eas env:create --type file --visibility secret`; `eas secret:*` is deprecated).
- **iOS linking**: `expo-build-properties` `ios.useFrameworks: 'dynamic'` (RNFB 26 uses SPM) and `ios.enableSceneSupport: true`. Never `'static'` alone. No Podfile-patching plugins, no `jsEngine: 'jsc'`.
- **Pins**: `react-native-google-mobile-ads` stays at 17.0.0 until invertase/react-native-google-mobile-ads#903 is fixed. `patches/@react-native-firebase+crashlytics+26.4.0.patch` must stay until RN Firebase is upgraded past 26.4.0.
- **Native changes**: `npx expo prebuild` cleans `ios/`/`android/` by default on SDK 57 — change native code through config plugins only.
- **Deployment**: use the store-deploy skill files under `~/works/store-deploy-plugin/skills/` (see `CLAUDE.md` "EAS Build & Deploy Rules"). Local build first, then cloud.
- **Runtime testing**: drive simulators/emulators with `sim-use` (observe → act → verify with `sim-use ui`); never coordinate-tap with `simctl`/`adb`.
- **Coding principle (ponytail)**: does it need to exist? → reuse what is here → stdlib → platform → installed deps → one line → minimum code. Fix root causes, not symptoms.
- **CodeGraph (optional)**: use `codegraph_*` tools for structural questions when `.codegraph/` exists.

## Commands

```bash
npm install          # also applies patches/ (postinstall)
npm start            # dev server (LAN, dev client)
npm run ios          # iOS build + run
npm run android      # Android build + run
npm run typecheck    # TypeScript
npm run lint         # ESLint 9 flat config
npm test             # Vitest
npm run sync:codex   # regenerate .codex/agents + .agents/skills from .claude/
```

## Branch Strategy

`main` (production) ← `devel` (development) ← `feature/*`
