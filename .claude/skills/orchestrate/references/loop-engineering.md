# Loop Engineering — 지속 고도화 루프 설계

출시(또는 1차 빌드) 이후의 **개발 → 검증 → 다음 고도화 추천** 반복 루프에 대한 설계 레퍼런스.
주체: `loop-engineer` 에이전트 · 진입점: `/iterate-app` 스킬.

> 출처/철학: [Anthropic Harness Design](https://www.anthropic.com/engineering/harness-design-long-running-apps) — Sprint 분해, 독립 Evaluator, Hard Threshold, Iteration Ceiling, Progressive Simplification.

## 왜 별도 루프인가

`/orchestrate`의 Phase 1~7은 **일회성 빌드 파이프라인**이다 (0에서 출시까지 한 번). 그 안의 Phase 6 "Iteration"은 *출시 전 수렴 루프*(QA 이슈를 임계값까지 좁히는 것)일 뿐, 출시 후 "이제 뭘 더 만들지"를 다루지 않는다.

실제 앱 개발의 대부분은 **출시 이후**다. 그래서 별도의 루프가 필요하다:

```
        ┌─────────────────────────────────────────────┐
        │                                             │
        ▼                                             │
   1. Assess ──► 2. Recommend ──► 3. Develop ──► 4. Verify ──► 5. Reflect
   (현황 진단)    (다음 고도화 추천)   (한 슬라이스)   (게이트)      (회고+다음 추천)
        ▲                                                          │
        └──────────────────────────────────────────────────────────┘
                          (다음 사이클)
```

## 핵심 원칙

1. **한 사이클 = 한 슬라이스.** 한 번에 여러 기능을 벌이지 않는다. 작게 만들고 빨리 검증한다.
2. **데이터가 우선순위를 정한다.** "추천"은 직감이 아니라 KPI 갭·사용자 가치·노력·부채·커버리지의 가중 점수로 결정한다.
3. **검증은 협상 불가.** 모든 사이클은 CLAUDE.md "Hard Thresholds" 표를 통과해야 닫힌다. + 회귀 없음.
4. **전체 재빌드 금지.** 건드리는 슬라이스만 구현/검증한다. 멀티 에이전트 하네스는 단일 대비 20배 토큰을 쓰므로(orchestrate "Model Capability Adaptation" 참조), 증분 작업에 전체 파이프라인을 재실행하지 않는다.
5. **루프는 닫혀야 한다.** 모든 사이클은 "다음에 만들 것 1개 추천"으로 끝나, 다음 사이클의 입력이 된다.

## 단계별 상세

### 1. Assess — 현황 진단
입력: `_workspace/spec.md`(+`*_notes`/`project.context`), `docs/specs/README.md`, `_workspace/plan/{prd,kpis}.md`, `_workspace/qa/{inspection-report,code-review,unresolved}.md`, `_workspace/iterate/backlog.md`(직전), `git log`.
산출: "지금 상태" 요약 + KPI 목표 대비 갭(실측 있으면) 또는 "측정 공백" 식별.

### 2. Recommend — 다음 고도화 추천 (루프의 핵심)
**후보 소스:** 미완료 spec task(`- [ ]`) · PRD 2차 확장/nice-to-have · `unresolved.md` 이슈 · KPI 갭 축소 기능 · 기술 부채(qa-reviewer 경고/`// TODO`/중복·미사용 코드) · 사용자 피드백.

**가중 루브릭 (각 1~5점 → 가중합):**

| 축 | 가중치 | 1점 | 5점 |
|----|--------|-----|-----|
| KPI 임팩트 | 30% | 어떤 지표와도 무관 | 북극성/취약 축 갭을 직접 축소 |
| 사용자 가치 | 25% | 내부용/비가시 | 사용자 즉시 체감, 리텐션 기여 |
| 노력(역수) | 20% | 멀티 피처·대규모 | 단일 슬라이스·반나절 |
| 부채/리스크 감소 | 15% | 무관 | 크래시/보안/회귀 위험 제거 |
| 커버리지 갭 | 10% | 이미 충분 | 미구현 P0/측정 공백 메움 |

상위 3개를 근거와 함께 제시 → 사용자 1개 선택 (unattended면 1위 자동). 결과는 `_workspace/iterate/backlog.md`에 저장.

### 3. Develop — 한 슬라이스 개발 (위임)
| 변경 유형 | 위임 |
|-----------|------|
| 새 모듈/엔티티/타입 | feature-builder |
| API·상태·Analytics·광고·평점 인프라 | api-integrator |
| 화면·컴포넌트·배선 | ui-developer |
각 에이전트는 spec.md 분기 규칙(Pre-Work Contract)을 따른다. 완료 task는 `docs/specs/`에서 체크.

### 4. Verify — 검증 게이트
- **qa-reviewer**: CLAUDE.md Hard Thresholds(정본) — typecheck/lint 0, FSD, 보안(SecureStore), Analytics/평점/광고 안티패턴 (변경 슬라이스 + 의존 그래프).
- **app-inspector**: 변경 화면 기능/UX/접근성 + **회귀 검사**.
- **추가 게이트**: KPI 회귀 없음(기존 이벤트/측정 유지) · 번들 회귀 없음(불필요 의존성 금지).
- FAIL → 구현 에이전트 수정 (최대 3회). 3회 후 미해결 → 백로그 환원.

### 5. Reflect — 회고 및 다음 추천
`_workspace/iterate/cycle-{N}.md`에 요약 기록 → `docs/specs/README.md` + `kpis.md` 갱신 → 백로그 재채점 → **다음 1개 추천**으로 루프를 닫는다.

## Iteration Ceiling (멈출 때를 안다)
- 추천 1위 점수가 낮으면(< 3.0/5) 새 기능 대신 **계측·실험 설정**을 추천한다 ("지금은 관찰 단계").
- 같은 후보가 2사이클 연속 1위인데 미완 → 범위를 더 잘게 쪼갠다 (Progressive Simplification).
- 사용자가 멈추라고 하거나 백로그가 비면 루프 종료.

## `/loop`(하네스 러너)와의 관계
- 하네스 기본 `/loop`은 "주기적으로 같은 명령 실행"하는 범용 러너다.
- 자동 무인 고도화: `_workspace/spec.md`에 `execution.unattended: true` + `on_ambiguity: pick_recommended` 설정 후 `/loop /iterate-app`.
- `loop-engineer`는 러너가 아니라 **한 사이클의 의사결정/오케스트레이션**을 담당한다. 역할이 겹치지 않는다.

## 산출물
```
_workspace/iterate/
├── backlog.md          # 가중 루브릭으로 랭킹된 후보 (재사용/갱신)
├── cycle-{N}.md        # 사이클별 요약 (목표·변경·검증·KPI 가설)
└── decisions.log       # 무인 모드 자동 선택 기록
```
