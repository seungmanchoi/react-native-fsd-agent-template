# Orchestrate Skill — Full App Lifecycle Pipeline

## Trigger Phrases
- "앱 만들어줘"
- "풀스택으로 만들어줘"
- "프로덕션 앱 만들어줘"
- "end-to-end 개발"
- "처음부터 끝까지 만들어줘"

## Overview

이 스킬은 React Native + Expo + FSD 아키텍처 기반 앱의 **전체 라이프사이클**을 8개의 AI 에이전트와 8개의 스킬을 통해 자동으로 오케스트레이션한다.

**Tech Stack**: React Native 0.81 + Expo 54 + FSD + NativeWind + Zustand + TanStack Query + Axios + TypeScript

### Harness Design Principles (Anthropic)

이 오케스트레이터는 Anthropic의 공식 하네스 설계 원칙을 따른다:
> 상세: `references/harness-principles.md` 참조

1. **Context Reset > Compaction** — Phase 간 전환 시 `_workspace/`에 산출물 저장 후 컨텍스트 리셋. 장시간 작업의 컨텍스트 저하(degradation)와 조급증(anxiety)을 방지.
2. **Sprint 기반 분해** — Phase 4에서 feature 단위 스프린트로 분해. 각 스프린트마다 구현→평가→수정 루프 수행.
3. **독립 Evaluator** — Generator(feature-builder, api-integrator, ui-developer)와 Evaluator(qa-reviewer, app-inspector)를 분리. 자체 평가 지양.
4. **Hard Threshold** — 소프트 점수가 아닌 pass/fail 경성 기준. 하나라도 임계값 이하면 스프린트 FAIL.
5. **디자인 4축 평가** — Design Quality, Originality, Craft, Functionality 축으로 디자인 산출물 평가.

---

## Workspace

모든 에이전트는 `_workspace/` 디렉토리를 통해 데이터를 주고받는다.

```
_workspace/
├── idea/
│   ├── market-research.md      # idea-researcher 출력
│   └── app-concepts.md
├── plan/
│   ├── prd.md                  # product-planner 출력
│   ├── user-stories.md
│   └── fsd-module-map.md
├── design/
│   ├── design-system.md        # design-architect 출력
│   ├── nativewind-theme.md
│   └── screen-layouts.md
├── implementation/
│   ├── features/               # feature-builder 출력
│   ├── api/                    # api-integrator 출력
│   └── screens/                # ui-developer 출력
└── qa/
    ├── code-review.md          # qa-reviewer 출력
    └── inspection-report.md    # app-inspector 출력
```

---

## Full Pipeline

### Phase 1: Ideation — `idea-researcher`

**에이전트**: `idea-researcher`
**스킬**: `/ideate`
**입력**: 사용자 요청 (자연어)
**출력**: `_workspace/idea/`

```
Tasks:
1. 시장 조사 및 경쟁 앱 분석
2. 앱 아이디어 3~5개 도출
3. 각 아이디어의 핵심 가치, 타겟 유저, 차별점 정리
4. 최적 아이디어 선정 및 근거 작성
```

**Output format** (`_workspace/idea/app-concepts.md`):
```markdown
# Selected App Concept
- Name: ...
- Tagline: ...
- Target Users: ...
- Core Value: ...
- Key Features: [feature1, feature2, ...]
- Differentiators: ...
```

**Error Handling**: 아이디어 도출 실패 시, 사용자에게 앱 카테고리(예: 생산성, 헬스, 소셜)를 질문하고 재시도.

---

### Phase 2: Planning — `product-planner`

**에이전트**: `product-planner`
**스킬**: `/plan-app`
**입력**: `_workspace/idea/app-concepts.md`
**출력**: `_workspace/plan/`

```
Tasks:
1. PRD (Product Requirements Document) 작성
2. 에픽/유저 스토리 분해
3. FSD 모듈 맵 설계 (features/, entities/, shared/)
4. 우선순위 로드맵 (MVP vs Nice-to-have)
```

**Output format** (`_workspace/plan/fsd-module-map.md`):
```markdown
# FSD Module Map
## features/
- auth: 로그인/회원가입/토큰 관리
- [feature-name]: ...

## entities/
- user: 사용자 도메인 모델
- [entity-name]: ...

## shared/
- api: Axios 클라이언트
- ui: 공통 컴포넌트
```

**Error Handling**: PRD가 불명확할 경우, 핵심 유저 플로우 3개를 먼저 정의하고 진행.

---

### Phase 3: Design — `design-architect`

**에이전트**: `design-architect`
**스킬**: `/design-system`
**입력**: `_workspace/plan/`
**출력**: `_workspace/design/`

```
Tasks:
1. NativeWind 커스텀 테마 설계 (colors, typography, spacing)
2. 공통 UI 컴포넌트 스펙 정의
3. 각 스크린 레이아웃 와이어프레임 (텍스트 기반)
4. 네비게이션 구조 설계 (Expo Router 기반)
```

**Output format** (`_workspace/design/nativewind-theme.md`):
```markdown
# NativeWind Theme
## Colors
- primary: #...
- secondary: #...
- background: #...
- surface: #...
- error: #...

## Typography
- heading: font-bold text-2xl
- body: text-base
- caption: text-sm text-gray-500
```

**Error Handling**: 디자인 시스템이 정의되지 않으면 기본 NativeWind 팔레트를 사용하고 진행.

---

### Phase 4: Implementation — 3 에이전트 순차 실행

Phase 4는 의존성 순서에 따라 3개 에이전트가 **순차적으로** 진행한다.

#### Phase 4a: Feature Builder — `feature-builder`

**에이전트**: `feature-builder`
**스킬**: `/create-feature`, `/create-entity`
**입력**: `_workspace/plan/fsd-module-map.md`, `_workspace/design/`
**출력**: `src/features/`, `src/entities/`

```
Tasks:
1. FSD 모듈 맵 기반 features/ 구조 생성
2. entities/ 도메인 모델 생성
3. Zustand store 세팅 (필요한 feature만)
4. TypeScript 타입 정의 (Interface, Type, Enum)
5. 각 모듈의 index.ts barrel export 작성
```

**FSD Feature 구조**:
```
features/{name}/
├── api/           # API 호출 함수
├── hooks/         # useQuery, useMutation
├── store/         # Zustand store (선택적)
├── types/         # TS 타입
├── ui/            # UI 컴포넌트
└── index.ts       # Public API
```

**Error Handling**: 타입 충돌 발생 시 `shared/types/`에 공통 타입 추출.

#### Phase 4b: API Integrator — `api-integrator`

**에이전트**: `api-integrator`
**입력**: `_workspace/plan/prd.md`, `src/features/` (4a 출력)
**출력**: `src/shared/api/`, `src/features/*/api/`, `src/features/*/hooks/`

```
Tasks:
1. Axios 클라이언트 설정 (baseURL, interceptors, 토큰 자동 갱신)
2. 각 feature의 API 함수 구현
3. TanStack Query hooks 작성 (useQuery, useMutation, infinite)
4. API 에러 핸들링 표준화
5. 개발용 목 데이터 작성
```

**Token Auto-Refresh 패턴**:
```typescript
// src/shared/api/client.ts
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // refresh token logic
    }
  }
);
```

**Error Handling**: API 스펙 미정 시 RESTful 컨벤션으로 목 엔드포인트 생성.

#### Phase 4c: UI Developer — `ui-developer`

**에이전트**: `ui-developer`
**스킬**: `/create-screen`
**입력**: `_workspace/design/screen-layouts.md`, `src/features/` (4a+4b 출력)
**출력**: `app/` (Expo Router), `src/widgets/`, `src/shared/ui/`

```
Tasks:
1. Expo Router 기반 스크린 파일 생성
2. NativeWind 스타일 적용
3. Feature hooks 연결
4. Safe Area handling (SafeAreaView 필수)
5. 로딩/에러/빈 상태 처리
6. React Hook Form + Zod 폼 구현
```

**필수 패턴**:
```typescript
// 모든 스크린에 SafeArea 적용
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* content */}
    </SafeAreaView>
  );
}
```

**Error Handling**: 레이아웃 명세 누락 시 기본 FlatList + Empty State 패턴 적용.

---

### Phase 5: QA — 2 에이전트 병렬 실행

Phase 5는 2개 에이전트가 **병렬로** 실행된다.

#### Phase 5a: QA Reviewer — `qa-reviewer`

**에이전트**: `qa-reviewer`
**입력**: `src/` 전체
**출력**: `_workspace/qa/code-review.md`

```
Checks:
1. TypeScript strict mode 위반 (any 타입 사용 금지)
2. FSD 의존성 규칙 준수 (상위 레이어 → 하위 레이어만 허용)
3. ESLint 규칙 위반
4. 불필요한 re-render (useCallback, useMemo 누락)
5. 메모리 누수 (useEffect cleanup 누락)
6. 보안 이슈 (하드코딩된 시크릿, 노출된 API 키)
```

**Test Scenarios** (Harness 패턴):
```
정상 플로우:  모든 화면 렌더링 → 데이터 로딩 → 사용자 상호작용
에러 플로우:  네트워크 오류 → 401 토큰 만료 → 빈 데이터 상태
엣지 케이스:  오프라인 상태, 느린 네트워크, 대용량 리스트
```

#### Phase 5b: App Inspector — `app-inspector`

**에이전트**: `app-inspector`
**스킬**: `/inspect-app`
**입력**: `app/` 전체, `src/` 전체
**출력**: `_workspace/qa/inspection-report.md`

```
Checks:
1. 앱 구동 가능 여부 (import 오류, 누락된 파일)
2. 화면 전환 흐름 검증 (Expo Router 라우팅)
3. UI/UX 일관성 (NativeWind 클래스 오류, 스타일 누락)
4. Safe Area 적용 여부 (모든 스크린)
5. 접근성 (accessibilityLabel, accessibilityRole)
6. 성능 지표 (FlatList keyExtractor, getItemLayout)
```

**Fix Loop** (Harness 패턴):
```
inspection-report.md에 이슈 발견 시:
→ 심각도 HIGH:   즉시 수정 후 재검사 (최대 3회)
→ 심각도 MEDIUM: 수정 후 Phase 6 진행
→ 심각도 LOW:    백로그 등록 (TODO 주석)
```

---

### Phase 6: Iteration

Phase 5에서 발견된 이슈가 HIGH 이상일 경우:

```
qa-reviewer 수정 적용
  → app-inspector 재검사
  → 최대 3회 반복
  → 미해결 이슈는 // TODO: [ISSUE] 주석으로 마킹
```

---

### Phase 7: Deployment

**스킬**: `/store-deploy` 참조 (별도 스킬)
**입력**: `_workspace/` 전체, `app.config.ts`

```
Tasks:
1. EAS Build (프로덕션 바이너리)
2. 스토어 메타데이터 생성
3. 스크린샷 생성
4. App Store / Google Play 제출
```

상세 절차: `~/works/store-deploy-plugin/skills/store-deploy/SKILL.md`

---

## Pipeline Diagram

```
[사용자 요청]
      │
      ▼
┌──────────────────────────┐
│  Phase 1: Ideation       │  idea-researcher  (/ideate)
└────────────┬─────────────┘
             │ _workspace/idea/
             ▼
┌──────────────────────────┐
│  Phase 2: Planning       │  product-planner  (/plan-app)
└────────────┬─────────────┘
             │ _workspace/plan/
             ▼
┌──────────────────────────┐
│  Phase 3: Design         │  design-architect (/design-system)
└────────────┬─────────────┘
             │ _workspace/design/
             ▼
┌──────────────────────────────────────────────┐
│  Phase 4: Implementation (순차)              │
│  4a feature-builder (/create-feature/entity) │
│     → 4b api-integrator                      │
│        → 4c ui-developer (/create-screen)    │
└────────────┬─────────────────────────────────┘
             │ src/, app/
             ▼
┌──────────────────────────────────────────────┐
│  Phase 5: QA (병렬)                          │
│  5a qa-reviewer  ◄──────►  5b app-inspector  │
│                              (/inspect-app)   │
└────────────┬─────────────────────────────────┘
             │ _workspace/qa/
             ▼
┌──────────────────────────┐
│  Phase 6: Iteration      │  Fix Loop (최대 3회)
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Phase 7: Deployment     │  /store-deploy
└──────────────────────────┘
```

---

## Agent-Skill Mapping

| 에이전트 | 담당 스킬 | 책임 영역 |
|---------|----------|----------|
| `idea-researcher` | `/ideate` | 시장 조사, 앱 아이디어 도출 |
| `product-planner` | `/plan-app` | PRD, FSD 모듈 맵, 유저 스토리 |
| `design-architect` | `/design-system` | NativeWind 테마, 화면 레이아웃 |
| `feature-builder` | `/create-feature`, `/create-entity` | FSD 모듈, Zustand, TS 타입 |
| `api-integrator` | — | Axios 클라이언트, TanStack Query hooks |
| `ui-developer` | `/create-screen` | Expo Router 스크린, NativeWind UI |
| `qa-reviewer` | — | 코드 품질, TypeScript, FSD 규칙 |
| `app-inspector` | `/inspect-app` | 기능/UX 검사, Safe Area, 접근성 |

---

## Conventions (전 에이전트 공통)

```typescript
// 타입 네이밍
interface IUser { ... }     // Interface → I 접두사
type TApiResponse = ...     // Type → T 접두사
enum EStatus { ... }        // Enum → E 접두사

// import alias
import { Button } from '@/shared/ui';
import { useAuth } from '@/features/auth';

// no any
// ❌ const data: any = ...
// ✅ const data: IUser = ...
```

---

## Error Escalation

```
각 Phase에서 블로킹 이슈 발생 시:
1. _workspace/{phase}/error.md에 이슈 기록
2. 다음 Phase로 진행하지 않고 사용자에게 알림
3. 사용자 입력 후 해당 Phase부터 재개
```
