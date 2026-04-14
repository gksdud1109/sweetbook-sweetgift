---
name: ux-spec-authoring
description: Write SweetGift-specific UX flows, screen specs, and copy for the anniversary album MVP from docs/mvp-contract.md.
---

# UX Spec Authoring

## Purpose
SweetGift는 “커플 기념일 선물용 앨범”이라는 감정적 맥락이 중요하다.  
이 skill은 `docs/mvp-contract.md`를 바탕으로 프론트가 바로 구현할 수 있는 수준의 UX 문서를 만든다.

## When to use
- `docs/ux/` 문서를 새로 만들 때
- 프론트 구현 전에 화면 흐름을 먼저 잠글 때
- 입력 UX, 미리보기 UX, 주문 UX를 다시 설계할 때

## When NOT to use
- 코드만 고칠 때
- API shape만 바꿀 때

## Required inputs
1. `docs/mvp-contract.md`
2. 현재 화면 또는 리뷰 피드백
3. 타겟 사용자와 MVP 범위

## Workflow

### Step 1 — Product tone lock
- 기본 톤은 `refined editorial`로 잡는다.
- 목표는 “선물용 앨범 서비스”이지 “관리자 도구”가 아니다.
- 본문은 읽기 쉬운 산세리프, 제목은 제한된 display font만 사용한다.

### Step 2 — Flow spec
- 최소 5개 화면을 정의한다.
  - Landing
  - Create Album
  - Preview
  - Order
  - Completion
- 각 화면마다 `default / loading / error / success`를 적는다.

### Step 3 — Input UX simplification
- 현재 SweetGift에서 특히 중요하게 설계할 항목:
  - 이미지 업로드 vs URL 입력
  - 추억 다건 입력 방식
  - 샘플 데이터 불러오기
- 추억 입력은 다음 대안을 비교한다.
  - 카드별 수동 입력
  - bulk textarea
  - CSV-like paste
  - 사진 기준 자동 카드 생성

### Step 4 — Copy guide
- empty/error 문구는 건조하지 않게 쓴다.
- 과한 감성 문구나 generic SaaS 문구는 피한다.

## Expected outputs
- `docs/ux/design-direction.md`
- `docs/ux/user-flow.md`
- `docs/ux/screen-specs.md`
- `docs/ux/copy-guide.md`

## Role mapping
- Primary: Product Designer
- Secondary: Frontend Engineer

## Handoff
- 구현 단계로 넘길 때는 `frontend-implementation` 사용
