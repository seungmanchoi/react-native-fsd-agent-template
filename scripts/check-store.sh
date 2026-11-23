#!/usr/bin/env bash
# 스토어 제출 전 반려 위험 검사. app-store-compliance guard 를 이 앱에 돌린다.
# 0 = CLEAR, 2 = critical 있음(빌드·제출 금지), 1 = 검사 못 함. docs/rules/build-deploy.md "제출 전 반려 위험 검사".
set -uo pipefail
cd "$(dirname "$0")/.."
APP="$PWD"

ASC="${ASC_HOME:-$HOME/repositories/app-store-compliance}"
if [ ! -f "$ASC/agent-os/hooks/app-store-compliance-guard.sh" ]; then
  git clone --depth 1 https://github.com/mjmirza/app-store-compliance "$ASC" || exit 1
fi

# CNG 앱이라 ios/android 가 없으면 네이티브 검사(Info.plist, PrivacyInfo, AndroidManifest)가 빠진다.
# 없는 플랫폼만 만든다(prebuild 는 기본 clean 이라 있는 ios/Pods 를 지운다).
# ponytail: 있으면 그대로 쓴다. app.config 를 바꾼 뒤라면 `npm run check:store -- --fresh`
PLAT=""
if [ "${1:-}" = "--fresh" ] || { [ ! -d ios ] && [ ! -d android ]; }; then PLAT=all
elif [ ! -d ios ]; then PLAT=ios
elif [ ! -d android ]; then PLAT=android; fi
if [ -n "$PLAT" ]; then
  APP_ENV=production npx expo prebuild --no-install --platform "$PLAT" || exit 1
fi

# 앱에 들어가는 파일만 떼어 검사한다. 점 폴더(.claude·.codex·.playwright-mcp 등 도구 기록)·루트 yml(Playwright 캡처)·
# 테스트는 오탐을, gitignore 된 캐시(build-output 의 Xcode 캐시, unity/Library)는 10분 넘는 검사를 만든다.
# ios/android 는 gitignore 여도 prebuild 결과라 넣는다. eas.json 은 production 프로필만,
# package.json 은 scripts(개발용 `expo start --localhost` 가 스테이징 주소로 잡힌다)를 뺀다.
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
git ls-files -o -i --exclude-standard --directory 2>/dev/null \
  | grep -v -E '^(ios|android)/$' | sed 's|^|/|' > "$TMP/ignored"
rsync -a --exclude-from="$TMP/ignored" \
  --exclude '.*/' --exclude node_modules --exclude build-output --exclude build --exclude Pods \
  --exclude _workspace --exclude docs --exclude screenshots --exclude '/*.yml' --exclude '/*.yaml' \
  --exclude __tests__ --exclude '*.test.*' --exclude '*.spec.*' \
  ./ "$TMP/app/" || exit 1
node -e '
  const fs = require("fs"), dir = process.argv[1];
  const edit = (name, fn) => { const f = `${dir}/${name}`; if (!fs.existsSync(f)) return;
    const j = JSON.parse(fs.readFileSync(f, "utf8")); fn(j); fs.writeFileSync(f, JSON.stringify(j, null, 2)); };
  edit("eas.json", (j) => { const keep = {};
    for (let p = "production"; p && j.build?.[p]; p = j.build[p].extends) keep[p] = j.build[p];
    if (j.build) j.build = keep; });
  edit("package.json", (j) => { delete j.scripts; });' "$TMP/app" || exit 1

# RN 은 pod install 때 pod 들의 PrivacyInfo 를 모아 앱 PrivacyInfo.xcprivacy 를 만든다(privacy_file_aggregation).
# 아직 없으면 사본에서 pod install 해 빌드와 같은 파일을 만든다. Pods 는 사본과 함께 지워진다.
if [ -d "$TMP/app/ios" ] && ! find "$TMP/app/ios" -maxdepth 2 -name PrivacyInfo.xcprivacy | grep -q .; then
  ln -s "$APP/node_modules" "$TMP/app/node_modules"
  (cd "$TMP/app/ios" && pod install --silent) || exit 1
fi

bash "$ASC/agent-os/hooks/app-store-compliance-guard.sh" "$TMP/app"
