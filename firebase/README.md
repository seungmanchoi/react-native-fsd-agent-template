# Firebase 설정 파일 위치

Firebase Analytics / Crashlytics를 사용하려면 아래 두 파일을 이 디렉토리에 배치한다. `app.config.ts`의 `googleServicesFile`이 이 경로를 읽고, `npx expo prebuild`가 네이티브 프로젝트로 복사한다 (`ios/`·`android/`에 직접 두지 않는다).

- iOS: `GoogleService-Info.plist`
  - Firebase Console → 프로젝트 설정 → iOS 앱(번들 ID) → 설정파일 다운로드
- Android: `google-services.json`
  - Firebase Console → 프로젝트 설정 → Android 앱(패키지명) → 설정파일 다운로드

두 파일은 `.gitignore`에 등록되어 있어 커밋되지 않는다. 앱 바이너리에 그대로 들어가는 공개 클라이언트 설정이라, EAS 빌드 업로드에서는 일부러 제외하지 않는다(`.easignore`).

## EAS 클라우드 빌드 (파일이 없는 깨끗한 체크아웃)

file 타입 EAS 환경변수로 주입한다. 이름은 `app.config.ts`가 읽는 두 개와 정확히 같아야 한다. `eas secret:*`은 deprecated다.

```bash
eas env:create --name GOOGLE_SERVICE_INFO_PLIST --type file --value ./firebase/GoogleService-Info.plist \
  --visibility secret --environment production --environment preview --environment development
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./firebase/google-services.json \
  --visibility secret --environment production --environment preview --environment development
```

로컬 빌드(fastlane / `eas build --local`)는 이 디렉토리의 파일을 그대로 쓴다.

## 왜 Firebase Analytics가 필요한가

Firebase Analytics를 통합하지 않으면 AdMob 광고가 audience signal 없이 non-personalized(NPA) 형태로만 노출되어 eCPM이 3~5배 낮아진다. AdMob과 Firebase Analytics를 함께 사용하는 것이 표준 권장 구성이다.

## 빌드 호환성 메모 (Expo SDK 57 / RN Firebase 26)

- RN Firebase 26은 Firebase iOS SDK를 **Swift Package Manager**로 가져오고, SPM은 **dynamic frameworks가 필수**다. 템플릿은 `expo-build-properties` → `ios.useFrameworks: 'dynamic'`을 쓴다. `'static'`만 단독으로 쓰면 `pod install`이 실패한다.
- 예전 SDK 54 시절의 `forceStaticLinking` / `GoogleUtilities` modular headers / `jsEngine: 'jsc'` 우회는 더 이상 필요 없고 쓰지 않는다 (iOS는 항상 Hermes).
- RN Firebase 26.4.0의 Crashlytics dSYM 업로드 스크립트는 SPM 모드에서 plist 경로를 잘못 찾아 **모든 iOS 빌드를 실패**시킨다. `patches/@react-native-firebase+crashlytics+26.4.0.patch`(upstream 수정 반영, `postinstall`에서 자동 적용)가 이를 막는다. RN Firebase를 26.4.0보다 올리면 패치를 지운다.
- 상세: `.claude/skills/orchestrate/references/deploy-build-troubleshooting.md` "RN Firebase 26 iOS 링크 규칙"

## 처음 한 번만 — Firebase Console 설정

1. https://console.firebase.google.com → 프로젝트 생성 (또는 기존 프로젝트 선택)
2. iOS 앱 추가 → 번들 ID 입력 (`app.config.ts`의 `bundleIdentifier`와 동일하게, `com.seungmanchoi.{slug}`)
3. `GoogleService-Info.plist` 다운로드 → 이 디렉토리에 배치
4. Android 앱 추가 → 패키지명 입력 (`app.config.ts`의 `android.package`와 동일하게)
5. `google-services.json` 다운로드 → 이 디렉토리에 배치
6. AdMob ↔ Firebase 연동: AdMob Console → 앱 → 앱 설정 → 연결된 Firebase 앱 → 연결
