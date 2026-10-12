---
name: init-app
description: "이 템플릿을 새 앱으로 바꾸는 첫 단계 스킬. slug·bundle id·scheme·앱 이름(다국어)·ATT 문구의 앱 이름·package name·운영 API URL 을 한 번에 바꾸고, Firebase·EAS·ATT 문구 등 남은 수동 단계를 안내한다. '새 앱 시작', '템플릿으로 앱 만들기', '앱 이름 바꿔줘', 'init app', 'bootstrap' 요청 시, 그리고 orchestrate 가 app.config.ts 의 SLUG 가 아직 my-app 인 걸 발견했을 때 사용할 것."
---

# Init App — 템플릿 → 새 앱

템플릿 식별자(`my-app` / `MyApp`)를 새 앱 값으로 바꾼다. 코드는 만들지 않는다. 기획·구현은 이후 `orchestrate`(풀 빌드) 또는 개별 스킬로 한다.

## 언제

- `app.config.ts` 의 `const SLUG = 'my-app';` 이 그대로인 상태에서 앱 작업을 시작할 때
- 이미 바꿨으면 다시 실행하지 않는다(스크립트가 거부한다). 이름만 고칠 때는 `--force`

## Step 1: 값 정하기

사용자 요청에서 뽑고, 없을 때만 묻는다.

| 값 | 규칙 |
|----|------|
| `slug` | kebab-case 영문 소문자. bundle id 는 `com.seungmanchoi.{slug에서 - 제거}` 로 정해지며 **첫 업로드 후에는 바꿀 수 없다**. 스토어에 같은 패키지명이 없는지 확인한다 |
| `name` | 영어 표시 이름, 30자 이하. 스토어 `name.txt`/`title.txt` 와 같아야 한다 |
| `ko`/`ja`/`zh` | 언어별 홈 화면 이름. 없으면 영어 이름을 쓴다 |
| `api-url` | 백엔드가 있을 때만. `https://` |

## Step 2: 실행

```bash
npm run app:init -- --slug pocket-pulse --name "Pocket Pulse" --ko "포켓 펄스" --ja "ポケットパルス" --zh "口袋脉搏"
npm install   # package-lock.json 이름 갱신
```

## Step 3: 남은 수동 단계 (스크립트가 못 하는 것)

1. **ATT 문구 재작성** — 스크립트는 예시 문구의 앱 이름만 바꾼다. 광고를 쓰면 `docs/rules/ads.md` "ATT 프롬프트 문구 다국어"의 4요소(무엇·왜·구체적 예시·거부 시 결과)로 이 앱에 맞게 `app.config.ts` 의 `TRACKING_PERMISSION_TEXT` 와 `plugins/withLocalizedAttDescription.js` 로케일 테이블을 다시 쓴다. 광고를 안 쓰면 광고 모듈 제거 범위는 `api-integrator` 의 분기 규칙을 따른다
2. **Firebase** — 새 bundle id 로 Firebase 앱을 만들고 `firebase/GoogleService-Info.plist`, `firebase/google-services.json` 을 둔다(gitignore). 없으면 네이티브 빌드가 실패한다. 콘솔 자동화는 `api-integrator` "Firebase 콘솔 자동화"
3. **EAS** — `eas init` 으로 `extra.eas.projectId` 를 채운다. EAS 25 프로젝트 한도 밖이면 건너뛰고 fastlane 으로 빌드한다(`~/works/AGENTS.md`)
4. **아이콘·스플래시** — `assets/images/` 교체
5. **검증** — `npm run verify` 후 `npm start` 를 띄워 두고 `npm run ios` 로 시뮬레이터에서 앱 이름과 첫 화면을 확인한다(`sim-use ui`)

## 다음

- 처음부터 만들기: `orchestrate` (Phase 0 이 이 결과를 `_workspace/spec.md` 의 `project` 로 쓴다)
- 기능 하나씩: `create-feature` / `create-screen`
