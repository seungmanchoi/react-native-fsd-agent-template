---
name: create-entity
description: "FSD entity(도메인 모델) 레이어에 새 엔티티(api/store/types/index)를 생성하는 스킬. '엔티티 만들어줘', 'entity 추가', '도메인 모델 추가' 요청 시 반드시 이 스킬을 사용할 것."
---

# Create Entity Skill

FSD 아키텍처의 entity(도메인 모델) 레이어에 새 엔티티를 생성하는 스킬.

> 스캐폴딩 전 `.claude/agents/feature-builder.md`의 Pre-Work Contract(`_workspace/spec.md` 분기 규칙)를 따른다.

## Trigger

- "엔티티 만들어줘", "entity 추가", "도메인 모델 추가"
- `/create-entity {name}`

## Input

- `name`: 엔티티 이름 (kebab-case, 예: `product`)
- `with-store`: Zustand store 포함 여부 (default: true)

## Steps

### Step 1: 이름 검증
- kebab-case 형식 확인
- 기존 entity와 이름 중복 확인 (`src/entities/` 검색)

### Step 2: 디렉토리 구조 생성

```
src/entities/{name}/
├── api/
│   ├── {name}.api.ts
│   └── index.ts
├── store/
│   ├── {name}.store.ts
│   └── index.ts
├── types/
│   ├── {name}.types.ts
│   └── index.ts
└── index.ts
```

### Step 3: 파일 생성

#### `types/{name}.types.ts`
```typescript
export interface I{Name} {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface I{Name}State {
  {name}: I{Name} | null;
  set{Name}: ({name}: I{Name}) => void;
  clear: () => void;
}
```

#### `store/{name}.store.ts`
```typescript
import { create } from 'zustand';
import type { I{Name}State } from '../types';

export const use{Name}Store = create<I{Name}State>()((set) => ({
  {name}: null,
  set{Name}: ({name}) => set({ {name} }),
  clear: () => set({ {name}: null }),
}));
```

#### `api/{name}.api.ts`
```typescript
import { apiClient } from '@shared/api';
import type { I{Name} } from '../types';

export const get{Name} = async (id: string): Promise<I{Name}> => {
  const { data } = await apiClient.get(`/{name}/${id}`);
  return data;
};
```

#### `index.ts`
```typescript
export * from './types';
export * from './store';
export * from './api';
```

### Step 4: QA 검증
- `npm run typecheck` 실행
- FSD 의존성 규칙 확인 (entities는 shared만 참조 가능)

## Agent Delegation

| Step | Agent |
|------|-------|
| 1-3 | feature-builder |
| 4 | qa-reviewer |
