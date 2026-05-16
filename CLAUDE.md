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

**필수 패턴**:
```typescript
// src/shared/secure-storage/client.ts
import * as SecureStore from 'expo-secure-store';
import { SECURE_KEYS, TSecureKey } from './keys';

const DEFAULT_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY, // iCloud 백업 차단
};

export const setSecureItem = async (key: TSecureKey, value: string) => {
  await SecureStore.setItemAsync(key, value, DEFAULT_OPTIONS);
};

export const getSecureItem = async (key: TSecureKey): Promise<string | null> => {
  return SecureStore.getItemAsync(key, DEFAULT_OPTIONS);
};

export const deleteSecureItem = async (key: TSecureKey) => {
  await SecureStore.deleteItemAsync(key, DEFAULT_OPTIONS);
};

export const clearAllSecure = async () => {
  await Promise.all(Object.values(SECURE_KEYS).map(deleteSecureItem));
};
```

```typescript
// src/shared/secure-storage/keys.ts
export const SECURE_KEYS = {
  ACCESS_TOKEN: 'auth.access_token',
  REFRESH_TOKEN: 'auth.refresh_token',
  BIOMETRIC_ENABLED: 'auth.biometric_enabled',
} as const;

export type TSecureKey = (typeof SECURE_KEYS)[keyof typeof SECURE_KEYS];
```

#### 토큰 저장소 통합 규칙

- `features/auth/store/`의 토큰 상태는 메모리에 보관하고, **persist 어댑터는 `expo-secure-store` 기반 custom storage**로 구현한다. Zustand `persist`의 `storage`에 `createJSONStorage(() => secureZustandStorage)`를 주입한다.
- Axios 인터셉터(`src/shared/api/client.ts`)는 토큰을 메모리 또는 SecureStore에서 가져온다. **AsyncStorage 직접 조회 금지**.
- 토큰 만료/로그아웃 시 `clearAllSecure()` 호출로 모든 시크릿 키를 일괄 삭제한다.
- iOS 옵션: 기본은 `WHEN_UNLOCKED_THIS_DEVICE_ONLY` — 디바이스 잠금 해제 시에만 접근, 백업/iCloud 동기화 제외.
- Android: `expo-secure-store`가 자동으로 Keystore-backed `EncryptedSharedPreferences`를 사용. 별도 설정 불필요.

#### 생체 인증 게이트 (선택)

결제·금융·헬스 데이터 등 고위험 토큰은 접근 시 생체 인증을 강제한다:
```typescript
await SecureStore.setItemAsync(key, value, {
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  requireAuthentication: true,
  authenticationPrompt: '인증이 필요합니다',
});
```

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

## Agent Team & Skills

이 프로젝트는 8개의 전문 에이전트와 8개의 스킬로 구성된 AI Agent Harness를 포함합니다.

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
| `orchestrate` | "앱 만들어줘" | 전체 파이프라인 오케스트레이션 |

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
Phase 6: Iteration     — Fix Loop (최대 3회)
Phase 7: Deployment    — /store-deploy
```

데이터 흐름: `_workspace/` 디렉토리를 통해 에이전트 간 컨텍스트 전달.

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

### 통합 단계 (필수 순서)

#### 1단계: Firebase 콘솔에서 프로젝트 및 앱 생성 (Playwright MCP 자동화)

**AdMob과 동일하게 Playwright MCP로 Firebase 콘솔(https://console.firebase.google.com)에 접속하여 수동 단계 없이 자동으로 진행한다.** Firebase의 앱 등록 API는 일반 사용자용 OAuth scope로는 호출이 제한되므로 콘솔 UI 자동화가 표준이다.

##### Playwright MCP 사용 절차
1. `mcp__playwright__browser_navigate`로 `https://console.firebase.google.com` 접속
2. 로그인이 필요하면 사용자에게 직접 로그인 요청 (브라우저 창은 비-headless 모드로 유지)
3. **프로젝트 선택 또는 생성**
   - 기존 Firebase 프로젝트가 있으면 선택
   - 없으면 "프로젝트 추가" → 프로젝트 이름 입력 (보통 `{앱슬러그}-prod`) → Google Analytics 사용 설정 ON → 계정 선택 → 만들기
4. **iOS 앱 추가**
   - 프로젝트 개요 → "앱 추가" → iOS 아이콘 클릭
   - Apple bundle ID: `app.config.ts`의 `ios.bundleIdentifier` 값 입력
   - 앱 닉네임: 앱 이름 입력 (옵션)
   - App Store ID: 비워두기 (출시 후 입력 가능)
   - "앱 등록" → **GoogleService-Info.plist 다운로드** 버튼 클릭
   - SDK 추가/콘솔 단계는 "다음" 눌러서 스킵 (코드 통합은 4단계에서 처리)
5. **Android 앱 추가**
   - "앱 추가" → Android 아이콘 클릭
   - Android 패키지 이름: `app.config.ts`의 `android.package` 값 입력
   - 앱 닉네임 입력 (옵션)
   - 디버그 서명 인증서 SHA-1: 일단 비워두기 (Crashlytics/SDK는 SHA-1 없이도 동작)
   - "앱 등록" → **google-services.json 다운로드** 버튼 클릭
6. **다운로드 파일을 프로젝트로 이동**
   - `~/Downloads/GoogleService-Info.plist` → `ios/GoogleService-Info.plist`
   - `~/Downloads/google-services.json` → `android/app/google-services.json`
   - prebuild 전이라 `ios/`, `android/` 폴더가 없으면 일단 `firebase/` 임시 폴더에 보관 후 `expo prebuild --clean` 후 재배치
7. **Analytics 활성화 확인**
   - 콘솔 좌측 메뉴 "Analytics" → "대시보드" 클릭하여 데이터 스트림이 활성 상태인지 확인
   - "측정 ID(G-XXXXXXXXXX)"를 기록 (선택)

##### Playwright MCP 자동화 실패 시 fallback
- Firebase 콘솔이 UI를 변경하여 selector가 실패하면 즉시 중단하고 사용자에게 "Firebase 콘솔에서 iOS/Android 앱을 수동으로 등록한 뒤, `GoogleService-Info.plist`와 `google-services.json`을 `~/Downloads/`에 받아두었다"는 확인을 요청한다.
- 사용자 확인 후 6단계(파일 이동)부터 자동화를 재개한다.

#### 2단계: 설정 파일 배치 및 보안 처리

1. **로컬 배치**
   ```
   ios/GoogleService-Info.plist
   android/app/google-services.json
   ```
2. **`.gitignore`에 즉시 추가** (커밋 차단)
   ```gitignore
   # Firebase secrets — never commit
   ios/GoogleService-Info.plist
   android/app/google-services.json
   firebase/
   ```
3. **EAS Secrets로 빌드 시 주입**
   ```bash
   eas secret:create --scope project --name GOOGLE_SERVICES_PLIST --type file --value ./ios/GoogleService-Info.plist
   eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./android/app/google-services.json
   ```
4. **`app.config.ts`에서 환경변수 참조**
   ```typescript
   ios: { googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? './ios/GoogleService-Info.plist', ... }
   android: { googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './android/app/google-services.json', ... }
   ```

#### 3단계: 패키지 설치 및 plugin 등록

```bash
npm install @react-native-firebase/app @react-native-firebase/analytics @react-native-firebase/crashlytics
npx expo install expo-build-properties
```

`app.config.ts`의 `plugins`에 추가:
```typescript
plugins: [
  '@react-native-firebase/app',
  '@react-native-firebase/crashlytics',
  ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
],
```

#### 4단계: `src/shared/analytics/` 모듈 작성
래퍼(`client.ts`)·이벤트 카탈로그(`events.ts`)·`useScreenTracking` 훅·barrel export.

#### 5단계: 루트 `_layout.tsx`에서 Analytics 초기화
`initAnalytics()` 호출 (내부에서 `setAnalyticsCollectionEnabled(env.IS_PROD)` + `setCrashlyticsCollectionEnabled(env.IS_PROD)` 수행).

#### 6단계: 이벤트 트래킹 적용
PRD의 KPI에 매핑된 화면/액션에 `useScreenTracking()` 및 `logEvent()` 삽입.

#### 7단계: 빌드 검증
```bash
npx expo prebuild --clean
npm run typecheck && npm run lint
eas build --profile preview --platform ios --local   # 또는 development
```
빌드 로그에서 `[Firebase/Analytics][I-ACS...]` 초기화 로그가 나오는지 확인한다.

### Hard Threshold (Analytics)

| 기준 | 임계값 |
|------|--------|
| PRD에 KPI 정의 누락 | **0개** (북극성 + 4축 기본 세트) |
| 직접 `firebase.analytics()` 호출 (래퍼 미사용) | **0개** |
| 이벤트 상수 미정의(매직 스트링) `logEvent` 호출 | **0개** |
| PII가 포함된 이벤트 파라미터 | **0개** |
| `GoogleService-Info.plist` / `google-services.json` 커밋 | **0개** |

## EAS Build & Deploy Rules (MANDATORY)

### 빌드 순서

프로덕션 빌드 시 반드시 아래 순서를 따른다:

1. **로컬 빌드 먼저** (`eas build --local`) → 빌드 에러 확인
2. 로컬 빌드 성공 시 → **클라우드 빌드** (`eas build`) 진행
3. 클라우드 빌드 크레딧 부족 시 로컬 빌드 결과물 사용

이렇게 하면 클라우드 빌드 크레딧 낭비 없이 Gradle/Xcode 에러를 사전에 잡을 수 있다.

### 빌드 아카이브 최적화 (.easignore)

EAS 클라우드 빌드 시 불필요한 파일이 업로드되면 아카이브 크기가 커지고 업로드 시간이 증가한다. `.easignore` 파일을 반드시 설정한다:

```
# .easignore 필수 항목
node_modules/
assets/store-screenshots/
assets/store-listing/
fastlane/
screenshots/
docs/
scripts/
build-output/
.git/
.idea/
.vscode/
.playwright-mcp/
.DS_Store
*.md
*.tsbuildinfo
```

### 앱 크기 최적화 체크리스트

배포 전 아래 항목을 확인한다:

| 항목 | 방법 | 효과 |
|------|------|------|
| 이미지 최적화 | PNG → WebP 변환, 해상도 적정화 | 에셋 크기 50%+ 감소 |
| 미사용 폰트 제거 | 사용하지 않는 `@expo-google-fonts/*` 삭제 | 폰트당 0.5-2MB 절감 |
| 미사용 의존성 제거 | `npm ls --all` 확인 후 미사용 패키지 삭제 | 번들 크기 감소 |
| Lottie 애니메이션 최적화 | 파일 크기 확인, 불필요한 레이어 제거 | 1-5MB 절감 가능 |
| 네이티브 디버그 심볼 | `eas.json`에서 production 프로필 확인 | 앱 크기 직접 영향 없음 |
| ProGuard/R8 (Android) | 자동 적용됨, 매핑 파일 경고 무시 가능 | 코드 크기 감소 |
| Bitcode (iOS) | Expo managed에서 자동 처리 | - |

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

### 배포 전 필수 준비 항목

| 항목 | 설명 |
|------|------|
| 개인정보처리방침 URL | GitHub Pages 등에 호스팅, 4개 언어 권장 |
| 앱 아이콘 | iOS: 1024x1024, Android: 512x512 (adaptive icon) |
| 스크린샷 | iOS: iPhone 6.7"/6.5", iPad 12.9". Android: 1080x1920 phone |
| 그래픽 이미지 (Android) | 1024x500 feature graphic |
| 스토어 메타데이터 | `fastlane/metadata/` 구조로 title, description, release notes 준비 |
| **릴리즈 노트** | **Android changelogs는 반드시 500 bytes 이내**. Google Play API 제한. iOS release_notes는 4000자까지 가능하지만, 동일 내용을 Android에도 사용하므로 **500 bytes 기준으로 작성** |
| 앱 버전 관리 | ASC/Play 기존 버전보다 높은 version 설정 필수 |
| `.easignore` 설정 | 빌드 아카이브에 불필요한 파일 제외 |

### Android 특수 고려사항

- **lintOptions/lint 구문**: AGP 8+ 에서 `lintOptions`는 `lint`로 변경됨. Expo config plugin 작성 시 주의
- **ACTIVITY_RECOGNITION 권한**: `expo-sensors` 사용 시 자동 포함됨. Play Console "건강 앱" 질문에서 용도 설명 필요
- **Draft App 제한**: 앱 설정 미완료 시 Google Play API(fastlane supply 포함) 커밋이 실패함. Play Console 웹에서 앱 설정을 먼저 완료해야 함
- **첫 번째 제출**: EAS Submit / fastlane이 아닌 Play Console 웹에서 수동으로 첫 AAB 업로드 필요

### iOS 특수 고려사항

- **ASC App ID**: `eas.json`의 `ascAppId`에 실제 App Store Connect 앱 ID 설정 필수 (기본값 변경)
- **버전 충돌**: ASC에 이미 높은 버전이 있으면 낮은 버전 업로드 불가. `app.config.ts`에서 버전 확인
- **ITSAppUsesNonExemptEncryption**: 암호화 미사용 시 `Info.plist`에 `false` 설정으로 수출 규정 팝업 스킵
- **비대화식 제출 (ASC API Key)**: `eas submit --non-interactive`로 자동 제출하려면 `eas.json`의 `submit.production.ios`에 `appleId` 외에 다음을 추가한다:
  ```json
  "ascApiKeyPath": "./fastlane/keys/AuthKey_XXXXXXXXXX.p8",
  "ascApiKeyId": "XXXXXXXXXX",
  "ascApiKeyIssuerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  ```
  `appleId`만 설정된 상태에서는 앱 별 암호 입력을 요구하므로 CI/자동 파이프라인이 멈춘다.

### iOS 빌드 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `xcodebuild -showBuildSettings` 타임아웃 (fastlane 단계) | Apple Silicon + RN 0.81 + SPM 의존성 해석 시간 초과. 기본 3초 4회 retry로 부족 | 빌드 명령 앞에 `FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT=120 FASTLANE_XCODEBUILD_SETTINGS_RETRIES=8` 환경변수 설정 |
| "Multiple commands produce .../InfoPlist.strings" | `app.config.ts`의 `locales` 필드와 `withLocalizedAppName` plugin이 둘 다 PBXVariantGroup을 등록 | 위 "앱 이름 일관성" 항목 참고. plugin은 `locales` 사용 시 자동으로 iOS 처리를 생략함. 각 언어 JSON에 `CFBundleDisplayName` 추가 |
| `eas submit` "You've already submitted this version" | 동일 `expo.version`이 이미 ASC에 업로드됨 (TestFlight도 동일 version+build 조합 거부) | `app.config.ts`의 `APP_VERSION` 패치(예: 1.0.2 → 1.0.3) 후 재빌드 |

### Android 빌드 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `react-native-reanimated:buildCMakeRelWithDebInfo` 단계에서 `libworklets.so missing and no known rule to make it` | 로컬 `node_modules/react-native-{reanimated,worklets}/android/.cxx` 캐시가 이전 빌드의 절대 경로를 참조 | `cd android && ./gradlew --stop && cd ..` 후 `rm -rf android node_modules/react-native-reanimated/android/{.cxx,build} node_modules/react-native-worklets/android/{.cxx,build}` 실행. EAS가 prebuild를 다시 수행하면서 일관된 경로로 빌드함 |
| "Specified value for android.package is ignored because an android directory was detected" | 로컬에 `android/` 폴더가 이미 있음 (이전 prebuild 결과) | 의도한 동작이라면 무시. `app.config.ts`의 `android.package` 변경을 반영하려면 `android/` 삭제 후 재빌드 |

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
