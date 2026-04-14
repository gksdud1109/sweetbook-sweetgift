---
name: webapp-testing
description: Test SweetGift's end-to-end MVP flow on local dev servers, focusing on Create, Preview, Book creation, Order creation, and Completion states.
---

# Webapp Testing

## Purpose
SweetGift는 한 화면이 아니라 한 흐름이 끝까지 이어져야 가치가 보인다.  
이 skill은 로컬 환경에서 Create → Preview → Order → Completion 플로우를 smoke test하는 절차를 고정한다.

## When to use
- 프론트/백엔드 머지 전
- UI/상태관리 수정 후
- Sandbox 인증 문제를 제외한 플로우 검증 시

## When NOT to use
- 단위 테스트 대체용
- SweetBook 실 API 인증 문제만 확인할 때

## Required inputs
1. 로컬 실행 명령
2. 루트 `.env`
3. 성공 기준

## Success criteria
- 사용자가 더미 또는 실제 입력으로 draft를 생성할 수 있다
- Preview가 생성된다
- book 생성이 동작한다
- order 생성이 동작한다
- completion 화면이 최종 상태를 보여준다

## Workflow

### Step 1 — Server mode 확인
- mock mode인지 real API mode인지 먼저 확인한다.
- `NEXT_PUBLIC_API_BASE_URL`이 프론트에 연결돼 있는지 본다.

### Step 2 — Golden path
1. Landing 진입
2. Create 이동
3. 샘플 데이터 또는 실제 데이터 입력
4. Preview 이동
5. 책 생성 요청
6. Order 이동
7. 주문 생성 요청
8. Completion 확인

### Step 3 — Edge checks
- 잘못된 입력 시 validation error
- book 없이 order 진입 시 안내
- mock/API mode badge가 실제 상태를 반영하는지
- 새로고침 후에도 상태가 깨지지 않는지

### Step 4 — Regression focus for SweetGift
- 폰트와 visual regression
- 이미지 입력 UX
- 추억 입력 UX
- 상태 복구(localStorage)

## Expected outputs
- smoke test 결과 메모
- 필요 시 e2e test script
- 발견된 QA 이슈 목록

## Role mapping
- Primary: QA / Reviewer
- Secondary: Frontend Engineer

## Handoff
- UI 문제는 `frontend-implementation`
- backend/env 문제는 `sweetbook-api-integration`
