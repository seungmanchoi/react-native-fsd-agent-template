---
name: orchestrate
description: "React Native + Expo + FSD 앱의 전체 라이프사이클(아이디어→기획→스펙→디자인→구현→QA→배포)을 10개 에이전트·9개 스킬로 오케스트레이션하는 일회성 빌드 파이프라인. '앱 만들어줘', '풀스택으로 만들어줘', '프로덕션 앱 만들어줘', 'end-to-end 개발', '처음부터 끝까지 만들어줘' 요청 시 반드시 이 스킬을 사용할 것. (출시 후 반복 개선은 /iterate-app)"
---

# Orchestrate Skill — Full App Lifecycle Pipeline

## Trigger Phrases
- "앱 만들어줘"
- "풀스택으로 만들어줘"
- "프로덕션 앱 만들어줘"
- "end-to-end 개발"
- "처음부터 끝까지 만들어줘"

## Overview

이 스킬은 React Native + Expo + FSD 아키텍처 기반 앱의 **전체 라이프사이클**을 10개의 AI 에이전트와 9개의 스킬을 통해 자동으로 오케스트레이션한다.

**Tech Stack**: React Native 0.81 + Expo 54 + FSD + NativeWind + Zustand + TanStack Query + Axios + TypeScript

### Harness Design Principles (Anthropic)

이 오케스트레이터는 Anthropic의 공식 하네스 설계 원칙을 따른다:
> 상세: `references/harness-principles.md` 참조

1. **Context Reset > Compaction** — Phase 간 전환 시 `_workspace/`에 산출물 저장 후 컨텍스트 리셋. 장시간 작업의 컨텍스트 저하(degradation)와 조급증(anxiety)을 방지.
2. **Sprint 기반 분해** — Phase 4에서 feature 단위 스프린트로 분해. 각 스프린트마다 구현→평가→수정 루프 수행.
3. **독립 Evaluator** — Generator(feature-builder, api-integrator, ui-developer)와 Evaluator(qa-reviewer, app-inspector)를 분리. 자체 평가 지양.
4. **Hard Threshold** — 소프트 점수가 아닌 pass/fail 경성 기준. 하나라도 임계값 이하면 스프린트 FAIL.
5. **디자인 4축 평가** — Design Quality, Originality, Craft, Functionality 축으로 디자인 산출물 평가.
6. **지속 개선 루프(Continuous Improvement Loop)** — 출시는 끝이 아니라 루프의 한 바퀴다. 개발→검증→**다음 고도화 추천**을 반복한다. 일회성 빌드(Phase 1~7) 이후의 반복은 `/iterate-app` 스킬과 `loop-engineer` 에이전트가 담당한다. 상세: `references/loop-engineering.md`.

---

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

> **`_workspace/` 는 `.gitignore` 됨.** Phase 0 산출물(`spec.md`)도 로컬 전용. 템플릿은 `.claude/skills/orchestrate/templates/spec.template.yml`에 위치하며, Phase 0 Step 0.1에서 필요 시 `_workspace/spec.md`로 복사한다.

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

**목적**: 프로젝트별로 달라지는 핵심 결정사항(측정/온보딩/평점/수익화/인증/백엔드/권한/배포 등)을 사전에 수집하여 `_workspace/spec.md`를 생성한다. 이후 모든 phase는 spec.md를 먼저 읽고 작업한다.

**입력**: 사용자 자연어 요청
**출력**: `_workspace/spec.md`

#### Step 0.0: 코드 인텔리전스(CodeGraph) 초기화 (권장 · 스킵 가능)

**목적**: 이후 모든 phase가 grep 대신 구조 기반 코드 인텔리전스(심볼 정의·호출 관계·영향도)를 사용하도록 인덱스를 준비한다. Step 0.2 컨텍스트 수집, `qa-reviewer`의 FSD 의존성·영향 검사, `loop-engineer`의 impact/callers 기반 "다음 작업" 랭킹이 이 인덱스를 활용한다. **미설치·미빌드여도 파이프라인은 grep fallback으로 정상 진행하며, 절대 차단하지 않는다.**

**판정 흐름** (`AskUserQuestion`으로 인터랙션):

```
1. CLI 설치 확인:  which codegraph
   ├─ 미설치  → 질문 "CodeGraph(코드 인텔리전스)가 설치돼 있지 않습니다. 설치할까요?"
   │     ├─ 설치       → `codegraph install`(현재 에이전트에 MCP 등록) 안내 → 2단계로
   │     └─ 건너뛰기   → grep fallback으로 Step 0.1 진행
   └─ 설치됨  → 2단계로

2. 프로젝트 인덱스(.codegraph/) 확인:  codegraph status  (또는 ls .codegraph/)
   ├─ 인덱스 없음 → 질문 "CodeGraph가 설치돼 있습니다. 이 프로젝트에 인덱스를 빌드하고 진행할까요?"
   │     ├─ 빌드하고 진행 (권장) → `codegraph init -i` 실행 → Step 0.1 진행
   │     └─ 인덱스 없이 진행     → grep fallback으로 Step 0.1 진행
   └─ 인덱스 있음 → `codegraph sync`(변경분만 동기화) 후 Step 0.1 진행
```

> 핵심 인터랙션: **설치됨 + 인덱스 없음**이면 곧바로 빌드하지 말고 "빌드하고 진행할지"를 한 번 묻는다(인덱싱은 수백~수천 파일에서 시간이 걸릴 수 있으므로 사용자 동의 후 실행).

**무인 실행(`execution.unattended: true`)**: 묻지 않고 자동 처리 —
- 설치됨 + 인덱스 없음 → `codegraph init -i` 자동 실행
- 설치됨 + 인덱스 있음 → `codegraph sync`
- 미설치 → 스킵(grep fallback). 설치를 강제하지 않는다.
- 선택 결과는 `_workspace/decisions.log`에 기록 (예: `decision=codegraph value=indexed source=unattended`).

#### Step 0.1: spec.md 존재 여부 확인

```
if _workspace/spec.md 존재:
    "기존 spec.md를 발견했습니다. 그대로 사용할까요? (Y/n)" 단일 질문
    Y → Step 0.5(스키마 검증)로 점프 → 통과 시 Phase 1 진행
    n → 백업(spec.md.{timestamp}.bak) 후 Step 0.2로 진행
else:
    `.claude/skills/orchestrate/templates/spec.template.yml`을 `_workspace/spec.md`로 복사 후 Step 0.2로 진행
```

> 사용자가 무인 실행을 원하면 위 템플릿을 직접 편집해서 `_workspace/spec.md`로 미리 저장해두고 `/orchestrate`만 실행하면 된다. 그러면 survey가 스킵된다.

#### Step 0.2: 프로젝트 전반 컨텍스트 수집

객관식 질문 전 한 번, 자유 입력만 받는다:

```
Q: "이 앱에 대해 추가로 알려주고 싶은 게 있나요?
   (제약, 영감, 참고 앱, 비즈니스 맥락, 톤앤매너 등 — 자유롭게, 비워둬도 됨)"
→ spec.md의 project.context 필드에 그대로 저장
```

이 텍스트는 이후 모든 에이전트가 작업 시작 시 읽고 객관식 답과 함께 해석한다.

#### Step 0.3: 질문 카탈로그 진행

`AskUserQuestion` 도구로 아래 카탈로그를 순서대로 진행한다. 각 객관식 질문 직후 **"추가 메모 (선택)"** 자유 입력을 한 번 더 받아 `<field>_notes`에 저장한다.

**[필수]** = 모든 프로젝트가 답해야 함
**[조건부]** = 앞선 답에 따라 LLM이 묻거나 스킵

##### A. 측정·관측

| ID | 질문 | 옵션 | spec 필드 |
|----|------|------|----------|
| A1 [필수] | Firebase Analytics + GA property 연동 | Yes / No | `measurement.firebase_analytics` |
| A2 [필수] | Crashlytics 활성화 | Yes / No | `measurement.crashlytics` |
| A3 [조건부] | Remote Config(A/B 테스트) | Yes / No | `measurement.remote_config` (`firebase_analytics=true`일 때만) |
| A4 [필수] | 북극성 지표 | LLM 추천 수락 / 직접 입력 | `measurement.north_star` + `_notes` |

##### B. UX 옵션

| ID | 질문 | 옵션 | spec 필드 |
|----|------|------|----------|
| B1 [필수] | 온보딩 가이드 | 없음 / 슬라이드형(스킵 가능) / 인터랙티브 튜토리얼 | `ux.onboarding` |
| B2 [필수] | 평점 유도 (`expo-store-review`) | Yes / No | `ux.store_review` |
| B3 [조건부] | 평점 트리거 | LLM 추천 / 직접 지정 | `ux.store_review_triggers` (`store_review=true`일 때만) |
| B4 [필수] | 지원 언어 | en/ko/ja/zh/es/... 다중 선택 | `ux.languages` |
| B5 [필수] | 다크모드 | 라이트만 / 다크만 / 시스템 따라가기 + 토글 | `ux.dark_mode` |
| B6 [필수] | 햅틱 피드백 | Yes / No | `ux.haptics` |
| B7 [조건부] | 빈 상태 일러스트 | LLM 생성 / 기본 SVG / 없음 | `ux.empty_state_illustration` |

##### C. 수익화

| ID | 질문 | 옵션 | spec 필드 |
|----|------|------|----------|
| C1 [필수] | 수익화 모델 | 없음 / 광고 / IAP / 구독 / 광고+IAP | `monetization.model` |
| C2 [조건부] | AdMob 광고 단위 | Banner/Interstitial/Rewarded/Native/AppOpen (다중) | `monetization.ad_formats` (`model`에 광고 포함 시) |
| C3 [조건부] | 인터스티셜 빈도 | 액션 N회마다 (기본 3) | `monetization.interstitial_every_n` |
| C4 [조건부] | 구독 상품 구조 | 주간/월간/연간 / 단일 / 멀티 티어 | `monetization.iap_tiers` |
| C5 [조건부] | 페이월 위치 | 온보딩 후 / 기능 진입 시 / 무료 한도 초과 시 | `monetization.paywall_position` |
| C6 [조건부] | 무료 사용 한도 | 횟수 / 일수 / 없음 | `monetization.free_quota` |

##### D. 인증·사용자

| ID | 질문 | 옵션 | spec 필드 |
|----|------|------|----------|
| D1 [필수] | 인증 방식 | 없음(게스트) / 이메일 / Apple / Google / Kakao / 익명→업그레이드 (다중) | `auth.methods` |
| D2 [조건부] | 계정 삭제 흐름 | 인앱 / 웹 페이지 / 양쪽 | `auth.account_deletion` (`methods≠[게스트only]`일 때 **자동 필수 승격**) |
| D3 [조건부] | 사용자 프로필 화면 | Yes / No | `auth.profile_screen` |
| D4 [조건부] | 생체 인증 게이트 | 결제만 / 앱 잠금 / 없음 | `auth.biometric_gate` |

##### E. 데이터·백엔드

| ID | 질문 | 옵션 | spec 필드 |
|----|------|------|----------|
| E1 [필수] | 백엔드 | 없음(로컬) / Firebase / Supabase / 자체 REST API | `backend.type` |
| E2 [조건부] | 오프라인 우선 | Yes / No | `backend.offline_first` (`type≠none`일 때) |
| E3 [조건부] | 파일/이미지 업로드 | Yes / No | `backend.uploads` |
| E4 [조건부] | 실시간 동기화 | Yes / No | `backend.realtime` |
| E5 [조건부] | 검색 | 클라이언트 / 서버 / Algolia | `backend.search` |

##### F. 네이티브 권한

| ID | 질문 | 옵션 | spec 필드 |
|----|------|------|----------|
| F1 [필수] | 카메라 / 사진 라이브러리 | 둘 다 / 사진만 / 카메라만 / 없음 | `permissions.media` |
| F2 [필수] | 위치 | 필수 / 선택 / 없음 | `permissions.location` |
| F3 [필수] | 푸시 알림 | 로컬만 / 원격+로컬 / 없음 | `permissions.push` |
| F4 [조건부] | 헬스킷/센서/NFC/BLE | 다중 선택 | `permissions.advanced` |
| F5 [조건부] | 백그라운드 작업 | 없음 / 위치 / 동기화 / 오디오 | `permissions.background` |

##### G. 콘텐츠·정책

| ID | 질문 | 옵션 | spec 필드 |
|----|------|------|----------|
| G1 [조건부] | UGC(사용자 생성 콘텐츠) | Yes / No | `policy.ugc` (소셜/커뮤니티 카테고리면 묻기) |
| G2 [필수] | 연령 등급 | 4+ / 9+ / 12+ / 17+ | `policy.age_rating` |
| G3 [조건부] | 13세 미만 대상 | Yes / No | `policy.children_under_13` (Family/Education 카테고리면 묻기) |
| G4 [필수] | 개인정보처리방침/지원 URL | 자동 생성(GitHub Pages) / 직접 입력 | `policy.privacy_url` |

##### H. 배포

| ID | 질문 | 옵션 | spec 필드 |
|----|------|------|----------|
| H1 [필수] | 타겟 스토어 | iOS / Android / 양쪽 | `deployment.platforms` |
| H2 [필수] | 베타 채널 | TestFlight / Internal Testing / 양쪽 / 사용 안 함 | `deployment.beta_channel` |
| H3 [조건부] | 키워드/ASO | LLM 생성 / 직접 입력 | `deployment.aso` |

##### I. 기술 옵션

| ID | 질문 | 옵션 | spec 필드 |
|----|------|------|----------|
| I1 [조건부] | 애니메이션 강도 | 최소 / 보통 / 강함(Reanimated) | `tech.animation_level` |
| I2 [조건부] | 차트/그래프 | Yes / No | `tech.charts` |
| I3 [조건부] | 카메라 커스텀 UI | Yes / No | `tech.custom_camera` (`permissions.media`에 카메라 포함 시) |

#### Step 0.4: 조건부 분기 규칙

**핵심 원칙**: 앞선 답이 다음 결정의 분기점이 되면 그 시점에 추가 질문. 결정이 모호하지 않으면 묻지 않는다.

자동 승격 규칙:
- `D1.methods`에 게스트가 아닌 항목 포함 → D2(계정 삭제) **자동 필수** (Apple 5.1.1(v))
- `C1.model`에 광고 포함 → C2, C3 활성화
- `C1.model`에 IAP/구독 포함 → C4, C5, C6 활성화
- `E1.type=Firebase` 그리고 `C1.model`에 구독 포함 → "Firestore 구독 상태 캐싱 vs RevenueCat webhook" 추가 질문
- `B1.onboarding≠없음` 그리고 `D1.methods`에 소셜 포함 → "온보딩 도중 로그인 강제 vs 게스트 진입 후 유도" 추가 질문
- `F2.location=필수` → "위치 권한 거부 시 fallback UI" 추가 질문
- 앱 카테고리=헬스/피트니스 → F4 헬스킷 옵션 강조, G3 더 엄격하게 질문
- 앱 카테고리=금융/결제 → D4 자동 필수, SecureStore `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` 강제

#### Step 0.5: spec.md 작성

수집한 답을 아래 YAML 스키마로 `_workspace/spec.md`에 저장:

```yaml
# _workspace/spec.md
# Auto-generated by Phase 0 Pre-flight Survey
# 모든 에이전트는 작업 전 이 파일과 *_notes / project.context 를 먼저 읽는다.

project:
  name: {앱슬러그}
  category: {photo|productivity|social|...}
  context: |
    {Step 0.2 자유 입력 — 전체 톤앤매너/제약/참고 앱 등}

execution:
  unattended: false              # true면 체크포인트/조건부 질문도 자동 결정
  on_ambiguity: pick_recommended # pick_first | pick_recommended | ask
  idea_selection: ask            # ask | 1 | 2 | 3 | recommended
  design_selection: ask          # ask | recommended | 1 | 2 | 3

measurement:
  firebase_analytics: true
  firebase_analytics_notes: ""
  crashlytics: true
  crashlytics_notes: ""
  remote_config: false
  north_star: ""
  north_star_notes: ""

ux:
  onboarding: slideshow
  onboarding_notes: ""
  store_review: true
  store_review_notes: ""
  store_review_triggers: []
  store_review_triggers_notes: ""
  languages: [en, ko]
  dark_mode: system_with_toggle
  dark_mode_notes: ""
  haptics: true

monetization:
  model: none
  model_notes: ""
  ad_formats: []
  interstitial_every_n: 3
  iap_tiers: []
  paywall_position: ""
  free_quota: ""

auth:
  methods: []
  methods_notes: ""
  account_deletion: ""
  profile_screen: false
  biometric_gate: none

backend:
  type: none
  type_notes: ""
  offline_first: false
  uploads: false
  realtime: false
  search: ""

permissions:
  media: none
  location: none
  push: none
  advanced: []
  background: none

policy:
  ugc: false
  age_rating: "4+"
  children_under_13: false
  privacy_url: auto-github-pages

deployment:
  platforms: [ios, android]
  beta_channel: testflight
  aso: llm-generated

tech:
  animation_level: normal
  charts: false
  custom_camera: false
```

**스키마 약속**: 모든 객관식 필드는 같은 이름의 `_notes` 필드(자유 입력)를 가질 수 있다. 비어 있어도 무방. 에이전트는 `_notes`가 있으면 객관식 값보다 우선 반영한다.

#### Step 0.6: 사용자 최종 확인

```
"spec.md를 생성했습니다. 이대로 진행하시겠습니까? (Y/편집)"
Y → Phase 1로 진행
편집 → 사용자가 직접 편집 후 재확인
```

#### 무인 실행 (Unattended)

`spec.md`에 `execution.unattended: true`로 설정되어 있으면:
- Phase 체크포인트(아이디어 선택/디자인 선택/MVP 범위 등)에서 멈추지 않음
- 조건부 질문은 `on_ambiguity` 정책에 따라 처리:
  - `pick_first` → 첫 번째 옵션
  - `pick_recommended` → LLM 추천안
  - `ask` → 사용자에게 물음 (기본값)
- 자동 결정된 항목은 `_workspace/decisions.log`에 기록
  ```
  [2026-05-18 14:32:01] phase=1 decision=idea_selection value=2 reason=pick_recommended source=on_ambiguity
  ```

이 모드는 CI/배치 실행을 위한 것. 일반 사용자는 기본값(`unattended: false`)으로 둔다.

#### Phase 0 통과 조건

- `_workspace/spec.md`가 존재하고 YAML 파싱 가능
- 모든 [필수] 필드가 채워져 있음
- `project.name`, `project.category`, `deployment.platforms`가 비어있지 않음

통과 시 Phase 1로 진행, 통과 못 하면 누락 필드를 사용자에게 다시 물어본다.

---

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

이 Contract가 Quick QA의 기준이 된다. Contract에 명시되지 않은 항목은 검증하지 않는다.

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
0. Secure Storage 모듈 구축 (토큰 저장 인프라 — API 클라이언트 작성 전 필수)
   - npx expo install expo-secure-store
   - src/shared/secure-storage/{client,keys,types,index}.ts
   - SECURE_KEYS 상수: ACCESS_TOKEN, REFRESH_TOKEN 등
   - DEFAULT_OPTIONS: keychainAccessible = WHEN_UNLOCKED_THIS_DEVICE_ONLY (iCloud 백업 차단)
   - SecureStore-backed Zustand storage adapter 제공
1. Axios 클라이언트 설정 (baseURL, interceptors, 토큰 자동 갱신)
   - 토큰 조회는 메모리 또는 @/shared/secure-storage 만 사용 (AsyncStorage 금지)
2. 각 feature의 API 함수 구현
3. TanStack Query hooks 작성 (useQuery, useMutation, infinite)
4. API 에러 핸들링 표준화 + 토큰/PII가 로그/리포트에 포함되지 않도록 마스킹
5. 개발용 목 데이터 작성
6. 토큰 store(features/auth/store)는 SecureStore-backed persist 어댑터 사용
   - createJSONStorage(() => secureZustandStorage) 주입
   - AsyncStorage 어댑터 사용 금지
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
- `grep -rE "(accessToken|refreshToken)" src/` 결과가 모두 `@/shared/secure-storage` 경유인지 확인
- 토큰 store의 persist storage가 AsyncStorage가 아닌지 확인

- PASS → Phase 4c 진행
- FAIL → api-integrator에게 수정 요청 (최대 2회 재시도)

---

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
7. Engagement 배선
   - 모든 스크린에 useScreenTracking() 삽입 (Phase 4d에서 모듈은 구축됨)
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
    <SafeAreaView className="flex-1 bg-white">
      {/* content */}
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

**에이전트**: `api-integrator`
**입력**: `_workspace/plan/kpis.md`, `_workspace/plan/prd.md`, `app/`, `src/features/`
**출력**: `src/shared/analytics/`, 각 화면/액션의 `logEvent` 호출 삽입

이 단계는 **PRD의 KPI를 실제로 측정 가능하게 만드는 단계**이다. KPI가 정의되지 않은 채로 Phase 4d에 진입하면 즉시 Phase 2로 돌아간다.

```
Tasks:
1. Firebase 콘솔에 iOS/Android 앱 등록 (Playwright MCP 자동화)
   AdMob 콘솔 자동화와 동일한 패턴. Firebase 앱 생성은 일반 OAuth scope로
   호출 불가하므로 console.firebase.google.com UI를 Playwright MCP로 조작한다.

   1-1. mcp__playwright__browser_navigate → https://console.firebase.google.com
   1-2. 로그인 필요 시 사용자에게 브라우저 창에서 직접 로그인 요청
        (headless 모드 사용 금지, 창은 자동화 중에도 열려 있어야 함)
   1-3. 프로젝트 선택
        - 기존 Firebase 프로젝트가 있으면 클릭하여 선택
        - 없으면 "프로젝트 추가" → 이름 `{앱슬러그}-prod` → Google Analytics ON →
          GA 계정 선택 → "프로젝트 만들기"
   1-4. iOS 앱 등록
        - "앱 추가" → iOS 아이콘
        - Apple bundle ID: app.config.ts의 ios.bundleIdentifier 그대로 입력
        - 앱 닉네임: 앱 이름
        - "앱 등록"
        - "GoogleService-Info.plist 다운로드" 버튼 클릭
          → 다운로드는 ~/Downloads/ 에 저장됨
        - 이후 SDK 단계는 "다음"으로 모두 스킵
   1-5. Android 앱 등록
        - "앱 추가" → Android 아이콘
        - Android 패키지 이름: app.config.ts의 android.package 그대로 입력
        - 앱 닉네임: 앱 이름
        - SHA-1: 비워두기 (Analytics/Crashlytics는 SHA-1 없이 동작)
        - "앱 등록"
        - "google-services.json 다운로드" 버튼 클릭
        - SDK 단계 "다음"으로 스킵
   1-6. 다운로드 파일을 프로젝트로 이동
        - ~/Downloads/GoogleService-Info.plist → ios/GoogleService-Info.plist
        - ~/Downloads/google-services.json → android/app/google-services.json
        - ios/ 또는 android/ 폴더가 없으면 firebase/ 임시 폴더에 보관 후
          expo prebuild --clean 이후 정식 위치로 이동
   1-7. .gitignore에 즉시 추가
        - ios/GoogleService-Info.plist
        - android/app/google-services.json
        - firebase/
   1-8. EAS Secrets 등록 (클라우드 빌드용)
        eas secret:create --scope project --name GOOGLE_SERVICES_PLIST \
          --type file --value ./ios/GoogleService-Info.plist
        eas secret:create --scope project --name GOOGLE_SERVICES_JSON \
          --type file --value ./android/app/google-services.json

   Playwright selector 실패 fallback:
   - Firebase 콘솔 UI가 변경되어 자동화가 실패하면 즉시 중단
   - _workspace/implementation/firebase-manual.md 에 진행 상황 기록
   - 사용자에게 "콘솔에서 직접 두 앱을 등록하고 두 파일을
     ~/Downloads/ 에 받아두었다"는 확인 요청
   - 확인 후 1-6단계부터 자동화 재개

2. 패키지 설치
   npm install @react-native-firebase/app \
     @react-native-firebase/analytics \
     @react-native-firebase/crashlytics
   npx expo install expo-build-properties

3. Expo plugin 등록 (app.config.ts)
   plugins:
     - '@react-native-firebase/app'
     - '@react-native-firebase/crashlytics'
     - ['expo-build-properties', { ios: { useFrameworks: 'static' } }]
   ios.googleServicesFile / android.googleServicesFile 경로도 지정

4. src/shared/analytics/ 모듈 작성
   - client.ts (logEvent, setUserProperty, initAnalytics 래퍼)
   - events.ts (PRD의 KPI 카탈로그를 상수로 정의)
   - hooks/useScreenTracking.ts
   - types/index.ts, index.ts (barrel export)

5. 루트 _layout.tsx에서 initAnalytics() 호출
   - env.IS_PROD 기준으로 수집 활성/비활성 토글

6. PRD KPI 매핑 적용
   - 모든 스크린에 useScreenTracking() 삽입
   - 핵심 액션(F-NNN)에 logEvent() 삽입
   - 활성/유지/수익화 축 이벤트가 모두 1개 이상 코드에 존재하는지 검증

7. Crashlytics 초기화
   - crashlytics().setCrashlyticsCollectionEnabled(env.IS_PROD)

8. Store Review 모듈 구축 (engagement 인프라)
   - npx expo install expo-store-review
   - src/shared/store-review/{client,policy,store,triggers,types,index}.ts
   - hooks/useStoreReview.ts
   - PRD의 "Store Review Triggers" 섹션을 REVIEW_TRIGGERS 상수로 변환
   - 정책 엔진 canRequestReview: 설치≥3일, 실행≥5회, 핵심액션≥3회,
     마지막요청 후 ≥90일, 세션당 1회, 최근 5분 내 에러 차단
   - 카운터 store는 비민감이므로 AsyncStorage persist 사용 (SecureStore 불필요)
   - 루트 _layout.tsx에서 useReviewStore.recordLaunch() 호출
   - 글로벌 에러 바운더리/Crashlytics 핸들러에서 recordError() 호출

9. 빌드 검증
   - npx expo prebuild --clean
   - npm run typecheck && npm run lint
   - eas build --local 또는 development build로 한 번 구동
   - 디바이스/시뮬레이터 로그에 [Firebase/Analytics] 초기화 로그 확인
```

**Sprint Contract (Phase 4d)** — `_workspace/implementation/sprint-contract-4d.md`:
```markdown
# Sprint Contract: Phase 4d Analytics

## Done 조건
- [ ] Playwright MCP로 Firebase 콘솔에 iOS/Android 앱 등록 완료
- [ ] ios/GoogleService-Info.plist 파일이 프로젝트에 존재
- [ ] android/app/google-services.json 파일이 프로젝트에 존재
- [ ] 두 파일이 .gitignore에 등록되어 git status에 untracked로도 노출되지 않음
- [ ] EAS Secrets에 GOOGLE_SERVICES_PLIST, GOOGLE_SERVICES_JSON 업로드 완료
- [ ] @react-native-firebase/{app,analytics,crashlytics} + expo-build-properties 설치
- [ ] app.config.ts에 plugins 및 googleServicesFile 경로 등록
- [ ] src/shared/analytics/{client,events,types,index}.ts 생성
- [ ] src/shared/analytics/hooks/useScreenTracking.ts 생성
- [ ] 루트 _layout.tsx에서 initAnalytics() 호출
- [ ] PRD의 north-star 이벤트 + 4축 이벤트 각 1개 이상 logEvent 호출 존재
- [ ] env.IS_PROD 기반 dev/prod 분기 동작
- [ ] src/shared/store-review/{client,policy,store,triggers,hooks/useStoreReview,types,index}.ts 생성
- [ ] PRD의 Review Triggers가 REVIEW_TRIGGERS 상수로 1:1 매핑
- [ ] 루트 _layout.tsx에서 recordLaunch() 호출 + 에러 바운더리에서 recordError() 호출
- [ ] expo prebuild --clean 성공 + 로컬 빌드 성공

## 검증 방법
- git ls-files | grep -E '(GoogleService-Info\.plist|google-services\.json)' 결과 0건
- npm run typecheck 0 에러
- npm run lint 0 에러
- grep으로 매직 스트링 logEvent 호출 0건 확인
- grep으로 외부 코드의 firebase.analytics() 직접 호출 0건 확인
- eas secret:list 결과에 GOOGLE_SERVICES_PLIST, GOOGLE_SERVICES_JSON 존재
```

**KPI 정의 검증 (Go/No-Go)**:
- `_workspace/plan/kpis.md`가 존재하지 않거나 north-star + 4축이 빠져 있으면
  → Phase 2 (product-planner) 재실행으로 escalate
- PRD에 정의된 이벤트와 코드의 EVENTS 상수가 1:1로 일치하지 않으면 FAIL

**Error Handling**:
- **Firebase 콘솔 미로그인**: Playwright MCP가 로그인 페이지를 감지하면 사용자에게 브라우저 창에서 직접 로그인하라고 요청하고 대기. 절대 자격증명을 자동 입력 시도하지 않는다.
- **Playwright selector 실패** (콘솔 UI 변경): `_workspace/implementation/firebase-manual.md`에 진행 상태(어느 단계에서 실패했는지, 어떤 앱이 이미 등록되었는지) 기록 후 사용자에게 수동 등록 + 파일 다운로드를 요청. 사용자 확인 후 파일 이동 단계부터 자동화 재개.
- **다운로드 파일 누락**: `~/Downloads/GoogleService-Info.plist`, `~/Downloads/google-services.json`이 없으면 1-4 / 1-5단계의 "다운로드" 버튼 클릭이 실패한 것. 콘솔에서 해당 앱 설정 → "GoogleService-Info.plist/google-services.json" 다시 다운로드.
- **EAS Secrets 충돌**: 동일 이름 secret이 이미 있으면 `eas secret:delete` 후 재생성 (사용자 확인 필요).
- **빌드 실패 — Multiple commands produce duplicate**: `useFrameworks: 'static'` 누락 또는 `@react-native-firebase/app` plugin 등록 누락 우선 확인.
- **Firebase 콘솔 접근 권한 부재**: `_workspace/implementation/error-4d.md`에 차단 사유 기록 후 사용자에게 Firebase 프로젝트 권한 부여 요청.

**Quick QA Checkpoint (4d-QA)**:
Phase 4d 완료 후 qa-reviewer가 경량 검증을 실행한다:
```bash
npm run typecheck && npm run lint
```
추가 검사 (qa-reviewer가 수동 수행):
- 외부 코드에서 `firebase.analytics()` 직접 호출 0건 (반드시 `@/shared/analytics` 래퍼 사용)
- `logEvent(`'string'`, ...)` 매직 스트링 호출 0건 (반드시 `EVENTS.*` 상수 사용)
- 이벤트 파라미터에 이메일/전화/실명/정확 위치 PII 0건
- `expo-store-review` 직접 호출 0건 (반드시 `@/shared/store-review` 훅 사용)
- 정책 엔진 미경유 `requestReview()` 호출 0건
- 매직 스트링 트리거 ID 0건 (반드시 `REVIEW_TRIGGERS.*` 사용)

- PASS → Phase 5 진행
- FAIL → api-integrator에게 수정 요청 (최대 2회 재시도)

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
점수 개선이 둔화되면 추가 반복의 효용이 낮다. 3회 반복 후에도 개선이 미미하면 현재 상태로 Phase 7에 진행하고, 미해결 이슈는 백로그로 관리한다.

> **Phase 6은 "출시 전 수렴 루프"다.** 출시 후의 **지속 고도화 루프**(개발→검증→다음 고도화 추천을 무한 반복)는 별도의 `/iterate-app` 스킬과 `loop-engineer` 에이전트가 담당한다. Phase 5에서 백로그(`_workspace/qa/unresolved.md`)로 넘어간 이슈와 미구현 PRD 항목은 출시 후 첫 `/iterate-app` 사이클의 후보가 된다. 루프 메커니즘 상세: `references/loop-engineering.md`.

---

### Phase 7: Deployment

**스킬**: `/store-deploy` 참조 (별도 스킬)
**입력**: `_workspace/` 전체, `app.config.ts`

#### Step 7.0: 배포 전 확인 — 런타임 트리거 배선 게이트 (Pre-Deploy Gate)

**게시된 빌드에서만 동작하고 출시 후엔 코드 업데이트로만 고칠 수 있는 런타임 기능**은, 빌드 직전에 "적절한 시점에 실제로 배선됐는지"를 반드시 확인한다. 시뮬레이터·dev·TestFlight에선 검증이 안 되므로 **코드 배선 여부로만 판정**한다.

| 확인 항목 | 통과 기준 | 미통과 시 |
|----------|----------|----------|
| **스토어 리뷰 트리거** | `spec.md`의 `ux.store_review=true`이면, PRD Review Triggers에 매핑된 화면의 **긍정적 액션 성공 콜백(UI idle)**에 `maybeRequest(REVIEW_TRIGGERS.X)`가 **최소 1곳 이상** 실제 배선됨. (인앱 리뷰는 스토어 콘솔 사전 설정 불필요) | 한 곳도 없으면 평점 수집이 0 → `ui-developer`로 환원, 가치-순간 결정 후 배선 |
| 광고 동의/초기화 | `monetization.model`에 광고 포함 시 `initializeAdsWithConsent()` await + AdMob Console GDPR/IDFA 메시지 **Published** | `api-integrator`로 환원 |
| Analytics KPI 배선 | 북극성/4축 이벤트가 화면에 배선(`useScreenTracking` + 커스텀 이벤트) | `api-integrator`/`ui-developer`로 환원 |

> **왜 배포 단계인가**: 위 트리거들은 "어느 화면의 어느 순간에 넣을지"가 UX 품질을 좌우하는데(평점은 잘못 띄우면 ★1 폭격), 그 판단은 전체 화면이 완성된 **배포 직전**에 가장 정확하다. 또한 게시 후엔 즉시 못 고치므로 여기가 마지막 안전망이다. 모두 통과해야 Build/Submit 진행.

```
Tasks:
1. EAS Build (프로덕션 바이너리)
2. 스토어 메타데이터 생성
3. 스크린샷 생성
4. App Store / Google Play 제출
```

상세 절차: `~/works/store-deploy-plugin/skills/store-deploy/SKILL.md`

#### Step 7.7: Android 프로덕션 액세스 신청 (개인 계정 한정)

Google Play **개인 계정**으로 만든 신규 앱은, 비공개 테스트 **14일+ / 12명+** 게이트를 충족한 뒤 **"프로덕션 액세스 신청"** 양식을 제출·통과해야 프로덕션 공개가 가능하다. 이 신청 양식 작성·제출은 `api-integrator`의 "Play Console 프로덕션 액세스 신청 자동화" 능력이 담당하며, **답변은 `references/play-production-access-application.md`를 정본으로 참고**해 사용자의 실제 사실로 작성한다(날조 금지, 최종 제출 전 사용자 확인). 승인은 보통 7일 이내, 이메일 통보. 승인 후 비공개 테스트(alpha) 최신 버전을 콘솔에서 프로덕션으로 "버전 승급"(재빌드 불필요).

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
│  Phase 2.5: Spec Planning│  spec-planner (docs/specs/)
└────────────┬─────────────┘
             │ docs/specs/
             ▼
┌──────────────────────────┐
│  Phase 3: Design         │  design-architect (/design-system)
└────────────┬─────────────┘
             │ _workspace/design/
             ▼
┌────────────────────────────────────────────────────────┐
│  Phase 4: Implementation (순차 + Quick QA)             │
│  4a feature-builder    → 4a-QA (typecheck+lint)        │
│   → 4b api-integrator  → 4b-QA                         │
│      → 4c ui-developer → 4c-QA                         │
│         → 4d api-integrator (Firebase Analytics+KPI)   │
│            → 4d-QA                                     │
└────────────┬───────────────────────────────────────────┘
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
| `product-planner` | `/plan-app` | PRD, FSD 모듈 맵, 유저 스토리, **KPI 정의 + Review Trigger 카탈로그** |
| `spec-planner` | — | docs/specs/ 스펙 문서, phase/task 분해, 진행 추적 |
| `design-architect` | `/design-system` | NativeWind 테마, 화면 레이아웃 |
| `feature-builder` | `/create-feature`, `/create-entity` | FSD 모듈, Zustand, TS 타입 |
| `api-integrator` | — | Axios 클라이언트, TanStack Query hooks, **Firebase Analytics + KPI 이벤트 + Secure Storage + Store Review 인프라** |
| `ui-developer` | `/create-screen` | Expo Router 스크린, NativeWind UI, **Review trigger·screen tracking·key action 카운터 배선** |
| `qa-reviewer` | — | 코드 품질, TypeScript, FSD 규칙, **Analytics 매직 스트링/PII + SecureStore 우회 + Review 안티패턴 검사** |
| `app-inspector` | `/inspect-app` | 기능/UX 검사, Safe Area, 접근성 |
| `loop-engineer` | `/iterate-app` | **출시 후 지속 고도화 루프** — 현황 진단, 다음 고도화 추천(KPI 갭·기술부채·FSD 커버리지·노력 랭킹), 개발→검증→추천 루프 supervise |

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

Phase 5의 app-inspector는 정적 코드 분석뿐 아니라 **런타임 테스트**도 수행해야 한다:

```
1. iOS Simulator 실행: npx expo start --ios
2. 각 화면 스크린샷 캡처: xcrun simctl io booted screenshot
3. 네비게이션 흐름 확인: 탭 전환, 스택 push/pop
4. 입력 테스트: 키보드 입력, 버튼 터치 반응
5. 에러 상태 유발: 네트워크 끊기, 빈 데이터
```

Playwright MCP가 가용한 경우 웹 빌드에서 자동화 테스트도 가능하다.

---

## Model Capability Adaptation (Anthropic 원칙)

> "Every component in a harness encodes an assumption about what the model can't do on its own."

**모델이 발전하면 하네스를 간소화해야 한다.** 각 컴포넌트가 정당화되는지 주기적으로 재평가:

| 컴포넌트 | 가정 | 현재 모델에서 필요? |
|---------|------|-------------------|
| Sprint Contract | 모델이 범위를 놓침 | 단순 앱은 불필요, 복잡한 앱은 유지 |
| Quick QA (4a-4c) | 서브스텝 간 에러 누적 | 유지 권장 (typecheck은 항상 유용) |
| Phase 6 Fix Loop | 한 번에 완벽 불가 | 유지 (자체 평가는 여전히 관대) |
| Generator-Evaluator 분리 | 자체 평가 편향 | 핵심 — 제거 불가 |
| Context Reset | 컨텍스트 저하 | 최신 Opus(4.8+)에서는 불필요할 수 있음 — 새 모델 출시 시 재평가 |

**비용 인식**: 멀티 에이전트 하네스는 단일 에이전트 대비 **20배 이상** 토큰을 소비한다. 단순한 기능 추가는 하네스 없이 직접 구현하고, 전체 앱 구축 시에만 파이프라인을 활성화한다.

---

## Inspired By

- **[Anthropic Harness Design](https://www.anthropic.com/engineering/harness-design-long-running-apps)** — Generator-Evaluator, Sprint Contract, Hard Threshold, Pivot vs Refine, Active Testing, Model Capability Adaptation
- **[revfactory/harness](https://github.com/revfactory/harness)** — 6가지 아키텍처 패턴 (Pipeline, Fan-out, Expert Pool, Producer-Reviewer, Supervisor, Hierarchical), Progressive Disclosure, Agent Teams
- **[Feature-Sliced Design](https://feature-sliced.design/)** — 프론트엔드 아키텍처 방법론
