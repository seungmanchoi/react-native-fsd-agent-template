---
name: create-screen
description: "Expo Router 규칙에 맞는 새 스크린을 추가하는 스킬. SafeArea·NativeWind·spec.md ux 분기(dark_mode 등)를 따른다. '스크린 추가해줘', '화면 만들어줘', '페이지 추가' 요청 시 반드시 이 스킬을 사용할 것."
---

# Create Screen Skill

Expo Router 규칙에 맞는 새 스크린을 추가하는 스킬.

> 스크린 생성 전 `.claude/agents/ui-developer.md`의 Pre-Work Contract(`_workspace/spec.md` 의 `ux.*` 분기 규칙, SafeArea·테마 토큰)를 따른다.

## Trigger

- "스크린 추가해줘", "화면 만들어줘", "페이지 추가"
- `/create-screen {name}`

## Input

- `name`: 스크린 이름 (kebab-case, 예: `settings`)
- `group`: 라우트 그룹 (예: `(tabs)`, `(auth)`, `(modal)`)
- `layout`: 레이아웃 타입 (`stack` | `tabs` | `none`)

## Steps

### Step 1: 라우트 구조 확인
- `app/` 디렉토리의 기존 라우트 구조 분석
- 지정된 group 존재 여부 확인, 없으면 생성

### Step 2: 스크린 파일 생성

#### `app/{group}/{name}.tsx`
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

export default function {Name}Screen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* 테마 토큰 사용 — bg-white 하드코딩 금지 (spec.md ux.dark_mode 준수) */}
      <View className="flex-1 px-4">
        <Text className="text-lg font-bold text-foreground">{Name}</Text>
      </View>
    </SafeAreaView>
  );
}
```

### Step 3: 레이아웃 업데이트
- 해당 group의 `_layout.tsx`에 새 스크린 등록
- 탭 그룹이면 탭 아이콘 설정 포함

### Step 4: 네비게이션 연결 (optional)
- 기존 스크린에서의 이동 링크 추가
- `expo-router`의 `Link` 또는 `router.push()` 사용

### Step 5: QA 검증
- SafeAreaView 적용 확인
- NativeWind className 사용 확인
- TypeScript 타입 체크

## Agent Delegation

| Step | Agent |
|------|-------|
| 1-4 | ui-developer |
| 5 | qa-reviewer |
