# EAS Build & Deploy Rules (MANDATORY)

> 이 문서는 CLAUDE.md 에서 옮긴 상세 규칙이다. **Hard Threshold 표는 CLAUDE.md 가 정본**이며, 여기 없는 통과 기준은 CLAUDE.md 를 따른다.

## 빌드와 제출

프로덕션 빌드는 **로컬이 기본**이다. 절차는 `store-deploy` 플러그인의 store-build·store-submit 스킬을 따른다.

1. **빌드**: `eas build --local` 로 `build-output/` 에 산출물을 만든다. EAS 프로젝트가 없는 앱은 그 앱의 fastlane lane 으로 빌드한다
2. **제출**: 로컬 산출물을 `eas submit --path <파일>` 로 올린다. EAS 프로젝트가 없는 앱은 fastlane 업로드 lane 을 쓴다
3. **클라우드 EAS Build** (`eas build`) 는 사용자가 요청하거나 로컬 빌드가 안 될 때만 쓴다
4. 제출 전 산출물의 version, buildNumber/versionCode, bundle id 와 `extra.appEnv`(아래)를 확인한다

### 제출 전 반려 위험 검사 (app-store-compliance)

프로덕션 빌드 전에 `npm run check:store` 를 돌린다. [app-store-compliance](https://github.com/mjmirza/app-store-compliance) guard 가 Apple·Google 반려 패턴(개인정보 매니페스트, 계정 삭제, 권한 문구, 결제, 스테이징 주소 등)으로 이 앱을 검사한다.

- 플레이북이 `~/repositories/app-store-compliance`(`ASC_HOME` 로 바꿀 수 있음)에 없으면 처음 실행할 때 받는다. 갱신은 `git -C ~/repositories/app-store-compliance pull`. 규칙이 60일 넘게 묵으면 결과 맨 위에 `Rule pack STALE` 이 뜬다
- 없는 플랫폼만 `expo prebuild --no-install --platform <ios|android>` 로 만든 뒤 검사한다(둘 다 gitignore). `app.config.ts` 를 바꾼 뒤에는 `npm run check:store -- --fresh`(전체 clean prebuild 라 `ios/Pods` 도 지운다)
- 앱에 들어가는 파일만 임시 사본으로 떼어 검사한다. gitignore 된 경로(`ios/`·`android/` 만 예외), 점 폴더(`.claude`·`.codex`·`.playwright-mcp`), 루트 `*.yml`(Playwright 캡처), `docs`, 테스트, `build-output` 은 빼고, `eas.json` 은 production 프로필(과 그 `extends`)만, `package.json` 은 `scripts` 를 뺀다. 하네스 문서(계정 삭제 없음)·개발용 `expo start --localhost`(스테이징 주소) 오탐과 Xcode 캐시로 10분 넘던 검사를 막는다
- 앱 `PrivacyInfo.xcprivacy` 는 RN 이 `pod install` 때 pod 매니페스트를 모아 만든다(`privacy_file_aggregation`). `ios/` 에 아직 없으면 사본에서 `pod install` 을 돌려 빌드와 같은 파일로 검사한다(Pods 는 사본과 함께 지워진다, 첫 실행 1분 안팎). 그래서 `app.config.ts` 에 `privacyManifests` 를 따로 적지 않는다
- 결과가 `BLOCKED`(critical) 이면 빌드·제출하지 않는다. 고치거나, 오탐이면 파일·줄을 근거로 사용자에게 확인받는다. `APP_STORE_GUARD_OK=1` 우회는 사용자가 허락할 때만 쓴다
- `CLEAR` 는 승인 보장이 아니다. 데모 계정·스토어 콘솔 답변 같은 코드 밖 항목은 guard 가 출력하는 체크리스트로 따로 확인한다
- 플레이북의 `install.sh` 가 넣는 전역 PreToolUse hook 은 쓰지 않는다. `expo run:ios`·`expo prebuild`·개발용 `eas build` 까지 막고, 사본 없이 앱 폴더 전체를 읽어 위 오탐이 그대로 critical 이 된다. 에이전트용 감사(`/app-store-audit`)만 원하면 `install.sh` 뒤 각 도구 설정에서 hook 항목만 지운다

## 빌드 아카이브·앱 크기 최적화

`.easignore`(빌드 아카이브 제외 목록)와 앱 크기 최적화 체크리스트(이미지 WebP · 미사용 폰트/의존성 제거 · Lottie 최적화 등)는 `.claude/skills/orchestrate/references/deploy-build-troubleshooting.md` 참고.

## 빌드 환경 (APP_ENV) — 광고 ID·Analytics 분기 (CRITICAL)

`src/shared/config/env.ts`의 `IS_DEV` / `IS_PROD`는 `APP_ENV`(`development` | `preview` | `production`)로 결정되고, 실광고 ID(`AdUnitIds`)와 Analytics/Crashlytics 수집이 `IS_PROD`를 따른다.

- **EAS 빌드**: `eas.json` 프로필의 `env.APP_ENV` + `environment`로 지정한다.
- **APP_ENV가 없는 빌드**(로컬 fastlane/xcodebuild/gradle release): release 번들은 `production`, dev 번들은 `development`로 자동 판정된다(`__DEV__` 기준).
- 개발용 npm 스크립트(`start*`, `ios`, `android`, `build:*`)는 `APP_ENV=development`를 붙여 둔다 — `expo start --no-dev`나 기기 release 실행이 실광고·Analytics로 새지 않게. fallback은 fastlane 같은 스토어 빌드 경로에서만 쓰인다.
- 로컬 fastlane lane은 `eas.json` 프로필 env를 읽지 않는다 — `API_URL` 등 프로필 값을 lane에서 export한다 (안 하면 `app.config.ts` 기본값 localhost로 빌드된다).
- `.env`에 `APP_ENV`를 넣지 않는다 — `.env`는 로컬 release 빌드의 앱 설정에도 로드된다.
- 앱 환경 구분에 `NODE_ENV`를 쓰지 않는다. 과거 템플릿의 `NODE_ENV` 방식은 로컬 fastlane 빌드에 `nodeEnv: "development"`가 박혀 **스토어 빌드가 테스트 광고 ID로 출시**됐다.
- 검증: `unzip -p build-output/*.ipa 'Payload/*.app/EXConstants.bundle/app.config' | grep -o '"appEnv":"[a-z]*"'` → 출력이 없거나(`production`으로 판정) `"appEnv":"production"`이어야 한다.

## 앱 이름 일관성 (MANDATORY)

스토어에 표시되는 앱 이름과 기기 홈 화면에 표시되는 앱 이름을 반드시 일치시킨다.

| 항목 | 설정 위치 | 설명 |
|------|----------|------|
| 홈 화면 이름 | `app.config.ts` → `withLocalizedAppName` plugin | 기기 언어별 앱 이름 |
| iOS 스토어 이름 | `fastlane/metadata/ios/{lang}/name.txt` | ASC에 표시되는 이름 |
| Android 스토어 이름 | `fastlane/metadata/android/{lang}/title.txt` | Play Store에 표시되는 이름 |
| 기본 이름 | `app.config.ts` → `name` | 홈 화면 기본 언어 이름과 동일해야 함 |

**규칙:**
- 위 4곳의 앱 이름이 언어별로 모두 동일해야 한다
- 앱 이름 변경 시 4곳 모두 동시에 변경한다
- 홈 화면 이름은 길면 잘리므로 30자 이내로 설정 (스토어 이름 제한과 동일)
- `withLocalizedAppName` plugin (`plugins/withLocalizedAppName.js`)은 prebuild 시 iOS `InfoPlist.strings`와 Android `values-{locale}/strings.xml`을 자동 생성
- plugin이 Xcode 프로젝트의 `PBXVariantGroup`에 파일을 등록해야 빌드에 포함됨
- **`locales` 필드와 동시 사용 금지**: `app.config.ts`에 `locales: { ko: './...json' }`처럼 Expo의 locales 핸들러를 사용하면 plugin은 자동으로 iOS 처리를 생략한다. 이 경우 각 언어 JSON에 `CFBundleDisplayName` 키를 직접 추가해야 한다 (예: `{ "CFBundleDisplayName": "마이앱", "NSCameraUsageDescription": "..." }`). 두 방식이 동시에 동작하면 "Multiple commands produce InfoPlist.strings" 빌드 에러가 발생함

## 배포 전 준비 · 플랫폼 특수 고려 · 빌드 트러블슈팅

배포 전 필수 준비(개인정보처리방침/아이콘/스크린샷/메타데이터/**Android 릴리즈 노트 언어별 500자 제한**/버전 관리), Android·iOS 특수 고려(Draft App 첫 제출은 Play Console 웹 수동 업로드 · `eas.json` `ascAppId` · `ITSAppUsesNonExemptEncryption` · ASC API Key 비대화식 제출), iOS/Android 빌드 트러블슈팅(xcodebuild 타임아웃 · `InfoPlist.strings` 중복 · **RNFirebase 26 SPM + dynamic frameworks 링크 규칙** · AdMob 17 Android 빌드 버그 · reanimated `libworklets` 캐시 · SDK 57 `prebuild` 기본 clean)은 모두 `.claude/skills/orchestrate/references/deploy-build-troubleshooting.md` 로 이전했다. 배포 시 해당 문서 + `/store-deploy` 스킬을 따른다.

**Android 프로덕션 액세스 신청(개인 계정)**: 비공개 테스트 14일+/12명+ 게이트 충족 후 제출하는 "프로덕션 액세스 신청" 양식의 전체 질문·답변 작성 원칙(사실 기반·날조 금지·300자·worked example)은 `.claude/skills/orchestrate/references/play-production-access-application.md`가 정본이다. 신청서 작성은 `api-integrator`의 "Play Console 프로덕션 액세스 신청 자동화" 능력이 담당하며, 작성 시 반드시 이 문서를 참고한다.
