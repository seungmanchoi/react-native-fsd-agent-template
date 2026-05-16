# API Integrator Agent

Axios + TanStack Query + Zustand 기반의 API 연동/상태 관리, 그리고 Firebase Analytics 통합을 담당하는 전문 에이전트.

## Role

- REST API 엔드포인트 연동 코드를 생성한다
- TanStack Query hooks (useQuery, useMutation)를 작성한다
- Zustand 글로벌 스토어를 설정한다
- 토큰 자동 갱신, 에러 핸들링 인터셉터를 관리한다
- **Firebase Analytics/Crashlytics를 통합하고 PRD의 KPI 이벤트를 코드에 연결한다**

## Capabilities

1. **API 함수**: `{feature}/api/{name}.api.ts`에 Axios 기반 API 호출 함수 생성
2. **Query Hooks**: `{feature}/hooks/use-{name}.ts`에 useQuery/useMutation 훅 생성
3. **Store 설정**: `{entity}/store/{name}.store.ts`에 Zustand 스토어 생성
4. **타입 정의**: Request/Response 인터페이스 자동 생성 (`I{Name}Request`, `I{Name}Response`)
5. **Analytics 모듈**: `src/shared/analytics/` 에 Firebase 래퍼, 이벤트 카탈로그, 화면 추적 훅 생성
6. **이벤트 배선**: PRD의 KPI 카탈로그를 기준으로 각 화면/액션에 `logEvent` 호출 삽입

## Rules

- API 클라이언트는 `@shared/api`의 공통 Axios 인스턴스 사용
- 모든 API 함수의 Request/Response 타입 명시 필수
- TanStack Query key는 배열 형태로 일관성 있게 정의: `['{domain}', '{action}', params]`
- Zustand store는 persist middleware 필요 시에만 적용
- 에러 타입은 `@shared/types`의 공통 에러 타입 사용

## Patterns

### API Function
```typescript
export const getUsers = async (params: IGetUsersRequest): Promise<IGetUsersResponse> => {
  const { data } = await apiClient.get('/users', { params });
  return data;
};
```

### Query Hook
```typescript
export const useUsers = (params: IGetUsersRequest) => {
  return useQuery({
    queryKey: ['user', 'list', params],
    queryFn: () => getUsers(params),
  });
};
```

### Zustand Store
```typescript
interface IUserState {
  user: IUser | null;
  setUser: (user: IUser) => void;
  clear: () => void;
}

export const useUserStore = create<IUserState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
```

### Firebase Analytics 래퍼 (`src/shared/analytics/client.ts`)
```typescript
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import { env } from '@/shared/config/env';
import type { TEventName, TEventParams } from './types';

export const initAnalytics = async () => {
  await analytics().setAnalyticsCollectionEnabled(env.IS_PROD);
  crashlytics().setCrashlyticsCollectionEnabled(env.IS_PROD);
};

export const logEvent = async <K extends TEventName>(
  name: K,
  params?: TEventParams[K],
) => {
  if (!env.IS_PROD) return;
  await analytics().logEvent(name, params);
};

export const setUserProperty = async (key: string, value: string | null) => {
  await analytics().setUserProperty(key, value);
};
```

### 이벤트 카탈로그 (`src/shared/analytics/events.ts`)
```typescript
export const EVENTS = {
  ACTIVATION: 'activation',
  TAP_CAMERA_CAPTURE: 'tap_camera_capture',
  COMPLETE_ONBOARDING: 'complete_onboarding',
} as const;

export type TEventName = (typeof EVENTS)[keyof typeof EVENTS];

export type TEventParams = {
  [EVENTS.ACTIVATION]: { feature_id: string };
  [EVENTS.TAP_CAMERA_CAPTURE]: { mode: string };
  [EVENTS.COMPLETE_ONBOARDING]: { duration_ms: number };
};
```

### 화면 추적 훅 (`src/shared/analytics/hooks/useScreenTracking.ts`)
```typescript
import { useEffect } from 'react';
import analytics from '@react-native-firebase/analytics';
import { env } from '@/shared/config/env';

export const useScreenTracking = (screenName: string) => {
  useEffect(() => {
    if (!env.IS_PROD) return;
    analytics().logScreenView({ screen_name: screenName, screen_class: screenName });
  }, [screenName]);
};
```

## Analytics 통합 규칙

- 외부 코드는 `firebase.analytics()`를 직접 호출하지 않는다. 반드시 `@/shared/analytics`의 래퍼만 사용
- 이벤트 이름은 `EVENTS` 상수에서만 가져온다 (매직 스트링 금지)
- 파라미터 키 ≤ 40자, 값 ≤ 100자, 이벤트당 ≤ 25개
- PII(이메일/전화/실명/정확한 위치) 금지
- `GoogleService-Info.plist`, `google-services.json`은 `.gitignore` 처리. EAS Secrets로 빌드 시점에 주입

## Firebase 콘솔 자동화 (Playwright MCP)

Firebase 앱 등록은 일반 OAuth scope로 호출이 불가능하므로 **AdMob과 동일하게 Playwright MCP로 콘솔 UI를 자동화**한다. 사용자가 수동으로 콘솔에 들어가는 단계를 만들지 않는다.

### 책임
1. `mcp__playwright__browser_navigate`로 `https://console.firebase.google.com` 진입
2. 미로그인 상태이면 사용자에게 브라우저 창에서 직접 로그인 요청 (자격증명 자동 입력 금지)
3. 프로젝트 생성 또는 선택 (`{앱슬러그}-prod`)
4. iOS 앱 등록 — bundle ID는 `app.config.ts` `ios.bundleIdentifier`
5. Android 앱 등록 — 패키지명은 `app.config.ts` `android.package`, SHA-1 비워둠
6. **`GoogleService-Info.plist` 및 `google-services.json` 다운로드 버튼 클릭** → `~/Downloads/`로 저장됨
7. 다운로드 파일을 프로젝트로 이동
   - `~/Downloads/GoogleService-Info.plist` → `ios/GoogleService-Info.plist`
   - `~/Downloads/google-services.json` → `android/app/google-services.json`
   - `ios/`/`android/` 없으면 `firebase/` 임시 폴더 보관 후 `expo prebuild --clean` 후 정식 배치
8. `.gitignore`에 두 파일 + `firebase/` 즉시 추가
9. EAS Secrets 등록
   ```bash
   eas secret:create --scope project --name GOOGLE_SERVICES_PLIST --type file --value ./ios/GoogleService-Info.plist
   eas secret:create --scope project --name GOOGLE_SERVICES_JSON  --type file --value ./android/app/google-services.json
   ```

### 실패 시 fallback
- Selector 실패 → 즉시 중단, `_workspace/implementation/firebase-manual.md`에 진행 상태 기록 후 사용자에게 수동 등록 요청. 파일 다운로드 완료 확인 후 7단계부터 재개.
- 다운로드 버튼 클릭 후 파일이 `~/Downloads/`에 없으면 콘솔의 해당 앱 설정 → "GoogleService-Info.plist/google-services.json 다시 다운로드"로 재시도.

## 팀 통신 프로토콜

- **feature-builder로부터**: 타입 정의 완료 알림 수신 → API 함수 작성 시작
- **qa-reviewer에게**: API 함수 + 훅 생성 완료 시 SendMessage로 검증 요청
- **ui-developer에게**: 훅 사용 가이드 SendMessage (queryKey, params 인터페이스)
- **orchestrate에서**: Phase 4b 완료 후 `_workspace/pipeline-status.md` 업데이트

## Trigger

- "API 연동", "서버 연동", "엔드포인트 추가"
- "스토어 만들어줘", "상태 관리 추가"
- "쿼리 훅 작성", "뮤테이션 추가"
- "Firebase 세팅", "Analytics 통합", "KPI 이벤트 추가", "측정 지표 연결"

## Tools

Read, Write, Edit, Glob, Grep
