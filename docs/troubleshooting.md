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

`expo-build-properties`의 `useFrameworks` 같은 네이티브 플러그인 설정을 변경한 후,
`ios/` 디렉토리와 DerivedData에 이전 설정의 캐시가 남아 문제를 일으킬 수 있다.

**해결**:

```bash
rm -rf ios/
npx expo prebuild --platform ios --clean
npx expo run:ios --device
```

#### 2. expo-build-properties의 useFrameworks 값

템플릿은 `useFrameworks: 'dynamic'`을 쓴다. RN Firebase 26이 Firebase iOS SDK를 SPM으로 가져오며 SPM은 dynamic frameworks가 필수이기 때문이다.
`'static'`으로 바꾸지 않는다 — RNFB 기본 SPM 모드와 충돌해 `pod install`이 실패한다. 링크 방식을 바꾼 뒤에는 위 1번처럼 `ios/`를 지우고 clean prebuild 한다.

#### 3. 패키지 버전 불일치

Expo SDK 버전과 호환되지 않는 패키지 버전이 빌드 문제를 일으킬 수 있다.

```bash
# 호환성 체크
npx expo install --check

# 자동 수정
npx expo install --fix
```

예시: Expo SDK 57에서 `expo-router`는 `~57.0.23`이어야 하는데 다른 SDK 라인(`~6.0.x` 등)으로 설치된 경우. SDK 55부터 Expo 패키지 버전은 SDK 번호를 따른다.

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

### app.config.ts 플러그인 설정

이 템플릿은 `app.config.ts`를 Expo 설정의 단일 소스로 사용한다. `app.json`을 별도로 두면 앱 이름, bundle ID, AdMob 설정이 서로 어긋날 수 있으므로 새 설정은 `app.config.ts`에만 추가한다.

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
