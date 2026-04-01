---
name: inspect-app
description: "구현된 앱의 기능, UX, 디자인을 종합 검수하는 스킬. PRD 대비 기능 완성도, 화면 흐름, 디자인 가이드라인 준수, 접근성, 엣지 케이스를 점검한다. '앱 검수', '기능 점검', 'UX 검토', '디자인 QA', '출시 전 점검' 요청 시 반드시 이 스킬을 사용할 것."
---

# Inspect App — 앱 종합 검수 스킬

구현된 앱을 PRD, 디자인 시스템 기준으로 종합 검수하는 스킬.

## Trigger
- "앱 검수", "기능 점검", "QA 해줘"
- "UX 검토", "디자인 QA"
- "출시 전 점검", "앱 리뷰해줘"

## Input
- PRD: `_workspace/02_product_plan.md`
- 디자인 시스템: `_workspace/03_design_system.md`
- 구현 코드: `src/`, `app/`

## Steps

### Step 1: 기능 완성도 검수
- PRD의 유저 스토리를 체크리스트로 변환
- 각 유저 스토리에 해당하는 코드 파일 매핑
- 구현 여부 확인 (PASS/FAIL/PARTIAL)
- API 타입과 UI 타입의 경계면 교차 비교

### Step 2: UX 흐름 검증
- `app/` 디렉토리의 라우트 구조 분석
- 화면 간 네비게이션 연결 확인
- 에러 상태, 로딩 상태, 빈 상태 처리 확인
- 키보드 회피(KeyboardAvoidingView) 확인

### Step 3: 디자인 일관성 검수
- 디자인 시스템의 토큰 값과 실제 className 비교
- 하드코딩된 색상, 폰트 크기, 스페이싱 탐지
- 컴포넌트 variant 사용 일관성 확인

### Step 4: 접근성 점검
- 터치 타겟 크기 (최소 44x44)
- accessibilityLabel 설정 여부
- 색상 대비(contrast ratio) 확인

### Step 5: 엣지 케이스 탐지
- 긴 텍스트 / 빈 데이터 / 대량 데이터
- 이미지 로드 실패 대응
- 네트워크 오프라인 대응
- 빠른 연속 입력 방어

### Step 6: 보고서 생성
- 종합 점수 (0~100)
- CRITICAL / WARNING / INFO 분류
- 각 이슈에 파일:라인, 설명, 수정 방법 포함
- `_workspace/05_inspection_report.md`에 저장

## Agent Delegation
| Step | Agent |
|------|-------|
| 1-6 | app-inspector |

## QA Reviewer와의 역할 분담
- **qa-reviewer**: 코드 품질, TypeScript 타입 안전성, FSD 규칙, lint/format
- **app-inspector**: 기능 완성도, UX 흐름, 디자인 일관성, 접근성
