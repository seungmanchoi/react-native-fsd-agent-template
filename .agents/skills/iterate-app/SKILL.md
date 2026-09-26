---
name: iterate-app
description: "출시/1차 구현 완료 후 앱을 지속적으로 고도화하는 루프 스킬. 현황 진단 → 다음 고도화 추천(데이터 기반 랭킹) → 한 슬라이스 개발 → 검증 → 다음 추천을 반복한다. 전체 파이프라인을 재실행하지 않는다. '다음 뭐 만들지', '고도화해줘', '개선 루프', '기능 추가 우선순위', 'iterate', '다음 스프린트 돌려줘' 요청 시 반드시 이 스킬을 사용할 것."
---

# Iterate App — 지속 고도화 루프 스킬

이미 만들어진 앱을 **한 사이클에 한 가지씩** 데이터 기반으로 개선하는 루프. `/orchestrate`(일회성 빌드, Phase 1~7)와 달리, 이 스킬은 **출시 이후의 반복**을 담당하며 전체 파이프라인을 다시 돌리지 않는다.

> 루프 메커니즘·랭킹 루브릭 상세: `.claude/skills/orchestrate/references/loop-engineering.md`
> 의사결정 주체: `loop-engineer` 에이전트

## Trigger
- "다음 뭐 만들지", "다음 작업 추천", "고도화해줘", "개선해줘"
- "기능 추가 우선순위", "개선 루프 돌려줘", "다음 스프린트", "iterate"

## When NOT to use
- 처음부터 앱을 만들 때 → `/orchestrate`
- 명확히 지정된 단일 변경(예: "로그인 버튼 색 바꿔") → 해당 에이전트 직접 호출 (루프 불필요)

## Steps (1 사이클)

### Step 1: Assess — 현황 진단
`loop-engineer`가 `_workspace/spec.md`, `docs/specs/README.md`, `_workspace/plan/{prd,kpis}.md`, `_workspace/qa/*`, `_workspace/iterate/backlog.md`(있으면), 최근 git log를 읽어 "지금 상태"를 요약한다. KPI 실측이 있으면 목표 대비 취약 축을 식별한다.
> **CodeGraph 사용 시**: 직전 사이클 이후 코드가 바뀌었으므로 진단 전 `codegraph sync`(변경분만)로 인덱스를 최신화한 뒤, `codegraph impact`/`callers`/`files`로 변경 영향 범위·커버리지 갭을 구조적으로 파악한다(없으면 grep fallback). 인덱스가 stale하면 Step 2 랭킹이 왜곡되므로 sync는 매 사이클 권장.

### Step 2: Recommend — 다음 고도화 추천
후보(미완료 spec task / PRD 2차 확장 / 미해결 이슈 / KPI 갭 기능 / 기술 부채 / 사용자 피드백)를 가중 루브릭(KPI 30 · 가치 25 · 노력↓ 20 · 부채 15 · 커버 10)으로 채점·정렬한다.
- 상위 3개를 근거와 함께 제시하고 **사용자가 1개 선택**
- `execution.unattended: true`면 1위 자동 선택 + `_workspace/iterate/decisions.log` 기록
- 결과는 `_workspace/iterate/backlog.md`에 저장

### Step 3: Develop — 한 슬라이스 개발 (위임)
선택된 항목이 **건드리는 슬라이스만** 구현 에이전트에 위임 (전체 재빌드 금지):

| 변경 유형 | 위임 대상 |
|-----------|----------|
| 새 모듈/엔티티/타입 | `feature-builder` |
| API·상태·Analytics·광고·평점 인프라 | `api-integrator` |
| 화면·컴포넌트·배선 | `ui-developer` |

각 에이전트는 자신의 Pre-Work Contract(spec.md 분기 규칙)를 따른다. 완료 시 `docs/specs/`의 `- [ ]` → `- [x]` 갱신.

### Step 4: Verify — 검증 게이트
- `qa-reviewer`: typecheck/lint 0, FSD 의존성, 보안·Analytics·평점·광고 안티패턴 (변경 슬라이스 + 의존 그래프 — CodeGraph 사용 시 `codegraph impact`로 변경 심볼의 파급 범위를 산출해 회귀 검사 대상 화면을 누락 없이 확정). **CLAUDE.md "Hard Thresholds" 표가 정본.**
- `app-inspector`: 변경 화면 기능/UX/접근성 + **회귀 검사**(기존 동작 유지)
- 추가: KPI 회귀 없음, 불필요 의존성 추가 없음
- FAIL → 구현 에이전트에 수정 요청 (최대 3회). 3회 후 미해결은 백로그 환원.

### Step 5: Reflect — 회고 및 다음 추천
- `_workspace/iterate/cycle-{N}.md`에 사이클 요약 기록 (목표·변경·검증 결과·KPI 영향 가설)
- `docs/specs/README.md` 대시보드 + `_workspace/plan/kpis.md` 상태 갱신
- 백로그 재채점 → `_workspace/iterate/backlog.md` 갱신 → **다음 사이클 추천 1개 제시 후 루프 종료**

## 무인/반복 실행
이 스킬을 하네스 `/loop`으로 감싸면 자동 고도화 루프가 된다. 권장: `_workspace/spec.md`에 `execution.unattended: true` + `on_ambiguity: pick_recommended` 설정 후 `/loop /iterate-app`.

## Agent Delegation
| Step | Agent |
|------|-------|
| 1 Assess · 2 Recommend · 5 Reflect | loop-engineer |
| 3 Develop | feature-builder / api-integrator / ui-developer |
| 4 Verify | qa-reviewer + app-inspector |

## 산출물
```
_workspace/iterate/
├── backlog.md          # 랭킹된 고도화 후보
├── cycle-{N}.md        # 사이클 요약
└── decisions.log       # 무인 자동 선택 기록
```
