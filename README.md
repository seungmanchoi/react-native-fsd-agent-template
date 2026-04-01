<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Feature--Sliced_Design-FSD-orange?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Harness-purple?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Agents-8_Specialists-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Skills-8_Workflows-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Pattern-Pipeline-yellow?style=for-the-badge" />
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
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
</p>

# React Native FSD Agent Template

AI 에이전트 기반 풀 라이프사이클 개발을 지원하는 React Native + Expo + Feature-Sliced Design 프로덕션 템플릿.

> **What makes this different?** 이 템플릿은 FSD 아키텍처 규칙을 이해하는 8개의 Claude Code 에이전트와 8개의 스킬을 포함합니다. "앱 만들어줘" 한 마디로 아이디어 도출부터 시장 조사 → 기획 → 디자인 시스템 → FSD 모듈 스캐폴딩 → API 연동 → 스크린 개발 → QA 검증까지 전체 파이프라인이 자동으로 실행됩니다.

---

## Full Pipeline

```
Phase 1: Ideation       idea-researcher   시장 조사, 경쟁 앱 분석, 아이디어 도출
           │
Phase 2: Planning       product-planner   PRD, 유저 스토리, FSD 모듈 맵 설계
           │
Phase 3: Design         design-architect  NativeWind 테마, 화면 레이아웃
           │
Phase 4: Implementation (순차)
  4a       feature-builder   FSD 모듈, Zustand store, TypeScript 타입
  4b       api-integrator    Axios 클라이언트, TanStack Query hooks
  4c       ui-developer      Expo Router 스크린, NativeWind UI
           │
Phase 5: QA (병렬)
  5a       qa-reviewer       코드 품질, TypeScript strict, FSD 규칙
  5b       app-inspector     기능/UX 검사, Safe Area, 접근성
           │
Phase 6: Iteration      Fix Loop (최대 3회)
           │
Phase 7: Deployment     /store-deploy → EAS Build → App Store / Google Play
```

데이터 흐름: 에이전트 간 컨텍스트는 `_workspace/` 디렉토리를 통해 전달됩니다.

---

## Agent Team

| 에이전트 | 역할 | 트리거 |
|---------|-----|-------|
| **idea-researcher** | 시장 조사, 앱 아이디어 도출 | "앱 아이디어 찾아줘" |
| **product-planner** | PRD, FSD 모듈 맵, 유저 스토리 | "앱 기획해줘" |
| **design-architect** | 디자인 시스템, NativeWind 테마 | "디자인 시스템 만들어줘" |
| **feature-builder** | FSD 모듈 스캐폴딩 | "feature/entity 만들어줘" |
| **api-integrator** | Axios + TanStack Query + Zustand | "API 연동해줘" |
| **ui-developer** | NativeWind 스크린 & UI 컴포넌트 | "스크린 만들어줘" |
| **qa-reviewer** | 코드 품질, TypeScript, FSD 규칙 | 각 Phase 자동 실행 |
| **app-inspector** | 기능/UX 검사, Safe Area, 접근성 | "앱 검사해줘" |

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
| `orchestrate` | "앱 만들어줘" | 전체 파이프라인 오케스트레이션 |

---

## Architecture Pattern

파이프라인은 두 가지 패턴을 혼합합니다.

- **Phase 1–3**: 순차 파이프라인 — 각 에이전트의 출력이 다음 에이전트의 입력이 됩니다.
- **Phase 4**: Fan-out (순차) — feature-builder → api-integrator → ui-developer 의존성 순서.
- **Phase 5**: 병렬 실행 — qa-reviewer와 app-inspector가 동시에 검사.
- **Phase 6**: Fix Loop — 최대 3회 반복 후 미해결 이슈는 TODO 마킹.

### Harness Design Principles

[Anthropic의 공식 하네스 설계 가이드](https://www.anthropic.com/engineering/harness-design-long-running-apps)와 [revfactory/harness](https://github.com/revfactory/harness)를 기반으로 설계되었습니다.

| 원칙 | 설명 |
|------|------|
| **Context Reset** | Phase 간 `_workspace/`에 산출물 저장 후 컨텍스트 리셋. Compaction보다 효과적 |
| **Sprint 기반 분해** | Phase 4에서 feature 단위 스프린트. 각 스프린트마다 구현→평가→수정 |
| **독립 Evaluator** | Generator(builder/integrator/developer)와 Evaluator(reviewer/inspector) 분리 |
| **Hard Threshold** | pass/fail 경성 기준. typecheck 0 에러, any 0개, FSD 위반 0개 |
| **디자인 4축 평가** | Design Quality(30%), Originality(25%), Craft(25%), Functionality(20%) |
| **능동 테스트** | 정적 분석 + `npm run typecheck/lint` 실행 + import 순환 참조 탐지 |

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
| Build & Deploy | EAS Build / EAS Submit |

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
│   │   ├── qa-reviewer.md              # Code quality assurance
│   │   └── app-inspector.md            # Functional/UX inspection
│   └── skills/                         # AI Skills
│       ├── ideate/                     # 아이디어 도출
│       ├── plan-app/                   # 앱 기획
│       ├── design-system/              # 디자인 시스템
│       ├── create-feature/             # Feature scaffolding
│       ├── create-entity/              # Entity scaffolding
│       ├── create-screen/              # Screen creation
│       ├── inspect-app/                # App inspection
│       └── orchestrate/                # Full pipeline orchestration
│
├── _workspace/                         # 에이전트 간 데이터 교환
│   ├── idea/                           # Phase 1 출력
│   ├── plan/                           # Phase 2 출력
│   ├── design/                         # Phase 3 출력
│   ├── implementation/                 # Phase 4 출력
│   └── qa/                             # Phase 5 출력
│
├── app/                                # Expo Router (file-based routing)
│   ├── _layout.tsx                     # Root layout (providers)
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
│   │   └── auth/                       # Example: authentication
│   │       ├── api/                    # API calls
│   │       ├── hooks/                  # useLogin, useSignup
│   │       ├── types/                  # ILoginRequest, ILoginResponse
│   │       └── index.ts                # Public API
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
│       ├── api/                        # Axios client + token management
│       ├── config/                     # Environment, theme
│       ├── lib/                        # Custom hooks, utils
│       ├── types/                      # Common types
│       └── ui/                         # UI components
│
├── app.config.ts                       # Expo config (dynamic)
├── tailwind.config.js                  # NativeWind/Tailwind config
├── tsconfig.json                       # TypeScript (path aliases)
├── .eslintrc.js                        # ESLint rules
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

상위 레이어는 하위 레이어만 참조할 수 있습니다. 동일 레벨 간 직접 참조는 금지합니다.

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
npm start              # Dev server (LAN mode)
npm run start:local    # Dev server (localhost)
npm run start:tunnel   # Dev server (tunnel)
npm run ios            # Run on iOS
npm run android        # Run on Android
npm run web            # Run on Web
npm run lint           # ESLint check
npm run typecheck      # TypeScript check
npm run format         # Prettier format
npm run eas:build:dev  # EAS development build
npm run eas:build:prod # EAS production build
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

`.env` 파일:

```
API_URL=http://your-api-server:3000
```

### 4. EAS Build 설정

```bash
eas build:configure    # EAS 초기 설정
```

`eas.json`에서 빌드 프로필 수정.

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

## Inspired By

- **[revfactory/harness](https://github.com/revfactory/harness)** — Agent Team & Skill Architect 메타 스킬. 에이전트 팀 구성, 파이프라인 패턴, `_workspace/` 데이터 흐름 방식의 원천
- **[Anthropic Harness Design](https://www.anthropic.com/engineering/harness-design-long-running-apps)** — Context Reset, Sprint 분해, Hard Threshold, 독립 Evaluator 등 장시간 에이전트 작업을 위한 공식 설계 가이드
- **[Feature-Sliced Design](https://feature-sliced.design/)** — 프론트엔드 아키텍처 방법론

---

## License

MIT
