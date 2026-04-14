# Code Review — feat/be/backend-mvp (2026-04-14 v2)

**Reviewer persona:** Senior backend engineer (외부 API 정합성, 실패 시나리오 집중)
**Review skill:** `skills/backend-code-review-skill.md`
**Target branch:** `feat/be/backend-mvp`
**Worktree:** `/Users/hanyoung-jeong/Development/sweetgift-be`
**이전 리뷰:** `agents/review/feat-be-backend-mvp-2026-04-14.md`

---

## 이전 리뷰 대비 반영 현황

| 이전 지적 항목 | 상태 |
|---------------|------|
| HTTP 에러를 문자열 파싱으로 분류 (`msg.includes("4")`) | ✅ 해결 — `SweetBookHttpError.status` 정수 분기로 교체 |
| upstream 응답 런타임 검증 없음 | ✅ 해결 — zod `SweetBookBookResponseSchema`, `SweetBookOrderResponseSchema` 적용 |
| POST /orders 멱등성 전무 | ✅ 해결 — `getDraftByBookId` + `status === "ordered"` guard |
| `ordered` 상태 draft에서 책 재생성 차단 누락 | ✅ 해결 — `book_created || ordered` 조건 추가 |
| 테스트 파일 0개 | ✅ 해결 — 4개 파일, 27+ 케이스 (mapUpstreamError 회귀 포함) |
| 인메모리 store → 서버 재시작 시 유실 | ✅ 개선 — JSON 파일 persistence 도입 |

이전 리뷰의 6개 핵심 지적이 전부 반영됐다. 특히 테스트와 파일 persistence는 과제 범위를 넘는 실질적인 개선이다.

---

## 1. 총평

이전 대비 정합성과 안정성이 크게 향상됐다. 에러 분류 로직이 구조화됐고, 테스트가 회귀 방지 역할을 실제로 수행하며, JSON persistence로 데모 중 서버 재시작 시나리오까지 커버된다.

그러나 **3개의 새로운 위험 지점이 발생했다.** `orders.ts`의 조건부 `updateDraft` 패턴이 중복 주문 방어를 깰 수 있고, 테스트가 실제 파일 시스템에 write하며 서로 상태를 오염시킬 수 있다. `writeFileSync` on hot path도 운영 규모에서는 치명적이다.

---

## 2. 가장 위험한 문제 3개

### 문제 1 — orders.ts: `existingDraft`가 null이면 orderId가 저장되지 않음

**파일:** `src/routes/orders.ts:62-67`

```typescript
// 성공 후 orderId 저장 — existingDraft가 null이면 저장 자체를 skip
if (existingDraft) {
  updateDraft(existingDraft.draftId, {
    status: "ordered",
    orderId: upstream.id,
  });
}
```

`bookId`를 직접 전달하되 store에서 역방향 조회가 실패하는 경우가 현실에 존재한다.

- JSON 파일이 손상되어 `load()`가 빈 Map을 반환한 직후
- 서버 재시작 전에 만들어진 book이지만 파일이 없는 환경(테스트)
- 외부에서 `bookId`를 수동으로 생성해 호출하는 경우

이때 `existingDraft === undefined` → SweetBook에는 주문이 생성되지만 `orderId`가 저장되지 않는다. 다음 재시도에서도 `existingDraft`가 null이므로 guard가 발동하지 않아 **중복 주문이 계속 생성**된다.

---

### 문제 2 — draft-store.ts: `writeFileSync` on hot path — 이벤트 루프 블로킹

**파일:** `src/store/draft-store.ts:81-85`

```typescript
function persist(store: Map<string, StoredDraft>): void {
  const path = resolveStorePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify([...store.entries()], null, 2), "utf-8");
}
```

`writeFileSync`는 I/O가 완료될 때까지 Node.js 이벤트 루프 전체를 블로킹한다. `saveDraft`와 `updateDraft` 모두 이 함수를 호출하므로, 모든 write 요청(`POST /album-drafts`, `POST /books`, `POST /orders`)이 파일 쓰기 시간만큼 다른 모든 요청을 대기시킨다.

과제 수준의 트래픽에서는 체감이 없더라도, 코드 주석에 "Synchronous fs calls on hot path"라고 명시하면서도 이유로 "async complexity"를 들고 있는데, `writeFile`(비동기)으로 교체하는 비용이 크지 않고 패턴이 더 정직하다.

---

### 문제 3 — tests: store 싱글톤 오염 + 실제 파일 시스템 write

**파일:** `tests/setup.ts`, `tests/orders.test.ts`

`draft-store.ts`의 `store`는 module-level 싱글톤이다. 각 테스트 파일이 동일한 store 인스턴스를 공유하므로, `orders.test.ts`의 `beforeAll`에서 생성된 draft가 `books.test.ts`의 실행에 영향을 줄 수 있다.

더 심각한 것은 `setup.ts`에 `DATA_DIR` 설정이 없다는 점이다.

```typescript
// tests/setup.ts — 현재
process.env.SWEETBOOK_API_KEY = "sk_test_dummy";
process.env.SWEETBOOK_MOCK = "true";
process.env.CORS_ORIGIN = "http://localhost:3000";
// DATA_DIR이 없으므로 resolveStorePath()는 src/../../../data/drafts.json으로 fallback
```

테스트 중 `saveDraft`, `updateDraft`가 실제 `apps/api/data/drafts.json`에 write한다. CI 환경에서 이 파일이 빌드 아티팩트에 남거나, 테스트 간 실행 순서에 따라 이전 실행의 draft가 남아 있어 테스트가 오염될 수 있다.

---

## 3. 정합성이 깨질 수 있는 시나리오

### 시나리오 A — JSON 파일 손상 후 중복 주문
1. 서버 운영 중 `data/drafts.json` 파티션 오류로 corrupt
2. 서버 재시작 → `load()` catch → 빈 Map 반환, 로그 없음
3. 사용자가 이미 발급된 `bookId`로 주문 재시도
4. `getDraftByBookId(bookId)` → `undefined` (store가 비어 있음)
5. `existingDraft` null → SweetBook 주문 생성 → `if (existingDraft)` 조건 실패 → orderId 저장 안됨
6. 다음 재시도도 동일 — 중복 주문 생성 반복

### 시나리오 B — 동시 Book 생성 race condition (이전 리뷰 미해결)

**`src/routes/books.ts:40-75`**

```
Request A: getDraft() → status="draft" ✓ (guard 통과)
               ↓ await createBook() ...
Request B: getDraft() → status="draft" ✓ (guard 통과, A가 아직 updateDraft 안 함)
               ↓ await createBook() ...
Request A: updateDraft(status="book_created", bookId=A_id)
Request B: updateDraft(status="book_created", bookId=B_id) ← A_id 덮어씀
```

Node.js 단일 스레드이지만 `await` 경계에서 이벤트 루프가 다른 요청을 처리한다. 결과적으로 SweetBook에 책 2개, draft에는 마지막 bookId만 저장된다. 이건 이전 리뷰에서 지적됐지만 이번 PR에서 수정되지 않았고, 주석에도 언급이 없다.

### 시나리오 C — 테스트가 순서에 의존하는 orderId 검증

`orders.test.ts`에서 `bookId`는 `beforeAll`에서 단 하나 생성된다. "happy path" 테스트와 "idempotency" 테스트가 같은 `bookId`를 공유한다.

```typescript
it("creates an order ...", async () => { /* 첫 번째 호출 → 201 */ });
it("returns the SAME orderId on duplicate submission", async () => {
  const res1 = ... // 이미 위 테스트에서 ordered 상태임 → 200 반환
  const res2 = ... // 마찬가지로 200
  // orderId1 === orderId2 → 통과하지만, "201 생성"이 아니라 "200 캐시 반환"을 검증함
});
```

테스트는 통과하지만 검증 의도가 흐려진다. idempotency 테스트가 "새 주문 → 동일 결과 재반환"을 테스트하는지, "이미 ordered → 캐시 반환"만 테스트하는지 불분명하다.

---

## 4. 지금 당장 고쳐야 할 코드

### 수정 1 — orders.ts: `existingDraft` null 여부와 무관하게 orderId 저장

`bookId` → `orderId` 매핑을 별도 Map으로 보관하거나, `updateDraftByBookId` 헬퍼를 추가해 null 경우를 커버한다.

**`src/store/draft-store.ts`에 추가:**
```typescript
// bookId → orderId 독립 매핑 (existingDraft가 null인 경우에도 idempotency 유지)
const orderIndex = new Map<string, string>(); // bookId → orderId

export function getOrderIdByBookId(bookId: string): string | undefined {
  return orderIndex.get(bookId);
}

export function saveOrderId(bookId: string, orderId: string): void {
  orderIndex.set(bookId, orderId);
  // NOTE: 재시작 내구성이 필요하면 drafts.json 외 별도 파일 또는 동일 파일에 section 추가
}
```

**`src/routes/orders.ts` 수정:**
```typescript
// idempotency guard를 bookId → orderId 인덱스 기반으로 변경
const cachedOrderId = getOrderIdByBookId(bookId);
if (cachedOrderId) {
  return reply.send({ data: { orderId: cachedOrderId, bookId, status: "ordered" } });
}

// ... SweetBook 호출 ...

// 성공 후 — existingDraft 여부와 무관하게 저장
saveOrderId(bookId, upstream.id);
if (existingDraft) {
  updateDraft(existingDraft.draftId, { status: "ordered", orderId: upstream.id });
}
```

---

### 수정 2 — tests/setup.ts: DATA_DIR을 임시 경로로 설정

```typescript
// tests/setup.ts
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const tmpDir = mkdtempSync(join(tmpdir(), "sweetgift-test-"));
process.env.DATA_DIR = tmpDir;
process.env.SWEETBOOK_API_KEY = "sk_test_dummy";
process.env.SWEETBOOK_MOCK = "true";
process.env.CORS_ORIGIN = "http://localhost:3000";
```

임시 디렉토리를 사용하면 테스트 후 OS가 정리하고, 실제 `data/drafts.json`을 오염시키지 않는다.

---

### 수정 3 — draft-store.ts: `writeFileSync` → `writeFile` (비동기)

```typescript
import { existsSync, mkdirSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";

async function persist(store: Map<string, StoredDraft>): Promise<void> {
  const path = resolveStorePath();
  mkdirSync(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify([...store.entries()], null, 2), "utf-8");
}

export async function saveDraft(draft: StoredDraft): Promise<void> {
  store.set(draft.draftId, draft);
  await persist(store);
}

export async function updateDraft(
  draftId: string,
  patch: Partial<StoredDraft>,
): Promise<StoredDraft | undefined> {
  const existing = store.get(draftId);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  store.set(draftId, updated);
  await persist(store);
  return updated;
}
```

라우터에서 `await saveDraft(...)`, `await updateDraft(...)` 호출로 변경하면 된다.

---

### 수정 4 — books.ts: 남겨진 오래된 TODO 주석 제거

**`src/routes/books.ts:16-18`**

```typescript
// TODO: return cached bookId if draft.status === "book_created".  ← 이미 구현됨, 삭제
```

이미 `book_created || ordered` guard가 구현됐다. 완료된 TODO를 남겨두면 다음 리뷰어가 미구현으로 오해한다.

---

## 5. 지금 수준에서 충분한 부분

| 항목 | 평가 |
|------|------|
| `SweetBookHttpError` + status 정수 분기 | 이전 문자열 파싱의 근본 원인을 정확히 수정함. false-positive 회귀 테스트도 포함 |
| upstream 응답 zod 검증 | `SweetBookBookResponseSchema.parse(raw)` — `id`가 없으면 즉시 감지 |
| AbortError 감지 방식 | `err.name === "AbortError"` — Node.js `DOMException`이 `instanceof Error`가 아닌 경우까지 커버 |
| JSON 파일 persistence | 서버 재시작 이후 demo 연속성 유지. `DATA_DIR` env로 경로 오버라이드 가능 |
| corrupt 파일 방어 | `load()` catch → 빈 Map 반환으로 서버 crash 방지 |
| 테스트 케이스 설계 | `mapUpstreamError.test.ts`의 regression 케이스("factory error with 4 pages") 특히 좋음 |
| `bookRoutes`의 ordered 상태 guard | `book_created || ordered` 조건이 명확하고 이유도 주석으로 설명 |
| 에러 핸들러 일관성 | ZodError/AppError/Fastify 세 경로 모두 동일한 포맷 유지 |

---

## 6. 다음 단계에서 보강할 부분

| 항목 | 우선순위 | 내용 |
|------|----------|------|
| Book 생성 race condition | 중간 | `getDraft → await createBook → updateDraft` 사이 동시 요청 시 중복 생성. optimistic lock 또는 `draftId`별 mutex. TODO 주석이라도 추가할 것 |
| draft-store.ts corrupt 시 로그 없음 | 낮음 | `catch { return new Map(); }` → `catch (e) { console.error("draft store corrupt, starting fresh", e); return new Map(); }` |
| anniversaryDate 논리 검증 | 낮음 | `2026-02-30` 통과 — `z.string().refine(v => !isNaN(Date.parse(v)))` |
| SWEETBOOK_TIMEOUT_MS env화 | 낮음 | 하드코딩 10s → env var. client.ts TODO에 명시됐으나 미구현 |
| orders.test.ts 테스트 격리 | 낮음 | happy path와 idempotency를 독립 bookId로 분리하면 테스트 의도가 명확해짐 |
| JSON 파일 전체 rewrite | 낮음 | draft 1개 추가할 때도 전체 파일 overwrite. 실제 운영에서는 append-only log 또는 SQLite로 전환 필요 |
