# Firebase 설정 파일 위치

Firebase Analytics를 사용하려면 아래 두 파일을 이 디렉토리에 배치한 뒤 EAS 빌드를 다시 실행한다.

- iOS: `GoogleService-Info.plist`
  - Firebase Console → 프로젝트 설정 → iOS 앱(번들 ID) → 설정파일 다운로드
- Android: `google-services.json`
  - Firebase Console → 프로젝트 설정 → Android 앱(패키지명) → 설정파일 다운로드

두 파일은 `.gitignore`에 등록되어 있어 커밋되지 않는다.

EAS 빌드 환경에서는 환경변수 `GOOGLE_SERVICE_INFO_PLIST` / `GOOGLE_SERVICES_JSON`로 경로를 오버라이드할 수 있다 (`eas secret` + `eas.json`의 `env.file` 조합).

## 왜 Firebase Analytics가 필요한가

Firebase Analytics를 통합하지 않으면 AdMob 광고가 audience signal 없이 non-personalized(NPA) 형태로만 노출되어 eCPM이 3~5배 낮아진다. AdMob과 Firebase Analytics를 함께 사용하는 것이 표준 권장 구성이다.

## 빌드 호환성 메모

`@react-native-firebase` + Expo SDK 54 + RN 0.81 + AdMob(`react-native-google-mobile-ads`) 조합은 iOS 빌드에서 "include of non-modular header inside framework module" 에러가 발생한다 (Expo issue #39607).

`app.config.ts`의 `expo-build-properties` 플러그인에 다음이 설정되어 있어야 한다:

```ts
ios: {
  useFrameworks: 'static',                              // AdMob 요구사항
  forceStaticLinking: ['RNFBApp', 'RNFBAnalytics'],     // 헤더 에러 회피
  extraPods: [{ name: 'GoogleUtilities', modular_headers: true }], // AdMob 공유 pod 호환
}
```

또한 iOS는 `jsEngine: 'jsc'`로 오버라이드한다 (Android는 Hermes 유지). Firebase pod의 Swift interop 호환성 확보용.

## 처음 한 번만 — Firebase Console 설정

1. https://console.firebase.google.com → 프로젝트 생성 (또는 기존 프로젝트 선택)
2. iOS 앱 추가 → 번들 ID 입력 (`app.config.ts`의 `bundleIdentifier`와 동일하게)
3. `GoogleService-Info.plist` 다운로드 → 이 디렉토리에 배치
4. Android 앱 추가 → 패키지명 입력 (`app.config.ts`의 `android.package`와 동일하게)
5. `google-services.json` 다운로드 → 이 디렉토리에 배치
6. AdMob ↔ Firebase 연동: AdMob Console → 앱 → 앱 설정 → 연결된 Firebase 앱 → 연결
