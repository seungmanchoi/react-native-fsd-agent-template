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

## 언제 쓰나
- **app-inspector**의 런타임 UX/기능 검증 — 정적 검수를 넘어 실제 화면 동작·흐름 확인
- `/iterate-app`의 Verify 단계 — 구현한 슬라이스를 시뮬레이터에서 직접 조작해 확인
- 버그 재현 / 회귀 확인
