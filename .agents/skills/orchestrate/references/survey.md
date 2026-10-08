# Phase 0: Pre-flight Survey — 상세 절차

> orchestrate SKILL.md 에서 옮긴 상세 절차다. 해당 Phase 에 들어갈 때 이 문서를 Read 하고 그대로 따른다.

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

#### Step 0.0b: 템플릿 초기화 확인

`app.config.ts` 에 `const SLUG = 'my-app';` 이 남아 있으면 `init-app` 스킬을 먼저 실행한다(앱 이름·slug 는 요청에서 뽑고, 없을 때만 묻는다). 결과는 Step 0.5 의 `project.name` 에 그대로 쓴다.

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

**묻기 전에 채운다.** 사용자 요청·Step 0.2 답·현재 코드에서 답이 나오는 항목은 그 값으로 채우고 묻지 않는다(근거는 `<field>_notes`에 한 줄). 남은 **[필수]** 항목만 `AskUserQuestion` 한 번에 최대 4문항씩 묶어 묻고, 각 문항의 첫 옵션을 추천안으로 둔다. 별도 "추가 메모" 질문은 하지 않는다 — 사용자가 "Other"에 쓴 글을 `<field>_notes`에 저장한다. [조건부] 항목은 Step 0.4 규칙이 켤 때만 묻는다. 바이브 코딩 요청("간단한 X 앱 만들어줘")은 질문 1~2회 안에 Phase 1로 넘어가는 것이 목표다.

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

수집한 답으로 `_workspace/spec.md` 의 필드를 채운다. 필드 이름과 기본값은 `templates/spec.template.yml` 이 정본이다. `spec.md` 가 없으면 그 파일을 먼저 복사한다. 스키마 검증도 그 파일의 키를 기준으로 한다. 여기에 사본을 두지 않는다.

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
