---
name: orchestrate
description: "React Native + Expo + FSD 앱의 전체 라이프사이클(아이디어→기획→스펙→디자인→구현→QA→배포)을 하네스 에이전트·스킬로 오케스트레이션하는 일회성 빌드 파이프라인. '앱 만들어줘', '풀스택으로 만들어줘', '프로덕션 앱 만들어줘', 'end-to-end 개발', '처음부터 끝까지 만들어줘' 요청 시 반드시 이 스킬을 사용할 것. (출시 후 반복 개선은 /iterate-app)"
---

# Orchestrate Skill — Full App Lifecycle Pipeline

## Trigger Phrases
- "앱 만들어줘"
- "풀스택으로 만들어줘"
- "프로덕션 앱 만들어줘"
- "end-to-end 개발"
- "처음부터 끝까지 만들어줘"

## Overview

이 스킬은 React Native + Expo + FSD 아키텍처 기반 앱의 **전체 라이프사이클**을 하네스 에이전트와 스킬로 자동 오케스트레이션한다.

> **Codex 에서 실행 중이면** 이 문서의 Claude 도구 이름(`Agent`, `AskUserQuestion`, `SendMessage`, `/skill`, `mcp__*`)을 `references/runtime-adapters.md` 의 Codex 대응으로 읽는다.
>
> **통과 기준은 하나다**: `npm run verify`(typecheck · lint · test · check:harness)가 green 이고 CLAUDE.md Hard Threshold 위반이 0 이어야 Phase 를 넘긴다. Stop hook 이 같은 명령을 돌리지만, hook 이 없거나 신뢰되지 않은 환경에서도 직접 실행한다.

**Tech Stack**: React Native 0.86 + Expo SDK 57 + FSD + NativeWind + Zustand + TanStack Query + Axios + TypeScript 6

### Harness Design Principles (Anthropic)

Context Reset, Sprint 분해, Generator-Evaluator 분리, Hard Threshold, Pivot vs Refine, Active Testing, Model Capability Adaptation: `references/harness-principles.md`.

## Supervisor 메커니즘

orchestrate 스킬 자체가 **수퍼바이저** 역할을 한다. 수퍼바이저는 다음을 책임진다:

### 1. 파이프라인 상태 추적

`_workspace/pipeline-status.md`를 생성하고 매 Phase 전환 시 업데이트한다:

```markdown
# Pipeline Status

## Current Phase: {phase_number}
## Started: {timestamp}
## Last Updated: {timestamp}

| Phase | Status | Agent | Started | Completed | Notes |
|-------|--------|-------|---------|-----------|-------|
| 0. Pre-flight Survey | COMPLETED | orchestrate | ... | ... | spec.md 생성/재사용 |
| 1. Ideation | COMPLETED | idea-researcher | ... | ... | spec.md 컨텍스트 반영 |
| 2. Planning | COMPLETED | product-planner | ... | ... | KPI 정의 포함 |
| 2.5 Spec | IN_PROGRESS | spec-planner | ... | | |
| 3. Design | PENDING | | | | |
| 4a. Features | PENDING | | | | |
| 4a-QA | PENDING | qa-reviewer | | | Quick QA |
| 4b. API | PENDING | | | | |
| 4b-QA | PENDING | qa-reviewer | | | Quick QA |
| 4c. UI | PENDING | | | | |
| 4c-QA | PENDING | qa-reviewer | | | Quick QA |
| 4d. Analytics | PENDING | api-integrator | | | Firebase + KPI 이벤트 |
| 4d-QA | PENDING | qa-reviewer | | | Quick QA |
| 5. QA | PENDING | qa-reviewer + app-inspector | | | Full QA |
| 6. Iteration | PENDING | | | | Max 3 loops |
| 7. Deploy | PENDING | | | | |
```

### 2. Phase 전환 Go/No-Go 판단

각 Phase 완료 시 수퍼바이저가 **Go/No-Go**를 판단한다:

```
Go 조건:
- 해당 Phase의 산출물이 _workspace/{phase}/ 에 존재
- Quick QA(typecheck + lint) PASS (Phase 4 서브스텝)
- Error Escalation 없음

No-Go 조건:
- 산출물 누락 → 해당 Phase 재실행
- Quick QA FAIL → 수정 후 재검증 (최대 2회)
- 사용자 블로킹 이슈 → error.md 작성 후 대기
```

### 3. 컨텍스트 리셋 시 재개

컨텍스트가 리셋되었을 때, `_workspace/pipeline-status.md`를 읽어 마지막 COMPLETED Phase 다음부터 재개한다.

---

## Workspace

모든 에이전트는 `_workspace/` 디렉토리를 통해 데이터를 주고받는다.

> **`_workspace/` 는 대부분 `.gitignore` 된 임시 산출물이다.** 단 `spec.md`·`plan/`·`iterate/` 는 커밋 대상이라 다른 머신·런타임에서 이어서 작업할 수 있다. 템플릿은 `.claude/skills/orchestrate/templates/spec.template.yml`에 위치하며, Phase 0 Step 0.1에서 필요 시 `_workspace/spec.md`로 복사한다.

```
_workspace/
├── spec.md                     # Phase 0 Pre-flight Survey 산출물 (모든 phase가 먼저 읽음)
├── decisions.log               # 무인 모드에서 자동 결정된 항목 기록
├── idea/
│   ├── market-research.md      # idea-researcher 출력
│   └── app-concepts.md
├── plan/
│   ├── prd.md                  # product-planner 출력 (KPI + Review Triggers 섹션 포함)
│   ├── user-stories.md
│   ├── fsd-module-map.md
│   ├── kpis.md                 # 북극성 + 4축 + 이벤트 카탈로그
│   └── review-triggers.md      # 평점 유도 트리거 카탈로그 + 임계값
├── design/
│   ├── design-system.md        # design-architect 출력
│   ├── nativewind-theme.md
│   └── screen-layouts.md
├── implementation/
│   ├── features/               # feature-builder 출력
│   ├── api/                    # api-integrator 출력
│   ├── screens/                # ui-developer 출력
│   ├── analytics/              # api-integrator Phase 4d 출력 (이벤트 매핑 결과)
│   └── sprint-contract-{4a,4b,4c,4d}.md
└── qa/
    ├── code-review.md          # qa-reviewer 출력
    └── inspection-report.md    # app-inspector 출력
```

---

## Full Pipeline

### Phase 0: Pre-flight Survey — `orchestrate` (수퍼바이저 직접 수행)

**목적**: 프로젝트별 핵심 결정(측정·온보딩·평점·수익화·인증·백엔드·권한·배포)을 모아 `_workspace/spec.md` 를 만든다. 이후 모든 Phase 는 spec.md 를 먼저 읽는다. **상세 절차·질문 카탈로그(A~I)·조건부 분기 규칙·무인 실행: `references/survey.md` — Phase 0 시작 시 Read.**

| Step | 내용 |
|------|------|
| 0.0 | CodeGraph 설치·인덱스 확인(선택, 없으면 grep fallback — 절대 차단하지 않음) |
| 0.0b | `app.config.ts` 의 `SLUG` 가 `my-app` 이면 `init-app` 스킬 먼저 실행 |
| 0.1 | 기존 `_workspace/spec.md` 가 있으면 재사용 여부 확인, 없으면 `templates/spec.template.yml` 복사 |
| 0.2 | 자유 입력 1회 → `project.context` |
| 0.3 | **묻기 전에 채운다** — 요청·0.2 답·현재 코드로 답이 나오는 항목은 채우고(근거는 `<field>_notes`), 남은 [필수] 항목만 한 번에 최대 4문항씩 추천안을 첫 옵션으로 묻는다. 바이브 코딩 요청은 질문 1~2회 안에 Phase 1 로 넘어가는 게 목표 |
| 0.4 | 조건부 분기(광고 → C2·C3, 소셜 로그인 → 계정 삭제 필수 등) |
| 0.5 | spec.md 작성 — 필드·기본값 정본은 `templates/spec.template.yml` |
| 0.6 | 사용자 최종 확인 (무인 실행이면 생략, `_workspace/decisions.log` 기록) |

**통과 조건**: spec.md 가 YAML 로 파싱되고, 모든 [필수] 필드와 `project.name`·`project.category`·`deployment.platforms` 가 채워져 있다.

---

### Phase 1: Ideation — `idea-researcher`

**에이전트**: `idea-researcher`
**스킬**: `/ideate`
**입력**: 사용자 요청 (자연어)
**출력**: `_workspace/idea/`

> 사용자가 만들 앱을 이미 정했으면(이름·핵심 기능이 요청에 있음) 시장 조사와 후보 도출을 건너뛰고 그 요청을 `app-concepts.md` 의 선정 컨셉으로 기록한 뒤 Phase 2로 간다.

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
5. **핵심 지표(KPIs) 정의** — 북극성 지표 1개 + 4축(획득/활성/유지/수익화)
   기본 세트와 Firebase Analytics 이벤트 매핑을 PRD에 명시한다.
   누락 시 Phase 4d 실행이 불가능하므로 spec-planner로 진행하지 않는다.
```

**KPI 산출물** (`_workspace/plan/kpis.md`):
```markdown
# KPIs

## North Star Metric
- {정의}: {목표값}

## 4-Axis Baseline
| 축 | 지표 | 목표 | Firebase 이벤트 | 파라미터 |
|----|------|------|----------------|---------|
| 획득 | ... | ... | `first_open` | source |
| 활성 | ... | ... | `activation` (custom) | feature_id |
| 유지 | ... | ... | `session_start` | — |
| 수익화 | ... | ... | `ad_impression`, `purchase` | ad_unit_id, value |

## Custom Event Catalog
| 이벤트 | 트리거 | 파라미터 | 매핑 기능 |
|--------|--------|----------|----------|
| `tap_camera_capture` | 촬영 버튼 | mode | F-001 |
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

### Phase 2.5: Spec Planning — `spec-planner`

**에이전트**: `spec-planner`
**입력**: `_workspace/plan/prd.md`, `_workspace/plan/fsd-module-map.md`
**출력**: `docs/specs/`

```
Tasks:
1. PRD에서 피처 목록 추출
2. 피처별 docs/specs/{NN}-{feature-name}/ 디렉토리 생성
3. 각 피처의 phase 파일 작성 (phase1-mvp.md, phase2-enhancement.md 등)
4. 각 phase에 체크박스 형식의 task 목록 정의 (파일 단위)
5. docs/specs/README.md 진행 현황 대시보드 생성
```

**Task 형식**: 각 task는 생성할 파일 경로와 설명을 포함한다.
```markdown
- [ ] `src/features/auth/api/auth.api.ts` — 로그인/회원가입 API
```

**진행 추적**: Phase 4 구현 중 task 완료 시 `- [ ]` → `- [x]`로 변경하고 대시보드 업데이트.

**Error Handling**: PRD가 불충분하면 사용자에게 핵심 기능 3개를 확인 후 진행.

**Spec 검증 (Go/No-Go)**:
스펙 생성 후 수퍼바이저가 검증한다:
- [ ] `docs/specs/README.md` 대시보드가 존재하는가
- [ ] 모든 PRD feature에 대응하는 spec 디렉토리가 있는가
- [ ] 각 phase 파일에 최소 1개 이상의 task가 있는가
- [ ] task 형식이 `- [ ] \`파일경로\` — 설명` 패턴을 따르는가

검증 FAIL 시 spec-planner에게 수정 요청 후 재검증.

---

### Phase 3: Design — `design-architect`

**에이전트**: `design-architect`
**스킬**: `/design-system`
**입력**: `_workspace/plan/`
**출력**: `_workspace/design/`

```
Tasks:
0. NativeWind 설정 무결성 검증 (GATE — 통과 필수)
   - babel.config.js: jsxImportSource + nativewind/babel 프리셋
   - metro.config.js: withNativeWind 래핑
   - tailwind.config.js: nativewind/preset + content 경로
   - global.css: @tailwind 디렉티브
   - 루트 _layout.tsx: global.css import
   - nativewind-env.d.ts: 타입 레퍼런스
   → 누락 시 즉시 수정 후 다음 Task 진행
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

**Sprint Contract (Anthropic 원칙)**:
각 서브스텝(4a/4b/4c) 시작 **전**에 Sprint Contract를 `_workspace/implementation/sprint-contract-{step}.md`에 작성한다:

```markdown
# Sprint Contract: Phase 4{a|b|c}

## Done 조건
- [ ] 생성할 파일 목록 (spec에서 추출)
- [ ] 각 파일의 핵심 기능 1줄 설명

## 검증 방법
- typecheck 0 에러
- lint 0 에러
- barrel export 완성

## 예상 산출물
- src/features/{name}/ 디렉토리 N개
- src/entities/{name}/ 디렉토리 N개
```

이 Contract는 해당 Phase에서 **추가로** 확인할 항목이다. Contract에 없더라도 `npm run verify`와 CLAUDE.md Hard Threshold는 항상 적용된다.

---

**Spec Task 추적 규칙 (Phase 4 전체에 적용)**:
구현 에이전트가 파일을 생성/완료할 때마다:
1. `docs/specs/{feature}/phase{N}-*.md`에서 해당 task의 `- [ ]` → `- [x]` 변경
2. phase 내 모든 task 완료 시 frontmatter `status: completed` 변경
3. `docs/specs/README.md` 대시보드 진행률 업데이트

---

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

**Quick QA Checkpoint (4a-QA)**:
Phase 4a 완료 후 qa-reviewer가 경량 검증을 실행한다:
```bash
npm run typecheck && npm run lint
```
- PASS → Phase 4b 진행, `_workspace/pipeline-status.md` 업데이트
- FAIL → feature-builder에게 수정 요청 (최대 2회 재시도)

---

#### Phase 4b: API Integrator — `api-integrator`

**에이전트**: `api-integrator`
**입력**: `_workspace/plan/prd.md`, `src/features/` (4a 출력)
**출력**: `src/shared/api/`, `src/features/*/api/`, `src/features/*/hooks/`

```
Tasks:
0. 토큰 저장은 템플릿의 tokenManager(@shared/api, src/shared/api/client.ts)를 그대로 쓴다
   - expo-secure-store, keychainAccessible = WHEN_UNLOCKED_THIS_DEVICE_ONLY (iCloud 백업 차단)
   - 토큰 외 시크릿이 늘 때만 src/shared/secure-storage/ 를 분리한다 (CLAUDE.md "Secure Storage" (상세 `docs/rules/secure-storage.md`))
1. Axios 클라이언트 설정 (baseURL, interceptors, 토큰 자동 갱신)
   - 토큰 조회는 tokenManager 만 사용 (AsyncStorage 금지)
2. 각 feature의 API 함수 구현
3. TanStack Query hooks 작성 (useQuery, useMutation, infinite)
4. API 에러 핸들링 표준화 + 토큰/PII가 로그/리포트에 포함되지 않도록 마스킹
5. 개발용 목 데이터 작성
6. auth 훅은 tokenManager.setTokens(...)만 부른다. 토큰을 Zustand store(persist 포함)에 두지 않는다
7. 광고 앱: spec monetization.ad_formats 에 없는 형식의 훅·컴포넌트는 앱에서 뺀다
   (예: app_open 을 고르지 않으면 _layout.tsx 의 useAppOpenAd 호출을 지운다).
   ads.ts 키 ↔ 형식 대응은 store-admob Step 5
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

**Quick QA Checkpoint (4b-QA)**:
Phase 4b 완료 후 qa-reviewer가 경량 검증을 실행한다:
```bash
npm run typecheck && npm run lint
```
추가 보안 grep (qa-reviewer 수동 수행):
- `grep -rE "AsyncStorage.*(token|secret|password|refresh)"` → 0건
- `grep -rE "(accessToken|refreshToken)" src/` 결과에서 토큰 값이 `tokenManager` 로만 저장·조회되는지 확인
- 토큰을 담은 Zustand store 가 없는지 확인

- PASS → Phase 4c 진행
- FAIL → api-integrator에게 수정 요청 (최대 2회 재시도)

---

#### Phase 4c: UI Developer — `ui-developer`

**에이전트**: `ui-developer`
**스킬**: `/create-screen`
**입력**: `_workspace/design/screen-layouts.md`, `src/features/` (4a+4b 출력)
**출력**: `app/` (Expo Router), `src/widgets/`, `src/shared/ui/`

**사전 점검 (4c-Pre): NativeWind 동작 스모크 검증** — 첫 화면을 짜기 전에 1회.
NativeWind는 6개 파일(`babel.config.js` / `metro.config.js` / `tailwind.config.js` / `global.css` / 루트 `_layout.tsx`의 `import '../global.css'` / `nativewind-env.d.ts`)이 **전부** 맞아야 동작하고, 하나라도 빠지면 `className`이 **에러 없이 조용히 무시**된다. 화면 20개를 만든 뒤 발견하면 전체 스타일을 다시 손봐야 하므로 먼저 확인:
- 6파일 존재·설정 확인 (CLAUDE.md "NativeWind 필수 설정" 표 기준)
- 임시 토큰(예: `className="bg-red-500"`)이 실제 렌더에 반영되는지 1회 확인 (또는 기존 화면 시각 확인 + typecheck)
- 실패 → 6파일 수정 후 재확인. **통과해야 Tasks 진행** (전부-or-전무 설정이므로 조기 차단)

```
Tasks:
1. Expo Router 기반 스크린 파일 생성
2. NativeWind 스타일 적용
3. Feature hooks 연결
4. Safe Area handling (SafeAreaView 필수)
5. 로딩/에러/빈 상태 처리
6. React Hook Form + Zod 폼 구현
7. Engagement 배선
   - 화면 추적(screen_view)은 루트 _layout.tsx가 라우트 패턴으로 자동 기록 — 화면별 호출 불필요
   - PRD Review Triggers에 매핑된 화면의 성공 콜백에서
     useReviewStore().recordKeyAction() 호출 후
     useStoreReview().maybeRequest(REVIEW_TRIGGERS.X) 호출
   - 호출 위치는 긍정적 토스트/애니메이션 종료 직후 (UI idle 상태)
   - 에러 핸들러/catch/onError 블록 내부 호출 금지
   - "5점 부탁" 등 평점 점수 유도 텍스트 사용 금지
```

**필수 패턴**:
```typescript
// 모든 스크린에 SafeArea 적용
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* 테마 토큰 사용 — bg-white 하드코딩 금지 (spec.md ux.dark_mode 준수) */}
    </SafeAreaView>
  );
}
```

**Error Handling**: 레이아웃 명세 누락 시 기본 FlashList(v2, 자동 크기 계산) + Empty State 패턴 적용.

**Quick QA Checkpoint (4c-QA)**:
Phase 4c 완료 후 qa-reviewer가 경량 검증을 실행한다:
```bash
npm run typecheck && npm run lint
```
- PASS → Phase 4d 진행
- FAIL → ui-developer에게 수정 요청 (최대 2회 재시도)

---

#### Phase 4d: Analytics Integration — `api-integrator`

**입력**: `_workspace/plan/kpis.md`, `_workspace/plan/prd.md`, `app/`, `src/features/`
**출력**: `src/shared/lib/analytics/events.ts`(PRD KPI 카탈로그), 각 화면/액션의 `logEvent` 호출 — 래퍼·Crashlytics·화면 추적·Store Review 인프라는 템플릿에 이미 있다

PRD 의 KPI 를 실제로 측정 가능하게 만드는 단계다. KPI 가 정의되지 않았으면 Phase 2 로 돌아간다. spec 에서 Analytics/Crashlytics/평점이 꺼져 있으면 해당 항목은 건너뛰고 `api-integrator` 의 제거 규칙을 따른다.

1. Firebase 콘솔에 iOS/Android 앱 등록 → `firebase/` 에 설정 파일 배치(커밋 금지)
2. `events.ts` 에 북극성 + 4축 이벤트 상수 추가, 화면 성공 콜백에 `logEvent` 배선
3. PRD Review Triggers → `REVIEW_TRIGGERS` 1:1 매핑, 성공 콜백에 `maybeRequest` + `recordKeyAction()`
4. `npx expo prebuild --clean` + 로컬 빌드 성공, `npm run verify` green

**상세 절차(콘솔 자동화 단계, Sprint Contract 4d Done 조건·검증 명령): `references/analytics-integration.md` — Phase 4d 시작 시 Read.**

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
6. 보안 이슈
   - 하드코딩된 시크릿, 노출된 API 키
   - 토큰/시크릿이 AsyncStorage/MMKV/평문에 저장됨 (반드시 expo-secure-store)
   - SecureStore 외부에서 토큰을 직접 처리하는 코드
   - Zustand persist가 토큰 슬라이스를 AsyncStorage 어댑터로 저장
   - console.log/Crashlytics/Analytics에 토큰·PII 노출
7. Store Review 안티패턴
   - expo-store-review를 @/shared/store-review 외부에서 직접 호출
   - 정책 엔진(canRequestReview) 미경유 requestReview() 호출
   - 매직 스트링 트리거 ID (REVIEW_TRIGGERS.* 미사용)
   - 에러 핸들러/catch/onError 내부의 평점 요청
   - 온보딩/첫 실행/결제 실패/권한 거부 직후의 평점 요청
   - 별점 점수 유도 UI 텍스트("5점 부탁", "별 5개" 등)
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
6. 성능 지표 (FlashList v2 keyExtractor, 자동 크기 계산 — `estimatedItemSize`/`getItemLayout` 사용 금지)
```

**Fix Loop** (Harness 패턴):
```
inspection-report.md에 이슈 발견 시:
→ 심각도 HIGH:   즉시 수정 후 재검사 (최대 3회)
→ 심각도 MEDIUM: 수정 후 Phase 6 진행
→ 심각도 LOW:    백로그 등록 (TODO 주석)
```

---

### Phase 6: Iteration — Pivot vs Refine (Anthropic 원칙)

Phase 5에서 발견된 이슈가 HIGH 이상일 경우, **Pivot vs Refine 판단**을 수행한다:

```
Loop 시작 (최대 3회):
  1. QA 보고서의 점수 추이 확인
  2. Pivot vs Refine 판단:
     - 점수 상승 추세 → Refine (현재 방향 유지, 이슈만 수정)
     - 점수 정체/하락 → Pivot (접근 방식 변경)
     - 2회 연속 동일 이슈 → Pivot 강제
  3. 수정 적용
  4. qa-reviewer + app-inspector 재검사
  5. 점수가 임계값 이상이면 Phase 7 진행
     점수가 임계값 미만이면 Loop 반복

  미해결 이슈 (3회 후):
  → // TODO: [ISSUE-{번호}] 주석으로 마킹
  → _workspace/qa/unresolved.md에 기록
```

**Iteration Ceiling (Anthropic 원칙)**:
점수 개선이 둔화되면 추가 반복의 효용이 낮다. 3회 반복 후 남은 이슈가 **점수·UX 개선(MEDIUM/LOW)뿐이면** 백로그로 넘기고 Phase 7에 진행한다. **Hard Threshold 위반이나 `npm run verify` 실패, HIGH 이슈가 남아 있으면 Phase 7에 진행하지 않는다** — 반복 횟수는 작업 중단 기준이지 통과 기준이 아니다. 이 경우 남은 문제와 시도한 수정을 사용자에게 보고하고 멈춘다. 사용자 승인으로도 Hard Threshold 위반을 배포할 수 없다.

> **Phase 6은 "출시 전 수렴 루프"다.** 출시 후의 **지속 고도화 루프**(개발→검증→다음 고도화 추천을 무한 반복)는 별도의 `/iterate-app` 스킬과 `loop-engineer` 에이전트가 담당한다. Phase 5에서 백로그(`_workspace/qa/unresolved.md`)로 넘어간 이슈와 미구현 PRD 항목은 출시 후 첫 `/iterate-app` 사이클의 후보가 된다. 루프 메커니즘 상세: `references/loop-engineering.md`.

---

### Phase 7: Deployment

**스킬**: `/store-deploy` 참조 (별도 스킬)
**입력**: `_workspace/` 전체, `app.config.ts`

#### Step 7.0: 배포 전 재검증 게이트 (Pre-Deploy Gate)

게시된 빌드에서만 동작하거나 출시 후 코드·콘솔로만 고칠 수 있는 것들을 빌드 직전에 다시 확인한다. **하나라도 미통과면 Build/Submit 을 보류한다. 전체 표와 미통과 시 조치: `references/pre-deploy-gate.md` — Phase 7 진입 시 반드시 Read.**

- **(a) 런타임 배선**: 평점 트리거 최소 1곳 배선(`store_review=true` 일 때) · 광고 동의/초기화와 `useAdsReady()` 게이트 · KPI 이벤트 배선 · 스토어 바이너리 `extra.appEnv` 가 없거나 `production`
- **(b) 스토어·콘솔·시크릿**: `npm run verify` green + Hard Threshold 0 (승인으로 우회 불가) · HIGH 이슈 0 · 런타임 검증 증거(`BLOCKED` 는 PASS 아님) · 앱 이름 4곳 일치 · 권한 ↔ 사용 설명 일치 · 데이터 안전 라벨 ↔ SDK 일치 · IAP 상품 등록 · app-ads.txt · Firebase 설정 파일 · (2027-04 이후 iOS 27.1 SDK+ 제출) iPhone Duo 네이티브 스크린샷 — 이 항목만 Submit 직전에 확인

**배포 순서** (`/store-deploy`): (광고 앱) `store-admob` 으로 AdMob 앱·광고 단위(spec `monetization.ad_formats` → `--ad-types`) → 로컬 프로덕션 빌드(`eas build --local`, EAS 없는 앱은 fastlane. 클라우드는 사용자가 요청하거나 로컬 빌드가 안 될 때만) → 메타데이터 → 스크린샷 → 로컬 산출물 제출(`eas submit --path <파일>` 또는 fastlane 업로드 lane). 상세: store-deploy 플러그인 `store-deploy` 스킬 (설치: `references/runtime-adapters.md`)

#### Step 7.1: Android 프로덕션 액세스 신청 (개인 계정 한정)

Google Play **개인 계정**으로 만든 신규 앱은, 비공개 테스트 **14일+ / 12명+** 게이트를 충족한 뒤 **"프로덕션 액세스 신청"** 양식을 제출·통과해야 프로덕션 공개가 가능하다. 이 신청 양식 작성·제출은 `api-integrator`의 "Play Console 프로덕션 액세스 신청 자동화" 능력이 담당하며, **답변은 `references/play-production-access-application.md`를 정본으로 참고**해 사용자의 실제 사실로 작성한다(날조 금지, 최종 제출 전 사용자 확인). 승인은 보통 7일 이내, 이메일 통보. 승인 후 비공개 테스트(alpha) 최신 버전을 콘솔에서 프로덕션으로 "버전 승급"(재빌드 불필요).

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

---

## Active Runtime Testing (Anthropic 원칙)

> "Evaluators should interact with running applications rather than reviewing static outputs."

Phase 5의 app-inspector는 정적 코드 분석뿐 아니라 **런타임 테스트**도 수행해야 한다. 시뮬레이터·에뮬레이터 조작은 **sim-use 만** 쓴다 (CLAUDE.md "시뮬레이터 런타임 테스트 (sim-use)"). `simctl` 좌표 탭이나 Playwright 로 시뮬레이터를 조작하지 않는다:

```
1. 앱 실행: npm start 를 띄워 두고 npm run ios / npm run android
2. 관찰 → 조작 → 확인: sim-use ui → sim-use tap @N / type / swipe → sim-use ui
3. 네비게이션 흐름 확인: 탭 전환, 스택 push/pop
4. 입력 테스트: 키보드 입력, 버튼 터치 반응
5. 에러 상태 유발: 네트워크 끊기, 빈 데이터
6. 증거: sim-use screenshot
```

---

## Inspired By

- **[Anthropic Harness Design](https://www.anthropic.com/engineering/harness-design-long-running-apps)** — Generator-Evaluator, Sprint Contract, Hard Threshold, Pivot vs Refine, Active Testing, Model Capability Adaptation
- **[revfactory/harness](https://github.com/revfactory/harness)** — 6가지 아키텍처 패턴 (Pipeline, Fan-out, Expert Pool, Producer-Reviewer, Supervisor, Hierarchical), Progressive Disclosure, Agent Teams
- **[Feature-Sliced Design](https://feature-sliced.design/)** — 프론트엔드 아키텍처 방법론
