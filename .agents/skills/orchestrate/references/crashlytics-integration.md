# Crashlytics 붙이기 — 이미 있는 앱에 넣는 순서

> 새 앱은 템플릿에 Crashlytics 가 이미 들어 있다. survey A2(`measurement.crashlytics`)로 켜고 끈다(`analytics-integration.md` 2단계). 이 문서는 **Crashlytics 없이 만들어졌거나 출시된 앱**에 나중에 붙이는 순서다. `iterate-app` Step 1 이 없음을 발견하면 사용자에게 묻고, 붙이기로 하면 이 순서를 그대로 따른다.

**왜 필요한가**: 시뮬레이터에서 안 도는 경로(실제 카메라·GPU·광고 응답 등)의 크래시는 출시 뒤에야 난다. Crashlytics 가 없으면 사용자가 TestFlight 피드백을 보내 주지 않는 한 크래시가 났는지도 모른다.

## 0. 확인하고 묻는다

```
없음 판정: package.json 에 @react-native-firebase/crashlytics 가 없다
          (또는 spec.md 의 measurement.crashlytics 가 비어 있다)
→ AskUserQuestion 1문항
  "이 앱에는 Crashlytics(크래시 수집)가 없습니다. 붙일까요?"
  ├─ 붙이기 (권장) — 운영 빌드의 네이티브 크래시를 자동 수집, 처리된 오류는 recordError 로 기록
  └─ 건너뛰기      — spec.md 에 measurement.crashlytics: false, 사유를 _notes 에 남긴다
```

- 이미 `measurement.crashlytics: false` 로 답한 앱은 다시 묻지 않는다.
- 무인 실행(`execution.unattended: true`)이면 `on_ambiguity` 를 따른다. `pick_first`·`pick_recommended` 는 붙이기로 처리하고 `_workspace/iterate/decisions.log` 에 기록한다.
- Firebase(`@react-native-firebase/app` + `GoogleService-Info.plist`·`google-services.json`)가 아예 없는 앱이면 `analytics-integration.md` 1단계(Firebase 앱 등록·설정 파일)를 먼저 한다.

## 1. 패키지 — 설치된 RNFB 와 같은 메이저·버전

```bash
node -p "require('@react-native-firebase/app/package.json').version"   # 예: 24.0.0
npm install @react-native-firebase/crashlytics@<같은 버전>
```

버전이 다르면 네이티브 빌드나 런타임에서 깨진다. RNFB 패키지는 항상 같이 올린다.

## 2. config plugin — `app.config.ts`

- `plugins` 에서 `'@react-native-firebase/app'` 바로 다음에 `'@react-native-firebase/crashlytics'` 를 넣는다. 이 plugin 이 Android Gradle plugin 과 iOS dSYM 업로드 빌드 단계를 추가한다.
- `expo-build-properties` 의 iOS 링크 방식은 앱이 이미 쓰는 값을 유지한다.
  - `useFrameworks: 'static'` + `forceStaticLinking` 을 쓰는 앱(RNFB ≤25 + AdMob 조합): 목록에 `'RNFBCrashlytics'` 를 추가한다.
  - RNFB 26(SPM)은 `'dynamic'` 이 필수다(템플릿 기본).

## 3. dSYM 업로드 실패가 빌드를 깨지 않게 — patch-package

`node_modules/@react-native-firebase/crashlytics/ios_config.sh` 의 `FirebaseCrashlytics/run`(그리고 SPM `upload-symbols`) 호출을 `if ! ...; then echo "warning: ..."; fi` 로 감싸고 `npx patch-package @react-native-firebase/crashlytics` 로 저장한다. 템플릿의 `patches/@react-native-firebase+crashlytics+26.4.0.patch` 와 같은 처리다. 네트워크가 없거나 Firebase 설정이 placeholder 면 업로드가 실패하는데, 이 패치가 없으면 로컬 EAS 빌드 전체가 실패한다.

## 4. 어댑터 — 파사드 뒤에 숨긴다

`src/shared/lib/analytics/` 구조를 따른다(없으면 템플릿에서 가져온다).

- `types.ts`: `IAnalyticsAdapter` 에 `recordError: (error: Error) => void`
- `noop.ts`: `recordError` 는 dev 에서만 `console.warn`
- `firebase.ts`: modular API 만 쓴다(v26 은 namespaced 삭제).
  ```ts
  import { getCrashlytics, recordError, setCrashlyticsCollectionEnabled } from '@react-native-firebase/crashlytics';
  // init(): 운영 빌드만 수집. 이 설정은 다음 실행부터 적용되므로 기본값(켜짐)은 끄지 않는다 — 첫 실행 크래시도 잡혀야 한다.
  setCrashlyticsCollectionEnabled(getCrashlytics(), env.IS_PROD)
  // recordError(error): recordError(getCrashlytics(), error)
  ```
- `analytics.ts`: `export function recordError(error: unknown)` — `Error` 로 감싸고 try/catch. `index.ts`·`shared/lib/index.ts` barrel 에 export.
- `firebase.json` 에 Crashlytics 자동 수집을 끄는 키를 넣지 않는다.

## 5. 연결 — 초기화와 처리된 오류

1. 루트 `app/_layout.tsx` 에서 `initAnalytics()` 를 호출하는지 확인한다. 래퍼만 있고 호출이 빠진 앱이 있다. 빠지면 `IS_PROD` 게이트가 적용되지 않는다.
2. `ErrorBoundary.componentDidCatch` 에서 `recordError(error)`.
3. 앱이 죽지는 않지만 사용자가 실패를 겪는 `catch` 에서 `recordError(error)`. 예: 촬영·저장·결제·카메라 마운트 실패, 백그라운드 큐 실패. 토큰·PII 는 메시지에 넣지 않는다(Hard Threshold).
4. 네이티브 크래시와 처리되지 않은 JS 예외는 모듈만 있으면 자동 수집된다. 별도 코드가 필요 없다.

## 6. 검증

- `npm run typecheck`·`npm run lint` 0 errors, 필요하면 `npm run verify`.
- 네이티브 확인은 로컬 EAS 빌드로 한다(`eas build --local`). 빌드 로그에서 다음을 본다.
  - `Installing RNFBCrashlytics`·`FirebaseCrashlytics` pod 설치
  - dSYM 업로드 단계 `FirebaseCrashlytics/run` 이 실행됐는지. 실패해도 warning 으로 남고 빌드는 계속돼야 한다.
- Android 는 `com.google.firebase.crashlytics` Gradle plugin 이 적용됐는지 빌드 로그에서 확인한다.
- 수집 확인(선택): 운영 프로필 빌드를 TestFlight·내부 테스트로 설치하고, 진단용 버튼이나 일회성 코드로 `crash(getCrashlytics())` 를 호출한다. 앱을 다시 열면 Firebase 콘솔 Crashlytics 에 몇 분 안에 뜬다. 진단 코드는 커밋하지 않는다.

## 7. 기록

- `spec.md`: `measurement.crashlytics: true`. 버전이나 링크 방식 특이사항은 `crashlytics_notes` 에 적는다.
- `docs/specs/` 체크리스트와 `_workspace/iterate/cycle-{N}.md` 에 "Crashlytics 연동" 을 남긴다.
- 출시 노트에는 적지 않는다. 사용자에게 보이는 변화가 아니다.
