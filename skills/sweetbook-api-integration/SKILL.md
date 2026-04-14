---
name: sweetbook-api-integration
description: Implement and verify SweetGift backend integration with SweetBook Books API and Orders API, including env loading, mock mode, persistence, and sandbox validation.
---

# SweetBook API Integration

## Purpose
SweetGift 백엔드의 핵심은 SweetBook 연동이다.  
이 skill은 `Books API`, `Orders API`, env 로딩, mock mode, persistence, 그리고 Sandbox smoke test를 한 흐름으로 다룬다.

## When to use
- `apps/api/**` 구현/수정
- SweetBook 인증, base URL, mock mode 문제 해결
- Books/Orders adapter 또는 route 보강
- Sandbox 검증 시

## When NOT to use
- UI 폰트/레이아웃 수정
- 단순 README 문장 수정

## Required inputs
1. `docs/mvp-contract.md`
2. `docs/sandbox-smoke-test.md`
3. 루트 `.env`
4. 현재 백엔드 코드 또는 오류 로그

## Workflow

### Step 1 — Env correctness
- 루트 `.env`를 source of truth로 본다.
- 아래 값을 우선 확인한다.
  - `SWEETBOOK_API_KEY`
  - `SWEETBOOK_BASE_URL`
  - `SWEETBOOK_MOCK`
  - `PORT`
- `apps/api/package.json`의 실행 스크립트가 루트 `.env`를 읽는지 확인한다.

### Step 2 — Contract boundary
- 프론트는 `/api/v1/books`, `/api/v1/orders`만 호출한다.
- backend는 raw SweetBook response를 프론트에 직접 노출하지 않는다.
- adapter에서 upstream shape를 검증한다.

### Step 3 — Reliability checks
- idempotency:
  - `draftId -> bookId`
  - `bookId -> orderId`
- persistence:
  - 서버 재시작 후 draft/order continuity
- timeout / 4xx / 5xx mapping

### Step 4 — Sandbox validation
- 순서:
  1. `GET /api/v1/health`
  2. `POST /api/v1/album-drafts`
  3. `POST /api/v1/books`
  4. `POST /api/v1/orders`
- 실패 시 아래를 먼저 점검한다.
  - key type이 Sandbox key인지
  - `SWEETBOOK_MOCK=false`인지
  - base URL이 `https://api-sandbox.sweetbook.com/v1`인지
  - 인증 401인지 payload 4xx인지

### Step 5 — Tests
- `pnpm --filter @sweetgift/api type-check`
- `pnpm --filter @sweetgift/api test`
- 필요 시 `docs/sandbox-smoke-test.md`를 최신화

## Expected outputs
- 수정된 `apps/api/**`
- 검증된 env 실행 방식
- Sandbox smoke test 결과

## Role mapping
- Primary: Backend Engineer
- Secondary: QA / Reviewer

## Handoff
- UI 연결 문제는 `frontend-implementation`
- 계약 변경은 `mvp-contract-sharpening`
