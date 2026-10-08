# Secure Storage / 민감 데이터 저장 (MANDATORY)

> 이 문서는 CLAUDE.md 에서 옮긴 상세 규칙이다. **Hard Threshold 표는 CLAUDE.md 가 정본**이며, 여기 없는 통과 기준은 CLAUDE.md 를 따른다.

**`AsyncStorage`는 평문으로 저장되며 루팅/탈옥 기기에서 그대로 읽힌다.** 인증 토큰을 포함한 모든 민감 데이터는 iOS Keychain / Android Keystore-backed Encrypted Storage에 저장한다. 표준 도구는 `expo-secure-store` 이다.

## 저장 경계 — 무엇을 어디에

| 분류 | 예시 | 저장 위치 |
|------|------|----------|
| **민감 (반드시 SecureStore)** | access token, refresh token, OAuth/세션 토큰, API 비밀키, 결제 토큰/카드 정보, 사용자 비밀번호·PIN·생체 백업키, 프리미엄 라이선스 키, 사용자 식별 가능 정보(PII)와 결합된 토큰 | `expo-secure-store` |
| **준민감 (SecureStore 권장)** | 푸시 토큰, 디바이스 시크릿, 분석/측정용 user pseudo-id (재설치 후 복구 필요한 경우) | `expo-secure-store` |
| **비민감 (AsyncStorage/MMKV 허용)** | UI 테마, 언어, 마지막으로 본 화면, 온보딩 완료 플래그, 캐시된 비식별 콘텐츠, Zustand의 비민감 영역 | `@react-native-async-storage/async-storage` 또는 MMKV |

**금지 사항**
- 토큰을 Redux/Zustand persist를 통해 AsyncStorage에 저장 — persist는 **비민감 슬라이스만 대상**으로 한다
- 토큰을 `app.config.ts`의 `extra` 필드, `.env` 클라이언트 번들, 또는 평문 JSON으로 노출
- Console/Crashlytics/Analytics 로그에 토큰 또는 PII 출력 (`__DEV__`에서도 마스킹)

## 표준 스택

| 영역 | 패키지 | 비고 |
|------|--------|------|
| 암호화 저장 | `expo-secure-store` | iOS Keychain, Android Keystore + EncryptedSharedPreferences |
| 비민감 KV | `@react-native-async-storage/async-storage` 또는 `react-native-mmkv` | persist용 |
| 생체 인증 | `expo-local-authentication` (선택) | Keychain 접근 시 `requireAuthentication: true` |

설치:
```bash
npx expo install expo-secure-store
```

## 코드 통합 위치 (FSD)

템플릿 기본 구현은 **`src/shared/api/client.ts`의 `tokenManager`**가 담당한다 — expo-secure-store 직접 래퍼(`setTokens`/`getAccessToken`/`getRefreshToken`/`clearTokens`), 키는 `TOKEN_KEYS` 상수. Axios 인터셉터가 여기서 토큰을 읽는다.

토큰 외 시크릿(결제·라이선스·PII 결합 토큰 등)이 늘면 아래처럼 전용 모듈로 분리한다:

```
src/shared/secure-storage/
├── client.ts          # expo-secure-store 래퍼 (getItem/setItem/deleteItem/multiRemove)
├── keys.ts            # 저장 키 상수 (SECURE_KEYS.ACCESS_TOKEN 등)
├── types/index.ts     # ISecureStorageOptions, TSecureKey 등
└── index.ts           # barrel export
```

**분리 시 래퍼 코드는 `.claude/agents/api-integrator.md`의 "Secure Storage 래퍼" 섹션이 정본**이다. 분리해도 토큰은 `tokenManager` 에 둔다. 상시 규칙: `keychainAccessible = WHEN_UNLOCKED_THIS_DEVICE_ONLY`(iCloud 백업 차단), 키는 상수로만 정의한다.

## 토큰 저장소 통합 규칙

- 템플릿 기본: 토큰은 `src/shared/api/client.ts`의 `tokenManager`로 저장/조회하고, auth 훅(use-login/use-signup)은 `tokenManager.setTokens(...)`만 호출한다. 토큰을 Zustand store(`persist` 포함)에 두지 않는다.
- Axios 인터셉터(`src/shared/api/client.ts`)는 토큰을 메모리 또는 SecureStore에서 가져온다. **AsyncStorage 직접 조회 금지**.
- 토큰 만료/로그아웃 시 `tokenManager.clearTokens()`(시크릿이 여럿이면 `clearAllSecure()`)로 시크릿을 삭제하고, 같은 경로에서 `queryClient.clear()`로 이전 사용자의 쿼리 캐시를 비운다(템플릿: Profile Sign Out · `setAuthFailureCallback`).
- iOS 옵션: 기본은 `WHEN_UNLOCKED_THIS_DEVICE_ONLY` — 디바이스 잠금 해제 시에만 접근, 백업/iCloud 동기화 제외.
- Android: `expo-secure-store`가 자동으로 Keystore-backed `EncryptedSharedPreferences`를 사용. 별도 설정 불필요.

## 생체 인증 게이트 (선택)

결제·금융·헬스 데이터 등 고위험 토큰은 저장 시 `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` + `requireAuthentication: true` + `authenticationPrompt` 옵션으로 생체 인증을 강제한다 (코드 예시: api-integrator.md).
