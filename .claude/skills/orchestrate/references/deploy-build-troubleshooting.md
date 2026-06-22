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
| **배포 게이트 (b) 항목** | 앱 이름 4곳 일치 / 권한↔사용설명 일치(미사용 권한 미선언) / 데이터 안전 라벨↔수집 SDK 일치 / IAP·구독 상품 콘솔 등록 / 미해결 HIGH QA 이슈 0 / app-ads.txt 게시 / EAS Secrets 주입. 상세: orchestrate Phase 7 Step 7.0 (b) |

## 네이티브 설정 변경 → 재빌드 무효화 (재검증 규칙)

`app.config.ts` · config plugin · 네이티브 의존성 · `infoPlist` · 권한 · 앱 이름(`withLocalizedAppName`) 등 **네이티브 레이어에 영향을 주는 변경은 JS 핫리로드로 반영되지 않는다.** 변경 후 반드시 재검증한다:

1. `npx expo prebuild --clean` (ios/android 재생성 — 이전 네이티브 산출물 폐기)
2. `npm run typecheck && npm run lint`
3. `eas build --local` 또는 development build로 1회 구동 검증

특히 `withLocalizedAppName`(홈화면 다국어 이름) · plugin 추가/제거 · 권한·Info.plist 문구 변경은 clean prebuild 없이는 **반영 안 된 채 빌드가 성공**해 출시 후에야 발견된다. 변경이 네이티브에 닿는지 애매하면 clean prebuild를 기본값으로 한다.

## Android 특수 고려사항

- **lintOptions/lint 구문**: AGP 8+ 에서 `lintOptions`는 `lint`로 변경됨. Expo config plugin 작성 시 주의
- **ACTIVITY_RECOGNITION 권한**: `expo-sensors` 사용 시 자동 포함됨. Play Console "건강 앱" 질문에서 용도 설명 필요
- **Draft App 제한**: 앱 설정 미완료 시 Google Play API(fastlane supply 포함) 커밋이 실패함. Play Console 웹에서 앱 설정을 먼저 완료해야 함
- **첫 번째 제출**: EAS Submit / fastlane이 아닌 Play Console 웹에서 수동으로 첫 AAB 업로드 필요

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
| `xcodebuild -showBuildSettings` 타임아웃 (fastlane 단계) | Apple Silicon + RN 0.81 + SPM 의존성 해석 시간 초과. 기본 3초 4회 retry로 부족 | 빌드 명령 앞에 `FASTLANE_XCODEBUILD_SETTINGS_TIMEOUT=120 FASTLANE_XCODEBUILD_SETTINGS_RETRIES=8` 환경변수 설정 |
| "Multiple commands produce .../InfoPlist.strings" | `app.config.ts`의 `locales` 필드와 `withLocalizedAppName` plugin이 둘 다 PBXVariantGroup을 등록 | CLAUDE.md "앱 이름 일관성" 항목 참고. plugin은 `locales` 사용 시 자동으로 iOS 처리를 생략함. 각 언어 JSON에 `CFBundleDisplayName` 추가 |
| `eas submit` "You've already submitted this version" | 동일 `expo.version`이 이미 ASC에 업로드됨 (TestFlight도 동일 version+build 조합 거부) | `app.config.ts`의 `APP_VERSION` 패치(예: 1.0.2 → 1.0.3) 후 재빌드 |
| `non-modular-include-in-framework-module` / `RCT_EXPORT_METHOD ... type specifier missing` / `fmt::basic_format_string ... call to consteval function is not a constant expression` | RNFirebase + RN 0.81 + New Architecture + `useFrameworks: 'static'` 조합 비호환. 자세한 원인은 아래 참고 | `./plugins/withRNFirebaseStaticBuild` plugin을 `app.config.ts`의 `plugins`에 추가 + `npx expo prebuild --clean` |

### RN Firebase 통합 시 빌드 실패 (RN 0.81 + new arch + static frameworks)

**RNFirebase + RN 0.81 + New Architecture + `useFrameworks: 'static'`** 4개 조건이 동시에 켜지면 iOS 빌드가 다음 순서로 3가지 에러를 차례로 뱉는다. **모두 정상이며, 템플릿에 포함된 `plugins/withRNFirebaseStaticBuild.js`를 활성화하면 한 번에 해결된다.**

1. **`-Wnon-modular-include-in-framework-module`**
   - RNFirebase 헤더(예: `RCTConvert+FIRApp.h`)가 React-Core 헤더(`<React/RCTConvert.h>`)를 non-modular import. static framework 모드에서는 Clang module system이 거부.
   - 패치: Podfile에 `use_modular_headers!` 주입 + post_install에서 `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES` 강제.

2. **`RCT_EXPORT_METHOD ... type specifier missing, defaults to 'int'`**
   - RN 0.81 + new arch에서 React-Core가 **prebuilt binary**로 제공되는데, prebuilt 모듈은 preprocessor 매크로(`RCT_EXPORT_METHOD` 등)를 module map으로 export하지 않는다. RNFirebase의 ObjC 모듈(`RNFBAnalyticsModule.m`, `RNFBCrashlyticsModule.m`)이 매크로 expand에 실패해서 syntax error.
   - 패치: Podfile 최상단에 `ENV['RCT_USE_PREBUILT_RNCORE'] = '0'` 설정 → React-Core 소스 빌드 (빌드 시간 +5분 정도 증가하지만 매크로 정상 동작).

3. **`fmt::basic_format_string ... call to consteval function is not a constant expression`**
   - React-Core를 소스 빌드하면 fmt 11이 의존성으로 끌려 들어오는데, fmt 11은 `__cpp_consteval` 또는 `FMT_CLANG_VERSION >= 1101` 분기에서 `FMT_USE_CONSTEVAL=1`로 활성화. Apple Clang 16의 더 엄격한 consteval 평가가 fmt 자체의 format string을 거부.
   - 패치: post_install에서 `Pods/fmt/include/fmt/base.h`의 모든 `#  define FMT_USE_CONSTEVAL 1` 라인을 `0`으로 rewrite.

**참조 구현**: `plugins/withRNFirebaseStaticBuild.js` — 위 3개 패치를 모두 포함하며 idempotent. `app.config.ts`의 `plugins`에 `'./plugins/withRNFirebaseStaticBuild'`를 추가하고 `npx expo prebuild --clean`만 실행하면 자동 적용.

**RN Firebase 버전 권장**: RN 0.81 + New Arch에서는 **`@react-native-firebase/* >= 24.0.0`**을 사용한다. 21.x는 ObjC RCT 매크로 호환성이 약하다.

## Android 빌드 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `react-native-reanimated:buildCMakeRelWithDebInfo` 단계에서 `libworklets.so missing and no known rule to make it` | 로컬 `node_modules/react-native-{reanimated,worklets}/android/.cxx` 캐시가 이전 빌드의 절대 경로를 참조 | `cd android && ./gradlew --stop && cd ..` 후 `rm -rf android node_modules/react-native-reanimated/android/{.cxx,build} node_modules/react-native-worklets/android/{.cxx,build}` 실행. EAS가 prebuild를 다시 수행하면서 일관된 경로로 빌드함 |
| "Specified value for android.package is ignored because an android directory was detected" | 로컬에 `android/` 폴더가 이미 있음 (이전 prebuild 결과) | 의도한 동작이라면 무시. `app.config.ts`의 `android.package` 변경을 반영하려면 `android/` 삭제 후 재빌드 |
