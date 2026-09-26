# Deploy & Build Troubleshooting (on-demand reference)

배포(Phase 7 / `/store-deploy`)·빌드 단계에서만 필요한 절차/트러블슈팅 모음. CLAUDE.md(상시 컨텍스트)에서 분리해 on-demand로 참조한다. 항상 적용되는 규칙(빌드 순서, 앱 이름 일관성)은 CLAUDE.md "EAS Build & Deploy Rules"에 남아 있다.

> 전체 배포 파이프라인은 global `~/.claude/CLAUDE.md`의 `store-deploy` 스킬 규칙을 따른다.

## 빌드 아카이브 최적화 (.easignore)

EAS 클라우드 빌드 시 불필요한 파일이 업로드되면 아카이브 크기가 커지고 업로드 시간이 증가한다. `.easignore` 파일을 반드시 설정한다:

```
node_modules/
assets/store-screenshots/
assets/store-listing/
fastlane/
screenshots/
docs/
scripts/
build-output/
_workspace/
.claude/
plugins/
.git/
.idea/
.vscode/
.playwright-mcp/
.DS_Store
*.md
*.tsbuildinfo
```

## 앱 크기 최적화 체크리스트

배포 전 아래 항목을 확인한다:

| 항목 | 방법 | 효과 |
|------|------|------|
| 이미지 최적화 | PNG → WebP 변환, 해상도 적정화 | 에셋 크기 50%+ 감소 |
| 미사용 폰트 제거 | 사용하지 않는 `@expo-google-fonts/*` 삭제 | 폰트당 0.5-2MB 절감 |
| 미사용 의존성 제거 | `npm ls --all` 확인 후 미사용 패키지 삭제 | 번들 크기 감소 |
| Lottie 애니메이션 최적화 | 파일 크기 확인, 불필요한 레이어 제거 | 1-5MB 절감 가능 |
| 네이티브 디버그 심볼 | `eas.json`에서 production 프로필 확인 | 앱 크기 직접 영향 없음 |
| ProGuard/R8 (Android) | 자동 적용됨, 매핑 파일 경고 무시 가능 | 코드 크기 감소 |
| Bitcode (iOS) | Expo managed에서 자동 처리 | - |

## 배포 전 필수 준비 항목

| 항목 | 설명 |
|------|------|
| 개인정보처리방침 URL | GitHub Pages 등에 호스팅, 4개 언어 권장 |
| 앱 아이콘 | iOS: 1024x1024, Android: 512x512 (adaptive icon) |
| 스크린샷 | iOS: iPhone 6.7"/6.5", iPad 12.9". Android: 1080x1920 phone |
| 그래픽 이미지 (Android) | 1024x500 feature graphic |
| 스토어 메타데이터 | `fastlane/metadata/` 구조로 title, description, release notes 준비 |
| **릴리즈 노트** | **Android changelogs는 반드시 500 bytes 이내**. Google Play API 제한. iOS release_notes는 4000자까지 가능하지만, 동일 내용을 Android에도 사용하므로 **500 bytes 기준으로 작성** |
| 앱 버전 관리 | ASC/Play 기존 버전보다 높은 version 설정 필수 |
| `.easignore` 설정 | 빌드 아카이브에 불필요한 파일 제외 |
| **런타임 트리거 배선** | **게시 후엔 코드로만 수정 가능.** 빌드 직전 확인: `ux.store_review=true`면 평점 트리거(`maybeRequest`)가 가치-순간 화면 성공 콜백에 최소 1곳 배선됐는지 / 광고 사용 시 AdMob GDPR·IDFA 메시지 Published 여부 / KPI 이벤트 배선 여부. (시뮬레이터·dev·TestFlight에선 검증 불가 → 코드로만 판정) 상세: orchestrate Phase 7 Step 7.0 |
| **배포 게이트 (b) 항목** | 앱 이름 4곳 일치 / 권한↔사용설명 일치(미사용 권한 미선언) / 데이터 안전 라벨↔수집 SDK 일치 / IAP·구독 상품 콘솔 등록 / 미해결 HIGH QA 이슈 0 / app-ads.txt 게시 / Firebase 설정 주입(EAS file env 또는 로컬 `./firebase/`) / 제출 바이너리 `appEnv` = production. 상세: orchestrate Phase 7 Step 7.0 (b) |

## 네이티브 설정 변경 → 재빌드 무효화 (재검증 규칙)

`app.config.ts` · config plugin · 네이티브 의존성 · `infoPlist` · 권한 · 앱 이름(`withLocalizedAppName`) 등 **네이티브 레이어에 영향을 주는 변경은 JS 핫리로드로 반영되지 않는다.** 변경 후 반드시 재검증한다:

1. `npx expo prebuild --clean` (ios/android 재생성 — 이전 네이티브 산출물 폐기. SDK 57부터는 `prebuild`가 기본으로 clean하므로 `ios/`·`android/`를 손으로 고친 내용은 사라진다 — 네이티브 변경은 config plugin으로만 한다)
2. `npm run typecheck && npm run lint`
3. `eas build --local` 또는 development build로 1회 구동 검증

특히 `withLocalizedAppName`(홈화면 다국어 이름) · plugin 추가/제거 · 권한·Info.plist 문구 변경은 clean prebuild 없이는 **반영 안 된 채 빌드가 성공**해 출시 후에야 발견된다. 변경이 네이티브에 닿는지 애매하면 clean prebuild를 기본값으로 한다.

## Android 특수 고려사항

- **lintOptions/lint 구문**: AGP 8+ 에서 `lintOptions`는 `lint`로 변경됨. Expo config plugin 작성 시 주의
- **ACTIVITY_RECOGNITION 권한**: `expo-sensors` 사용 시 자동 포함됨. Play Console "건강 앱" 질문에서 용도 설명 필요
- **Draft App 제한**: 앱 설정 미완료 시 Google Play API(fastlane supply 포함) 커밋이 실패함. Play Console 웹에서 앱 설정을 먼저 완료해야 함
- **첫 번째 제출**: 게시 전(draft) 앱에는 Google Play API가 `releaseStatus: completed` 릴리스를 만들지 못한다. Expo 문서(2026-07)상 `eas submit`이 첫 내부 테스트 릴리스를 만들 수 있지만, draft 앱이면 `releaseStatus: "draft"`로 올리거나 Play Console 웹에서 첫 AAB를 수동 업로드한다 (`store-deploy` 스킬 절차 우선)

## iOS 특수 고려사항

- **ASC App ID**: `eas.json`의 `ascAppId`에 실제 App Store Connect 앱 ID 설정 필수 (기본값 변경)
- **버전 충돌**: ASC에 이미 높은 버전이 있으면 낮은 버전 업로드 불가. `app.config.ts`에서 버전 확인
- **ITSAppUsesNonExemptEncryption**: 암호화 미사용 시 `Info.plist`에 `false` 설정으로 수출 규정 팝업 스킵
- **비대화식 제출 (ASC API Key)**: `eas submit --non-interactive`로 자동 제출하려면 `eas.json`의 `submit.production.ios`에 `appleId` 외에 다음을 추가한다:
  ```json
  "ascApiKeyPath": "./fastlane/keys/AuthKey_XXXXXXXXXX.p8",
  "ascApiKeyId": "XXXXXXXXXX",
  "ascApiKeyIssuerId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  ```
  `appleId`만 설정된 상태에서는 앱 별 암호 입력을 요구하므로 CI/자동 파이프라인이 멈춘다.

## iOS 빌드 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `xcodebuild -showBuildSettings` 타임아웃 (fastlane 단계) | Apple Silicon + SPM 의존성(Firebase) 해석 시간 초과. 기본 3초 4회 retry로 부족 | 빌드 명령 앞에 `FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT=120 FASTLANE_XCODEBUILD_SETTINGS_RETRIES=8` 환경변수 설정 |
| "Multiple commands produce .../InfoPlist.strings" | `app.config.ts`의 `locales` 필드와 `withLocalizedAppName` plugin이 둘 다 PBXVariantGroup을 등록 | CLAUDE.md "앱 이름 일관성" 항목 참고. plugin은 `locales` 사용 시 자동으로 iOS 처리를 생략함. 각 언어 JSON에 `CFBundleDisplayName` 추가 |
| `eas submit` "You've already submitted this version" | 동일 `expo.version`이 이미 ASC에 업로드됨 (TestFlight도 동일 version+build 조합 거부) | `app.config.ts`의 `APP_VERSION` 패치(예: 1.0.2 → 1.0.3) 후 재빌드 |
| `pod install` 실패: "SPM + static linkage is not supported" | RN Firebase 26 기본 SPM 모드에 `useFrameworks: 'static'`을 단독으로 지정 | `expo-build-properties` → `ios.useFrameworks: 'dynamic'` (템플릿 기본). 정적이 꼭 필요하면 아래 opt-out |
| `Unable to read Google Service plist at path .../ios/GoogleService-Info.plist` ([CP-User] [RNFB] Crashlytics Configuration 단계) | RN Firebase 26.1~26.4.0의 SPM dSYM 업로드 스크립트가 `ios/<Target>/`가 아닌 `ios/` 루트에서 plist를 찾고, 실패하면 빌드를 중단 | 템플릿의 `patches/@react-native-firebase+crashlytics+26.4.0.patch`(upstream a2b7e578 + 비치명 처리, `postinstall: patch-package`)가 해결. 패치 적용 후 `pod install` 재실행. RNFB를 26.4.0보다 올리면 패치 삭제 |
| 앱이 iOS 27에서 제대로 뜨지 않음 (Xcode 27 / iOS 27 SDK 빌드) | UIScene 라이프사이클 미적용 | `expo-build-properties` → `ios.enableSceneSupport: true` (템플릿 기본, `expo@57.0.23+` 필요) |

### RN Firebase 26 iOS 링크 규칙 (SPM + dynamic frameworks)

RN Firebase 26.1+는 Firebase iOS SDK를 **Swift Package Manager**로 가져오고, SPM은 **dynamic frameworks가 필수**다. Expo SDK 57 / RN 0.86 / RNFB 26 / `react-native-google-mobile-ads` 17 조합은 Invertase 문서에서 dynamic으로 검증됐다.

```ts
// app.config.ts (템플릿 기본)
'@react-native-firebase/app',
'@react-native-firebase/crashlytics',
['expo-build-properties', { ios: { useFrameworks: 'dynamic', enableSceneSupport: true } }],
```

- Podfile을 고치는 커스텀 패치 플러그인(예전 `withRNFirebaseStaticBuild`, `RCT_USE_PREBUILT_RNCORE=0`, `use_modular_headers!`)을 쓰지 않는다 — RN 0.81 + static 시절 우회책이며 SDK 57에서는 필요 없다.
- `jsEngine: 'jsc'`를 쓰지 않는다. RN 0.81부터 iOS는 항상 Hermes이고, JSC 지정은 React Native DevTools만 막는다.
- **정적 링크 opt-out** (Firebase를 CocoaPods로 끌어오는 다른 라이브러리와 충돌할 때만): RNFB app plugin `['@react-native-firebase/app', { ios: { disableSPM: true } }]` + `useFrameworks: 'static'` + `forceStaticLinking`에 사용하는 **모든** RNFB pod(`RNFBApp`, `RNFBAnalytics`, `RNFBCrashlytics`, …).
- 로컬 검증: `npx expo prebuild --clean` → `cd ios && pod install` 로그에 `[react-native-firebase] ... Linking FirebaseCore directly into the app target (SPM)`가 보여야 한다.

**버전 고정 메모**
- `react-native-google-mobile-ads`는 **17.0.0 정확히 고정**. 17.1.0~17.2.0은 Expo config plugin 사용 시 Android Gradle 설정 단계에서 `Cannot get property 'googleMobileAdsJson'`로 실패한다 (invertase/react-native-google-mobile-ads#903). 수정 릴리스가 나오면 Android release 빌드로 확인 후 올린다.
- 툴체인: Xcode 26.4+ (RNFB는 26.2+), iOS 최소 16.4, Node 22.13+.

## Android 빌드 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `react-native-reanimated:buildCMakeRelWithDebInfo` 단계에서 `libworklets.so missing and no known rule to make it` | 로컬 `node_modules/react-native-{reanimated,worklets}/android/.cxx` 캐시가 이전 빌드의 절대 경로를 참조 | `cd android && ./gradlew --stop && cd ..` 후 `rm -rf android node_modules/react-native-reanimated/android/{.cxx,build} node_modules/react-native-worklets/android/{.cxx,build}` 실행. EAS가 prebuild를 다시 수행하면서 일관된 경로로 빌드함 |
| "Specified value for android.package is ignored because an android directory was detected" | 로컬에 `android/` 폴더가 이미 있음 (이전 prebuild 결과) | 의도한 동작이라면 무시. `app.config.ts`의 `android.package` 변경을 반영하려면 `android/` 삭제 후 재빌드 |
