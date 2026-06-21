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

[English](./README.md) | **한국어**

# React Native FSD Agent Template

AI 에이전트 기반 풀 라이프사이클 개발을 지원하는 React Native + Expo + Feature-Sliced Design 프로덕션 템플릿.

> **What makes this different?** 이 템플릿은 FSD 아키텍처 규칙을 이해하는 10개의 Claude Code 에이전트와 9개의 스킬을 포함합니다. "앱 만들어줘" 한 마디로 아이디어 도출부터 시장 조사 → 기획 → 디자인 시스템 → FSD 모듈 스캐폴딩 → API 연동 → 스크린 개발 → QA 검증까지 전체 파이프라인이 자동으로 실행됩니다. 출시 후에는 **지속 개선 루프**(`/iterate-app`)가 현황을 진단하고 KPI 갭·기술부채·커버리지로 순위를 매겨 다음 고도화를 추천한 뒤, 한 슬라이스를 만들고 검증하고 다음 작업을 추천합니다.

---

## Full Pipeline

```
Phase 1: Ideation       idea-researcher   시장 조사, 경쟁 앱 분석, 아이디어 도출
           │
Phase 2: Planning       product-planner   PRD, 유저 스토리, FSD 모듈 맵 설계
           │
Phase 2.5: Spec Planning  spec-planner    피처별 스펙 문서, phase/task 분해, 진 행 추적
           │
Phase 3: Design         design-architect  NativeWind 테마, 화면 레이아웃
           │
Phase 4: Implementation (순차 + spec task 체크 병행)
  4a       feature-builder   FSD 모듈, Zustand store, TypeScript 타입
  4b       api-integrator    Axios 클라이언트, TanStack Query hooks
  4c       ui-developer      Expo Router 스크린, NativeWind UI
           │
Phase 5: QA (병렬)
  5a       qa-reviewer       코드 품질, TypeScript strict, FSD 규칙
  5b       app-inspector     기능/UX 검사, Safe Area, 접근성
           │
Phase 6: Iteration      Fix Loop (최대 3회, 출시 전 수렴)
           │
Phase 7: Deployment     /store-deploy → EAS Build → App Store / Google Play
═══════════════════════════════════════════════════════════════════════
출시 후 지속 개선 루프 (반복):
  Assess → 다음 고도화 추천 → 한 슬라이스 개발 → 검증 → 회고
           loop-engineer  (/iterate-app)
```

데이터 흐름: 에이전트 간 컨텍스트는 `_workspace/` 디렉토리를 통해 전달됩니다. 출시 후 증분 작업은 일회성 파이프라인을 재실행하지 않고 `/iterate-app` 루프를 사용합니다.

---

## Agent Team

| 에이전트 | 역할 | 트리거 |
|---------|-----|-------|
| **idea-researcher** | 시장 조사, 앱 아이디어 도출 | "앱 아이디어 찾아줘" |
| **product-planner** | PRD, FSD 모듈 맵, 유저 스토리 | "앱 기획해줘" |
| **spec-planner** | 피처별 스펙 문서, phase/task 분해, 진행 추적 | Phase 2 완료 후 자동 |
| **design-architect** | 디자인 시스템, NativeWind 테마 | "디자인 시스템 만들어 줘" |
| **feature-builder** | FSD 모듈 스캐폴딩 | "feature/entity 만들어줘" |
| **api-integrator** | Axios + TanStack Query + Zustand | "API 연동해줘" |
| **ui-developer** | NativeWind 스크린 & UI 컴포넌트 | "스크린 만들어줘" |
| **qa-reviewer** | 코드 품질, TypeScript, FSD 규칙 | 각 Phase 자동 실행 |
| **app-inspector** | 기능/UX 검사, Safe Area, 접근성 | "앱 검사해줘" |
| **loop-engineer** | 출시 후 지속 고도화 루프, 다음 작업 추천(KPI 갭·기술부채·커버리지 랭킹) | "다음 뭐 만들지" / "고도화해줘" |

---

## Skills

| 스킬 | 커맨드 | 설명 |
|-----|-------|-----|
| `ideate` | "앱 아이디어 찾아줘" | 시장 조사 및 앱 아이디어 도출 |
| `plan-app` | "앱 기획해줘" | PRD 작성 및 FSD 모듈 맵 설계 |
| `design-system` | "디자인 시스템 만들어줘" | NativeWind 테마 및 화면 레이아웃 |
| `create-feature` | "피처 만들어줘" | FSD feature 모듈 스캐폴딩 |
| `create-entity` | "엔티티 만들어줘" | FSD entity 도메인 모델 생성 |
| `create-screen` | "스크린 추가해줘" | Expo Router 스크린 생성 |
| `inspect-app` | "앱 검사해줘" | 기능/UX 전체 검사 |
| `orchestrate` | "앱 만들어줘" | 전체 파이프라인 오케스트레이션 (일회성 빌드) |
| `iterate-app` | "다음 뭐 만들지" / "고도화해줘" | 출시 후 개발→검증→다음 추천 지속 루프 |

---

## Architecture Pattern

파이프라인은 두 가지 패턴을 혼합합니다.

- **Phase 1–2**: 순차 파이프라인 — 각 에이전트의 출력이 다음 에이전트의 입력이  됩니다.
- **Phase 2.5**: Spec Planning — PRD를 `docs/specs/`에 피처별 phase/task로 분해. 이후 구현 진행 추적의 기준이 됩니다.
- **Phase 3**: Design — 디자인 시스템, 테마, 화면 레이아웃 설계.
- **Phase 4**: Fan-out (순차) — feature-builder → api-integrator → ui-developer. **각 task 완료 시 spec 체크박스 업데이트**.
- **Phase 5**: 병렬 실행 — qa-reviewer와 app-inspector가 동시에 검사.
- **Phase 6**: Fix Loop — 최대 3회 반복(출시 전 수렴) 후 미해결 이슈는 TODO 마킹.
- **출시 후**: 지속 개선 루프(`/iterate-app`) — 현황 진단 → 다음 고도화 추천 → 한 슬라이스 개발 → 검증 → 회고를 반복. `loop-engineer`가 주도하며 전체 파이프라인을 재실행하지 않음. (`.claude/skills/orchestrate/references/loop-engineering.md`)

### Harness Design Principles

[Anthropic의 공식 하네스 설계 가이드](https://www.anthropic.com/engineering/harness-design-long-running-apps)와 [revfactory/harness](https://github.com/revfactory/harness)를 기반으로 설계되었습니다.

| 원칙 | 설명 |
|------|------|
| **Context Reset** | Phase 간 `_workspace/`에 산출물 저장 후 컨텍스트 리셋. Compaction보다 효과적 |
| **Sprint 기반 분해** | Phase 4에서 feature 단위 스프린트. 각 스프린트마다 구현→평가→수정 |
| **독립 Evaluator** | Generator(builder/integrator/developer)와 Evaluator(reviewer/inspector) 분리 |
| **Hard Threshold** | pass/fail 경성 기준. typecheck 0 에러, any 0개, FSD 위반 0개 |
| **디자인 4축 평가** | Design Quality(30%), Originality(25%), Craft(25%), Functionality(20%) |
| **디자인 가드레일** | Do's & Don'ts로 AI의 오프브랜드 선택을 사전 차단 |
| **능동 테스트** | 정적 분석 + `npm run typecheck/lint` 실행 + import 순환 참조 탐지 |
| **지속 개선 루프** | 출시 후 개발→검증→다음 추천을 한 사이클 한 슬라이스씩, KPI 갭·가치·노력·부채·커버리지로 랭킹 |

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
| Analytics | Firebase Analytics 24 (adapter, Expo Go 자동 no-op) |
| Secure Storage | expo-secure-store (Keychain / Keystore) |
| In-App Review | expo-store-review (policy-gated) |
| i18n | i18n-js |
| Build & Deploy | EAS Build / EAS Submit |

---

## Production Modules

에이전트 하네스 외에도, 이 템플릿은 수익화·측정·보안 인증을 위한 **바로 쓸 수 있는 프로덕션 모듈**을 기본 내장합니다. 각 모듈은 FSD 레이어링과 단일 진입점 규칙을 따릅니다.

### 광고 — AdMob (`src/features/ads/`)

UMP(GDPR) 동의, iOS ATT, SDK 초기화를 **필수 순서**로 실행합니다. 루트 레이아웃은 **오직** `initializeAdsWithConsent()` 만 await 합니다:

```tsx
// app/_layout.tsx
import { initializeAdsWithConsent } from '@features/ads';
useEffect(() => { void initializeAdsWithConsent(); }, []);
```

```
UMP(GDPR) 동의  →  iOS ATT 프롬프트  →  mobileAds().initialize()
```

- 훅: `useInterstitialAd`, `useRewardedAd`, `useAppOpenAd`, `useAdLifecycle`, `usePremiumGuard`
- 컴포넌트: `AdBanner`, `AdDevPanel` (개발 전용 테스트 패널)
- 빈도 제한·프리미엄 게이팅은 `useAdStore` / `usePremiumStore` (Zustand)
- 개발 환경은 Google **테스트 광고 단위**, 프로덕션은 `src/shared/config/ads.ts`의 실제 ID 사용
- 핵심 액션 직전이나 카메라/핵심 화면에는 **절대** 광고 배치 금지

### Analytics — Firebase (`src/shared/lib/analytics/`)

**Firebase / no-op 어댑터**를 가진 얇은 래퍼 — Expo Go(네이티브 모듈 없음)에서는 자동으로 no-op으로 폴백하고, 개발 환경에서는 수집이 비활성화됩니다.

```ts
import { initAnalytics, logEvent, logScreenView } from '@shared/lib/analytics';
```

- 래퍼만 사용 — `firebase.analytics()` 직접 호출 금지
- 이벤트 이름은 `EAnalyticsEvent`에 정의(매직 스트링 금지), 파라미터에 PII 금지

### 보안 토큰 저장 (`src/shared/api/client.ts`)

인증 토큰은 평문 AsyncStorage가 아니라 **`expo-secure-store` 기반 Keychain / Keystore**(`tokenManager`)에 저장됩니다. Axios 클라이언트는 `401` 시 자동으로 토큰을 갱신하고, 새 토큰이 올 때까지 동시 요청을 큐에 쌓아 재시도합니다.

```ts
import { api, tokenManager, setAuthFailureCallback } from '@shared/api';
```

### 인앱 평점 (`src/shared/store-review/`)

스토어 평점 요청을 중앙 정책 엔진으로 게이팅합니다 — `expo-store-review`를 직접 호출하지 않습니다. `maybeRequest()`는 **모든** 게이트를 통과할 때만 호출됩니다(설치 3일+, 실행 5회+, 핵심 액션 3회+, 마지막 요청 후 90일+, 연 3회 이하, 실행 직후 120초 쿨다운, UI idle, 최근 에러 없음).

```ts
import { useStoreReview, REVIEW_TRIGGERS } from '@shared/store-review';
const { maybeRequest } = useStoreReview();
// 긍정적 액션의 성공 콜백 안, UI가 idle일 때:
await maybeRequest(REVIEW_TRIGGERS.AFTER_TASK_COMPLETE, { uiIsIdle: true });
```

- 정책 엔진(`canRequestReview`)은 순수 함수로 단위 테스트됨(`policy.test.ts`)
- 트리거 ID는 `REVIEW_TRIGGERS`에서만(매직 스트링 금지), 매 요청은 `request_store_review` 로깅
- 카운터는 AsyncStorage에 persist(비민감), `recordLaunch()`는 `_layout.tsx`에서 실행
- 임계값·호출 위치는 앱마다 다름 — PRD에 맞게 배선

### Config Plugins (`plugins/`)

| Plugin | 역할 |
|--------|------|
| `withRNFirebaseStaticBuild` | RN 0.81 + New Arch + static frameworks iOS 빌드 패치(3종 에러 자동 해결) |
| `withLocalizedAppName` | 홈화면 다국어 앱 이름(iOS `InfoPlist.strings` / Android `strings.xml`) |
| `withLocalizedAttDescription` | iOS ATT 프롬프트 다국어 메시지(Android no-op) |

---

## Getting Started

### 1. 템플릿 사용

GitHub에서 **"Use this template"** 버튼을 클릭하거나:

```bash
gh repo create my-app --template seungmanchoi/react-native-fsd-agent-template --clone
cd my-app
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 설정

```bash
cp .env.example .env
```

`.env` 파일을 수정하여 API URL 등을 설정합니다.

### 4. 실행

```bash
npm start          # Expo Dev Server (LAN)
npm run ios        # iOS Simulator
npm run android    # Android Emulator
```

### 5. AI Agent Harness 사용 (Claude Code)

```bash
# 전체 파이프라인 — 앱을 처음부터 끝까지 만들기
"커피 구독 앱을 만들어줘"

# 개별 스킬 — 특정 기능만 추가
"상품 목록/상세 기능을 만들어줘. API는 /products 엔드포인트"

# → feature-builder: src/features/product/ 스캐폴딩
# → api-integrator: API 함수 + useProducts 훅 생성
# → ui-developer: 상품 리스트/상세 스크린 생성
# → qa-reviewer: FSD 규칙 + 타입 검증
```

---

## Project Structure

```
.
├── .claude/
│   ├── agents/                         # AI Agent definitions
│   │   ├── idea-researcher.md          # 시장 조사, 아이디어 도출
│   │   ├── product-planner.md          # PRD, FSD 모듈 맵
│   │   ├── design-architect.md         # 디자인 시스템, 레이아웃
│   │   ├── feature-builder.md          # FSD module scaffolding
│   │   ├── api-integrator.md           # API + state management
│   │   ├── ui-developer.md             # UI/Screen development
│   │   ├── spec-planner.md             # Spec docs, phase/task 분해
│   │   ├── qa-reviewer.md              # Code quality assurance
│   │   ├── app-inspector.md            # Functional/UX inspection
│   │   └── loop-engineer.md            # 출시 후 고도화 루프, 다음 작업 추천
│   └── skills/                         # AI Skills
│       ├── ideate/                     # 아이디어 도출
│       ├── plan-app/                   # 앱 기획
│       ├── design-system/              # 디자인 시스템
│       ├── create-feature/             # Feature scaffolding
│       ├── create-entity/              # Entity scaffolding
│       ├── create-screen/              # Screen creation
│       ├── inspect-app/                # App inspection
│       ├── iterate-app/                # 출시 후 지속 개선 루프
│       └── orchestrate/                # Full pipeline orchestration
│           └── references/             # harness-principles, loop-engineering, deploy-build-troubleshooting
│
├── docs/
│   ├── specs/                         # 피처별 스펙 문서 (spec-planner 출력)
│   │   ├── README.md                  # 진행 현황 대시보드
│   │   └── {NN}-{feature}/            # 피처별 phase 파일
│   │       ├── phase1-mvp.md
│   │       └── phase2-enhancement.md
│   └── troubleshooting.md             # 빌드/런타임 트러블슈팅
│
├── _workspace/                         # 에이전트 간 데이터 교환
│   ├── idea/                           # Phase 1 출력
│   ├── plan/                           # Phase 2 출력
│   ├── design/                         # Phase 3 출력
│   ├── implementation/                 # Phase 4 출력
│   └── qa/                             # Phase 5 출력
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

**Feature-Sliced Design**은 비즈니스 도메인별로 코드를 구성하는 아키텍처입니다.

### Layer Hierarchy

```
app (routing) → widgets → features → entities → shared
```

상위 레이어는 하위 레이어만 참조할 수 있습니다. 동일 레벨 간 직접 참조는 금지합 니다.

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

### 1. 앱 이름 및 식별자

`app.config.ts`에서 수정:

```typescript
name: 'MyApp',              // 앱 이름
slug: 'my-app',             // URL slug
scheme: 'myapp',            // Deep link scheme
// iOS
bundleIdentifier: 'com.myapp.app',
// Android
package: 'com.myapp.app',
```

### 2. 테마 색상

`tailwind.config.js`에서 primary 색상 변경:

```javascript
colors: {
  primary: {
    500: '#your-color',
    // ...
  },
},
```

`src/shared/config/theme.ts`에서 상세 테마 수정.

### 3. API URL

`.env` file:

```
API_URL=http://your-api-server:3000
```

### 4. EAS Build 설정

```bash
eas build:configure    # EAS 초기 설정
```

`eas.json`에서 빌드 프로필 수정.

---

## Environment Variables

앱 설정은 `app.config.ts` → `extra` → `src/shared/config/env.ts` 순으로 전달됩니다.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `API_URL` | `http://localhost:3000/api/v1` | 백엔드 base URL |
| `NODE_ENV` | `development` | 환경 모드 |
| `DEBUG` | `false` | 디버그 플래그 |
| `LOG_LEVEL` | `debug` | 로그 레벨 |
| `APP_VERSION` | `1.0.0` | 앱 버전 (iOS/Android) |

**Firebase 시크릿** — 절대 커밋 금지 (`firebase/`에 두고 gitignore):

| 변수 | 파일 |
|------|------|
| `GOOGLE_SERVICE_INFO_PLIST` | `firebase/GoogleService-Info.plist` (iOS) |
| `GOOGLE_SERVICES_JSON` | `firebase/google-services.json` (Android) |

EAS 클라우드 빌드에서는 시크릿으로 주입합니다:

```bash
eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --type file --value ./firebase/GoogleService-Info.plist
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./firebase/google-services.json
```

---

## Testing

```bash
npm test            # Vitest, 1회 실행
npm run test:watch  # Vitest, watch 모드
```

- 테스트 파일은 소스 옆에 `src/**/*.test.ts(x)` 형태로 위치
- `npm run typecheck`(0 에러)와 `npm run lint`(0 에러)는 **Hard Threshold** 게이트 — `CLAUDE.md` 참고

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

### EAS Build 순서 (필수)

```
1. eas build --local        ← 로컬에서 먼저 빌드 에러 확인
2. eas build                ← 성공 확인 후 클라우드 빌드
3. eas submit               ← 스토어 제출
```

> 클라우드 빌드 크레딧은 월 제한이 있으므로, 로컬 빌드로 Gradle/Xcode 에러를 먼 저 잡는다.

### EAS 빌드 프로필 (`eas.json`)

| 프로필 | 용도 |
|--------|------|
| `development-simulator` | iOS 시뮬레이터 개발 빌드 |
| `development` | 실기기 개발 빌드 (dev client) |
| `preview` | 내부 배포용 |
| `production` | 스토어 배포용 (빌드 번호 자동 증가) |

### iOS — Firebase Static Build

RN Firebase + RN 0.81 + New Architecture + static frameworks 조합은 iOS 빌드에서 알려진 3종 에러를 유발한다. 템플릿에 포함된 **`withRNFirebaseStaticBuild`** 플러그인이 이를 모두 자동으로 해결한다 — `app.config.ts`의 plugins에 유지하고 `npx expo prebuild --clean`만 실행하면 된다. 자세한 내용은 [`docs/troubleshooting.md`](./docs/troubleshooting.md)와 `CLAUDE.md` 참고.

### .easignore 설정

빌드 아카이브에서 불필요한 파일을 제외하여 업로드 시간을 단축한다:

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

### 앱 크기 최적화

| 최적화 항목 | 방법 | 효과 |
|------------|------|------|
| **이미지 포맷** | PNG → WebP, 적정 해상도 | 에셋 50%+ 감소 |
| **미사용 폰트** | 불필요한 `@expo-google-fonts/*` 제거 | 폰트당 0.5-2MB |
| **미사용 패키지** | `npm ls` 확인 후 제거 | 번들 크기 감소 |
| **Lottie 최적화** | 불필요 레이어 제거, 파일 크기 확인 | 1-5MB 가능 |

---

## Inspired By

- **[revfactory/harness](https://github.com/revfactory/harness)** — Agent Team & Skill Architect 메타 스킬. 에이전트 팀 구성, 파이프라인 패턴, `_workspace/` 데 이터 흐름 방식의 원천
- **[Anthropic Harness Design](https://www.anthropic.com/engineering/harness-design-long-running-apps)** — Context Reset, Sprint 분해, Hard Threshold, 독립 Evaluator 등 장시간 에이전트 작업을 위한 공식 설계 가이드.
- **[Feature-Sliced Design](https://feature-sliced.design/)** — 프론트엔드 아키 텍처 방법론

---

## License

MIT
