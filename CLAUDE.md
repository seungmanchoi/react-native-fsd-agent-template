# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

React Native + Expo template with **Feature-Sliced Design (FSD)** architecture and **AI Agent Harness** for full lifecycle app development with Claude Code.

## Tech Stack

- **Framework**: React Native 0.86 + Expo SDK 57 (React 19.2, New Architecture, Hermes)
- **Routing**: Expo Router (file-based — SDK 56+ forks React Navigation: import from `expo-router`, never `@react-navigation/*`)
- **State Management**: Zustand (global) + TanStack Query (server)
- **Styling**: NativeWind (Tailwind CSS for RN)
- **Form & Validation**: React Hook Form + Zod
- **API**: Axios with token auto-refresh
- **TypeScript**: 6.0 strict mode (Expo SDK 57 pins `~6.0`; TS 7 is not supported yet)

## Harness Engineering Rules (MANDATORY)

**이 프로젝트의 모든 작업은 아래 하네스 규칙을 따른다.** 에이전트와 스킬을 반드시 활용하여 작업한다.

### 핵심 규칙

0. **새 앱 시작**: `app.config.ts` 의 `SLUG` 가 아직 `my-app` 이면 `init-app` 스킬(`npm run app:init`)부터 실행한다.
1. **새 기능 구현 시**: 반드시 FSD 구조 규칙을 따른다. feature/entity/widget 생성 시 해당 에이전트 정의 파일(`.claude/agents/`)을 Read하고 지시를 따른다.
2. **풀 앱 개발 시**: `/orchestrate` 스킬의 7-Phase 파이프라인을 따른다. Phase를 건너뛰지 않는다.
3. **QA는 생략할 수 없다**: 구현 완료 후 반드시 `npm run verify`(typecheck · lint · test · `check:harness`)를 실행한다. Hard Threshold 기준을 적용한다. 래퍼 우회 import·UTC 날짜 키는 ESLint 가, NativeWind·SafeArea·Firebase 설정·버전 고정·하네스 사본은 `scripts/check-harness.mjs` 가 잡는다. Stop hook(Claude `.claude/settings.json`, Codex `.codex/hooks.json`)이 코드가 바뀐 턴마다 같은 명령을 돌려 실패를 되돌려 주지만, hook 이 없어도 직접 실행한다.
4. **`_workspace/` 디렉토리**: 에이전트 간 데이터는 `_workspace/`에 파일로 저장하여 전달한다. Phase 전환 시 이전 산출물을 Read하고 이어서 작업한다. `spec.md`·`plan/`·`iterate/` 는 커밋 대상이고(`.gitignore` 예외) 나머지는 임시 산출물이다.
5. **디자인 변경 시**: `design-architect` 에이전트의 4축 평가 기준(Design Quality, Originality, Craft, Functionality)을 적용한다.
6. **배포 시**: `/store-deploy` 스킬을 사용한다. 다른 배포 방법을 사용하지 않는다.
7. **상세 규칙 문서**: 보안 저장소·Analytics·평점·광고·빌드/배포·런타임 테스트·도구를 건드리는 작업은 시작 전에 해당 `docs/rules/*.md` 를 Read 하고 따른다. 이 파일에는 요약과 Hard Threshold 만 있다.

### Hard Thresholds (위반 시 작업 FAIL)

| 기준 | 임계값 |
|------|--------|
| `npm run typecheck` 오류 | **0개** |
| `npm run lint` 에러 | **0개** |
| `any` 타입 사용 | **0개** |
| FSD 레이어 의존성 위반 | **0개** |
| SafeAreaView 누락 (스크린) | **0개** |
| barrel export 누락 | **0개** |
| NativeWind 설정 누락 | **0개** |
| `toISOString().split('T')[0]`로 로컬 날짜 구하기 | **0개** |
| 토큰/시크릿이 AsyncStorage·MMKV·평문에 저장됨 | **0개** |
| 평점 요청이 정책 엔진(`canRequestReview`) 미경유 | **0개** |
| 평점 요청 시 `uiIsIdle` 게이트 누락 / 자체 사전 프롬프트 사용 | **0개** |
| `mobileAds().initialize()` 직접 호출 (`initializeAdsWithConsent` 미경유) | **0개** |
| UMP → ATT → `mobileAds().initialize()` 순서 위반 | **0개** |
| `AdsConsent.*` 직접 호출 (래퍼 미사용) | **0개** |

### Secure Storage / 민감 데이터 저장 (MANDATORY)

토큰·시크릿·결제/라이선스 키·PII 와 결합된 토큰은 `expo-secure-store`(iOS Keychain / Android Keystore)에만 둔다. `AsyncStorage`·MMKV 는 평문이라 UI 테마·언어·온보딩 플래그 같은 비민감 값만 담는다. 템플릿 토큰 저장소는 `src/shared/api/client.ts` 의 `tokenManager`(`keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY`)이고, auth 훅은 `tokenManager.setTokens(...)` 만 부른다. 로그아웃·토큰 만료 시 `tokenManager.clearTokens()` 와 `queryClient.clear()` 를 같은 경로에서 호출한다.

상세(저장 경계 표, 전용 모듈 분리, 생체 인증 게이트): `docs/rules/secure-storage.md`

#### Hard Threshold (Secure Storage)

| 기준 | 임계값 |
|------|--------|
| 토큰/시크릿이 `AsyncStorage`/`MMKV`/`localStorage`/평문 파일에 저장 | **0개** |
| `SecureStore` 외부에서 토큰을 직접 다루는 코드 (래퍼 미사용) | **0개** |
| Zustand `persist` storage가 토큰 슬라이스를 AsyncStorage로 저장 | **0개** |
| 토큰/PII가 `console.log`/Crashlytics/Analytics 파라미터에 노출 | **0개** |
| `app.config.ts` `extra` 또는 `.env`에 클라이언트용 비밀키 포함 | **0개** |

### 날짜/시간 처리 (CRITICAL)

모든 날짜/시간 처리는 `dayjs`를 사용하고, 아래 규칙을 반드시 따른다. `new Date()` 기반 날짜 계산은 UTC/로컬 시간대 혼동을 일으키므로 금지한다.

| 상황 | 올바른 방법 | 금지하는 방법 |
|------|-----------|-------------|
| 오늘 날짜 (YYYY-MM-DD) | `dayjs().format('YYYY-MM-DD')` | `new Date().toISOString().split('T')[0]` |
| N일 전 날짜 | `dayjs().subtract(N, 'day').format('YYYY-MM-DD')` | `new Date(Date.now() - N * 86400000)` |
| 현재 시각 (시/분) | `dayjs().hour()`, `dayjs().minute()` | `new Date().getUTCHours()` |
| 타임스탬프 저장 | `new Date().toISOString()` (createdAt 등) | 로컬 시간 문자열 |

**핵심 원칙:**
- `dayjs()`는 디바이스 로컬 시간을 반환한다 → 사용자 대면 날짜/시간에 사용
- `new Date().toISOString()`은 UTC를 반환한다 → 정렬/비교용 타임스탬프에만 사용
- **절대 `toISOString().split('T')[0]`으로 "오늘 날짜"를 구하지 않는다** — UTC 기준이므로 한국(+9)/일본(+9) 시간대에서 자정~09시 사이에 "어제" 날짜가 반환됨
- Zustand persist store에 날짜를 저장할 때는 `YYYY-MM-DD` 문자열 또는 ISO 타임스탬프만 사용 (Date 객체 금지)

### ESLint 9 (Flat Config) & FlashList v2 (CRITICAL)

이 템플릿은 최신 기술 스택을 준수한다.

1. **ESLint 9**: \`eslint.config.js\` (Flat Config, `defineConfig`) 형식을 사용한다. \`lint\` 스크립트에서 \`--ext\` 옵션은 더 이상 사용하지 않는다. ESLint 10은 `eslint-config-expo`가 쓰는 `eslint-plugin-react`가 아직 지원하지 않으므로 올리지 않는다. React Compiler 규칙(`react-hooks/refs`, `react-hooks/purity`)이 켜져 있어 **렌더 중 ref 읽기/쓰기·`Date.now()` 호출은 lint 에러**다 — effect/이벤트 핸들러로 옮긴다.
2. **FlashList v2**: \`estimatedItemSize\` 속성은 더 이상 필수사항이 아니며, 사용 시 타입 에러가 발생할 수 있다. 자동 크기 계산을 활용한다.
3. **Workspace 제외**: \`_workspace/\`, \`.claude/\`, \`plugins/\` 디렉토리는 린트 및 타입체크 대상에서 제외되어야 한다.

### NativeWind 필수 설정 (CRITICAL)

NativeWind가 정상 동작하려면 아래 4개 파일이 **모두** 올바르게 설정되어야 한다. 하나라도 누락되면 `className`이 적용되지 않아 전체 UI가 깨진다.

| 파일 | 필수 설정 |
|------|----------|
| `babel.config.js` | `presets`에 `['babel-preset-expo', { jsxImportSource: 'nativewind' }]`와 `'nativewind/babel'` 포함 |
| `metro.config.js` | `withNativeWind(config, { input: './global.css' })` |
| `tailwind.config.js` | `presets: [require('nativewind/preset')]` 및 `content` 경로에 `app/`, `src/` 포함 |
| `global.css` | `@tailwind base; @tailwind components; @tailwind utilities;` |
| `_layout.tsx` (루트) | `import '../global.css';` |
| `nativewind-env.d.ts` | `/// <reference types="nativewind/types" />` + `/// <reference types="expo/types" />` (TS 6은 `@types`를 자동 포함하지 않고 `global.css` side-effect import를 검사한다) |
| `tailwind.config.js` 토큰 | `src/shared/config/theme.ts`와 같은 시맨틱 토큰 — 브랜드색 `primary`(`bg-primary`, `text-primary`)와 본문색 `text-*`(`text-text-primary`)을 구분한다. **정의되지 않은 클래스는 경고 없이 무시**되므로 새 토큰은 반드시 config에 추가 |

### 에이전트 활용 매핑

| 작업 유형 | 사용할 에이전트 | 참조 파일 |
|----------|--------------|----------|
| 아이디어/리서치 | `idea-researcher` | `.claude/agents/idea-researcher.md` |
| 기획/PRD/KPI | `product-planner` | `.claude/agents/product-planner.md` |
| 스펙/Task 분해 | `spec-planner` | `.claude/agents/spec-planner.md` |
| 디자인/테마 | `design-architect` | `.claude/agents/design-architect.md` |
| FSD 모듈 생성 | `feature-builder` | `.claude/agents/feature-builder.md` |
| API/상태관리/Analytics | `api-integrator` | `.claude/agents/api-integrator.md` |
| UI/스크린 | `ui-developer` | `.claude/agents/ui-developer.md` |
| 코드 품질 | `qa-reviewer` | `.claude/agents/qa-reviewer.md` |
| 기능/UX 검수 | `app-inspector` | `.claude/agents/app-inspector.md` |
| 출시 후 고도화/다음 작업 추천 | `loop-engineer` | `.claude/agents/loop-engineer.md` |

## Agent Team & Skills

이 프로젝트는 10개의 전문 에이전트와 11개의 스킬로 구성된 AI Agent Harness를 포함합니다. Claude Code 와 Codex 가 같은 원본을 쓴다(아래 "Claude · Codex 공용 하네스").

### Agents

| Agent | Role | File |
|-------|------|------|
| `idea-researcher` | 시장 조사, 앱 아이디어 도출 | `.claude/agents/idea-researcher.md` |
| `product-planner` | PRD, FSD 모듈 맵, 유저 스토리 | `.claude/agents/product-planner.md` |
| `spec-planner` | 피처별 스펙, phase/task 분해, 진행 추적 | `.claude/agents/spec-planner.md` |
| `design-architect` | 디자인 시스템, NativeWind 테마 | `.claude/agents/design-architect.md` |
| `feature-builder` | FSD 모듈 스캐폴딩 | `.claude/agents/feature-builder.md` |
| `api-integrator` | Axios + TanStack Query + Zustand | `.claude/agents/api-integrator.md` |
| `ui-developer` | NativeWind 스크린 & UI 컴포넌트 | `.claude/agents/ui-developer.md` |
| `qa-reviewer` | 코드 품질, TypeScript, FSD 규칙 | `.claude/agents/qa-reviewer.md` |
| `app-inspector` | 기능/UX 검사, Safe Area, 접근성 | `.claude/agents/app-inspector.md` |
| `loop-engineer` | 출시 후 지속 고도화 루프, 다음 작업 추천(KPI 갭·부채·커버리지 랭킹) | `.claude/agents/loop-engineer.md` |

### Skills

| Skill | Command | Description |
|-------|---------|-------------|
| `init-app` | "새 앱 시작" / "앱 이름 바꿔줘" | 템플릿 식별자(slug·bundle id·scheme·다국어 이름) 교체 + 남은 수동 단계 안내 |
| `ideate` | "앱 아이디어 찾아줘" | 시장 조사 및 앱 아이디어 도출 |
| `plan-app` | "앱 기획해줘" | PRD 작성 및 FSD 모듈 맵 설계 |
| `design-system` | "디자인 시스템 만들어줘" | NativeWind 테마 및 화면 레이아웃 |
| `create-feature` | "피처 만들어줘" | FSD feature 모듈 스캐폴딩 |
| `create-entity` | "엔티티 만들어줘" | FSD entity 도메인 모델 생성 |
| `create-screen` | "스크린 추가해줘" | Expo Router 스크린 생성 |
| `inspect-app` | "앱 검사해줘" | 기능/UX 전체 검사 |
| `orchestrate` | "앱 만들어줘" | 전체 파이프라인 오케스트레이션 (일회성 빌드) |
| `iterate-app` | "다음 뭐 만들지" / "고도화해줘" | 출시 후 개발→검증→다음 추천 지속 루프 |
| `sim-use` | 시뮬레이터 런타임 검증 시 | 시뮬레이터·에뮬레이터 조작 (아래 "시뮬레이터 런타임 테스트") |

> `spec-planner`는 전용 스킬 없이 에이전트로 직접 호출된다(Phase 2.5). 그 외 에이전트는 위 스킬과 대응하고, `sim-use` 는 app-inspector 와 `/iterate-app` 이 쓰는 도구 스킬이다.

### Claude · Codex 공용 하네스

| | Claude Code | Codex CLI |
|---|---|---|
| 진입 지침 | `CLAUDE.md` | `AGENTS.md` → `CLAUDE.md` |
| 에이전트 | `.claude/agents/*.md` (원본) | `.codex/agents/*.toml` (생성 사본) |
| 스킬 | `.claude/skills/` (원본), `/스킬명` | `.agents/skills/` (생성 사본), `$스킬명` 또는 `/skills` |
| 검증 hook | `.claude/settings.json` `hooks.Stop` | `.codex/hooks.json` (처음 한 번 `/hooks` 에서 신뢰) |
| 배포 플러그인 | `.claude/settings.json` 이 `seungmanchoi/store-deploy-plugin` 을 등록 | `codex plugin marketplace add seungmanchoi/store-deploy-plugin` → `codex plugin add store-deploy@store-deploy-marketplace` |

- 에이전트·스킬을 고친 뒤에는 반드시 `npm run sync:codex`를 실행하고 사본을 함께 커밋한다(사본을 직접 수정하지 않는다). `npm run verify` 가 사본이 낡았으면 실패한다.
- 스킬·에이전트 본문의 Claude 도구 이름(`Agent`, `AskUserQuestion`, `SendMessage`, `/loop`, `mcp__*`)을 Codex 에서 어떻게 읽는지는 `.claude/skills/orchestrate/references/runtime-adapters.md` 가 정본이다.

### Full Pipeline

```
Phase 1: Ideation      — idea-researcher  (/ideate)
Phase 2: Planning      — product-planner  (/plan-app)
Phase 2.5: Spec Planning — spec-planner   (docs/specs/ 생성 + task 분해)
Phase 3: Design        — design-architect (/design-system)
Phase 4: Implementation (순차 + spec task 체크 병행)
  4a feature-builder   (/create-feature, /create-entity)
  4b api-integrator
  4c ui-developer      (/create-screen)
  4d api-integrator    (Firebase Analytics 통합 + KPI 이벤트)
Phase 5: QA (병렬)
  5a qa-reviewer
  5b app-inspector     (/inspect-app)
Phase 6: Iteration     — Fix Loop (최대 3회, 출시 전 수렴)
Phase 7: Deployment    — /store-deploy
───────────────────────────────────────────────────
출시 후 지속 고도화 루프 (반복):
  Loop: Assess → Recommend(다음 고도화) → Develop → Verify → Reflect
        — loop-engineer (/iterate-app)
```

데이터 흐름: `_workspace/` 디렉토리를 통해 에이전트 간 컨텍스트 전달.
출시 후 반복 개발은 일회성 파이프라인(Phase 1~7)을 재실행하지 않고 `/iterate-app` 루프를 사용한다 (상세: `.claude/skills/orchestrate/references/loop-engineering.md`).

## Analytics & 핵심 지표 (MANDATORY)

모든 앱은 출시 직후부터 KPI 를 수집한다. PRD 에 북극성 지표 1개와 4축 기본 세트(획득·활성·유지·수익화)를 정의하고, 이벤트는 Firebase Analytics(RN Firebase 26 **modular API**)로 보낸다.

- 호출은 `@shared/lib/analytics` 래퍼(`initAnalytics`, `logEvent`, `logScreenView`, `recordError`)로만 한다. 이벤트 이름은 `events.ts` 의 `EAnalyticsEvent` 상수, snake_case `동사_명사`, PII 금지
- 수집은 `env.IS_PROD` 에서만. `firebase.json` 의 `analytics_auto_collection_enabled: false` 를 지우지 않는다. Crashlytics 자동 수집 끄기를 추가하지 않는다
- `initAnalytics()` 는 루트 `_layout.tsx` **모듈 최상단**에서 호출한다. `screen_view` 는 루트 레이아웃이 라우트 패턴으로 자동 기록한다
- iOS 는 `expo-build-properties` `useFrameworks: 'dynamic'`(RNFB 26 SPM). 설정 파일은 `./firebase/` 에 두고 커밋하지 않는다

상세(KPI 표, 이벤트 네이밍, 모듈 구조, 수집 시점의 이유, 설정 파일 주입): `docs/rules/analytics.md`. 통합 절차 정본: `.claude/agents/api-integrator.md`

### Hard Threshold (Analytics)

| 기준 | 임계값 |
|------|--------|
| PRD에 KPI 정의 누락 | **0개** (북극성 + 4축 기본 세트) |
| 직접 `firebase.analytics()` / `@react-native-firebase/*` 호출 (래퍼 미사용) | **0개** |
| RN Firebase namespaced API(`analytics()`, `crashlytics()`) 사용 | **0개** (v26에서 삭제) |
| 이벤트 상수 미정의(매직 스트링) `logEvent` 호출 | **0개** |
| PII가 포함된 이벤트 파라미터 | **0개** |
| `GoogleService-Info.plist` / `google-services.json` 커밋 | **0개** |

## 스토어 평점 유도 (In-App Review Prompts) (MANDATORY)

평점은 사용자가 가치를 느낀 직후의 짧은 순간에만 요청한다. 모든 요청은 `useStoreReview().maybeRequest(REVIEW_TRIGGERS.X)` 하나로 하고, 정책 엔진 `canRequestReview` 가 설치 3일·실행 5회·핵심 액션 3회·직전 요청 90일·연 3회·실행 후 120초·UI idle·최근 5분 내 에러 없음을 모두 확인한다. 자체 사전 프롬프트, 점수 유도 문구, 반환값에 따른 후속 UI 분기, 에러 핸들러 안 호출은 금지다. 루트 레이아웃이 `recordLaunch()`, 에러 바운더리가 `recordError()`, 화면 성공 콜백이 `recordKeyAction()` 을 부른다.

상세(플랫폼 한계, 게이트 표, 안티패턴, 모듈 구조, 에이전트 분담): `docs/rules/store-review.md`. 구현 정본: `.claude/agents/api-integrator.md` "Store Review"

### Hard Threshold (Store Review)

| 기준 | 임계값 |
|------|--------|
| `expo-store-review` 직접 호출 (래퍼 미사용) | **0개** |
| `requestReview()` 호출이 정책 엔진(`canRequestReview`) 미경유 | **0개** |
| 매직 스트링 트리거 ID 사용 (`REVIEW_TRIGGERS.*` 미사용) | **0개** |
| 에러/크래시 핸들러 내부의 평점 요청 호출 | **0개** |
| 온보딩/첫 실행/결제 실패 직후 평점 요청 | **0개** |
| 평점 점수 유도 문구("5점 부탁") UI 텍스트 | **0개** |
| 자체 사전 프롬프트 다이얼로그/시트 (Google Play 정책 위반) | **0개** |
| `maybeRequest()` 반환값에 의존하는 후속 UI/네비게이션 분기 | **0개** |
| `IReviewPolicy`의 `maxRequestsPerYear` / `cooldownAfterLaunchSec` / `uiIsIdle` 게이트 누락 | **0개** |

## 광고 동의 시퀀스 / eCPM 최적화 (MANDATORY)

AdMob 을 쓰는 앱은 `react-native-google-mobile-ads` **17.0.0 고정**(17.1~17.2 는 Expo plugin 사용 시 Android Gradle 이 깨진다)과 아래 순서를 따른다. 루트 `_layout.tsx` 는 `initializeAdsWithConsent()` 만 `void` 로 부른다.

```
UMP (GDPR) consent → iOS ATT → mobileAds().setRequestConfiguration(...) → mobileAds().initialize()
```

- 모든 광고 로드는 `useAdsReady()` / `isAdsReady()` 뒤에 시작한다. `AdsConsent.*`·`mobileAds()`·`expo-tracking-transparency` 를 직접 부르지 않는다
- ATT 목적 문자열은 앱마다 새로 쓴다: 무엇(광고 식별자)·왜(관련성, 설치 측정)·구체적 예시·거부 시 결과. `app.config.ts` 와 `plugins/withLocalizedAttDescription.js` 로케일 테이블을 함께 고치고 plugin 을 등록한다. 상투 문구는 Guideline 5.1.1 자동 반려(poly-dash 1.0.10, 2026-08-06)
- AdMob Console 의 GDPR·IDFA 메시지는 배포 전에 게시(Published)한다. `privacyOptionsRequired` 면 설정 화면에 `showAdsConsentForm()` 진입점을 두고 `onAdConsentResult()` 로 구독한다
- 무효 트래픽 방어: 화면당 배너 1개, 전면 광고는 `canShow*` 게이트, 리워드는 `EARNED_REWARD` 에서만 지급, 로드 재시도는 백오프, 실광고 ID 내부 빌드는 테스트 기기 등록 후

상세(콘솔 설정, Info.plist, Privacy Options, user property, eCPM 체크리스트, ATT 다국어 검증 명령, 무효 트래픽 문서 지도, 에이전트 분담): `docs/rules/ads.md`

### Hard Threshold (광고 동의)

| 기준 | 임계값 |
|------|--------|
| `mobileAds().initialize()` 직접 호출 (`initializeAdsWithConsent` 미경유) | **0개** |
| UMP → ATT → `initialize()` 순서 위반 | **0개** |
| `AdsConsent.*` 또는 `expo-tracking-transparency` 직접 호출 (래퍼 미사용) | **0개** |
| `NSUserTrackingUsageDescription` 누락 (iOS) | **0개** |
| 목적 문자열이 상투 문구(`This identifier will be used to deliver personalized ads to you.` 등) | **0개** |
| `DEFAULT_ATT_DESCRIPTIONS` 로케일 테이블이 기본값 그대로 배포 | **0개** |
| 광고 앱인데 `withLocalizedAttDescription` plugin 미등록 | **0개** |
| `.lproj/InfoPlist.strings` 개수 ≠ Xcode 등록 개수 | **0개** |
| AdMob Console GDPR/IDFA 메시지 미게시 상태로 배포 | **0개** |
| 광고 로드(`createForAdRequest`/`load()`/`<BannerAd>`)가 `useAdsReady()`/`isAdsReady()` 게이트 미경유 | **0개** |
| `privacyOptionsRequired`인데 설정 화면에 "광고 개인정보 설정"(`showAdsConsentForm()`) 진입점 없음 | **0개** |

### Hard Threshold (무효 트래픽)

| 기준 | 임계값 |
|------|--------|
| 한 화면에 배너 2개 이상 / 숨겨진·가려진 광고 렌더링 | **0개** |
| 전면 광고 `show()`가 `canShow*` 게이트(공유 쿨다운·일일 cap) 미경유 | **0개** |
| 리워드 보상 선지급 (`EARNED_REWARD` 콜백 외부) | **0개** |
| 광고 로드 실패 즉시 무한 재시도 (백오프 없음) | **0개** |
| 실광고 ID 빌드를 테스트 기기 미등록 상태로 내부 배포 | **0개** |

## EAS Build & Deploy Rules (MANDATORY)

- 배포는 `/store-deploy`(store-deploy 플러그인) 로만 한다. 프로덕션 빌드는 **로컬이 기본**: `eas build --local` → `eas submit --path <파일>`. EAS 프로젝트가 없는 앱은 빌드·제출 모두 그 앱의 fastlane lane 으로 하고, lane 에서 `API_URL` 등 프로필 env 를 export 한다(안 하면 localhost 로 빌드된다). 클라우드 EAS Build 는 사용자가 요청하거나 로컬 빌드가 안 될 때만
- 제출 전 산출물의 version, buildNumber/versionCode, bundle id, `extra.appEnv` 를 확인한다
- `IS_DEV`/`IS_PROD` 는 `APP_ENV`(`development` | `preview` | `production`)가 정한다. EAS 는 프로필 env, APP_ENV 가 없는 release 빌드는 production 으로 판정한다. `.env` 에 `APP_ENV` 를 넣지 않고, 앱 환경 구분에 `NODE_ENV` 를 쓰지 않는다
- 스토어 이름과 홈 화면 이름(`app.config.ts` `name`, `withLocalizedAppName`, iOS `name.txt`, Android `title.txt`)을 언어별로 똑같이 맞춘다(30자 이내)
- 네이티브 변경은 config plugin 으로만 한다(SDK 57 `prebuild` 는 기본 clean)

상세(APP_ENV 판정·검증 명령, 앱 이름 규칙, 배포 전 준비·트러블슈팅 문서 위치, Play 프로덕션 액세스 신청): `docs/rules/build-deploy.md`

| 기준 | 임계값 |
|------|--------|
| 스토어 제출 바이너리의 `extra.appEnv`가 `development` / `preview` | **0개** |

## Branch Strategy

이 템플릿으로 만든 앱 레포:

```
main     <- Production
  ^
devel    <- Development (default)
  ^
feature/* <- Feature branches
```

템플릿 레포 자체에는 `devel` 이 없다. `main` 에 PR 로 머지한다.

## Commands

```bash
npm install          # Install dependencies
npm start            # Dev server (127.0.0.1 만. 상세: docs/rules/runtime-testing.md)
npm run start:lan    # 실기기용 LAN 서버 — 켜 둔 동안 같은 네트워크에 번들이 열린다
npm run ios          # iOS 빌드·실행 (서버는 npm start 를 먼저 띄운다)
npm run android      # Android 빌드·실행 (서버는 npm start 를 먼저 띄운다)
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run verify       # typecheck + lint + test + check:harness (Stop hook 도 이것을 돌린다)
npm run app:init -- --slug <slug> --name "<Name>"   # 템플릿 → 새 앱 (init-app 스킬)
npm run sync:codex   # .claude → Codex 사본 재생성
npm run eas:build:prod:ios      # 로컬 프로덕션 빌드 → build-output/ (android 는 :android, 클라우드는 eas:build:prod:cloud)
npm run format       # Prettier
```

## 시뮬레이터 런타임 테스트 (sim-use) (MANDATORY)

시뮬레이터·에뮬레이터에서 앱을 실행해 화면과 흐름을 검증할 때는 `sim-use` 만 쓴다(`simctl`·`adb` 좌표 탭, Playwright 금지). 요소 별칭(`@N`)으로 observe(`sim-use ui`) → act(`tap`·`type`·`swipe`) → verify(`sim-use ui`) 를 반복한다. 스킬은 레포에 있다(`.claude/skills/sim-use`, Codex 사본 `.agents/skills/sim-use`).

상세(설치, 명령 표, Android 브리지, 언제 쓰나): `docs/rules/runtime-testing.md`

## 코딩 원칙 — ponytail · CodeGraph

- **ponytail**: 존재하지 않아도 되는 코드가 최고의 코드. 필요한가? → 이미 있나? → 표준 라이브러리 → 플랫폼 기능 → 설치된 의존성 → 한 줄 → 동작하는 최소 코드 순으로 먼저 걸리는 칸에서 멈춘다. 버그는 증상이 아닌 근본 원인을 공유 함수 한 곳에서 고친다. 입력 검증·에러 처리·보안·접근성은 줄이지 않는다
- **CodeGraph (선택)**: 구조 질문(무엇이 무엇을 호출·정의·파급하는지)은 `codegraph_*`, 리터럴 텍스트는 grep. 없으면 grep 으로 진행한다

상세(플러그인 설정·토글, CodeGraph 도구 표): `docs/rules/tooling.md`

## Architecture: Feature-Sliced Design (FSD)

```
src/
├── core/          # App initialization, providers
├── features/      # Business logic (auth, etc.)
├── entities/      # Domain models (user, etc.)
├── widgets/       # Independent UI blocks
└── shared/        # Shared utilities
    ├── api/       # API client (Axios)
    ├── config/    # Environment, theme
    ├── lib/       # Hooks, utils
    ├── types/     # Common types
    └── ui/        # Reusable UI components
```

**Dependency Rule**: Upper layers may only reference lower layers.
`app -> widgets -> features -> entities -> shared`

## Feature Structure Convention

```
features/{name}/
├── api/           # API calls
├── hooks/         # Custom hooks (useQuery, useMutation)
├── store/         # Zustand store (if needed)
├── types/         # TypeScript types
├── ui/            # UI components
└── index.ts       # Public API (barrel export)
```

## Code Conventions

- No `any` type in production code
- Safe area handling is mandatory for all screens (use `SafeAreaView` / `react-native-safe-area-context`)
- Interface prefix: `I`, Type prefix: `T`, Enum prefix: `E`
- Separate files for interfaces, types, enums
- Use `@/` alias for imports
- Run lint, typecheck, prettier after changes
