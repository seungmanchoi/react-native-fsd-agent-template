# Phase 4d: Analytics Integration — 상세 절차

> orchestrate SKILL.md 에서 옮긴 상세 절차다. 해당 Phase 에 들어갈 때 이 문서를 Read 하고 그대로 따른다.

#### Phase 4d: Analytics Integration — `api-integrator`

**에이전트**: `api-integrator`
**입력**: `_workspace/plan/kpis.md`, `_workspace/plan/prd.md`, `app/`, `src/features/`
**출력**: `src/shared/lib/analytics/events.ts`(PRD KPI 카탈로그), 각 화면/액션의 `logEvent` 호출 삽입 — 래퍼·Crashlytics·화면 추적·Store Review 인프라는 템플릿에 이미 있다

이 단계는 **PRD의 KPI를 실제로 측정 가능하게 만드는 단계**이다. KPI가 정의되지 않은 채로 Phase 4d에 진입하면 즉시 Phase 2로 돌아간다.

```
Tasks:
1. Firebase 콘솔에 iOS/Android 앱 등록 (Playwright MCP 자동화)
   Firebase 앱 생성은 일반 OAuth scope로
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
   1-6. 다운로드 파일을 ./firebase/로 이동 (app.config.ts googleServicesFile 기본 경로 —
        prebuild가 네이티브 프로젝트로 복사하므로 ios/·android/에 직접 두지 않는다)
        - ~/Downloads/GoogleService-Info.plist → firebase/GoogleService-Info.plist
        - ~/Downloads/google-services.json → firebase/google-services.json
   1-7. .gitignore 확인 (템플릿에 firebase/GoogleService-Info.plist,
        firebase/google-services.json 포함) — git status에 노출되면 즉시 중단
   1-8. (기본은 건너뛴다) 로컬 빌드는 ./firebase/ 파일을 그대로 쓰고, 클라우드 빌드도
        .easignore 가 firebase/ 를 올려서 그대로 된다. firebase/ 를 아카이브에서 뺀 앱의
        클라우드 빌드만 file 환경변수를 등록한다 (eas secret:* 은 deprecated).
        이름은 app.config.ts가 읽는 두 개와 정확히 같아야 한다:
        eas env:create --name GOOGLE_SERVICE_INFO_PLIST --type file \
          --value ./firebase/GoogleService-Info.plist --visibility secret \
          --environment production --environment preview --environment development
        eas env:create --name GOOGLE_SERVICES_JSON --type file \
          --value ./firebase/google-services.json --visibility secret \
          --environment production --environment preview --environment development

   Playwright selector 실패 fallback:
   - Firebase 콘솔 UI가 변경되어 자동화가 실패하면 즉시 중단
   - _workspace/implementation/firebase-manual.md 에 진행 상황 기록
   - 사용자에게 "콘솔에서 직접 두 앱을 등록하고 두 파일을
     ~/Downloads/ 에 받아두었다"는 확인 요청
   - 확인 후 1-6단계부터 자동화 재개

2. 패키지 확인 — 템플릿에 @react-native-firebase/{app,analytics,crashlytics} 26.x 와
   expo-build-properties 가 이미 있다. measurement.crashlytics=false 면 crashlytics
   패키지·plugin 과 함께 firebase.ts 의 crashlytics import·호출(recordError 는 no-op),
   patches/@react-native-firebase+crashlytics+*.patch, firebase.json 의 crashlytics_* 키를
   제거한다 — import 가 남으면 Metro 번들 실패, 패치가 남으면 patch-package 가 CI(EAS)에서
   exit 1 로 install 을 멈춘다.

3. Expo plugin 확인 (app.config.ts — 템플릿 기본값 유지)
   plugins:
     - '@react-native-firebase/app'
     - '@react-native-firebase/crashlytics'
     - ['expo-build-properties', { ios: { useFrameworks: 'dynamic', enableSceneSupport: true } }]
       RNFB 26 은 Firebase iOS SDK 를 SPM 으로 받으며 SPM 은 dynamic 필수.
       'static' 단독 금지(pod install 실패) — 정적이 꼭 필요하면 RNFB app plugin
       { ios: { disableSPM: true } } + 'static' + 모든 RNFB pod forceStaticLinking.
   ios.googleServicesFile / android.googleServicesFile = ./firebase/* (env 로 오버라이드)

4. src/shared/lib/analytics/ (템플릿 구현 확장)
   - events.ts 에 PRD KPI 카탈로그를 EAnalyticsEvent 상수로 추가
   - firebase.ts 는 RNFB v26 modular API 만 사용 (namespaced analytics() 는 삭제됨)

5. 루트 _layout.tsx 모듈 최상단의 void initAnalytics() 유지 (effect 안으로 옮기지 않는다 —
   자식 화면 effect가 먼저 실행돼 production 첫 실행의 마운트 이벤트가 버려진다)
   - env.IS_PROD 에서만 Analytics·Crashlytics 수집 (dev/preview 는 끔)

6. PRD KPI 매핑 적용
   - screen_view 는 루트 _layout.tsx 가 라우트 패턴으로 자동 기록 (추가 작업 없음)
   - 핵심 액션(F-NNN)에 logEvent(EAnalyticsEvent.X, ...) 삽입
   - 활성/유지/수익화 축 이벤트가 모두 1개 이상 코드에 존재하는지 검증

7. Crashlytics
   - 수집 토글은 initAnalytics() 가 처리, 비치명 에러는 recordError(error)
   - 루트 ErrorBoundary 가 recordError + reviewStore.recordError 를 이미 호출
   - 로컬 release 빌드 후 dSYM 업로드 빌드 단계 존재 확인

8. Store Review (템플릿 src/shared/store-review/ 에 이미 있다 — 설치·생성하지 않는다)
   - PRD의 "Store Review Triggers" 섹션을 REVIEW_TRIGGERS 상수에 추가
   - 정책 기본값은 policy.ts DEFAULT_POLICY: 설치≥3일, 실행≥5회, 핵심액션≥3회,
     마지막요청 후 ≥90일, 세션당 1회, 최근 5분 내 에러 차단
   - 루트 _layout.tsx 의 recordLaunch()·ErrorBoundary 의 recordError() 는 이미 있다 — 유지

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
- [ ] firebase/GoogleService-Info.plist, firebase/google-services.json 존재 (번들 ID/패키지명 일치)
- [ ] 두 파일이 .gitignore에 등록되어 git status에 untracked로도 노출되지 않음
- [ ] (firebase/ 를 아카이브에서 뺀 클라우드 빌드만) EAS env 에 GOOGLE_SERVICE_INFO_PLIST, GOOGLE_SERVICES_JSON (file) 등록
- [ ] @react-native-firebase/{app,analytics,crashlytics} 26.x + expo-build-properties (dynamic) 유지
- [ ] app.config.ts에 plugins 및 googleServicesFile 경로 등록
- [ ] src/shared/lib/analytics/events.ts 에 PRD KPI 이벤트 상수 추가
- [ ] 루트 _layout.tsx에서 initAnalytics() 호출 + 화면 추적(useSegments) 유지
- [ ] PRD의 north-star 이벤트 + 4축 이벤트 각 1개 이상 logEvent 호출 존재
- [ ] env.IS_PROD 기반 dev/prod 분기 동작
- [ ] src/shared/store-review/ 템플릿 모듈 유지 (새로 만들지 않음)
- [ ] PRD의 Review Triggers가 REVIEW_TRIGGERS 상수로 1:1 매핑
- [ ] 루트 _layout.tsx에서 recordLaunch() 호출 + 에러 바운더리에서 recordError() 호출
- [ ] expo prebuild --clean 성공 + 로컬 빌드 성공

## 검증 방법
- git ls-files | grep -E '(GoogleService-Info\.plist|google-services\.json)' 결과 0건
- npm run typecheck 0 에러
- npm run lint 0 에러
- grep으로 매직 스트링 logEvent 호출 0건 확인
- grep으로 외부 코드의 @react-native-firebase/* 직접 import / namespaced analytics() 호출 0건 확인
- (firebase/ 를 아카이브에서 뺀 클라우드 빌드만) eas env:list 결과에 GOOGLE_SERVICE_INFO_PLIST, GOOGLE_SERVICES_JSON 존재
```

**KPI 정의 검증 (Go/No-Go)**:
- `_workspace/plan/kpis.md`가 존재하지 않거나 north-star + 4축이 빠져 있으면
  → Phase 2 (product-planner) 재실행으로 escalate
- PRD에 정의된 이벤트와 코드의 EAnalyticsEvent 상수가 1:1로 일치하지 않으면 FAIL

**부트 시퀀스 정본 확인 (`_layout.tsx`)**:
Phase 4b(광고·SecureStore)와 4d(Analytics·Crashlytics·Review)가 모두 루트 `_layout.tsx` 한 곳에 init을 모은다. **순서가 어긋나면 첫 이벤트·첫 광고 요청·동의 정보가 누락**되므로(전형적 order-sensitive 지점) 아래 정본 순서를 확인한다:
1. `ErrorBoundary`가 트리 최상단 (Crashlytics `recordError` + `reviewStore.recordError`) — init 중 크래시도 포착
2. `void initializeAdsWithConsent()` — UMP → ATT → `setRequestConfiguration` → `mobileAds().initialize()`. **첫 렌더를 막지 않는다**(await 금지). UMP 결과(`ump_status`/`att_status`)는 consent.ts가 직접 user property로 기록
3. `void initAnalytics()` — 수집 토글(IS_PROD). **모듈 최상단**에서 호출(effect 아님 — 네이티브 수집이 꺼진 채 시작하므로 자식 화면의 마운트 이벤트보다 먼저 켜야 한다). 동의 흐름과 병렬이어도 된다 (UMP가 Firebase consent mode를 직접 갱신)
4. `useReviewStore.persist.rehydrate()` **완료 후** `recordLaunch()` (세션당 1회)
5. `setAuthFailureCallback` (auth 사용 앱)
6. 광고 컴포넌트/훅은 `useAdsReady()`가 true가 된 뒤에만 로드
- 위반(특히 동의 전에 광고 로드, 렌더를 막는 await, hydrate 전 recordLaunch) 발견 → `api-integrator`로 환원. 미사용 모듈(광고/Analytics 미선택)은 해당 단계 생략 가능.

**Error Handling**:
- **Firebase 콘솔 미로그인**: Playwright MCP가 로그인 페이지를 감지하면 사용자에게 브라우저 창에서 직접 로그인하라고 요청하고 대기. 절대 자격증명을 자동 입력 시도하지 않는다.
- **Playwright selector 실패** (콘솔 UI 변경): `_workspace/implementation/firebase-manual.md`에 진행 상태(어느 단계에서 실패했는지, 어떤 앱이 이미 등록되었는지) 기록 후 사용자에게 수동 등록 + 파일 다운로드를 요청. 사용자 확인 후 파일 이동 단계부터 자동화 재개.
- **다운로드 파일 누락**: `~/Downloads/GoogleService-Info.plist`, `~/Downloads/google-services.json`이 없으면 1-4 / 1-5단계의 "다운로드" 버튼 클릭이 실패한 것. 콘솔에서 해당 앱 설정 → "GoogleService-Info.plist/google-services.json" 다시 다운로드.
- **EAS env 충돌**: 동일 이름 변수가 이미 있으면 `eas env:create ... --force`로 덮어쓴다 (사용자 확인 필요).
- **pod install 실패 — "SPM + static linkage is not supported"**: `useFrameworks: 'static'`이 RNFB 기본 SPM 모드와 충돌한 것. `'dynamic'`으로 되돌린다.
- **빌드 실패 — Multiple commands produce duplicate**: `@react-native-firebase/app` plugin 등록 누락 또는 `ios/`에 수동 배치한 GoogleService-Info.plist 중복 우선 확인.
- **Firebase 콘솔 접근 권한 부재**: `_workspace/implementation/error-4d.md`에 차단 사유 기록 후 사용자에게 Firebase 프로젝트 권한 부여 요청.

**Quick QA Checkpoint (4d-QA)**:
Phase 4d 완료 후 qa-reviewer가 경량 검증을 실행한다:
```bash
npm run typecheck && npm run lint
```
추가 검사 (qa-reviewer가 수동 수행):
- 외부 코드에서 `@react-native-firebase/*` 직접 호출 0건 (반드시 `@shared/lib/analytics` 래퍼 사용)
- `logEvent(`'string'`, ...)` 매직 스트링 호출 0건 (반드시 `EAnalyticsEvent.*` 상수 사용)
- 이벤트 파라미터에 이메일/전화/실명/정확 위치 PII 0건
- `expo-store-review` 직접 호출 0건 (반드시 `@/shared/store-review` 훅 사용)
- 정책 엔진 미경유 `requestReview()` 호출 0건
- 매직 스트링 트리거 ID 0건 (반드시 `REVIEW_TRIGGERS.*` 사용)

- PASS → Phase 5 진행
- FAIL → api-integrator에게 수정 요청 (최대 2회 재시도)

---
