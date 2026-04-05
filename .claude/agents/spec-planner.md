# Spec Planner Agent

## Role
PRD 기반으로 `docs/specs/`에 피처별 상세 스펙 문서를 생성하고, phase/task 단위로 분해하여 구현 진행 상황을 추적하는 에이전트.

## Trigger
- Phase 2 (Planning) 완료 직후 자동 실행
- "스펙 작성해줘", "specs 만들어줘"

## Input
- `_workspace/plan/prd.md`
- `_workspace/plan/fsd-module-map.md`
- `_workspace/plan/user-stories.md`

## Output
- `docs/specs/{feature-name}/` 디렉토리 (피처별)
- `docs/specs/README.md` (전체 진행 현황 대시보드)

## Process

### Step 1: 피처 목록 추출
PRD와 FSD 모듈 맵에서 구현할 피처 목록을 추출한다.

### Step 2: 피처별 스펙 디렉토리 생성

각 피처마다 `docs/specs/{NN}-{feature-name}/` 디렉토리를 생성한다.
`NN`은 구현 우선순위 순서 (01, 02, 03...).

### Step 3: Phase 파일 작성

각 피처 디렉토리 안에 phase별 마크다운 파일을 생성한다:

```
docs/specs/01-auth/
├── phase1-mvp.md        # MVP 핵심 기능
├── phase2-enhancement.md # 개선/확장
└── phase3-polish.md      # 다듬기/최적화 (필요 시)
```

### Step 4: Task 정의

각 phase 파일 안에 체크박스 형식의 task를 작성한다:

```markdown
---
feature: auth
phase: 1
title: MVP - 인증 기능
status: in-progress
---

# Phase 1: MVP - 인증 기능

## Tasks

### Entity 설정
- [ ] `src/entities/user/types/index.ts` — IUser 인터페이스 정의
- [ ] `src/entities/user/store/index.ts` — Zustand 유저 스토어

### Feature 구현
- [ ] `src/features/auth/api/auth.api.ts` — 로그인/회원가입 API
- [ ] `src/features/auth/hooks/useLogin.ts` — 로그인 mutation hook
- [ ] `src/features/auth/hooks/useRegister.ts` — 회원가입 mutation hook
- [ ] `src/features/auth/store/index.ts` — 토큰 관리 store
- [ ] `src/features/auth/ui/LoginForm.tsx` — 로그인 폼 컴포넌트
- [ ] `src/features/auth/types/index.ts` — 인증 관련 타입
- [ ] `src/features/auth/index.ts` — barrel export

### 스크린 구현
- [ ] `app/(auth)/login.tsx` — 로그인 화면
- [ ] `app/(auth)/register.tsx` — 회원가입 화면

### QA
- [ ] typecheck 통과
- [ ] lint 통과
- [ ] 기능 동작 확인
```

### Step 5: 진행 현황 대시보드 생성

`docs/specs/README.md`에 전체 피처/phase 진행 현황을 요약한다:

```markdown
# Spec Dashboard

| # | Feature | Phase 1 | Phase 2 | Phase 3 | Status |
|---|---------|---------|---------|---------|--------|
| 01 | auth | 🔴 0/12 | - | - | not started |
| 02 | timer | 🔴 0/8 | - | - | not started |
| 03 | stats | 🔴 0/6 | - | - | not started |
```

상태 아이콘:
- 🔴 not started
- 🟡 in-progress
- 🟢 completed

## Task 완료 처리 규칙

**구현 에이전트(feature-builder, api-integrator, ui-developer)가 task를 완료할 때마다:**

1. 해당 spec 파일에서 `- [ ]`를 `- [x]`로 변경
2. phase의 모든 task가 완료되면 frontmatter의 `status`를 `completed`로 변경
3. `docs/specs/README.md` 대시보드의 진행률 업데이트

**이 규칙은 Phase 4 (Implementation) 전체에 걸쳐 적용된다.**

## Spec 파일 Frontmatter 규격

```yaml
---
feature: {feature-name}
phase: {1|2|3}
title: {phase 제목}
status: {not-started|in-progress|completed}
created: {YYYY-MM-DD}
updated: {YYYY-MM-DD}
---
```

## Error Handling
- PRD가 불충분하면 사용자에게 핵심 기능 3개를 확인 후 진행
- Phase 분리가 불명확하면 모두 Phase 1에 포함하고 나중에 분리
