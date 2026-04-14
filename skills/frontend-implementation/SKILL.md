---
name: frontend-implementation
description: Implement and polish SweetGift frontend screens, typography, input UX, and state handling from the MVP contract and UX specs.
---

# Frontend Implementation

## Purpose
SweetGift 프론트는 “실제 제품처럼 보이는지”가 중요하다.  
이 skill은 현재 MVP에서 특히 중요한 세 가지를 고정한다.

- 폰트와 전반적인 visual polish
- 이미지 입력 UX
- 추억 입력 UX 단순화

## When to use
- `apps/web/**`를 구현하거나 보강할 때
- 화면은 있는데 완성도가 낮을 때
- QA 피드백을 반영할 때

## When NOT to use
- 백엔드 env / adapter / route 수정
- 계약 문서 수정만 하는 경우

## Required inputs
1. `docs/mvp-contract.md`
2. 필요 시 `docs/ux/*`
3. 현재 화면 상태 또는 리뷰 문서

## Workflow

### Step 1 — Typography and visual direction
- SweetGift 기본 원칙:
  - 본문 폰트는 한국어에 강한 깔끔한 sans 하나로 통일
  - 제목용 display font는 제한적으로만 사용
  - mac 기본 폰트 조합에 의존하지 않는다
- 우선 검토 대상:
  - `apps/web/app/layout.tsx`
  - `apps/web/app/globals.css`
  - `apps/web/tailwind.config.ts`

### Step 2 — Input UX review
- 현재 폼에서 사용자가 귀찮아하는 지점을 먼저 줄인다.
  - 표지/사진 URL 직접 입력
  - 추억 카드별 날짜/제목/설명 반복 입력
- 개선 우선순위:
  1. 샘플 데이터 / 빠른 채우기
  2. 이미지 파일 업로드
  3. 추억 bulk input
  4. 사진 기준 자동 카드 생성

### Step 3 — State integrity
- mock/API 상태를 혼동하지 않는다.
- `loadSample()`나 reset 동작은 stale book/order를 남기지 않게 한다.
- localStorage 복구는 schema 기반으로 한다.

### Step 4 — Required states
- `default`
- `loading`
- `error`
- `success`

모든 주요 화면에서 네 상태를 확인한다.

### Step 5 — Validation
- `pnpm --filter web typecheck`
- `pnpm --filter web build`

## Expected outputs
- 수정된 `apps/web/**`
- 필요 시 더미 데이터/이미지 asset
- 입력 UX 개선 사항 메모

## Role mapping
- Primary: Frontend Engineer
- QA support: Reviewer

## Handoff
- UI 흐름 검증은 `webapp-testing`
- 계약 mismatch면 `mvp-contract-sharpening`
