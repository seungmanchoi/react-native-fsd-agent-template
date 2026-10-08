# 개발 도구 — ponytail · CodeGraph

> 이 문서는 CLAUDE.md 에서 옮긴 상세 규칙이다. **Hard Threshold 표는 CLAUDE.md 가 정본**이며, 여기 없는 통과 기준은 CLAUDE.md 를 따른다.

## 코딩 원칙 — ponytail (lazy senior dev)

이 프로젝트는 **ponytail** 코딩 철학을 따른다: 존재하지 않아도 되는 코드가 최고의 코드. 요청을 완전히 이해한 뒤, 아래 사다리에서 **먼저 걸리는 칸에서 멈춘다**.

1. 애초에 필요한가? (YAGNI — 투기성 니즈면 스킵)
2. 이 코드베이스에 이미 있나? (헬퍼·유틸·타입·패턴 재사용 — 재구현 금지)
3. 표준 라이브러리로 되나?
4. 네이티브/플랫폼 기능으로 되나?
5. 이미 설치된 의존성으로 되나? (몇 줄로 될 걸 위해 새 의존성 추가 금지)
6. 한 줄로 되나?
7. 그제서야: 동작하는 최소 코드.

- 요청 안 한 추상화·보일러플레이트·"나중을 위한" 스캐폴딩 금지. 삭제 > 추가, 지루함 > 영리함.
- 버그 수정은 증상이 아닌 **근본 원인** — 공유 함수 한 곳에서 고쳐 형제 호출부까지 함께 수정한다.
- 이해는 절대 생략하지 않는다 — 사다리는 해법을 줄이지 읽기를 줄이지 않는다. 입력 검증·에러 처리·보안·접근성은 게으르게 굴지 않는다.

### 설정 / 토글
- 플러그인으로 제공된다(`ponytail@ponytail`, 마켓플레이스 `DietrichGebert/ponytail`). **이 레포 `.claude/settings.json`에 선언**돼 있어 클론 시 설치/신뢰 프롬프트가 뜬다.
- 수동 설치: `/plugin` → marketplace `DietrichGebert/ponytail` → ponytail 설치.
- 레벨 토글: `/ponytail lite|full|ultra` (기본 `full`) · 끄기: `stop ponytail` / `normal mode`.
- 플러그인이 없어도 위 원칙은 이 CLAUDE.md 규칙으로 적용된다. 플러그인은 상시 주입 hook + `/ponytail-review`·`-audit`·`-debt`·`-gain` 스킬을 추가로 제공한다.

## CodeGraph (코드 인텔리전스 · 선택)

이 프로젝트는 CodeGraph(`codegraph` CLI + `codegraph_*` MCP 도구)를 **선택적으로** 사용한다. tree-sitter로 파싱한 심볼/호출/영향도 그래프로, grep이 줄 수 없는 **구조적** 답을 sub-ms로 준다. 설치·인덱스 빌드는 강제가 아니며, 없으면 모든 작업이 grep fallback으로 정상 진행한다.

- **초기 설정/인덱스 빌드**: orchestrate **Phase 0 Step 0.0**이 CLI 설치·인덱스 존재를 감지해 빌드 여부를 인터랙션으로 처리한다(무인 모드는 자동). 수동: `codegraph init -i`.
- **사용 원칙**: 구조 질문(무엇이 무엇을 호출/정의/파급하는지)은 codegraph, 리터럴 텍스트(문자열·주석·로그)는 grep. 결과는 신뢰하고 grep으로 재검증하지 않는다.

| 질문 | 도구 |
|------|------|
| X 정의 위치 / 심볼 찾기 | `codegraph_search` |
| 작업/영역 컨텍스트 | `codegraph_context` (PRIMARY) |
| X→Y 흐름 추적 | `codegraph_trace` |
| 무엇이 이걸 호출/이게 무엇을 호출 | `codegraph_callers` / `codegraph_callees` |
| 바꾸면 뭐가 깨지나 | `codegraph_impact` |
| 여러 심볼 소스 한 번에 | `codegraph_explore` |

- **루프에서**: `/iterate-app`은 매 사이클 진단 전 `codegraph sync`(변경분만)로 최신화하고 `codegraph impact`로 회귀 범위를 산정한다(상세: iterate-app 스킬).
- **인덱스 캐시(`.codegraph/`)는 `.gitignore`** — 머신 로컬. 클론 후 필요 시 `codegraph init -i`로 재빌드.
