---
name: design-system
description: "앱 디자인 시스템을 설계하고 NativeWind/Tailwind 코드로 구현하는 스킬. 컬러 팔레트, 타이포그래피, 컴포넌트 variant, 화면 레이아웃을 정의하고 tailwind.config.js와 theme.ts를 실제로 업데이트한다. '디자인 해줘', '디자인 시스템 만들어줘', '색상 팔레트', 'UI 설계', '화면 디자인' 요청 시 반드시 이 스킬을 사용할 것."
---

# Design System — 앱 디자인 시스템 스킬

앱 컨셉에 맞는 디자인 시스템을 설계하고 NativeWind 코드로 구현하는 스킬.

## Trigger
- "디자인 해줘", "디자인 시스템 만들어줘"
- "색상 팔레트", "테마 설정", "UI 설계"
- "화면 디자인", "컴포넌트 디자인"

## Input
- PRD (`_workspace/plan/prd.md`)
- 경쟁 앱 디자인 레퍼런스 (있으면)

## Steps

### Step 0: NativeWind 설정 검증 (GATE — 통과해야 다음 스텝 진행)

디자인 시스템을 정의하기 전에 NativeWind가 올바르게 설정되었는지 검증한다.
이 설정이 누락되면 `className`이 전혀 작동하지 않아 **모든 디자인 작업이 무의미**하다.

```
검증 항목 (모두 PASS 필수):
1. babel.config.js
   - presets에 ['babel-preset-expo', { jsxImportSource: 'nativewind' }] 존재 여부
   - presets에 'nativewind/babel' 존재 여부
2. metro.config.js
   - withNativeWind(config, { input: './global.css' }) 래핑 여부
3. tailwind.config.js
   - presets: [require('nativewind/preset')] 존재 여부
   - content에 app/, src/ 경로 포함 여부
4. global.css
   - @tailwind base; @tailwind components; @tailwind utilities; 존재 여부
5. 루트 _layout.tsx
   - import '../global.css'; 존재 여부
6. nativewind-env.d.ts
   - /// <reference types="nativewind/types" /> 존재 여부
```

- **FAIL 시**: 누락된 설정을 즉시 수정하고 다음 스텝으로 진행
- **수정 후**: Metro 캐시 클리어 필요 (`npx expo start -c`)

### Step 1: 브랜드 톤 결정
- 앱 성격에 맞는 시각적 방향성 3가지 옵션 제시
  - 예: "미니멀 & 클린" / "따뜻한 & 친근" / "대담한 & 에너제틱"
- 사용자 선택 후 진행

### Step 2: 컬러 시스템
- Primary, Secondary, Accent 컬러 정의
- Semantic 컬러 (success, warning, error, info)
- Background, Surface, Text 계층
- Light/Dark 모드 대응
- `tailwind.config.js`의 colors 섹션에 반영

### Step 3: 타이포그래피
- Heading 1~3, Body, Caption, Label 스케일
- Font weight 체계 (regular, medium, semibold, bold)
- Line height, Letter spacing
- `tailwind.config.js`의 fontSize 섹션에 반영

### Step 4: 컴포넌트 라이브러리
- `src/shared/ui/`의 기존 컴포넌트 확인
- 각 컴포넌트의 variant, size, state 정의
- NativeWind className 기반 스타일 명세
- 필요 시 새 컴포넌트 생성

### Step 5: 화면별 레이아웃
- PRD의 화면 구조를 기반으로 상세 레이아웃 정의
- 각 화면의 구조: SafeAreaView → 내부 컴포넌트 트리
- NativeWind className으로 레이아웃 표현
- 핵심 화면 2~3개의 상세 레이아웃 제공

### Step 6: 파일 업데이트
- `tailwind.config.js` 업데이트
- `src/shared/config/theme.ts` 업데이트
- `_workspace/design/design-system.md`에 전체 디자인 시스템 문서 저장

## Agent Delegation
| Step | Agent |
|------|-------|
| 1-6 | design-architect |
