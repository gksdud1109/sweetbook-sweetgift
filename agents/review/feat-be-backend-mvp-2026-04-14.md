# Code Review — feat/be/backend-mvp (2026-04-14)

**Reviewer persona:** Senior backend engineer (외부 API 정합성, 실패 시나리오 집중)
**Review skill:** `skills/backend-code-review-skill.md`
**Target branch:** `feat/be/backend-mvp`
**Worktree:** `/Users/hanyoung-jeong/Development/sweetgift-be`

---

## 1. 총평

코드 구조 자체는 명확하고 의도가 잘 읽힌다. SweetBook adapter와 내부 도메인을 타입 분리했고, 에러 코드도 contract와 정렬되어 있으며, 프론트에 raw upstream을 노출하지 않는다는 기본 원칙은 지켜졌다.

그러나 **정합성과 안정성 관점에서 치명적인 구멍이 3개 있다.** HTTP 에러 분류 로직이 문자열 파싱에 의존하고, 주문 중복 방지 장치가 없으며, 동시 요청 시 책이 이중 생성될 수 있는 race condition이 존재한다. 테스트 파일이 전무하다는 것도 과제 평가 기준에서 실질적인 약점이다.

---

## 2. 가장 위험한 문제 3개

### 문제 1 — HTTP status를 에러 메시지 문자열 파싱으로 분류

**파일:** `src/adapters/sweetbook/errors.ts:58`

```typescript
if (msg.includes("4")) {  // "factory", "4xx", "HTTP 504:" 등도 매칭됨
```

`client.ts`가 `new Error(\`SweetBook HTTP ${response.status}: ${text}\`)` 형태로 에러를 생성하고, `errors.ts`가 그 문자열을 다시 파싱한다. 402 체크(`msg.includes("402")`)도 메시지 패턴에 의존하므로, SweetBook이 다른 형태로 에러를 내려주면 분류가 틀린다.

**근본 원인:** status code가 숫자로 보존되지 않고 문자열에 묻힌다.

---

### 문제 2 — POST /api/v1/orders 멱등성 완전 부재

**파일:** `src/routes/orders.ts`

동일 `bookId`로 요청이 두 번 들어오면 SweetBook에 주문이 두 번 생성된다. `books.ts`는 `draft.status === "book_created"` guard를 갖추고 있는데 `orders.ts`에는 아무 방어 코드가 없다. 네트워크 retry, 더블클릭, 응답 유실 후 재시도 등 모든 경우에서 중복 주문이 발생한다.

---

### 문제 3 — Book 생성 race condition

**파일:** `src/routes/books.ts:40-72`

```
getDraft() → [await createBook()] → updateDraft()
              ↑ 이 사이에 다른 요청이 끼어들 수 있음
```

Node.js event loop 특성상 `getDraft` 후 `await createBook()` 사이에 다른 요청이 상태를 읽는다. 두 요청이 동시에 `status !== "book_created"`를 읽으면 둘 다 SweetBook 호출로 진행한다. `updateDraft`는 `await` 이후에 호출되므로 optimistic lock 패턴이 없다.

---

## 3. 정합성이 깨질 수 있는 시나리오

### 시나리오 A — 주문 이중 생성
1. 사용자 주문 버튼 클릭
2. 응답 느려서 프론트 재시도
3. SweetBook에 동일 `bookId`로 주문 2건 생성
4. `draft.status`는 여전히 `"book_created"` — `"ordered"` 전환이 없음
5. 3번째 시도도 동일 결과

### 시나리오 B — createBook timeout 후 SweetBook에는 책이 존재
1. 요청이 10초 넘어서 AbortError 발생
2. 우리 서버는 504 반환, `draft.status`는 `"draft"` 유지
3. SweetBook에는 이미 책 생성 완료
4. 사용자 재시도 시 SweetBook에 두 번째 책 생성
5. 첫 번째 bookId는 우리 draft에 없음

### 시나리오 C — upstream 응답 shape 불일치
```typescript
// client.ts
return response.json() as Promise<T>;  // 런타임 검증 없음
```
SweetBook이 `id` 대신 `bookId`를 반환하면 `upstream.id === undefined`, `draft.bookId = undefined` 저장. GET `/album-drafts/:id` 응답에 `bookId`가 없는 draft가 반환된다.

### 시나리오 D — 에러 메시지 분류 오판
- SweetBook이 `"HTTP 400: balance required"` 반환 → `msg.includes("balance")` 매칭 → 402 처리로 오분류
- 실제 402 응답이 `"insufficient credits"` 메시지로 오면 → `msg.includes("402")` 실패 → catch-all 502

---

## 4. 지금 당장 고쳐야 할 코드

### 수정 1 — SweetBookHttpError로 에러 구조화

**`src/adapters/sweetbook/client.ts`**

```typescript
// 추가할 에러 클래스
export class SweetBookHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`SweetBook HTTP ${status}`);
    this.name = "SweetBookHttpError";
  }
}

// 기존 throw 교체 (line 52-54)
if (!response.ok) {
  const text = await response.text().catch(() => "");
  throw new SweetBookHttpError(response.status, text);
}

// 불필요한 try-catch re-throw 제거
// catch (err) { throw err; } — 이 블록은 삭제
```

---

### 수정 2 — mapUpstreamError를 status code 기반으로 교체

**`src/adapters/sweetbook/errors.ts`**

```typescript
import { SweetBookHttpError } from "./client.js";

export function mapUpstreamError(
  err: unknown,
  context: "book" | "order",
): AppError {
  const code = context === "book" ? "BOOK_CREATION_FAILED" : "ORDER_CREATION_FAILED";

  if (err instanceof Error && err.name === "AbortError") {
    return new AppError("UPSTREAM_TIMEOUT", "SweetBook API timed out.", 504);
  }

  if (err instanceof SweetBookHttpError) {
    if (err.status === 402) {
      return new AppError(code, "SweetBook account balance is insufficient.", 402);
    }
    if (err.status === 408 || err.status === 504) {
      return new AppError("UPSTREAM_TIMEOUT", "SweetBook API timed out.", 504);
    }
    if (err.status >= 400 && err.status < 500) {
      return new AppError("UPSTREAM_ERROR", `SweetBook rejected the request (${err.status}).`, 400);
    }
    if (err.status >= 500) {
      return new AppError(code, `SweetBook upstream error (${err.status}).`, 502);
    }
  }

  if (err instanceof Error) {
    return new AppError(code, `Network error: ${err.message}`, 502);
  }

  return new AppError(code, "Upstream error.", 502);
}
```

---

### 수정 3 — Order 멱등성 최소 방어

**`src/store/draft-store.ts`** — 필드 및 역방향 조회 추가:

```typescript
// StoredDraft에 orderId 추가
orderId?: string;

// 역방향 조회 함수 추가
export function getDraftByBookId(bookId: string): StoredDraft | undefined {
  for (const draft of store.values()) {
    if (draft.bookId === bookId) return draft;
  }
  return undefined;
}
```

**`src/routes/orders.ts`** — 핸들러 안에 중복 방지 추가:

```typescript
const existingDraft = getDraftByBookId(bookId);
if (existingDraft?.status === "ordered" && existingDraft.orderId) {
  return reply.send({
    data: {
      orderId: existingDraft.orderId,
      bookId,
      status: "ordered",
    },
  });
}

// 성공 후 상태 업데이트 추가
updateDraft(existingDraft.draftId, { status: "ordered", orderId: upstream.id });
```

---

### 수정 4 — ordered 상태 draft에서 책 재생성 차단

**`src/routes/books.ts:40`**

```typescript
// 현재
if (draft.status === "book_created" && draft.bookId) {

// 수정
if ((draft.status === "book_created" || draft.status === "ordered") && draft.bookId) {
```

---

## 5. 지금 수준에서 충분한 부분

| 항목 | 평가 |
|------|------|
| Adapter 계층 분리 | SweetBook upstream 타입과 내부 도메인 타입 완전 분리. contract 방어선 유지 |
| 프론트 응답 격리 | 세 라우터 모두 upstream 응답에서 필요한 필드만 반환. raw shape 노출 없음 |
| env 검증 | zod로 서버 시작 시 환경 변수 강제 검증 및 실패 시 exit |
| CORS 설정 | `env.CORS_ORIGIN` 화이트리스트 방식 적용 |
| 에러 핸들러 | ZodError, AppError, Fastify 자체 validation을 일관된 포맷으로 변환. 내부 에러 스택 노출 없음 |
| Mock 모드 | `SWEETBOOK_MOCK=true`로 실제 키 없이 리뷰어 즉시 실행 가능 |
| TODO 주석 | 멱등성, idempotency key, DB 교체 필요성이 코드 내에 명시됨 |
| 입력 유효성 검사 | 문자열 길이, 배열 min/max, 날짜 형식, 전화번호/우편번호 형식 모두 zod로 검증 |

---

## 6. 다음 단계에서 보강할 부분

| 항목 | 우선순위 | 내용 |
|------|----------|------|
| 테스트 파일 | 높음 | 현재 0개. `orders.ts` 중복 제출, `mapUpstreamError` 402/timeout/5xx, invalid body 거부 케이스 최소 3-4개 |
| upstream 응답 런타임 검증 | 중간 | `response.json() as Promise<T>` 대신 zod로 upstream shape 검증. `id` 필드 누락 즉시 감지 |
| anniversaryDate 논리 검증 | 낮음 | `2026-02-30` 같은 존재하지 않는 날짜가 통과됨. `z.string().refine(v => !isNaN(Date.parse(v)))` 추가 |
| SWEETBOOK_API_KEY placeholder 감지 | 낮음 | mock 아닐 때 `"replace_me"` 패턴 경고 log |
| REQUEST_TIMEOUT_MS env화 | 낮음 | 하드코딩 10s → `SWEETBOOK_TIMEOUT_MS` env로 빼면 테스트 환경에서 조정 가능. client.ts TODO에 명시됨 |
| address2 빈 문자열 정규화 | 낮음 | SweetBook이 빈 문자열과 undefined를 다르게 처리하는 경우 대비 |
