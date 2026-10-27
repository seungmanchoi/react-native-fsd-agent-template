# 시뮬레이터 런타임 테스트 (sim-use) (MANDATORY)

> 이 문서는 CLAUDE.md 에서 옮긴 상세 규칙이다. **Hard Threshold 표는 CLAUDE.md 가 정본**이며, 여기 없는 통과 기준은 CLAUDE.md 를 따른다.

시뮬레이터/에뮬레이터에서 **앱을 실제로 실행해 화면·흐름을 검증**할 때는 [`sim-use`](https://github.com/lycorp-jp/sim-use) CLI를 사용한다. 접근성 트리를 토큰 효율적 아웃라인으로 바꿔 **좌표가 아닌 요소 별칭(`@N`)으로 observe → act → verify** 하는 도구다. `simctl` 좌표 탭·Playwright 등 다른 방법으로 시뮬레이터 UI를 직접 조작하지 않는다. 정적 코드 리뷰(qa-reviewer)와 별개인 **런타임 검증**용이다.

## 부트스트랩 — 체크 후 없으면 설치 (런타임 테스트 시작 전 1회)

시뮬레이터 런타임 테스트 직전 아래를 먼저 실행한다. 이미 설치돼 있으면 no-op:

```bash
if ! command -v sim-use >/dev/null 2>&1; then
  brew tap lycorp-jp/tap && brew install lycorp-jp/tap/sim-use
fi
```

- 요구: macOS 14+ / 최신 Xcode Command Line Tools. CLT가 outdated면 `brew install`이 실패하므로(예: macOS 26에 구 CLT), 시스템 설정 → 소프트웨어 업데이트에서 CLT를 갱신한 뒤 재시도한다.
- 설치 자체는 머신 로컬(Homebrew)이다. 스킬은 레포에 들어 있다(`.claude/skills/sim-use`, Codex 사본 `.agents/skills/sim-use`). 평소에는 `sim-use init` 을 하지 않는다.
- CLI 를 올린 뒤 스킬도 맞추려면 `sim-use init --client claude --dest .claude/skills` 후 `npm run sync:codex` 를 실행해 두 사본을 같이 커밋한다.

## 앱 띄우기 — 개발 서버는 이 맥에서만

Metro 는 켜 둔 동안 앱 JS 번들(코드·콘텐츠 전체)·이미지·설정을 인증 없이 내준다. 그래서 기본 명령은 127.0.0.1 에만 연다.

```bash
npm start            # 터미널 1: 127.0.0.1:8081 에 Metro
npm run ios          # 터미널 2: 빌드·설치 후 127.0.0.1:8081 로 앱을 연다 (android 도 같다)
```

- `npm run ios`·`android` 는 서버를 열지 않는다(`--no-bundler`). `expo run:*` 이 직접 여는 Metro 는 `--localhost` 를 받지 않아 모든 네트워크에 열리고, 127.0.0.1 서버가 떠 있어도 같은 포트에 하나 더 뜬다. 앱이 붙을 주소는 `REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1` 로 맞춘다.
- `start` 의 `--dns-result-order=ipv4first` 를 지우지 않는다. 없으면 Node 가 localhost 를 `::1` 로 풀어 Metro 가 IPv6 에만 열리는데, Expo 는 앱을 `127.0.0.1` 로 열어 접속이 안 된다.
- 다른 프로젝트가 8081 을 쓰고 있으면 `npm start` 가 다른 포트를 묻는다. 그때 `npm run ios` 가 연 앱은 8081 로 붙으니, `npm start` 터미널에서 `i`(Android 는 `a`)로 다시 연다.
- 실기기는 `npm run start:lan` 을 쓰고 끝나면 바로 끈다. 켜 둔 동안 같은 네트워크의 누구나 번들을 받을 수 있다.

## observe → act → verify 루프

```bash
sim-use ui                 # 관찰: 화면 요소 아웃라인 출력(@별칭 부여)
sim-use tap @9             # 조작: 별칭으로 탭
sim-use type "hello"       # 텍스트 입력
sim-use swipe @3 up        # 스와이프
sim-use ui                 # 검증: 결과 재확인
```

| 목적 | 명령 |
|------|------|
| 화면 관찰(요소 아웃라인) | `sim-use ui` |
| 탭 / 스와이프 / 입력 / 붙여넣기 | `sim-use tap @N` · `swipe` · `type` · `paste` |
| 버튼 · 제스처 · 키보드 상태 | `sim-use button` · `gesture` · `keyboard-state` |
| 스크린샷 / 영상 | `sim-use screenshot` · `record-video` |
| iOS 전용 키 입력 | `sim-use ios key` · `key-combo` · `key-sequence` |
| Android 브리지(기기당 1회) | `sim-use android init --device <serial>` |

- Android는 에뮬레이터/기기마다 `sim-use android init`으로 APK 브리지를 한 번 설치해야 한다.
- fire-and-verify: 조작 후 반드시 `sim-use ui`로 상태를 재확인한 뒤 다음 액션을 결정한다(`ui` 없이 좌표를 가정하지 않는다).

## 창 크기 변화 — iPhone Duo (2027-04 부터)

iPhone Duo 는 접고 펴면 앱이 켜진 채로 창 크기가 바뀐다(outer 1398×2034 ↔ inner 2007×2853). iOS 27.1 SDK 이상으로 빌드하면 inner 화면 전체를 쓰고, 2027-04 부터 Apple 이 Duo 대응과 Duo 스크린샷을 요구한다. `orientation: 'portrait'`·`supportsTablet: false` 는 그대로 두되, 이 설정이 창 비율을 고정하거나 Duo 대응을 면제하지 않는다. `requireFullScreen`(`UIRequiresFullScreen`)을 켜서 피하지 않는다.

- 크기는 flex 로 잡고, 숫자가 필요하면 `useWindowDimensions()` 나 컨테이너 `onLayout` 을 쓴다. 모듈 최상단 `Dimensions.get()`·state 에 캐시한 크기·기종 분기는 펼친 뒤에 틀린 값이 된다. 스크린샷 픽셀값을 breakpoint 로 쓰지 않는다
- 넓은 창에서 본문·폼은 읽기 폭을 제한한다(`max-w-*` + `self-center`). 배경·미디어·게임 캔버스는 제한하지 않는다
- 하단 여백은 하드코딩하지 말고 safe-area inset 과 탭바 높이를 쓴다. 템플릿 `Tabs` 는 JS 탭바라 Duo 에서 자동으로 세로로 바뀌지 않는다
- 검증: Xcode 27.1+ 의 iPhone Duo 시뮬레이터에서 접힘·펼침 각각 핵심 화면을 보고, 화면을 연 채 접기→펴기→접기 해 상태(입력·스크롤·모달·키보드)가 유지되는지 본다. Duo 시뮬레이터가 없으면 이 항목만 `BLOCKED` 로 기록한다
- 스토어 스크린샷이 언어와 무관하게 같은 화면을 찍도록, 주요 내비게이션과 캡처 경로의 버튼에 고정 `testID` 를 둔다(탭은 `tabBarButtonTestID: 'tab-<route>'`). `store-screenshots` 가 `sim-use tap '#tab-<route>'` 로 누른다

## 언제 쓰나
- **app-inspector**의 런타임 UX/기능 검증 — 정적 검수를 넘어 실제 화면 동작·흐름 확인
- `/iterate-app`의 Verify 단계 — 구현한 슬라이스를 시뮬레이터에서 직접 조작해 확인
- 버그 재현 / 회귀 확인
