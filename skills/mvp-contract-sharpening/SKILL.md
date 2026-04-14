---
name: mvp-contract-sharpening
description: Refine SweetGift's MVP scope, API contract, README-required content, and submission decisions around docs/mvp-contract.md before implementation or major scope changes.
---

# MVP Contract Sharpening

## Purpose
SweetGift는 과제형 MVP다. 구현 속도보다 더 중요한 것은 요구사항 누락 방지와 제출 재현성이다.  
이 skill은 `docs/mvp-contract.md`와 제출용 문서를 읽고, 범위/계약/README 요구사항을 모호함 없이 정리할 때 사용한다.

## When to use
- `docs/mvp-contract.md`를 새로 쓰거나 크게 수정할 때
- 기능 추가 전에 과제 요구사항 충족 여부를 재점검할 때
- README 필수 항목과 실제 구현 범위가 맞는지 점검할 때
- 프론트/백엔드 계약이 흔들릴 때

## When NOT to use
- 실제 UI 구현만 할 때
- SweetBook API adapter 코드만 고칠 때
- 단순 카피 문구 수정만 할 때

## Required inputs
1. `docs/mvp-contract.md`
2. SweetBook 과제 안내 요구사항
3. 현재 구현 상태 또는 PR diff
4. 변경 목적 한 문장

## Workflow

### Step 1 — Requirements reconciliation
- 과제 요구사항을 기준으로 아래 항목을 체크한다.
  - Books API 사용
  - Orders API 사용
  - 최종 사용자용 프론트 존재
  - 백엔드가 키 관리
  - 더미 데이터 포함
  - 로컬 실행 가능
  - `.env.example`
  - README 필수 항목

### Step 2 — Scope lock
- `must-have`, `nice-to-have`, `not-now`로 분리한다.
- SweetGift 현재 우선순위는 아래다.
  - must-have: 앨범 생성, 미리보기, 책 생성, 주문 생성, 더미 데이터
  - nice-to-have: 이미지 업로드, 추억 입력 자동화, 실제 Sandbox smoke test
  - not-now: 로그인, 결제, BGM 재생, AI 자동 생성

### Step 3 — Contract review
- `docs/mvp-contract.md`의 요청/응답 shape가 코드와 같은지 본다.
- contract change가 필요하면 문서를 먼저 고치고 코드 변경은 나중에 한다.

### Step 4 — Submission readiness
- `README.md`에 반드시 아래 섹션이 있는지 확인한다.
  - 서비스 소개
  - 실행 방법
  - API 사용 목록
  - AI 도구 사용 내역
  - 설계 의도
  - 비즈니스 가능성
  - 추가하고 싶은 기능

## Expected outputs
- 수정된 `docs/mvp-contract.md`
- 필요 시 README 개정안
- must-have / nice-to-have 우선순위 메모

## Role mapping
- Primary: Product / PM
- Secondary: Frontend, Backend lead

## Handoff
- UX가 필요하면 `ux-spec-authoring`
- 구현이 필요하면 `frontend-implementation` 또는 `sweetbook-api-integration`
