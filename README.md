<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Feature--Sliced_Design-FSD-orange?style=for-the-badge" />
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

# React Native FSD Template

Production-ready React Native + Expo template with **Feature-Sliced Design (FSD)** architecture.

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

## Getting Started

### 1. Use this template

GitHub에서 **"Use this template"** 버튼을 클릭하거나:

```bash
gh repo create my-app --template seungmanchoi/react-native-fsd-template --clone
cd my-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

`.env` 파일을 수정하여 API URL 등을 설정합니다.

### 4. Run

```bash
npm start          # Expo Dev Server (LAN)
npm run ios        # iOS Simulator
npm run android    # Android Emulator
```

## Project Structure

```
.
├── app/                            # Expo Router (file-based routing)
│   ├── _layout.tsx                 # Root layout (providers)
│   ├── (auth)/                     # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   └── (tabs)/                     # Tab group (authenticated)
│       ├── _layout.tsx             # Bottom tabs (Home, Explore, Profile)
│       ├── index.tsx
│       ├── explore.tsx
│       └── profile.tsx
│
├── src/
│   ├── core/                       # App initialization
│   │   └── providers/              # QueryProvider, ThemeProvider
│   │
│   ├── features/                   # Business logic features
│   │   └── auth/                   # Example: authentication
│   │       ├── api/                # API calls
│   │       ├── hooks/              # useLogin, useSignup
│   │       ├── types/              # ILoginRequest, ILoginResponse
│   │       └── index.ts            # Public API
│   │
│   ├── entities/                   # Domain models
│   │   └── user/                   # Example: user entity
│   │       ├── api/                # User API
│   │       ├── store/              # Zustand store
│   │       ├── types/              # IUser
│   │       └── index.ts            # Public API
│   │
│   ├── widgets/                    # Independent UI blocks
│   │
│   └── shared/                     # Shared code
│       ├── api/                    # Axios client + token management
│       ├── config/                 # Environment, theme
│       ├── lib/                    # Custom hooks, utils
│       ├── types/                  # Common types
│       └── ui/                     # UI components
│           ├── Button.tsx
│           ├── Card.tsx
│           ├── Input.tsx
│           ├── Typography.tsx
│           ├── ErrorBoundary.tsx
│           └── Toast/
│
├── app.config.ts                   # Expo config (dynamic)
├── tailwind.config.js              # NativeWind/Tailwind config
├── tsconfig.json                   # TypeScript (path aliases)
├── .eslintrc.js                    # ESLint rules
├── .prettierrc.js                  # Prettier rules
└── eas.json                        # EAS Build profiles
```

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
├── store/                       # (optional) Zustand store
│   ├── my-feature.store.ts
│   └── index.ts
├── types/
│   ├── my-feature.types.ts     # Interfaces, types
│   └── index.ts
├── ui/                          # (optional) Feature-specific UI
│   ├── MyComponent.tsx
│   └── index.ts
└── index.ts                     # Public API (barrel export)
```

### Adding a New Entity

```
src/entities/my-entity/
├── api/
│   ├── my-entity.api.ts
│   └── index.ts
├── store/
│   ├── my-entity.store.ts
│   └── index.ts
├── types/
│   ├── my-entity.types.ts
│   └── index.ts
└── index.ts
```

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

## Customization

### 1. App name & identifiers

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

### 2. Theme colors

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

### 4. EAS Build

```bash
eas build:configure    # EAS 초기 설정
```

`eas.json`에서 빌드 프로필 수정.

## Naming Conventions

| Type | Prefix | Example |
|------|--------|---------|
| Interface | `I` | `IUserState` |
| Type | `T` | `TButtonVariant` |
| Enum | `E` | `EUserRole` |
| Hook | `use-` | `use-login.ts` |
| Component | PascalCase | `Button.tsx` |
| Util | camelCase | `auth-utils.ts` |

## Branch Strategy

```
main      ← Production
  ^
devel     ← Development (default)
  ^
feature/* ← Feature branches
```

## License

MIT
