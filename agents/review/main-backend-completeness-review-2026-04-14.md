# Code Review — main backend completeness (2026-04-14)

**Reviewer persona:** Senior backend engineer (실제 연동 안정성, 재현성, 실패 시나리오 집중)
**Review skill:** `skills/backend-code-review-skill.md`
**Target branch:** `origin/main`
**Worktree:** `/tmp/sweetgift-origin-main`

---

## 1. 총평

백엔드 MVP는 이미 동작 가능한 수준까지 올라와 있다. `Fastify` 라우트, `zod` 검증, upstream error mapping, order idempotency guard, runtime response validation까지 들어와 있어서 기본 뼈대는 괜찮다.

다만 **“과제 제출용 완성도” 기준으로는 아직 세 군데가 약하다.** 첫째, 실제 SweetBook 환경에 붙는 순간 실패할 가능성이 있는 환경 설정이 남아 있다. 둘째, 테스트가 mock 중심이라 실제 Sandbox 연동 신뢰도를 입증하지 못한다. 셋째, 현재 상태 저장 방식은 서버 재시작 한 번이면 happy path 연속성이 끊긴다. 지금부터는 기능 추가보다 이 세 가지를 줄이는 쪽이 완성도를 가장 많이 끌어올린다.

---

## 2. 가장 위험한 문제 3개

### 문제 1 — `.env.example` 기본 Base URL이 공식 환경과 다름

**파일:** `.env.example:9`, `apps/api/.env.example:14`

현재 예시는 아래처럼 되어 있다.

```env
SWEETBOOK_BASE_URL=https://api.sweetbook.io/v1
```

그런데 SweetBook 문서 기준으로 Sandbox와 Live는 아래다.

- Sandbox: `https://api-sandbox.sweetbook.com/v1`
- Live: `https://api.sweetbook.com/v1`

즉 지금 상태에서 사용자가 `.env.example`를 그대로 복사하고 `SWEETBOOK_MOCK=false`로 바꾸면, **실제 API 호출 이전에 base URL부터 잘못되어 연결 실패**가 날 가능성이 높다.

이건 기능 버그라기보다 제출 직전의 재현성 버그다. 과제에서는 이런 종류의 실수가 체감상 더 치명적이다.

---

### 문제 2 — 실제 Sandbox 연동 신뢰도가 코드로 입증되지 않음

**파일:** `apps/api/tests/mapUpstreamError.test.ts`, `apps/api/tests/orders.test.ts`

현재 테스트는 좋아졌다. 다만 범위가 여전히 제한적이다.

- `mapUpstreamError` 분류 테스트 있음
- `orders` 라우트의 validation/idempotency 테스트 있음
- 그런데 `album-drafts`, `books`, 실제 SweetBook 응답 shape 대응은 테스트 공백이 있음

특히 `client.ts`는 runtime validation을 하고 있지만, 그 검증이 **실제 Sandbox 응답을 근거로 맞는지**는 아직 확인되지 않았다. 즉 지금 테스트는 “우리가 예상한 upstream shape”를 잘 처리하는지는 보장하지만, “SweetBook이 실제로 보내는 shape”와 일치하는지는 보장하지 못한다.

---

### 문제 3 — 현재 idempotency와 draft continuity가 프로세스 메모리에만 묶여 있음

**파일:** `apps/api/src/store/draft-store.ts:1`

현재 store는 `Map<string, StoredDraft>` 기반 메모리 저장소다.

이 구조의 문제는 명확하다.

1. 서버 재시작 시 draft/book/order 연결 정보가 모두 사라짐
2. `POST /orders` idempotency guard도 같이 사라짐
3. 프론트가 새로고침 후 `draftId`나 `bookId`로 이어가려 해도 백엔드는 모름

과제 범위에서 DB를 붙이지 않는 결정은 이해 가능하다. 하지만 지금 상태는 “재시작 후에도 데모 흐름이 유지될 것”이라는 기대를 전혀 만족시키지 못한다. 최소한 **파일 기반 임시 저장이나 SQLite** 정도로만 올려도 데모 안정성이 크게 오른다.

---

## 3. 정합성과 완성도가 깨질 수 있는 시나리오

### 시나리오 A — mock 해제 후 바로 연결 실패
1. 리뷰어가 `.env.example`를 복사
2. `SWEETBOOK_MOCK=false`로 변경
3. 서버 실행
4. `/books`, `/orders` 호출
5. Base URL이 잘못돼 upstream 연결 실패

결과:
- 기능 구현은 되어 있어도 “실제 API 연동이 안 되는 프로젝트”로 보인다

### 시나리오 B — 데모 중 서버 재시작 후 order retry
1. draft 생성
2. book 생성
3. 서버 재시작
4. 동일 `bookId`로 order 재요청
5. 기존 draft/book 매핑이 사라져 idempotency guard 미작동

결과:
- 중복 주문 방어 설명이 코드에 있어도, 실제 데모에서는 보장되지 않는다

### 시나리오 C — 실제 SweetBook 응답 shape가 예상과 다름
1. `createBook()` 또는 `createOrder()` 호출
2. 실제 응답이 예상 필드명과 다름
3. zod parse 실패
4. `BOOK_CREATION_FAILED` 또는 `ORDER_CREATION_FAILED`로 보이지만 원인은 adapter shape mismatch

결과:
- 백엔드 자체 로직이 아니라 integration contract mismatch로 MVP가 막힌다

---

## 4. 지금 당장 수정할 부분

### 수정 1 — `.env.example`의 Base URL 교정

**루트 `.env.example`**

```env
# Sandbox default for assignment work
SWEETBOOK_BASE_URL=https://api-sandbox.sweetbook.com/v1
```

**`apps/api/.env.example`**

```env
# Sandbox default for assignment work
SWEETBOOK_BASE_URL=https://api-sandbox.sweetbook.com/v1
```

그리고 주석에 Live 전환값도 같이 적는 편이 좋다.

```env
# Sandbox: https://api-sandbox.sweetbook.com/v1
# Live: https://api.sweetbook.com/v1
```

---

### 수정 2 — 최소한의 backend smoke test 문서화 또는 스크립트화

추가 권장 파일:

- `apps/api/tests/books.test.ts`
- `apps/api/tests/album-drafts.test.ts`
- `docs/sandbox-smoke-test.md`

반드시 검증할 것:
- `POST /api/v1/album-drafts` 정상/validation 실패
- `POST /api/v1/books` 정상/없는 draft/중복 요청
- `POST /api/v1/orders` 정상/중복 요청/402/timeout

테스트가 어려우면 적어도 `docs/sandbox-smoke-test.md`에 아래를 남겨라.

1. 필요한 env
2. mock off 방법
3. 직접 호출 순서
4. 기대 응답
5. 마지막 검증 날짜

---

### 수정 3 — 메모리 store를 최소한 로컬 파일 기반으로 승격

가장 작은 현실적 대안은 아래 둘 중 하나다.

1. `SQLite`
2. `JSON file persistence`

과제 범위에서는 `SQLite`가 제일 깔끔하지만 시간이 빠듯하면 JSON 파일도 충분하다.

필요 최소 기능:
- draft 저장
- bookId 저장
- orderId 저장
- bookId 역조회

이것만 있어도:
- 재시작 후에도 preview/book/order 흐름 유지
- idempotency 설명의 설득력 상승
- 데모 중 안정성 상승

---

## 5. 지금 수준에서 충분한 부분

| 항목 | 평가 |
|------|------|
| Route 구조 | `album-drafts`, `books`, `orders`, `health`로 역할 구분이 명확함 |
| Error mapping | status 기반 분류로 이전보다 훨씬 안전해짐 |
| Runtime validation | upstream 응답을 `zod`로 즉시 검증하는 방향은 맞음 |
| Order idempotency guard | 최소한의 중복 주문 방어가 코드로 존재함 |
| Contract 분리 | 프론트 계약과 SweetBook upstream shape를 섞지 않음 |
| Build/Test 상태 | type-check, build, lint, 현재 test 모두 통과함 |

---

## 6. 다음 단계에서 보강할 부분

| 항목 | 우선순위 | 내용 |
|------|----------|------|
| README 연동 섹션 | 높음 | mock/real API 모드 차이, env 설정, 실행 순서를 심사자 기준으로 정리 |
| 실제 Sandbox 캡처 | 높음 | `bookId`, `orderId`가 실제로 생성되는 증거 확보 |
| `GET /credits` 사전 확인 | 중간 | `402`를 사용자에게 보여주기 전에 잔액 확인 UX를 둘지 검토 |
| `SWEETBOOK_TIMEOUT_MS` env화 | 중간 | timeout 값 조절 가능하게 분리 |
| 날짜 검증 강화 | 낮음 | `anniversaryDate` 실존 날짜 여부 refine |
| durable idempotency | 낮음 | restart-safe 수준까지 끌어올리기 |
