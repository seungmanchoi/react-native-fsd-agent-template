# Analytics & 핵심 지표 (MANDATORY)

> 이 문서는 CLAUDE.md 에서 옮긴 상세 규칙이다. **Hard Threshold 표는 CLAUDE.md 가 정본**이며, 여기 없는 통과 기준은 CLAUDE.md 를 따른다.

**모든 앱은 출시 직후부터 측정 가능한 핵심 지표(KPI)를 수집한다.** 이를 위해 Firebase Analytics를 표준 도구로 사용한다. KPI 정의는 기획 단계에서, 이벤트 수집 코드는 구현 단계에서 반드시 포함되어야 한다.

## Firebase 표준 스택

| 영역 | 패키지 | 용도 |
|------|--------|------|
| 핵심 | `@react-native-firebase/app` | Firebase 초기화 |
| Analytics | `@react-native-firebase/analytics` | 이벤트/사용자 속성/스크린 추적 |
| Crashlytics | `@react-native-firebase/crashlytics` | 충돌/예외 리포트 (KPI 신뢰도 보호) |
| Remote Config (선택) | `@react-native-firebase/remote-config` | 실험/플래그 |

Expo plugin 등록: `app.config.ts` → `plugins: ['@react-native-firebase/app', '@react-native-firebase/crashlytics']` 및 `expo-build-properties`로 iOS `useFrameworks: 'dynamic'` 설정. RN Firebase 26은 Firebase iOS SDK를 **SPM**으로 가져오며 SPM은 dynamic frameworks가 필수다 — `'static'`만 단독으로 쓰면 `pod install`이 실패한다(정적이 꼭 필요하면 RNFB app plugin `{ ios: { disableSPM: true } }` + `'static'` + 모든 RNFB pod을 `forceStaticLinking`). **v26은 namespaced API(`analytics().logEvent`)를 삭제했다** — modular API(`logEvent(getAnalytics(), ...)`)만 쓴다.

## 측정 표준 KPI (기본 세트)

**모든 앱에 기본으로 정의해야 하는 4개 축:**

| 축 | 대표 지표 | Firebase 이벤트 |
|----|----------|-----------------|
| 획득 (Acquisition) | 신규 설치, 첫 실행 | `first_open` (자동), `app_install` |
| 활성 (Activation) | DAU/WAU, 첫 핵심 행동 완료율 | `activation` (커스텀), `screen_view` (자동) |
| 유지 (Retention) | D1/D7/D30 리텐션, 세션 길이 | `session_start` (자동), `user_engagement` (자동) |
| 수익화 (Monetization) | 광고 노출/클릭, IAP 매출, ARPU | `ad_impression` (자동), `purchase` |

추가로 각 앱의 **북극성 지표(North Star Metric)** 1개를 PRD에서 명시한다 (예: "주간 사진 N장 촬영 사용자 수").

## 이벤트 네이밍 규칙

- snake_case, 영문 소문자, 동사_명사 형식 (`tap_camera_capture`, `view_gallery_grid`)
- 예약어 금지: Firebase 자동 이벤트(`session_start`, `first_open` 등)와 중복 금지. `screen_view`는 커스텀 이벤트로 만들지 않고 `logScreenView()`로만 보낸다(루트 `_layout.tsx`가 라우트 패턴으로 자동 기록, `firebase.json`에서 네이티브 자동 화면 수집은 끔)
- 파라미터는 25개 이하, 키 길이 ≤ 40자, 값 길이 ≤ 100자
- PII 금지: 이메일/전화번호/실명/정확한 위치는 절대 파라미터로 보내지 않는다

## 코드 통합 위치 (FSD)

```
src/shared/lib/analytics/
├── analytics.ts       # 파사드 — initAnalytics, logEvent, logScreenView
├── firebase.ts        # Firebase 어댑터
├── noop.ts            # no-op 어댑터 (Expo Go/네이티브 모듈 없을 때 자동 fallback)
├── events.ts          # 이벤트 카탈로그 (EAnalyticsEvent 상수 + 파라미터 타입)
├── types.ts           # IEventName, TEventParams 등
└── index.ts           # barrel export
```

- 직접 `firebase.analytics().logEvent()` 호출 금지 — 반드시 `@shared/lib/analytics`의 래퍼 함수만 사용
- 이벤트 이름은 `events.ts`의 상수로만 정의 (오타/중복 방지)
- 수집은 `env.IS_PROD`에서만 켠다(`initAnalytics()`가 Analytics·Crashlytics collection을 설정) — dev/preview 트래픽이 KPI를 오염시키지 않게. Analytics 네이티브 기본값은 `firebase.json`의 `analytics_auto_collection_enabled: false`로 꺼 둔다 — 켜 두면 JS가 끄기 전에 dev/preview 새 설치의 `first_open`·`session_start`가 전송된다. production은 `initAnalytics()`가 켠 직후 `first_open`·`session_start`가 기록되고 값이 저장돼 다음 실행부터는 시작부터 수집한다. Crashlytics 기본값은 켜 둔다(`crashlytics_auto_collection_enabled` 미설정) — 끄면 RNFB가 JS 설정을 다음 실행에야 반영해 JS 전에 죽는 production 첫 실행 크래시가 업로드되지 않는다(dev는 RNFB가 debug 빌드에서 이미 끈다). `initAnalytics()`는 루트 `_layout.tsx` **모듈 최상단**에서 호출한다 — effect 안이면 먼저 실행되는 자식 화면의 마운트 이벤트가 첫 실행에서 버려진다
- 비치명 에러는 `recordError(error)`(Crashlytics)로 보낸다. 루트 `ErrorBoundary`가 이미 호출한다

## 통합 단계

Firebase 콘솔 자동화(Playwright MCP) · 설정파일 배치/보안(`.gitignore` + EAS 환경변수(file)) · 패키지 설치/plugin 등록 · `src/shared/lib/analytics/` 모듈 작성 · `_layout.tsx` 초기화 · 이벤트 배선 · 빌드 검증의 **전체 절차는 `.claude/agents/api-integrator.md`("Firebase 콘솔 자동화", "Analytics 통합 규칙")** 와 orchestrate Phase 4d가 정본이다.

> 요약 규칙: `app.config.ts` plugins 에 `@react-native-firebase/app`, `@react-native-firebase/crashlytics`, `expo-build-properties`(iOS `useFrameworks: 'dynamic'`)를 등록한다. Podfile을 고치는 커스텀 패치 플러그인은 쓰지 않는다. `GoogleService-Info.plist`/`google-services.json`은 `./firebase/`에 두고(gitignore) 절대 커밋하지 않는다. 로컬 빌드는 이 파일을 그대로 쓰고, 클라우드 빌드도 `.easignore`가 `firebase/`를 올려서 그대로 된다. `firebase/`를 아카이브에서 뺀 경우에만 file 타입 환경변수 `GOOGLE_SERVICE_INFO_PLIST` / `GOOGLE_SERVICES_JSON`으로 주입한다(`app.config.ts`가 이 두 이름을 먼저 읽는다 — `eas secret:*`은 deprecated, `eas env:create --type file --visibility secret`). RNFirebase 빌드 이슈 상세: `.claude/skills/orchestrate/references/deploy-build-troubleshooting.md`.
