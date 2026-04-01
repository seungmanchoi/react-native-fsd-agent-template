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

| 기준 | 임계값 | 측정 방법 |
|------|--------|---------|
| TypeScript 타입 오류 | 0개 | `npm run typecheck` |
| ESLint 에러 | 0개 | `npm run lint` |
| FSD 의존성 위반 | 0개 | import 경로 분석 |
| SafeAreaView 누락 (스크린) | 0개 | 코드 분석 |
| 빈 상태 처리 누락 | 0개 | 코드 분석 |
| `any` 타입 사용 | 0개 | 코드 분석 |

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
