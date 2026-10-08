# Phase 7 Step 7.0: 배포 전 재검증 게이트 — 상세 표

> orchestrate SKILL.md 에서 옮긴 상세 절차다. 해당 Phase 에 들어갈 때 이 문서를 Read 하고 그대로 따른다.

#### Step 7.0: 배포 전 재검증 게이트 (Pre-Deploy Gate)

**게시된 빌드에서만 동작하거나 출시 후 코드/콘솔로만 고칠 수 있는 것들**은, 빌드 직전에 "제대로·일관되게 됐는지"를 마지막으로 재확인한다. 시뮬레이터·dev·TestFlight에선 검증되지 않는 항목은 **코드·설정 상태로만 판정**한다. 하나라도 미통과면 Build/Submit 보류.

**(a) 런타임 트리거 배선** — 게시 후 코드로만 수정 가능

| 확인 항목 | 통과 기준 | 미통과 시 |
|----------|----------|----------|
| **스토어 리뷰 트리거** | `spec.md`의 `ux.store_review=true`이면, PRD Review Triggers에 매핑된 화면의 **긍정적 액션 성공 콜백(UI idle)**에 `maybeRequest(REVIEW_TRIGGERS.X)`가 **최소 1곳 이상** 실제 배선됨. (인앱 리뷰는 스토어 콘솔 사전 설정 불필요) | 한 곳도 없으면 평점 수집이 0 → `ui-developer`로 환원, 가치-순간 결정 후 배선 |
| 광고 동의/초기화 | `monetization.model`에 광고 포함 시 루트에서 `initializeAdsWithConsent()` 호출(렌더 비차단) + 모든 광고 로드가 `useAdsReady()` 경유 + AdMob Console GDPR/IDFA 메시지 **Published** | `api-integrator`로 환원 |
| Analytics KPI 배선 | 북극성/4축 커스텀 이벤트가 화면에 배선(`screen_view`는 루트 `_layout.tsx`가 자동 기록) | `api-integrator`/`ui-developer`로 환원 |
| **빌드 환경 (APP_ENV)** | 스토어 제출 바이너리의 `extra.appEnv`가 없거나 `production` (EAS: 프로필 `APP_ENV=production` / 로컬 fastlane: 미설정 → release 번들이 production으로 판정). `docs/rules/build-deploy.md` "빌드 환경 (APP_ENV)" 검증 명령 | `development`/`preview`면 테스트 광고로 출시됨 → 재빌드 |

**(b) 스토어·콘솔·일관성·시크릿** — 출시 후 수정이 번거롭거나 리젝/정책 위반을 유발

| 확인 항목 | 통과 기준 | 미통과 시 |
|----------|----------|----------|
| **앱 이름 4곳 일치** | `app.config.ts` `name` / `withLocalizedAppName` / iOS `name.txt` / Android `title.txt` 가 **언어별로 모두 동일**(30자 이내) | 불일치 → 4곳 동기화 (`prebuild --clean` 재빌드 필요) |
| **권한 ↔ 사용 설명 일치** | spec `permissions.*`에서 켠 권한마다 Info.plist 사용 설명 문구 존재 + **안 쓰는 권한은 미선언** | 누락/과선언 → 스토어 리젝 사유, `api-integrator`로 환원 |
| **데이터 안전 라벨 ↔ SDK** | 통합된 데이터 수집 SDK(Analytics/AdMob/Crashlytics)와 Play 데이터 안전 / Apple 개인정보 라벨이 **일치** | 불일치 → 정책 위반/리젝, store-forms로 보정 |
| **IAP/구독 상품 등록** (조건부) | `monetization.model`에 IAP/구독 포함 시 ASC/Play 콘솔에 상품 생성·승인됨 | 미등록 → 페이월 무동작(수익 0), 콘솔 등록 후 재확인 |
| **검증 green** | 배포할 커밋에서 `npm run verify` 통과 + Hard Threshold 위반 0 (사용자 승인으로 우회 불가) | 실패 → 배포 보류, 해당 에이전트로 환원 |
| **미해결 HIGH QA 이슈** | `_workspace/qa/unresolved.md`에 HIGH 미해결 이슈 **0건** (Phase 6 과 같다 — 승인으로 넘기지 않는다) | HIGH 잔존 → 배포 보류 |
| **런타임 검증 증거** | Phase 5b 가 시뮬레이터에서 핵심 흐름(happy path·뒤로가기·키보드·에러/빈 상태)을 `sim-use` 로 확인하고 플랫폼·기기·커밋·스크린샷을 `_workspace/qa/runtime/` 에 남김. 시뮬레이터를 못 띄웠으면 `BLOCKED` 로 기록되며 PASS 가 아니다 | `BLOCKED`/누락 → 사용자에게 알리고 실행 가능한 환경에서 재검증 |
| **app-ads.txt** (조건부) | 광고 사용 시 app-ads.txt 게시 + 스토어 리스팅에 도메인 연결 (store-admob Step 7) | 미게시 → 무효 트래픽 판정·수익 차단 |
| **Firebase 설정 주입** | `GoogleService-Info.plist`/`google-services.json` 평문 커밋 0. `./firebase/` 두 파일 존재 (로컬 빌드, `.easignore` 가 올리는 클라우드 빌드 모두). `firebase/` 를 아카이브에서 뺀 클라우드 빌드만 file 환경변수 `GOOGLE_SERVICE_INFO_PLIST`/`GOOGLE_SERVICES_JSON` 등록(`eas env:list`) | 누락 → prebuild 실패/런타임 Firebase 실패, 설정 후 재빌드 |

> **왜 배포 단계인가**: (a)는 "어느 화면의 어느 순간에 넣을지"가 UX 품질을 좌우하고(평점은 잘못 띄우면 ★1 폭격), (b)는 여러 곳에 흩어져 동기화가 깨지거나 콘솔/스토어 설정과 어긋나기 쉽다. 둘 다 **전체가 완성된 배포 직전**에 판단·확인이 가장 정확하고, 게시 후엔 즉시 못 고치므로 여기가 마지막 안전망이다. 모두 통과해야 Build/Submit 진행.

```
Tasks (/store-deploy):
0. (광고 앱) AdMob 앱·광고 단위: store-admob. --ad-types 에 spec monetization.ad_formats 를 넘긴다
   (앱 코드가 부르는 형식과 같아야 한다. 템플릿 기본은 app_open 포함)
1. 프로덕션 빌드 — 로컬이 기본 (eas build --local, EAS 프로젝트가 없는 앱은 fastlane).
   클라우드 EAS Build 는 사용자가 요청하거나 로컬 빌드가 안 될 때만
2. 스토어 메타데이터 생성
3. 스크린샷 생성
4. App Store / Google Play 제출 — 로컬 산출물은 eas submit --path <파일>,
   EAS 프로젝트가 없는 앱은 그 앱의 fastlane 업로드 lane
```

상세 절차: store-deploy 플러그인의 `store-deploy` 스킬 (Claude: `.claude/settings.json` 이 `seungmanchoi/store-deploy-plugin` 을 등록, Codex: `references/runtime-adapters.md` 의 설치 명령. 유지관리자 로컬 원본: `~/works/store-deploy-plugin/skills/store-deploy/SKILL.md`)
