# 광고 동의 시퀀스 / eCPM 최적화 (MANDATORY)

> 이 문서는 CLAUDE.md 에서 옮긴 상세 규칙이다. **Hard Threshold 표는 CLAUDE.md 가 정본**이며, 여기 없는 통과 기준은 CLAUDE.md 를 따른다.

**AdMob 광고를 통합하는 모든 앱은 표준 동의 시퀀스를 반드시 따른다.** 순서가 어긋나면 첫 광고 요청이 동의 정보 없이 발사되어 EU 트래픽이 사실상 non-personalized 로만 팔려 eCPM 이 떨어진다. iOS의 경우 ATT를 받지 못해 IDFA 기반 personalized 광고가 불가능해진다.

## 표준 스택

| 영역 | 패키지 | 비고 |
|------|--------|------|
| AdMob SDK | `react-native-google-mobile-ads` **17.0.0 (정확히 고정)** | `AdsConsent` UMP API 포함. v17은 RN 0.86+·New Arch 필수. 17.1.0~17.2.0은 Expo config plugin 사용 시 Android Gradle 설정이 깨진다(invertase/react-native-google-mobile-ads#903) — 수정 릴리스 전까지 `^`로 올리지 않는다 |
| iOS 추적 권한 | `expo-tracking-transparency` | `NSUserTrackingUsageDescription` 필수 |
| 표준 헬퍼 | `src/features/ads/lib/consent.ts` | `initializeAdsWithConsent()` export |

## 표준 시퀀스 (절대 변경 금지)

```
UMP (GDPR) consent
   ↓  (EU 사용자: 동의 폼 노출 / 비 EU: no-op)
iOS ATT prompt
   ↓  (Android: skip)
mobileAds().setRequestConfiguration(...)
   ↓
mobileAds().initialize()
```

**왜 이 순서인가:**
- UMP가 ATT보다 먼저 와야 → 사용자가 GDPR 동의를 거부하면 ATT 무관하게 personalized ad 불가. 두 다이얼로그가 자연스럽게 연이어 노출됨.
- `setRequestConfiguration`이 `initialize()` 전이어야 → SDK가 첫 요청부터 child-directed / max content rating을 반영.
- `initialize()`가 마지막이어야 → 위 모든 동의/설정이 freeze 된 상태로 첫 광고 요청 발사.

## 구현 위치 (FSD)

```
src/features/ads/
├── lib/
│   └── consent.ts                # initializeAdsWithConsent / showAdsConsentForm
├── hooks/                        # useInterstitialAd / useRewardedAd / useAppOpenAd
├── ui/AdBanner.tsx
└── index.ts                      # barrel — initializeAdsWithConsent, isAdsReady, onAdsReady, onAdConsentResult
```

루트 `_layout.tsx` 에서는 **`initializeAdsWithConsent()` 만 호출**한다 (`void` — 첫 렌더를 막지 않는다. UMP 폼/ATT는 첫 화면 위에 뜬다). 개별 `AdsConsent.*` API 를 직접 부르거나 `mobileAds().initialize()` 를 직접 호출하지 않는다. `initialize()`는 UMP가 `canRequestAds`를 허용할 때만 실행되며, **모든 광고 로드는 `useAdsReady()`/`isAdsReady()`(동의 + SDK 초기화 완료) 뒤에만** 시작한다 — 마운트만으로 `createForAdRequest`/`load()`를 부르지 않는다.

```tsx
// app/_layout.tsx
import { initializeAdsWithConsent } from '@features/ads';

useEffect(() => {
  void initializeAdsWithConsent();
}, []);
```

## AdMob 콘솔 사전 설정 (한 번)

UMP가 실제로 폼을 띄우려면 AdMob Console 의 메시지가 **게시(Publish)** 되어야 한다. 게시 안 된 상태면 `requestInfoUpdate()` 가 항상 `NOT_REQUIRED` 로 응답해 코드가 정상이어도 폼이 안 뜬다.

1. **GDPR message**: AdMob Console → Privacy & messaging → European regulations → 메시지 생성 → Publish
2. **IDFA message** (iOS 권장): Privacy & messaging → IDFA → 생성 → Publish (ATT alert 직전에 사전 설명 노출 가능)

배포 전에 두 메시지가 모두 Published 상태인지 확인한다.

> **GDPR/IDFA 메시지 게시 자동화 시퀀스**(앱별 개인정보처리방침 URL 입력, "광고 단위 배포" 마스터 스위치 native click, **"동의하지 않음" 드롭다운 → "사용 안함" 명시 선택**이라는 게시 버튼 활성화 trap 포함)는 `.claude/agents/api-integrator.md`의 "AdMob 콘솔 자동화" 섹션이 정본이다. 체크박스/스위치는 반드시 Playwright native click을 사용한다(JS click은 React/Angular state 미반영).

## 추적 권한 / Info.plist

`app.config.ts` 의 `infoPlist` 에 `NSUserTrackingUsageDescription` 을 명시한다. 동일 문구를 `expo-tracking-transparency` plugin 옵션과 `react-native-google-mobile-ads` plugin 의 `userTrackingUsageDescription` 옵션 양쪽에 모두 설정한다.

Android 는 ATT 없이도 `react-native-google-mobile-ads` 가 매니페스트에 `com.google.android.gms.permission.AD_ID` 를 자동 주입하므로 추가 설정 불필요.

## 사용자 추후 변경 (선택 — Privacy Options)

AdMob Console 에서 "Privacy Options" 가 REQUIRED 로 설정되어 있으면 앱 내 설정 화면에 "광고 개인정보 설정" 버튼을 노출하고, 클릭 시 `showAdsConsentForm()` 을 호출해 UMP 폼을 다시 띄운다. 노출 여부(`privacyOptionsRequired`)는 한 번 조회하지 말고 `onAdConsentResult()`로 구독한다 — 오프라인 첫 실행 뒤 포그라운드 재시도에서 값이 바뀐다(템플릿 `app/(tabs)/profile.tsx`).

## Analytics 기록 (강력 권장)

- `setUserProperty('ump_status', ...)` — `obtained` / `required` / `not_required` / `error`
- `setUserProperty('ump_can_request_ads', ...)` — `'true'` / `'false'`
- `setUserProperty('att_status', ...)` — `granted` / `denied` / `undetermined` / `restricted` / `not_applicable`

이 user property 가 있으면 Firebase / BigQuery 에서 동의 상태별 eCPM·노출률 코호트를 분리해 광고 전략 최적화에 활용 가능.

## eCPM 최적화 체크리스트

| 항목 | 임팩트 | 비고 |
|------|--------|------|
| UMP 시퀀스 적용 | EU 개인화 광고 가능 | 본 섹션의 표준 시퀀스 |
| `MaxAdContentRating.PG` | 광고 풀 확장 | `setRequestConfiguration` |
| Adaptive Banner | 기기 폭에 맞는 배너 | `BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER` (v17에서 `ANCHORED_ADAPTIVE_BANNER`는 deprecated) |
| App Open 광고 | 추가 수익 라인 | Cold start + warm resume |
| Rewarded 광고 다종 | 사용자 인게이지먼트 ↑ | revive / coins / continue / shuffle 등 |
| 광고 mediation (선택) | 입찰 경쟁 증가 | AppLovin MAX / IronSource 등 (트래픽이 충분할 때 검토) |

## ATT 프롬프트 문구 다국어 (iOS — 광고 앱 필수)

`infoPlist.NSUserTrackingUsageDescription` 한 줄만 넣으면 **모든 기기에서 그 언어 하나로만** 뜬다. 언어별 문구는 `ios/<Project>/{locale}.lproj/InfoPlist.strings`에 있어야 하고, 그 파일이 **Xcode `PBXVariantGroup`에 등록**돼야 번들에 들어간다. 둘 중 하나만 빠져도 조용히 영어로 폴백해 한국·일본 사용자 ATT 허용률이 떨어진다.

- 광고를 넣는 앱은 `plugins`에 `'./plugins/withLocalizedAttDescription'`을 **반드시 등록**한다. 배열 내 위치는 무관하다.
- 이 플러그인은 `withXcodeProject` mod 에서 동작한다. `withDangerousMod`로 옮기지 말 것 — `withLocalizedAppName`이 dangerous mod 에서 `InfoPlist.strings`를 통째로 덮어쓰는데, dangerous mod 는 **plugins 배열의 역순**으로 실행되어 순서 의존 버그가 생긴다. xcodeproj mod 는 항상 dangerous mod 이후라 안전하다.
- 등록 대상은 "앱 이름을 선언한 언어"가 아니라 **디스크의 모든 `.lproj`**다. `withLocalizedAppName`은 자기가 선언한 언어만 등록하므로, ATT 전용 언어를 이 플러그인이 합집합으로 채운다.
- 검증: `npx expo prebuild --platform ios --clean` 후
  ```bash
  cat ios/<Project>/ko.lproj/InfoPlist.strings   # CFBundleDisplayName + ATT 문구 둘 다 있어야 함
  grep -oE "[a-zA-Z-]+\.lproj/InfoPlist.strings" ios/<Project>.xcodeproj/project.pbxproj | sort -u | wc -l
  ```
  두 번째 값이 `ls -d ios/<Project>/*.lproj | wc -l`과 같아야 한다.

### 문구 내용 — 상투적이면 자동 반려된다 (CRITICAL)

Apple 자동 심사가 목적 문자열을 검사해 **일반적인 문구를 placeholder 로 판정하고 반려**한다.
실제 반려(poly-dash 1.0.10, 2026-08-06):

> the following purpose strings … include placeholder text or are otherwise insufficient:
> • NSUserTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you."

`withLocalizedAttDescription.js` 의 `DEFAULT_ATT_DESCRIPTIONS` 는 **형식 예시일 뿐 그대로 쓰면 안 된다.**
앱마다 아래 4가지를 모두 담아 새로 쓴다:

1. 무엇을 쓰는지 — 기기의 광고 식별자
2. 왜 쓰는지 — 광고 관련성 향상 + 설치 측정
3. **구체적인 예시** — "관련 없는 상품 대신 이 앱과 비슷한 앱·게임 광고를 보여준다"
4. 거부 시 결과 — "광고는 계속 표시되며 맞춤 광고가 아닐 뿐"

`app.config.ts` 만 고치는 것으로는 부족하다. **로케일 테이블도 같이** 고쳐야 `.lproj` 에 상투 문구가
실려 나가지 않는다. 문구에 아포스트로피(`device's`, `won't`)가 들어가므로 TS/JS 리터럴은
**큰따옴표로 감싼다** — 작은따옴표로 감싸면 파일이 깨진다.

검증:
```bash
grep -rn "deliver personalized ads to you" app.config.ts plugins/ app.json locales/ 2>/dev/null   # 결과 0건이어야 함
```

## 무효 트래픽 방지 / 계정 정지 방어 (MANDATORY — 상세는 에이전트 문서)

AdMob 계정 정지의 대부분은 무효 트래픽(개발자/테스터 클릭, 사용자 비정상 클릭)과 배치 정책 위반에서 발생한다. 상세 규칙은 아래 문서에 분산되어 있으며, 광고 통합 시 반드시 함께 적용한다:

| 영역 | 핵심 규칙 | 상세 위치 |
|------|----------|----------|
| 테스트 트래픽 격리 | 빌드 프로필별 광고 모드 + `testDeviceIdentifiers` 등록 | `.claude/agents/api-integrator.md` |
| 클릭/노출 방어 인프라 | 템플릿에 있음: 전면 광고 공유 쿨다운 · 인터스티셜 일일 cap · 지수 백오프 · 리워드 `EARNED_REWARD` 지급. PRD 광고 정책이 정할 때만: 배너 클릭 가드 · 리워드 일일 cap · 세션당 전면 광고 상한 · `tap_ad` 이벤트 | `.claude/agents/api-integrator.md` |
| 배치 규칙 | 화면당 배너 1개 · 터치 요소 이격 · 미로드 collapse · 숨김/가림 금지 · 리워드 opt-in | `.claude/agents/ui-developer.md` |
| 방어 정책 수치 | PRD "무효 트래픽 방어 정책" 표 | `.claude/agents/product-planner.md` |
| 검사 | 5d 체크리스트 + Hard Threshold / 광고 배치 검수 | `.claude/agents/qa-reviewer.md` / `app-inspector.md` |
| 계정 레벨 | app-ads.txt 게시 · 스토어 리스팅 연결 · 본인 클릭 금지 | `store-admob` 스킬 Step 7 |

## 에이전트 책임 분담

- **product-planner**: PRD 에 "광고 정책" 섹션 작성 — 어느 placement (banner/interstitial/rewarded/app-open)을 쓸지, 노출 빈도 제한, EU/non-EU 대상 여부
- **api-integrator**: `src/features/ads/lib/consent.ts` 구축, `_layout.tsx` 에서 `initializeAdsWithConsent()` 호출, `app.config.ts` 의 plugin/infoPlist 설정
- **ui-developer**: `AdBanner` / `useInterstitialAd` / `useRewardedAd` 컴포넌트 배치 — 핵심 액션 직전/진행 중 광고 금지
- **qa-reviewer**: Hard Threshold 검사 + 동의 시퀀스 위반 탐지
