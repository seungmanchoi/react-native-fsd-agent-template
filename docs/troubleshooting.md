# Troubleshooting Guide

React Native + Expo 프로젝트에서 자주 발생하는 문제와 해결 방법을 정리한 문서.

---

## 실기기 빌드 문제

### "No script URL provided" 오류

**증상**: `npx expo run:ios --device`로 실기기에 빌드 후 앱 실행 시 다음 오류 발생:

```
No script URL provided. Make sure the packager is running
or you have embedded a JS bundle in your application bundle.
```

시뮬레이터에서는 정상 동작하지만 실기기에서만 발생.

**원인 분석**:

앱이 실기기에서 실행될 때 Metro 번들러에 연결하는 과정:

1. Xcode 빌드 시 `react-native-xcode.sh`가 Mac의 IP를 `ip.txt`에 기록
2. 앱 시작 시 `RCTBundleURLProvider`가 `ip.txt`에서 IP를 읽음
3. `isPackagerRunning` 메서드로 `http://{ip}:8081/status`에 HTTP 요청
4. 응답이 `packager-status:running`이면 Metro URL 반환
5. 실패하면 `nil` 반환 → "No script URL provided" 오류

**주요 원인과 해결 방법**:

#### 1. 네이티브 플러그인 설정 변경 후 잔여 빌드 아티팩트

`expo-build-properties`의 `useFrameworks: 'static'` 같은 네이티브 플러그인 설정을 변경한 후,
`app.config.ts`에서 제거해도 `ios/` 디렉토리에 이전 설정의 캐시가 남아 문제를 일으킬 수 있다.

**해결**:

```bash
rm -rf ios/
npx expo prebuild --platform ios --clean
npx expo run:ios --device
```

#### 2. expo-build-properties의 useFrameworks: 'static'

`useFrameworks: 'static'`은 CocoaPods 의존성을 static framework로 링킹한다.
이 설정이 네이티브 모듈 초기화 순서에 영향을 줘서 Metro 연결 체크가 실패할 수 있다.

특별한 이유가 없다면 이 설정을 사용하지 않는 것을 권장.

```typescript
// app.config.ts - 이 설정이 문제를 일으킬 수 있음
plugins: [
  ['expo-build-properties', {
    ios: { useFrameworks: 'static' }  // 주의!
  }]
]
```

#### 3. 패키지 버전 불일치

Expo SDK 버전과 호환되지 않는 패키지 버전이 빌드 문제를 일으킬 수 있다.

```bash
# 호환성 체크
npx expo install --check

# 자동 수정
npx expo install --fix
```

예시: Expo SDK 54에서 `expo-localization`은 `~17.0.8`이어야 하는데 `^55.0.8`로 설치된 경우.

---

### 시뮬레이터 vs 실기기 차이점

| 항목 | 시뮬레이터 | 실기기 |
|------|-----------|--------|
| Metro 연결 | `localhost` 사용 | `ip.txt`의 IP 사용 |
| JS 번들링 | Metro에서 직접 로드 | Metro에서 IP 기반 로드 |
| ip.txt 생성 | 생성 안 됨 | Xcode 빌드 시 생성 |
| 네트워크 | 로컬 네트워크 불필요 | 같은 WiFi 네트워크 필요 |

---

### Expo Go vs Development Build

QR 코드 스캔으로 Expo Go에서 실행하면 커스텀 네이티브 모듈을 사용할 수 없다.

**Expo Go에서 지원 안 되는 패키지 예시**:
- `react-native-compressor`
- `react-native-google-mobile-ads`
- 기타 커스텀 네이티브 모듈

이런 패키지를 사용하는 프로젝트는 반드시 `npx expo run:ios --device`로 Development Build를 해야 한다.

---

## iOS 빌드 설정

### NSAppTransportSecurity

개발 환경에서 로컬 네트워크 접근을 위해 `app.config.ts`에 ATS 설정 추가:

```typescript
ios: {
  infoPlist: {
    NSAppTransportSecurity: {
      NSAllowsArbitraryLoads: true,
      NSAllowsLocalNetworking: true,
    },
  },
},
```

> 참고: 실제로 이 설정 없이도 실기기 Metro 연결이 되는 경우가 있다 (calc-vault 프로젝트에서 확인).
> 하지만 안전을 위해 개발 환경에서는 추가하는 것을 권장.

### ITSAppUsesNonExemptEncryption

앱이 암호화를 사용하지 않는 경우 (대부분의 일반 앱), 이 값을 `false`로 설정하면
TestFlight 업로드 시 암호화 관련 질문을 건너뛸 수 있다:

```typescript
ios: {
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false,
  },
},
```

---

## 클린 빌드 가이드

문제가 발생했을 때 단계별로 시도할 클린 빌드 방법:

### Level 1: Metro 캐시 클리어

```bash
npx expo start --clear
```

### Level 2: node_modules 재설치

```bash
rm -rf node_modules
npm install
```

### Level 3: iOS 프로젝트 클린 재생성

```bash
rm -rf ios/
npx expo prebuild --platform ios --clean
npx expo run:ios --device
```

### Level 4: 전체 클린

```bash
rm -rf node_modules ios/ android/ .expo/
npm install
npx expo prebuild --clean
npx expo run:ios --device
```

> Level 3이 대부분의 네이티브 관련 문제를 해결한다. 네이티브 플러그인 설정 변경 후에는 Level 3을 기본으로 수행하는 것을 권장.

---

## AdMob (react-native-google-mobile-ads) 설정

### app.json에 AdMob 설정 추가

`react-native-google-mobile-ads`의 Xcode 빌드 스크립트는 `app.json`에서 직접 설정을 읽는다.
`app.config.ts`의 플러그인 설정과 별도로, `app.json` 루트에 다음을 추가하는 것을 권장:

```json
{
  "expo": { ... },
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-xxxx~yyyy",
    "ios_app_id": "ca-app-pub-xxxx~zzzz"
  }
}
```

### app.config.ts 플러그인 설정

```typescript
plugins: [
  [
    'react-native-google-mobile-ads',
    {
      iosAppId: 'ca-app-pub-xxxx~zzzz',
      androidAppId: 'ca-app-pub-xxxx~yyyy',
      delayAppMeasurementInit: true,
      userTrackingUsageDescription:
        'This identifier will be used to deliver personalized ads to you.',
    },
  ],
  'expo-tracking-transparency',
],
```

---

## 디버깅 팁

### Metro 연결 확인

실기기에서 Metro 연결 문제가 있을 때:

1. Mac과 iPhone이 같은 WiFi 네트워크에 연결되어 있는지 확인
2. Mac의 IP 확인: `ifconfig en0 | grep inet`
3. iPhone Safari에서 `http://{Mac IP}:8081/status` 접속하여 "packager-status:running" 확인
4. 방화벽이 8081 포트를 차단하고 있지 않은지 확인

### 빌드 모드 확인

```bash
# Debug 모드 (기본값) - Metro에서 JS 로드
npx expo run:ios --device

# Release 모드 - JS 번들 임베딩
npx expo run:ios --device --configuration Release
```

`npx expo run:ios --device`는 기본적으로 Debug 모드로 빌드된다.
