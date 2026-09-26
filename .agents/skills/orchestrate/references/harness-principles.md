# Harness Design Principles

Anthropic의 공식 하네스 설계 가이드 기반 원칙.
> 출처: https://www.anthropic.com/engineering/harness-design-long-running-apps

## 1. Context Reset > Compaction

장시간 에이전트 작업에서 컨텍스트 요약(compaction)보다 **완전한 컨텍스트 리셋**이 더 효과적이다.

**Context Degradation**: 대화 히스토리가 길어질수록 모델의 일관성이 떨어진다.
**Context Anxiety**: 컨텍스트 한계에 가까워지면 모델이 조급하게 작업을 마무리하려 한다.

**적용 방법**:
- Phase 간 전환 시 `_workspace/`에 산출물을 파일로 저장
- 새 Phase 시작 시 이전 대화를 리셋하고 파일 기반으로 컨텍스트 재구성
- 에이전트에게 "이전 Phase 산출물을 Read하고 이어서 작업하라"고 명시

## 2. Sprint 기반 분해

한 번에 전체 앱을 만들지 않고, **feature 단위 스프린트**로 분해한다.

각 스프린트:
- 하나의 feature를 완전히 구현
- 명시적 성공 기준(Sprint Contract) 포함
- 구현 → 평가 → 수정 루프를 스프린트 단위로 수행

**적용**: Phase 4(Implementation)에서 FSD feature 단위로 스프린트 반복.

## 3. Evaluator 튜닝

기본 LLM은 QA 에이전트로서 부족하다. 효과적인 평가를 위해:

- **Few-shot 예시**: 상세 점수 분해가 포함된 평가 예시 제공
- **명시적 회의주의**: AI 출력에 대한 기본적인 관대함을 방지
- **반복적 프롬프트 개선**: 잘못된 판단에 대한 피드백으로 평가 기준 조정

## 4. Hard Threshold (경성 기준)

주관적 점수 대신 **pass/fail 경성 기준**을 설정한다.

> "어떤 하나의 기준이라도 임계값 이하이면 해당 스프린트는 실패"

**Hard Threshold 전체 목록은 `CLAUDE.md`의 "Hard Thresholds" 표가 정본이다** (TypeScript/ESLint/`any`/FSD 의존성/SafeArea/barrel export/날짜 키/SecureStore/평점 정책/광고 동의 시퀀스 등). 측정 방법·자동 수정 가능 여부 열은 `.claude/agents/qa-reviewer.md`의 표를 참조한다. **이 파일에 표를 중복 유지하지 않는다** (3중 드리프트 방지).

> 참고: "빈 상태(empty state) 처리 누락"은 전역 Hard Threshold가 아니라 app-inspector가 **리스트 화면 단위**로 판정하는 항목이다 (`.claude/agents/app-inspector.md`).

## 5. 디자인 Grading Criteria (4축 평가)

주관적인 디자인 작업에도 명시적 기준을 적용한다:

| 축 | 설명 | 가중치 |
|----|------|--------|
| **Design Quality** | 일관성, 고유 아이덴티티 | 30% |
| **Originality** | 템플릿 대비 커스텀 의사결정 증거 | 25% |
| **Craft** | 기술적 실행 (스페이싱, 타이포, 대비) | 25% |
| **Functionality** | 미학과 독립적인 사용성 | 20% |

> Design Quality와 Originality에 높은 가중치를 두어 "안전한 기본값" 대신 **심미적 도전**을 유도.

## 6. 능동 테스트 (Active Testing)

정적 코드 분석만으로는 부족하다. **실제 앱을 탐색하며** 버그를 발견해야 한다.

- 코드를 읽는 것 외에 `npm run typecheck`, `npm run lint` 실행
- 가능하면 빌드를 수행하여 런타임 오류 확인
- import 관계를 추적하여 순환 참조 탐지

## 7. Progressive Simplification

- 처음엔 복잡하게 시작하고, 성능이 떨어지지 않는 구성 요소를 점진적으로 제거
- 모델이 개선될수록 이전 스캐폴딩이 불필요한 오버헤드가 될 수 있음
- 새 모델 출시 시 하네스 재평가 필요

## 8. 지속 개선 루프 (Continuous Improvement Loop)

출시는 끝이 아니라 루프의 한 바퀴다. 일회성 빌드(Phase 1~7) 이후에는 **개발 → 검증 → 다음 고도화 추천**을 반복한다.

- **한 사이클 = 한 슬라이스** — 작게 만들고 빨리 검증한다 (Sprint 분해의 연장)
- **데이터가 우선순위를 정한다** — "다음에 만들 것"은 직감이 아니라 KPI 갭·사용자 가치·노력·부채·커버리지의 가중 점수로 결정
- **검증은 협상 불가** — 모든 사이클은 Hard Threshold + 회귀 없음 게이트를 통과해야 닫힌다 (독립 Evaluator)
- **전체 재빌드 금지** — 건드리는 슬라이스만 구현/검증 (멀티 에이전트는 단일 대비 20배 토큰)
- **루프는 닫혀야 한다** — 모든 사이클은 "다음 1개 추천"으로 끝나 다음 사이클의 입력이 된다

주체: `loop-engineer` 에이전트 · 진입점: `/iterate-app` 스킬 · 상세 메커니즘: `loop-engineering.md`.
