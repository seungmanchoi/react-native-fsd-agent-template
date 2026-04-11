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
| 기획/PRD | `product-planner` | `.claude/agents/product-planner.md` |
| 스펙/Task 분해 | `spec-planner` | `.claude/agents/spec-planner.md` |
| 디자인/테마 | `design-architect` | `.claude/agents/design-architect.md` |
| FSD 모듈 생성 | `feature-builder` | `.claude/agents/feature-builder.md` |
| API/상태관리 | `api-integrator` | `.claude/agents/api-integrator.md` |
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
Phase 5: QA (병렬)
  5a qa-reviewer
  5b app-inspector     (/inspect-app)
Phase 6: Iteration     — Fix Loop (최대 3회)
Phase 7: Deployment    — /store-deploy
```

데이터 흐름: `_workspace/` 디렉토리를 통해 에이전트 간 컨텍스트 전달.

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
