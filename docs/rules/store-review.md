# 스토어 평점 유도 (In-App Review Prompts) (MANDATORY)

> 이 문서는 CLAUDE.md 에서 옮긴 상세 규칙이다. **Hard Threshold 표는 CLAUDE.md 가 정본**이며, 여기 없는 통과 기준은 CLAUDE.md 를 따른다.

**평점은 단순히 "달라"고 띄우는 게 아니라, 사용자가 가치를 느낀 직후의 짧은 순간을 노려야 한다.** 잘못된 타이밍에 띄우면 ★1 폭격을 유발한다. 모든 앱은 트리거를 코드 곳곳에 직접 호출하지 않고, **중앙 정책 엔진**을 통해 호출한다.

## 표준 스택

| 영역 | 패키지 | 비고 |
|------|--------|------|
| 평점 요청 | `expo-store-review` | iOS `SKStoreReviewController`, Android Google Play In-App Review API 래핑 |
| 카운터 persist | `@react-native-async-storage/async-storage` 또는 MMKV | **비민감 데이터** — SecureStore 불필요 |

설치:
```bash
npx expo install expo-store-review
```

## 플랫폼 한계 (알고 시작해야 한다)

- **iOS (`SKStoreReviewController.requestReview()`)**: 시스템이 **365일 윈도우 내 최대 3회**까지만 실제 다이얼로그를 노출한다. 초과 호출은 **에러 없이 조용히 무시**되므로 "표시되었는지" 알 길이 없다. HIG: "앱 실행 직후나 작업 도중에 묻지 말 것".
- **Android (Play In-App Review API)**: Google이 자체 쿼터를 관리하며 앱은 쿼터를 알 수 없다. **"리뷰 의향을 묻는 사전 프롬프트(would you like to review?) 금지"** — 정책 위반. 짧은 시간 내 반복 호출도 무시된다.
- **공통**: 호출 자체에 비용은 없지만, 정책 엔진으로 호출을 줄여야 "표시될 기회"가 보존된다. `requestReview()`는 표시 여부를 반환하지 않으므로 **표시되었다고 가정한 후속 UI/로직을 만들지 않는다**.

## 트리거 정책 (Hard Rules)

다음 모든 게이트를 통과해야 `requestReview()`가 호출된다:

| 게이트 | 기본값 | 비고 |
|--------|--------|------|
| 최소 설치 후 경과 일수 | 3일 이상 | "처음 본 앱"에 평점 금지 |
| 앱 실행(launch) 누적 횟수 | 5회 이상 | 한 번 써본 사용자 제외 |
| 핵심 액션 완료 횟수 | 3회 이상 | "Activation" 한 번이 아닌 반복 사용 |
| 마지막 요청 이후 경과 | 90일 이상 | iOS 시스템 쿼터 보호 |
| **365일 윈도우 내 자체 호출 횟수** | **3회 이하** | iOS 시스템 한도(연 3회)와 동일. 우리도 카운팅해서 초과 호출 자체를 차단 |
| 이번 세션에 이미 요청 | false | 한 세션에 1회 |
| **앱 실행 직후 cooldown** | **120초 이상 경과** | "실행 즉시" 노출 차단 (HIG) |
| **UI idle 상태 필수** | **true** | 모달/시트/네비게이션 트랜지션/폼 입력/비동기 작업 진행 중 호출 차단 |
| 최근 5분 내 에러/크래시 | false | 부정적 컨텍스트 차단 |
| `Platform.isPad` 등 폼팩터 제외 | 정책 결정 | 필요 시 옵트아웃 |

## 안티패턴 (즉시 FAIL)

- 앱 첫 실행 / 온보딩 도중 평점 요청
- 결제 실패, 네트워크 에러, 권한 거부 직후 평점 요청
- 모달 위에 모달로 평점 요청 (UX 충돌)
- "별점 5개 부탁드려요" 등 평점 점수 유도 문구 (App Store 가이드라인 위반)
- 평점을 안 주면 기능을 막는 dark pattern
- 각 화면에서 `StoreReview.requestReview()`를 정책 엔진 없이 직접 호출
- **자체 사전 프롬프트 금지** — "평점 남겨주실래요?" 같은 커스텀 다이얼로그/시트/액션시트로 의향 먼저 묻고 시스템 다이얼로그를 띄우는 흐름 금지 (Google Play 정책 위반, App Store도 권장하지 않음). 곧바로 시스템 다이얼로그(`StoreReview.requestReview()`)만 호출
- **표시 결과 의존 로직 금지** — `requestReview()`는 표시 여부를 반환하지 않는다. "다이얼로그가 떴으니 토스트 보여주자/다음 화면 이동하자" 같은 후속 UI 분기 금지. 호출은 fire-and-forget

## 코드 통합 위치 (FSD)

```
src/shared/store-review/
├── client.ts          # expo-store-review 래퍼 (requestReview, isAvailableAsync)
├── policy.ts          # 게이트 정책 엔진 (canRequest, evaluate)
├── store.ts           # Zustand persist — 카운터/타임스탬프 추적
├── triggers.ts        # TRIGGERS 상수 카탈로그 (액션 ID + 임계값)
├── hooks/
│   └── useStoreReview.ts  # maybeRequest(triggerId) 훅
├── types/index.ts
└── index.ts           # barrel export
```

**래퍼/정책 엔진(`canRequestReview`)/store/triggers/훅 구현은 `.claude/agents/api-integrator.md`의 "Store Review 모듈 / 정책 엔진 / 래퍼+훅" 섹션이 정본**이다.

- `IReviewState`는 `installedAt`·`sessionStartedAt`·`launchCount`·`keyActionCount`·`lastRequestedAt`·`lastErrorAt`·`requestedThisSession`·`requestHistory: string[]`를 포함한다. `recordLaunch()`가 `sessionStartedAt` 갱신, `markRequested()`가 `requestHistory` push + 1년 초과 prune.
- `IReviewPolicy`는 `minDaysSinceInstall`·`minLaunchCount`·`minKeyActionCount`·`minDaysSinceLastRequest`·**`maxRequestsPerYear`·`cooldownAfterLaunchSec`**·`blockAfterErrorWindowMin` 게이트와 `canRequestReview(state, { uiIsIdle }, policy)` 시그니처를 가진다.
- `maybeRequest`의 boolean 반환값은 "정책 통과 + 호출 시도"만 의미하며 다이얼로그 표시를 보증하지 않는다 → 후속 UI/네비게이션 분기 금지(fire-and-forget).

## 호출 규칙 (CRITICAL)

- 외부 코드는 `expo-store-review`를 직접 호출하지 않는다. **반드시 `useStoreReview().maybeRequest(REVIEW_TRIGGERS.X)`** 만 사용
- 트리거 ID는 `REVIEW_TRIGGERS` 상수 카탈로그에서만 가져온다 (매직 스트링 금지)
- 모든 평점 요청은 Analytics에 `request_store_review` 이벤트로 기록 (KPI 추적)
- 호출 위치: **긍정적 액션의 성공 콜백 안 + UI가 idle 상태**일 때만 (예: 저장 토스트가 사라진 뒤, 화면 전환이 끝난 뒤)
- 에러 핸들러(`onError`, catch 블록) 내부에서 호출 금지

## 카운터/이벤트 자동 집계

루트 `_layout.tsx`에서 앱 실행 시 `reviewStore.recordLaunch()`를 호출하고, 글로벌 에러 바운더리/Crashlytics 핸들러에서 `reviewStore.recordError()`를 호출한다. 핵심 액션 카운터(`recordKeyAction()`)는 ui-developer가 화면별 성공 콜백에서 호출한다.

## 에이전트 책임 분담

- **product-planner**: PRD에 "Review Triggers" 섹션 작성 — 어떤 액션이 트리거 후보인지, 임계값(N회 완료 등) 정의
- **api-integrator**: `src/shared/store-review/` 모듈 인프라(래퍼/정책/store/triggers/훅) 구축
- **ui-developer**: 각 화면의 성공 콜백에 `useStoreReview().maybeRequest(...)` 호출 삽입 + `recordKeyAction()` 카운터 호출
- **qa-reviewer**: 안티패턴/Hard Threshold 검사
- **배포 직전 게이트**: 인앱 리뷰는 **게시된 빌드에서만 표시**되고 출시 후엔 코드로만 고칠 수 있으므로, `store_review=true`인데 `maybeRequest`가 어느 화면에도 배선되지 않았으면 빌드를 보류한다 (orchestrate Phase 7 Step 7.0 — 트리거가 적절한 가치-순간에 들어갔는지 최종 확인)
