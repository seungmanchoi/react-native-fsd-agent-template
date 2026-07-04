# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

React Native + Expo template with **Feature-Sliced Design (FSD)** architecture and **AI Agent Harness** for full lifecycle app development with Claude Code.

## Tech Stack

- **Framework**: React Native 0.81 + Expo 54
- **Routing**: Expo Router (file-based)
- **State Management**: Zustand (global) + TanStack Query (server)
- **Styling**: NativeWind (Tailwind CSS for RN)
- **Form & Validation**: React Hook Form + Zod
- **API**: Axios with token auto-refresh
- **TypeScript**: Strict mode

## Harness Engineering Rules (MANDATORY)

**이 프로젝트의 모든 작업은 아래 하네스 규칙을 따른다.** 에이전트와 스킬을 반드시 활용하여 작업한다.

### 핵심 규칙

1. **새 기능 구현 시**: 반드시 FSD 구조 규칙을 따른다. feature/entity/widget 생성 시 해당 에이전트 정의 파일(`.claude/agents/`)을 Read하고 지시를 따른다.
2. **풀 앱 개발 시**: `/orchestrate` 스킬의 7-Phase 파이프라인을 따른다. Phase를 건너뛰지 않는다.
3. **QA는 생략할 수 없다**: 구현 완료 후 반드시 `npm run typecheck`, `npm run lint`를 실행한다. Hard Threshold 기준을 적용한다.
4. **`_workspace/` 디렉토리**: 에이전트 간 데이터는 `_workspace/`에 파일로 저장하여 전달한다. Phase 전환 시 이전 산출물을 Read하고 이어서 작업한다.
5. **디자인 변경 시**: `design-architect` 에이전트의 4축 평가 기준(Design Quality, Originality, Craft, Functionality)을 적용한다.
6. **배포 시**: `/store-deploy` 스킬을 사용한다. 다른 배포 방법을 사용하지 않는다.

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

**`AsyncStorage`는 평문으로 저장되며 루팅/탈옥 기기에서 그대로 읽힌다.** 인증 토큰을 포함한 모든 민감 데이터는 iOS Keychain / Android Keystore-backed Encrypted Storage에 저장한다. 표준 도구는 `expo-secure-store` 이다.

#### 저장 경계 — 무엇을 어디에

| 분류 | 예시 | 저장 위치 |
|------|------|----------|
| **민감 (반드시 SecureStore)** | access token, refresh token, OAuth/세션 토큰, API 비밀키, 결제 토큰/카드 정보, 사용자 비밀번호·PIN·생체 백업키, 프리미엄 라이선스 키, 사용자 식별 가능 정보(PII)와 결합된 토큰 | `expo-secure-store` |
| **준민감 (SecureStore 권장)** | 푸시 토큰, 디바이스 시크릿, 분석/측정용 user pseudo-id (재설치 후 복구 필요한 경우) | `expo-secure-store` |
| **비민감 (AsyncStorage/MMKV 허용)** | UI 테마, 언어, 마지막으로 본 화면, 온보딩 완료 플래그, 캐시된 비식별 콘텐츠, Zustand의 비민감 영역 | `@react-native-async-storage/async-storage` 또는 MMKV |

**금지 사항**
- 토큰을 Redux/Zustand persist를 통해 AsyncStorage에 저장 — persist는 **비민감 슬라이스만 대상**으로 한다
- 토큰을 `app.config.ts`의 `extra` 필드, `.env` 클라이언트 번들, 또는 평문 JSON으로 노출
- Console/Crashlytics/Analytics 로그에 토큰 또는 PII 출력 (`__DEV__`에서도 마스킹)

#### 표준 스택

| 영역 | 패키지 | 비고 |
|------|--------|------|
| 암호화 저장 | `expo-secure-store` | iOS Keychain, Android Keystore + EncryptedSharedPreferences |
| 비민감 KV | `@react-native-async-storage/async-storage` 또는 `react-native-mmkv` | persist용 |
| 생체 인증 | `expo-local-authentication` (선택) | Keychain 접근 시 `requireAuthentication: true` |

설치:
```bash
npx expo install expo-secure-store
```

#### 코드 통합 위치 (FSD)

```
src/shared/secure-storage/
├── client.ts          # expo-secure-store 래퍼 (getItem/setItem/deleteItem/multiRemove)
├── keys.ts            # 저장 키 상수 (SECURE_KEYS.ACCESS_TOKEN 등)
├── types/index.ts     # ISecureStorageOptions, TSecureKey 등
└── index.ts           # barrel export
```

**구현 코드는 `.claude/agents/api-integrator.md`의 "Secure Storage 래퍼 / SecureStore-backed Zustand Persist" 섹션이 정본**이다 (`client.ts` 래퍼, `keys.ts` 키 카탈로그, 토큰 store용 persist 어댑터). 상시 기억할 규칙만: `keychainAccessible = WHEN_UNLOCKED_THIS_DEVICE_ONLY`(iCloud 백업 차단), 키는 `SECURE_KEYS` 상수로만 정의한다.

#### 토큰 저장소 통합 규칙

- `features/auth/store/`의 토큰 상태는 메모리에 보관하고, **persist 어댑터는 `expo-secure-store` 기반 custom storage**로 구현한다. Zustand `persist`의 `storage`에 `createJSONStorage(() => secureZustandStorage)`를 주입한다.
- Axios 인터셉터(`src/shared/api/client.ts`)는 토큰을 메모리 또는 SecureStore에서 가져온다. **AsyncStorage 직접 조회 금지**.
- 토큰 만료/로그아웃 시 `clearAllSecure()` 호출로 모든 시크릿 키를 일괄 삭제한다.
- iOS 옵션: 기본은 `WHEN_UNLOCKED_THIS_DEVICE_ONLY` — 디바이스 잠금 해제 시에만 접근, 백업/iCloud 동기화 제외.
- Android: `expo-secure-store`가 자동으로 Keystore-backed `EncryptedSharedPreferences`를 사용. 별도 설정 불필요.

#### 생체 인증 게이트 (선택)

결제·금융·헬스 데이터 등 고위험 토큰은 저장 시 `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` + `requireAuthentication: true` + `authenticationPrompt` 옵션으로 생체 인증을 강제한다 (코드 예시: api-integrator.md).

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

1. **ESLint 9**: \`eslint.config.js\` (Flat Config) 형식을 사용한다. \`lint\` 스크립트에서 \`--ext\` 옵션은 더 이상 사용하지 않는다.
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
| `nativewind-env.d.ts` | `/// <reference types="nativewind/types" />` |

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

이 프로젝트는 10개의 전문 에이전트와 9개의 스킬로 구성된 AI Agent Harness를 포함합니다.

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
| `ideate` | "앱 아이디어 찾아줘" | 시장 조사 및 앱 아이디어 도출 |
| `plan-app` | "앱 기획해줘" | PRD 작성 및 FSD 모듈 맵 설계 |
| `design-system` | "디자인 시스템 만들어줘" | NativeWind 테마 및 화면 레이아웃 |
| `create-feature` | "피처 만들어줘" | FSD feature 모듈 스캐폴딩 |
| `create-entity` | "엔티티 만들어줘" | FSD entity 도메인 모델 생성 |
| `create-screen` | "스크린 추가해줘" | Expo Router 스크린 생성 |
| `inspect-app` | "앱 검사해줘" | 기능/UX 전체 검사 |
| `orchestrate` | "앱 만들어줘" | 전체 파이프라인 오케스트레이션 (일회성 빌드) |
| `iterate-app` | "다음 뭐 만들지" / "고도화해줘" | 출시 후 개발→검증→다음 추천 지속 루프 |

> `spec-planner`는 전용 스킬 없이 에이전트로 직접 호출된다(Phase 2.5). 그 외 9개 스킬이 위 표에 대응한다.

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
출시 후 반복 개발은 일회성 파이프라인(Phase 1~7)을 재실행하지 않고 `/iterate-app` 루프를 사용한다 (상세: `references/loop-engineering.md`).

## Analytics & 핵심 지표 (MANDATORY)

**모든 앱은 출시 직후부터 측정 가능한 핵심 지표(KPI)를 수집한다.** 이를 위해 Firebase Analytics를 표준 도구로 사용한다. KPI 정의는 기획 단계에서, 이벤트 수집 코드는 구현 단계에서 반드시 포함되어야 한다.

### Firebase 표준 스택

| 영역 | 패키지 | 용도 |
|------|--------|------|
| 핵심 | `@react-native-firebase/app` | Firebase 초기화 |
| Analytics | `@react-native-firebase/analytics` | 이벤트/사용자 속성/스크린 추적 |
| Crashlytics | `@react-native-firebase/crashlytics` | 충돌/예외 리포트 (KPI 신뢰도 보호) |
| Remote Config (선택) | `@react-native-firebase/remote-config` | 실험/플래그 |

Expo plugin 등록: `app.config.ts` → `plugins: ['@react-native-firebase/app', '@react-native-firebase/crashlytics']` 및 `expo-build-properties`로 `useFrameworks: 'static'`(iOS) 설정.

### 측정 표준 KPI (기본 세트)

**모든 앱에 기본으로 정의해야 하는 4개 축:**

| 축 | 대표 지표 | Firebase 이벤트 |
|----|----------|-----------------|
| 획득 (Acquisition) | 신규 설치, 첫 실행 | `first_open` (자동), `app_install` |
| 활성 (Activation) | DAU/WAU, 첫 핵심 행동 완료율 | `activation` (커스텀), `screen_view` (자동) |
| 유지 (Retention) | D1/D7/D30 리텐션, 세션 길이 | `session_start` (자동), `user_engagement` (자동) |
| 수익화 (Monetization) | 광고 노출/클릭, IAP 매출, ARPU | `ad_impression` (자동), `purchase` |

추가로 각 앱의 **북극성 지표(North Star Metric)** 1개를 PRD에서 명시한다 (예: "주간 사진 N장 촬영 사용자 수").

### 이벤트 네이밍 규칙

- snake_case, 영문 소문자, 동사_명사 형식 (`tap_camera_capture`, `view_gallery_grid`)
- 예약어 금지: Firebase 자동 이벤트(`session_start`, `screen_view` 등)와 중복 금지
- 파라미터는 25개 이하, 키 길이 ≤ 40자, 값 길이 ≤ 100자
- PII 금지: 이메일/전화번호/실명/정확한 위치는 절대 파라미터로 보내지 않는다

### 코드 통합 위치 (FSD)

```
src/shared/analytics/
├── client.ts          # firebase.analytics() 래퍼 — logEvent, setUserProperty
├── events.ts          # 이벤트 카탈로그 (상수 + 파라미터 타입)
├── hooks/
│   └── useScreenTracking.ts  # 화면 진입 시 screen_view 자동 호출
├── types/index.ts     # IEventName, TEventParams 등
└── index.ts           # barrel export
```

- 직접 `firebase.analytics().logEvent()` 호출 금지 — 반드시 `@/shared/analytics`의 래퍼 함수만 사용
- 이벤트 이름은 `events.ts`의 상수로만 정의 (오타/중복 방지)
- 개발 환경(`env.IS_DEV`)에서는 Analytics 수집을 비활성화하거나 디버그 모드 사용

### 통합 단계

Firebase 콘솔 자동화(Playwright MCP) · 설정파일 배치/보안(`.gitignore` + EAS Secrets) · 패키지 설치/plugin 등록 · `src/shared/analytics/` 모듈 작성 · `_layout.tsx` 초기화 · 이벤트 배선 · 빌드 검증의 **전체 절차는 `.claude/agents/api-integrator.md`("Firebase 콘솔 자동화", "Analytics 통합 규칙")** 와 orchestrate Phase 4d가 정본이다.

> 요약 규칙: `app.config.ts` plugins 에 `@react-native-firebase/app`, `@react-native-firebase/crashlytics`, `expo-build-properties`(iOS `useFrameworks: 'static'`), `./plugins/withRNFirebaseStaticBuild`(필수 빌드 패치)를 등록한다. `GoogleService-Info.plist`/`google-services.json`은 절대 커밋하지 않고 EAS Secrets로 주입한다. RNFirebase 빌드 이슈 상세: `.claude/skills/orchestrate/references/deploy-build-troubleshooting.md`.

### Hard Threshold (Analytics)

| 기준 | 임계값 |
|------|--------|
| PRD에 KPI 정의 누락 | **0개** (북극성 + 4축 기본 세트) |
| 직접 `firebase.analytics()` 호출 (래퍼 미사용) | **0개** |
| 이벤트 상수 미정의(매직 스트링) `logEvent` 호출 | **0개** |
| PII가 포함된 이벤트 파라미터 | **0개** |
| `GoogleService-Info.plist` / `google-services.json` 커밋 | **0개** |

## 스토어 평점 유도 (In-App Review Prompts) (MANDATORY)

**평점은 단순히 "달라"고 띄우는 게 아니라, 사용자가 가치를 느낀 직후의 짧은 순간을 노려야 한다.** 잘못된 타이밍에 띄우면 ★1 폭격을 유발한다. 모든 앱은 트리거를 코드 곳곳에 직접 호출하지 않고, **중앙 정책 엔진**을 통해 호출한다.

### 표준 스택

| 영역 | 패키지 | 비고 |
|------|--------|------|
| 평점 요청 | `expo-store-review` | iOS `SKStoreReviewController`, Android Google Play In-App Review API 래핑 |
| 카운터 persist | `@react-native-async-storage/async-storage` 또는 MMKV | **비민감 데이터** — SecureStore 불필요 |

설치:
```bash
npx expo install expo-store-review
```

### 플랫폼 한계 (알고 시작해야 한다)

- **iOS (`SKStoreReviewController.requestReview()`)**: 시스템이 **365일 윈도우 내 최대 3회**까지만 실제 다이얼로그를 노출한다. 초과 호출은 **에러 없이 조용히 무시**되므로 "표시되었는지" 알 길이 없다. HIG: "앱 실행 직후나 작업 도중에 묻지 말 것".
- **Android (Play In-App Review API)**: Google이 자체 쿼터를 관리하며 앱은 쿼터를 알 수 없다. **"리뷰 의향을 묻는 사전 프롬프트(would you like to review?) 금지"** — 정책 위반. 짧은 시간 내 반복 호출도 무시된다.
- **공통**: 호출 자체에 비용은 없지만, 정책 엔진으로 호출을 줄여야 "표시될 기회"가 보존된다. `requestReview()`는 표시 여부를 반환하지 않으므로 **표시되었다고 가정한 후속 UI/로직을 만들지 않는다**.

### 트리거 정책 (Hard Rules)

다음 모든 게이트를 통과해야 `requestReview()`가 호출된다:

| 게이트 | 기본값 | 비고 |
|--------|--------|------|
| 최소 설치 후 경과 일수 | 3일 이상 | "처음 본 앱"에 평점 금지 |
| 앱 실행(launch) 누적 횟수 | 5회 이상 | 한 번 써본 사용자 제외 |
| 핵심 액션 완료 횟수 | 3회 이상 | "Activation" 한 번이 아닌 반복 사용 |
| 마지막 요청 이후 경과 | 90일 이상 | iOS 시스템 쿼터 보호 |
| **365일 윈도우 내 자체 호출 횟수** | **3회 이하** | iOS 시스템 한도(연 3회)와 동일. 우리도 카운팅해서 초과 호출 자체를 차단 |
| 이번 세션에 이미 요청 | false | 한 세션에 1회 |
| **앱 실행 직후 cooldown** | **120초 이상 경과** | "실행 즉시" 노출 차단 (HIG) |
| **UI idle 상태 필수** | **true** | 모달/시트/네비게이션 트랜지션/폼 입력/비동기 작업 진행 중 호출 차단 |
| 최근 5분 내 에러/크래시 | false | 부정적 컨텍스트 차단 |
| `Platform.isPad` 등 폼팩터 제외 | 정책 결정 | 필요 시 옵트아웃 |

### 안티패턴 (즉시 FAIL)

- 앱 첫 실행 / 온보딩 도중 평점 요청
- 결제 실패, 네트워크 에러, 권한 거부 직후 평점 요청
- 모달 위에 모달로 평점 요청 (UX 충돌)
- "별점 5개 부탁드려요" 등 평점 점수 유도 문구 (App Store 가이드라인 위반)
- 평점을 안 주면 기능을 막는 dark pattern
- 각 화면에서 `StoreReview.requestReview()`를 정책 엔진 없이 직접 호출
- **자체 사전 프롬프트 금지** — "평점 남겨주실래요?" 같은 커스텀 다이얼로그/시트/액션시트로 의향 먼저 묻고 시스템 다이얼로그를 띄우는 흐름 금지 (Google Play 정책 위반, App Store도 권장하지 않음). 곧바로 시스템 다이얼로그(`StoreReview.requestReview()`)만 호출
- **표시 결과 의존 로직 금지** — `requestReview()`는 표시 여부를 반환하지 않는다. "다이얼로그가 떴으니 토스트 보여주자/다음 화면 이동하자" 같은 후속 UI 분기 금지. 호출은 fire-and-forget

### 코드 통합 위치 (FSD)

```
src/shared/store-review/
├── client.ts          # expo-store-review 래퍼 (requestReview, isAvailableAsync)
├── policy.ts          # 게이트 정책 엔진 (canRequest, evaluate)
├── store.ts           # Zustand persist — 카운터/타임스탬프 추적
├── triggers.ts        # TRIGGERS 상수 카탈로그 (액션 ID + 임계값)
├── hooks/
│   └── useStoreReview.ts  # maybeRequest(triggerId) 훅
├── types/index.ts
└── index.ts           # barrel export
```

**래퍼/정책 엔진(`canRequestReview`)/store/triggers/훅 구현은 `.claude/agents/api-integrator.md`의 "Store Review 모듈 / 정책 엔진 / 래퍼+훅" 섹션이 정본**이다.

- `IReviewState`는 `installedAt`·`sessionStartedAt`·`launchCount`·`keyActionCount`·`lastRequestedAt`·`lastErrorAt`·`requestedThisSession`·`requestHistory: string[]`를 포함한다. `recordLaunch()`가 `sessionStartedAt` 갱신, `markRequested()`가 `requestHistory` push + 1년 초과 prune.
- `IReviewPolicy`는 `minDaysSinceInstall`·`minLaunchCount`·`minKeyActionCount`·`minDaysSinceLastRequest`·**`maxRequestsPerYear`·`cooldownAfterLaunchSec`**·`blockAfterErrorWindowMin` 게이트와 `canRequestReview(state, { uiIsIdle }, policy)` 시그니처를 가진다.
- `maybeRequest`의 boolean 반환값은 "정책 통과 + 호출 시도"만 의미하며 다이얼로그 표시를 보증하지 않는다 → 후속 UI/네비게이션 분기 금지(fire-and-forget).

### 호출 규칙 (CRITICAL)

- 외부 코드는 `expo-store-review`를 직접 호출하지 않는다. **반드시 `useStoreReview().maybeRequest(REVIEW_TRIGGERS.X)`** 만 사용
- 트리거 ID는 `REVIEW_TRIGGERS` 상수 카탈로그에서만 가져온다 (매직 스트링 금지)
- 모든 평점 요청은 Analytics에 `request_store_review` 이벤트로 기록 (KPI 추적)
- 호출 위치: **긍정적 액션의 성공 콜백 안 + UI가 idle 상태**일 때만 (예: 저장 토스트가 사라진 뒤, 화면 전환이 끝난 뒤)
- 에러 핸들러(`onError`, catch 블록) 내부에서 호출 금지

### 카운터/이벤트 자동 집계

루트 `_layout.tsx`에서 앱 실행 시 `reviewStore.recordLaunch()`를 호출하고, 글로벌 에러 바운더리/Crashlytics 핸들러에서 `reviewStore.recordError()`를 호출한다. 핵심 액션 카운터(`recordKeyAction()`)는 ui-developer가 화면별 성공 콜백에서 호출한다.

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

### 에이전트 책임 분담

- **product-planner**: PRD에 "Review Triggers" 섹션 작성 — 어떤 액션이 트리거 후보인지, 임계값(N회 완료 등) 정의
- **api-integrator**: `src/shared/store-review/` 모듈 인프라(래퍼/정책/store/triggers/훅) 구축
- **ui-developer**: 각 화면의 성공 콜백에 `useStoreReview().maybeRequest(...)` 호출 삽입 + `recordKeyAction()` 카운터 호출
- **qa-reviewer**: 안티패턴/Hard Threshold 검사
- **배포 직전 게이트**: 인앱 리뷰는 **게시된 빌드에서만 표시**되고 출시 후엔 코드로만 고칠 수 있으므로, `store_review=true`인데 `maybeRequest`가 어느 화면에도 배선되지 않았으면 빌드를 보류한다 (orchestrate Phase 7 Step 7.0 — 트리거가 적절한 가치-순간에 들어갔는지 최종 확인)

## 광고 동의 시퀀스 / eCPM 최적화 (MANDATORY)

**AdMob 광고를 통합하는 모든 앱은 표준 동의 시퀀스를 반드시 따른다.** 순서가 어긋나면 첫 광고 요청이 동의 정보 없이 발사되어 EU eCPM이 사실상 non-personalized 트래픽 수준으로 폭락한다. iOS의 경우 ATT를 받지 못해 IDFA 기반 personalized 광고가 불가능해진다.

### 표준 스택

| 영역 | 패키지 | 비고 |
|------|--------|------|
| AdMob SDK | `react-native-google-mobile-ads` (^16) | `AdsConsent` UMP API 포함 |
| iOS 추적 권한 | `expo-tracking-transparency` | `NSUserTrackingUsageDescription` 필수 |
| 표준 헬퍼 | `src/features/ads/lib/consent.ts` | `initializeAdsWithConsent()` export |

### 표준 시퀀스 (절대 변경 금지)

```
UMP (GDPR) consent
   ↓  (EU 사용자: 동의 폼 노출 / 비 EU: no-op)
iOS ATT prompt
   ↓  (Android: skip)
mobileAds().setRequestConfiguration(...)
   ↓
mobileAds().initialize()
```

**왜 이 순서인가:**
- UMP가 ATT보다 먼저 와야 → 사용자가 GDPR 동의를 거부하면 ATT 무관하게 personalized ad 불가. 두 다이얼로그가 자연스럽게 연이어 노출됨.
- `setRequestConfiguration`이 `initialize()` 전이어야 → SDK가 첫 요청부터 child-directed / max content rating을 반영.
- `initialize()`가 마지막이어야 → 위 모든 동의/설정이 freeze 된 상태로 첫 광고 요청 발사.

### 구현 위치 (FSD)

```
src/features/ads/
├── lib/
│   └── consent.ts                # initializeAdsWithConsent / showAdsConsentForm
├── hooks/                        # useInterstitialAd / useRewardedAd / useAppOpenAd
├── ui/AdBanner.tsx
└── index.ts                      # barrel — initializeAdsWithConsent, isAdsReady, onAdsReady
```

루트 `_layout.tsx` 에서는 **`initializeAdsWithConsent()` 만 await** 한다. 개별 `AdsConsent.*` API 를 직접 부르거나 `mobileAds().initialize()` 를 직접 호출하지 않는다.

```tsx
// app/_layout.tsx
import { initializeAdsWithConsent } from '@features/ads';

useEffect(() => {
  void initializeAdsWithConsent();
}, []);
```

### AdMob 콘솔 사전 설정 (한 번)

UMP가 실제로 폼을 띄우려면 AdMob Console 의 메시지가 **게시(Publish)** 되어야 한다. 게시 안 된 상태면 `requestInfoUpdate()` 가 항상 `NOT_REQUIRED` 로 응답해 코드가 정상이어도 폼이 안 뜬다.

1. **GDPR message**: AdMob Console → Privacy & messaging → European regulations → 메시지 생성 → Publish
2. **IDFA message** (iOS 권장): Privacy & messaging → IDFA → 생성 → Publish (ATT alert 직전에 사전 설명 노출 가능)

배포 전에 두 메시지가 모두 Published 상태인지 확인한다.

> **GDPR/IDFA 메시지 게시 자동화 시퀀스**(앱별 개인정보처리방침 URL 입력, "광고 단위 배포" 마스터 스위치 native click, **"동의하지 않음" 드롭다운 → "사용 안함" 명시 선택**이라는 게시 버튼 활성화 trap 포함)는 `.claude/agents/api-integrator.md`의 "AdMob 콘솔 자동화" 섹션이 정본이다. 체크박스/스위치는 반드시 Playwright native click을 사용한다(JS click은 React/Angular state 미반영).

### 추적 권한 / Info.plist

`app.config.ts` 의 `infoPlist` 에 `NSUserTrackingUsageDescription` 을 명시한다. 동일 문구를 `expo-tracking-transparency` plugin 옵션과 `react-native-google-mobile-ads` plugin 의 `userTrackingUsageDescription` 옵션 양쪽에 모두 설정한다.

Android 는 ATT 없이도 `react-native-google-mobile-ads` 가 매니페스트에 `com.google.android.gms.permission.AD_ID` 를 자동 주입하므로 추가 설정 불필요.

### 사용자 추후 변경 (선택 — Privacy Options)

AdMob Console 에서 "Privacy Options" 가 REQUIRED 로 설정되어 있으면 앱 내 설정 화면에 "광고 개인정보 설정" 버튼을 노출하고, 클릭 시 `showAdsConsentForm()` 을 호출해 UMP 폼을 다시 띄운다.

### Analytics 기록 (강력 권장)

- `setUserProperty('ump_status', ...)` — `obtained` / `required` / `not_required` / `error`
- `setUserProperty('ump_can_request_ads', ...)` — `'true'` / `'false'`
- `setUserProperty('att_status', ...)` — `granted` / `denied` / `undetermined` / `restricted` / `not_applicable`

이 user property 가 있으면 Firebase / BigQuery 에서 동의 상태별 eCPM·노출률 코호트를 분리해 광고 전략 최적화에 활용 가능.

### eCPM 최적화 체크리스트

| 항목 | 임팩트 | 비고 |
|------|--------|------|
| UMP 시퀀스 적용 | EU eCPM +30~50% | 본 섹션의 표준 시퀀스 |
| `MaxAdContentRating.PG` | 광고 풀 확장 | `setRequestConfiguration` |
| Adaptive Banner | 배너 수익 +20% | `BannerAdSize.ANCHORED_ADAPTIVE_BANNER` |
| App Open 광고 | 추가 수익 라인 | Cold start + warm resume |
| Rewarded 광고 다종 | 사용자 인게이지먼트 ↑ | revive / coins / continue / shuffle 등 |
| 광고 mediation (선택) | eCPM +20~50% | AppLovin MAX / IronSource 등 (DAU 5K+에서 ROI) |

### Hard Threshold (광고 동의)

| 기준 | 임계값 |
|------|--------|
| `mobileAds().initialize()` 직접 호출 (`initializeAdsWithConsent` 미경유) | **0개** |
| UMP → ATT → `initialize()` 순서 위반 | **0개** |
| `AdsConsent.*` 또는 `expo-tracking-transparency` 직접 호출 (래퍼 미사용) | **0개** |
| `NSUserTrackingUsageDescription` 누락 (iOS) | **0개** |
| AdMob Console GDPR/IDFA 메시지 미게시 상태로 배포 | **0개** |

### 무효 트래픽 방지 / 계정 정지 방어 (MANDATORY — 상세는 에이전트 문서)

AdMob 계정 정지의 대부분은 무효 트래픽(개발자/테스터 클릭, 사용자 비정상 클릭)과 배치 정책 위반에서 발생한다. 상세 규칙은 아래 문서에 분산되어 있으며, 광고 통합 시 반드시 함께 적용한다:

| 영역 | 핵심 규칙 | 상세 위치 |
|------|----------|----------|
| 테스트 트래픽 격리 | 빌드 프로필별 광고 모드 + `testDeviceIdentifiers` 등록 | `.claude/agents/api-integrator.md` |
| 클릭/노출 방어 인프라 | 배너 클릭 가드 · 전면 광고 공유 쿨다운 · 포맷별 일일 cap · 지수 백오프 · 리워드 `EARNED_REWARD` 지급 | `.claude/agents/api-integrator.md` |
| 배치 규칙 | 화면당 배너 1개 · 터치 요소 이격 · 미로드 collapse · 숨김/가림 금지 · 리워드 opt-in | `.claude/agents/ui-developer.md` |
| 방어 정책 수치 | PRD "무효 트래픽 방어 정책" 표 | `.claude/agents/product-planner.md` |
| 검사 | 5d 체크리스트 + Hard Threshold / 광고 배치 검수 | `.claude/agents/qa-reviewer.md` / `app-inspector.md` |
| 계정 레벨 | app-ads.txt 게시 · 스토어 리스팅 연결 · 본인 클릭 금지 | `store-admob` 스킬 Step 7 |

| 기준 | 임계값 |
|------|--------|
| 한 화면에 배너 2개 이상 / 숨겨진·가려진 광고 렌더링 | **0개** |
| 전면 광고 `show()`가 `canShow*` 게이트(공유 쿨다운·일일 cap) 미경유 | **0개** |
| 리워드 보상 선지급 (`EARNED_REWARD` 콜백 외부) | **0개** |
| 광고 로드 실패 즉시 무한 재시도 (백오프 없음) | **0개** |
| 실광고 ID 빌드를 테스트 기기 미등록 상태로 내부 배포 | **0개** |

### 에이전트 책임 분담

- **product-planner**: PRD 에 "광고 정책" 섹션 작성 — 어느 placement (banner/interstitial/rewarded/app-open)을 쓸지, 노출 빈도 제한, EU/non-EU 대상 여부
- **api-integrator**: `src/features/ads/lib/consent.ts` 구축, `_layout.tsx` 에서 `initializeAdsWithConsent()` await, `app.config.ts` 의 plugin/infoPlist 설정
- **ui-developer**: `AdBanner` / `useInterstitialAd` / `useRewardedAd` 컴포넌트 배치 — 핵심 액션 직전/진행 중 광고 금지
- **qa-reviewer**: Hard Threshold 검사 + 동의 시퀀스 위반 탐지

## EAS Build & Deploy Rules (MANDATORY)

### 빌드 순서

프로덕션 빌드 시 반드시 아래 순서를 따른다:

1. **로컬 빌드 먼저** (`eas build --local`) → 빌드 에러 확인
2. 로컬 빌드 성공 시 → **클라우드 빌드** (`eas build`) 진행
3. 클라우드 빌드 크레딧 부족 시 로컬 빌드 결과물 사용

이렇게 하면 클라우드 빌드 크레딧 낭비 없이 Gradle/Xcode 에러를 사전에 잡을 수 있다.

### 빌드 아카이브·앱 크기 최적화

`.easignore`(빌드 아카이브 제외 목록)와 앱 크기 최적화 체크리스트(이미지 WebP · 미사용 폰트/의존성 제거 · Lottie 최적화 등)는 `.claude/skills/orchestrate/references/deploy-build-troubleshooting.md` 참고.

### 앱 이름 일관성 (MANDATORY)

스토어에 표시되는 앱 이름과 기기 홈 화면에 표시되는 앱 이름을 반드시 일치시킨다.

| 항목 | 설정 위치 | 설명 |
|------|----------|------|
| 홈 화면 이름 | `app.config.ts` → `withLocalizedAppName` plugin | 기기 언어별 앱 이름 |
| iOS 스토어 이름 | `fastlane/metadata/ios/{lang}/name.txt` | ASC에 표시되는 이름 |
| Android 스토어 이름 | `fastlane/metadata/android/{lang}/title.txt` | Play Store에 표시되는 이름 |
| 기본 이름 | `app.config.ts` → `name` | 홈 화면 기본 언어 이름과 동일해야 함 |

**규칙:**
- 위 4곳의 앱 이름이 언어별로 모두 동일해야 한다
- 앱 이름 변경 시 4곳 모두 동시에 변경한다
- 홈 화면 이름은 길면 잘리므로 30자 이내로 설정 (스토어 이름 제한과 동일)
- `withLocalizedAppName` plugin (`plugins/withLocalizedAppName.js`)은 prebuild 시 iOS `InfoPlist.strings`와 Android `values-{locale}/strings.xml`을 자동 생성
- plugin이 Xcode 프로젝트의 `PBXVariantGroup`에 파일을 등록해야 빌드에 포함됨
- **`locales` 필드와 동시 사용 금지**: `app.config.ts`에 `locales: { ko: './...json' }`처럼 Expo의 locales 핸들러를 사용하면 plugin은 자동으로 iOS 처리를 생략한다. 이 경우 각 언어 JSON에 `CFBundleDisplayName` 키를 직접 추가해야 한다 (예: `{ "CFBundleDisplayName": "마이앱", "NSCameraUsageDescription": "..." }`). 두 방식이 동시에 동작하면 "Multiple commands produce InfoPlist.strings" 빌드 에러가 발생함

### 배포 전 준비 · 플랫폼 특수 고려 · 빌드 트러블슈팅

배포 전 필수 준비(개인정보처리방침/아이콘/스크린샷/메타데이터/**릴리즈 노트 500byte 제한**/버전 관리), Android·iOS 특수 고려(Draft App 첫 제출은 Play Console 웹 수동 업로드 · `eas.json` `ascAppId` · `ITSAppUsesNonExemptEncryption` · ASC API Key 비대화식 제출), iOS/Android 빌드 트러블슈팅(xcodebuild 타임아웃 · `InfoPlist.strings` 중복 · **RNFirebase + RN 0.81 + New Arch + static frameworks 3대 빌드 에러와 `withRNFirebaseStaticBuild` 패치 상세** · reanimated `libworklets` 캐시)은 모두 `.claude/skills/orchestrate/references/deploy-build-troubleshooting.md` 로 이전했다. 배포 시 해당 문서 + `/store-deploy` 스킬을 따른다.

**Android 프로덕션 액세스 신청(개인 계정)**: 비공개 테스트 14일+/12명+ 게이트 충족 후 제출하는 "프로덕션 액세스 신청" 양식의 전체 질문·답변 작성 원칙(사실 기반·날조 금지·300자·worked example)은 `.claude/skills/orchestrate/references/play-production-access-application.md`가 정본이다. 신청서 작성은 `api-integrator`의 "Play Console 프로덕션 액세스 신청 자동화" 능력이 담당하며, 작성 시 반드시 이 문서를 참고한다.

## Branch Strategy

```
main     <- Production
  ^
devel    <- Development (default)
  ^
feature/* <- Feature branches
```

## Commands

```bash
npm install          # Install dependencies
npm start            # Dev server (LAN)
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run format       # Prettier
```

## 시뮬레이터 런타임 테스트 (sim-use) (MANDATORY)

시뮬레이터/에뮬레이터에서 **앱을 실제로 실행해 화면·흐름을 검증**할 때는 [`sim-use`](https://github.com/lycorp-jp/sim-use) CLI를 사용한다. 접근성 트리를 토큰 효율적 아웃라인으로 바꿔 **좌표가 아닌 요소 별칭(`@N`)으로 observe → act → verify** 하는 도구다. `simctl` 좌표 탭·Playwright 등 다른 방법으로 시뮬레이터 UI를 직접 조작하지 않는다. 정적 코드 리뷰(qa-reviewer)와 별개인 **런타임 검증**용이다.

### 부트스트랩 — 체크 후 없으면 설치 (런타임 테스트 시작 전 1회)

시뮬레이터 런타임 테스트 직전 아래를 먼저 실행한다. 이미 설치돼 있으면 no-op:

```bash
if ! command -v sim-use >/dev/null 2>&1; then
  brew tap lycorp-jp/tap && brew install lycorp-jp/tap/sim-use
  sim-use init --client claude --dest .claude/skills   # 이 프로젝트에 에이전트 스킬 등록
fi
```

- 요구: macOS 14+ / 최신 Xcode Command Line Tools. CLT가 outdated면 `brew install`이 실패하므로(예: macOS 26에 구 CLT), 시스템 설정 → 소프트웨어 업데이트에서 CLT를 갱신한 뒤 재시도한다.
- 설치 자체는 머신 로컬(Homebrew) — 레포에는 스킬 파일(`.claude/skills`)만 남는다.

### observe → act → verify 루프

```bash
sim-use ui                 # 관찰: 화면 요소 아웃라인 출력(@별칭 부여)
sim-use tap @9             # 조작: 별칭으로 탭
sim-use type "hello"       # 텍스트 입력
sim-use swipe @3 up        # 스와이프
sim-use ui                 # 검증: 결과 재확인
```

| 목적 | 명령 |
|------|------|
| 화면 관찰(요소 아웃라인) | `sim-use ui` |
| 탭 / 스와이프 / 입력 / 붙여넣기 | `sim-use tap @N` · `swipe` · `type` · `paste` |
| 버튼 · 제스처 · 키보드 상태 | `sim-use button` · `gesture` · `keyboard-state` |
| 스크린샷 / 영상 | `sim-use screenshot` · `record-video` |
| iOS 전용 키 입력 | `sim-use ios key` · `key-combo` · `key-sequence` |
| Android 브리지(기기당 1회) | `sim-use android init --device <serial>` |

- Android는 에뮬레이터/기기마다 `sim-use android init`으로 APK 브리지를 한 번 설치해야 한다.
- fire-and-verify: 조작 후 반드시 `sim-use ui`로 상태를 재확인한 뒤 다음 액션을 결정한다(`ui` 없이 좌표를 가정하지 않는다).

### 언제 쓰나
- **app-inspector**의 런타임 UX/기능 검증 — 정적 검수를 넘어 실제 화면 동작·흐름 확인
- `/iterate-app`의 Verify 단계 — 구현한 슬라이스를 시뮬레이터에서 직접 조작해 확인
- 버그 재현 / 회귀 확인

## CodeGraph (코드 인텔리전스 · 선택)

이 프로젝트는 CodeGraph(`codegraph` CLI + `codegraph_*` MCP 도구)를 **선택적으로** 사용한다. tree-sitter로 파싱한 심볼/호출/영향도 그래프로, grep이 줄 수 없는 **구조적** 답을 sub-ms로 준다. 설치·인덱스 빌드는 강제가 아니며, 없으면 모든 작업이 grep fallback으로 정상 진행한다.

- **초기 설정/인덱스 빌드**: orchestrate **Phase 0 Step 0.0**이 CLI 설치·인덱스 존재를 감지해 빌드 여부를 인터랙션으로 처리한다(무인 모드는 자동). 수동: `codegraph init -i`.
- **사용 원칙**: 구조 질문(무엇이 무엇을 호출/정의/파급하는지)은 codegraph, 리터럴 텍스트(문자열·주석·로그)는 grep. 결과는 신뢰하고 grep으로 재검증하지 않는다.

| 질문 | 도구 |
|------|------|
| X 정의 위치 / 심볼 찾기 | `codegraph_search` |
| 작업/영역 컨텍스트 | `codegraph_context` (PRIMARY) |
| X→Y 흐름 추적 | `codegraph_trace` |
| 무엇이 이걸 호출/이게 무엇을 호출 | `codegraph_callers` / `codegraph_callees` |
| 바꾸면 뭐가 깨지나 | `codegraph_impact` |
| 여러 심볼 소스 한 번에 | `codegraph_explore` |

- **루프에서**: `/iterate-app`은 매 사이클 진단 전 `codegraph sync`(변경분만)로 최신화하고 `codegraph impact`로 회귀 범위를 산정한다(상세: iterate-app 스킬).
- **인덱스 캐시(`.codegraph/`)는 `.gitignore`** — 머신 로컬. 클론 후 필요 시 `codegraph init -i`로 재빌드.

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
