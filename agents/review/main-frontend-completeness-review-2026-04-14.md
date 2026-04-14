# Code Review — main frontend completeness (2026-04-14)

**Reviewer persona:** Senior frontend engineer (제품 흐름, 상태 전이, 데모 신뢰도 집중)
**Review skill:** Product-facing MVP review
**Target branch:** `origin/main`
**Worktree:** `/tmp/sweetgift-origin-main`

---

## 1. 총평

프론트는 이미 과제 제출용 MVP 모양을 갖췄다. 랜딩, 작성, 미리보기, 주문, 완료까지 한 줄기 흐름이 있고, 디자인 톤도 “커플 기념일 선물”이라는 컨셉에 잘 맞는다. 단순 CRUD 화면처럼 보이지 않는 점도 좋다.

하지만 **완성도를 실제로 깎는 문제는 “화면 디자인”보다 상태와 fallback 정책에 있다.** 지금은 백엔드가 실패해도 mock 성공으로 이어질 수 있고, 더미 데이터 로드가 이전 draft/book/order 상태를 지우지 않으며, localStorage 복구값도 계약 검증 없이 그대로 신뢰한다. 즉 “보이는 화면”은 좋지만, “데모 신뢰도”는 아직 덜 다듬어졌다.

---

## 2. 가장 위험한 문제 3개

### 문제 1 — API 실패를 mock 성공으로 덮어써서 가짜 happy path가 만들어짐

**파일:** `apps/web/src/lib/api-client.ts:155-165`, `191-225`, `228-262`

현재 `createAlbumDraft`, `createBook`, `createOrder`는 API 호출 실패 시 일부 경우 mock fallback으로 자동 전환된다.

```typescript
return {
  data: await createMockBook(payload.draftId),
  source: "mock",
};
```

이 정책의 문제는 단순하다.

1. 백엔드가 실제로 실패했는데
2. 프론트는 성공처럼 다음 화면으로 진행하고
3. 완료 화면까지 도달할 수 있다

즉 심사자 입장에서는 “실제 API 흐름이 성공한 건지, mock로 넘어간 건지”를 놓치기 쉽다. 지금처럼 `ModeBadge`가 있더라도, 핵심 CTA가 계속 성공으로 이어지는 구조는 데모 신뢰도를 깎는다.

---

### 문제 2 — `loadSample()`가 이전 draft/book/order 상태를 지우지 않음

**파일:** `apps/web/src/providers/album-flow-provider.tsx:79-84`

현재 더미 데이터 로드는 form만 바꾼다.

```typescript
loadSample: () => {
  setFlow((current) => ({
    ...current,
    form: sampleDraftForm,
  }));
},
```

이 상태에서 이미 이전에 생성한 `draft`, `book`, `order`가 남아 있으면 다음과 같은 문제가 생긴다.

1. 사용자가 새 더미 데이터를 불러옴
2. 화면 폼은 새 데이터처럼 보임
3. 그런데 preview/order/completion은 이전 흐름 상태를 그대로 참조할 수 있음

즉 “지금 보고 있는 폼”과 “실제로 저장된 흐름 상태”가 분리된다.

---

### 문제 3 — localStorage 복구 상태를 계약 검증 없이 그대로 신뢰함

**파일:** `apps/web/src/lib/storage.ts:26-28`

```typescript
return JSON.parse(raw) as PersistedFlow;
```

이 코드는 타입 단언만 있고 runtime validation이 없다. 그래서 다음 경우에 취약하다.

- schema가 바뀐 뒤 옛 snapshot이 남아 있는 경우
- 수동 편집이나 깨진 값이 저장된 경우
- deploy 이후 shape가 달라진 경우

결과적으로 hydration 직후 provider가 잘못된 상태를 앱 전역으로 뿌릴 수 있다. 특히 demo용 앱에서는 “한 번 이상 만진 브라우저”에서만 이상 동작이 나는 문제가 제일 디버깅하기 어렵다.

---

## 3. 완성도가 깨질 수 있는 시나리오

### 시나리오 A — backend 500인데 completion까지 성공
1. 사용자가 Preview에서 책 생성 클릭
2. 백엔드가 `500` 또는 timeout 반환
3. `api-client.ts`가 fallbackEligible로 판단
4. mock `bookId` 생성
5. Order와 Completion까지 진행

결과:
- 데모는 성공해 보이지만 실제 API 연동 신뢰도는 보장되지 않는다

### 시나리오 B — sample load 후 이전 주문 상태가 남아 있음
1. 한 번 happy path 완료
2. Create로 돌아가 `더미 데이터 불러오기`
3. `book/order`는 초기화되지 않음
4. Completion 또는 Order 화면에서 이전 상태와 새 폼이 섞여 보일 수 있음

결과:
- “반복 시연 가능한 앱”이어야 하는데 상태 오염이 생김

### 시나리오 C — 예전 localStorage 때문에 특정 브라우저에서만 깨짐
1. 이전 버전 snapshot이 localStorage에 남음
2. 새 버전 앱 로드
3. unvalidated JSON이 provider에 주입됨
4. 특정 화면에서만 예상 못한 null/shape mismatch 발생

결과:
- 재현이 어려운 데모 버그가 생긴다

---

## 4. 지금 당장 수정할 부분

### 수정 1 — mock fallback 정책을 “초기 데모 모드”로만 제한

가장 안전한 방향은 이렇다.

- `NEXT_PUBLIC_API_BASE_URL`이 없을 때만 mock 허용
- API_BASE_URL이 있는 상태에서 `POST /books`, `POST /orders`가 실패하면 에러를 그대로 보여주기
- 필요하면 `NEXT_PUBLIC_FORCE_MOCK=true` 같은 명시적 플래그로만 fallback 허용

즉 아래 코드는 바꾸는 편이 좋다.

**현재**

```typescript
if (!normalized.fallbackEligible) {
  throw normalized;
}

return {
  data: await createMockBook(payload.draftId),
  source: "mock",
};
```

**권장**

```typescript
if (!API_BASE_URL || process.env.NEXT_PUBLIC_FORCE_MOCK === "true") {
  return {
    data: await createMockBook(payload.draftId),
    source: "mock",
  };
}

throw normalized;
```

이렇게 해야 “실제 API 모드”와 “데모 mock 모드”가 분리된다.

---

### 수정 2 — `loadSample()`에서 흐름 상태 전체 초기화

**권장 수정**

```typescript
loadSample: () => {
  setFlow({
    form: sampleDraftForm,
    draft: null,
    book: null,
    order: null,
    source: "mock",
  });
},
```

더미 데이터를 다시 불러오는 행동은 사실상 “새 데모 시작”과 같다. 따라서 draft/book/order를 비우는 게 맞다.

---

### 수정 3 — localStorage snapshot에 zod validation 추가

추가 권장 파일:

- `packages/contracts` 또는 `apps/web/src/lib/storage-schema.ts`

예시 방향:

```typescript
const persistedFlowSchema = z.object({
  form: ...,
  draft: albumDraftDetailSchema.nullable(),
  book: createBookResponseSchema.nullable(),
  order: createOrderResponseSchema.nullable(),
  source: z.enum(["api", "mock"]),
});
```

그리고 `readFlowSnapshot()`에서:

```typescript
const parsed = persistedFlowSchema.safeParse(JSON.parse(raw));
return parsed.success ? parsed.data : defaultFlow;
```

이렇게 해야 스냅샷 깨짐이 앱 전체 오류로 번지지 않는다.

---

## 5. 지금 수준에서 충분한 부분

| 항목 | 평가 |
|------|------|
| 화면 구성 | Landing → Create → Preview → Order → Completion 흐름이 명확함 |
| 제품 톤 | 기념일 선물 서비스라는 맥락이 UI 카피와 비주얼에 잘 드러남 |
| Preview 중심 구조 | 과제 핵심 화면을 Preview로 잡은 판단이 좋음 |
| shared contracts 사용 | 프론트가 계약 기반으로 백엔드와 연결됨 |
| build/lint/typecheck | 전부 통과해서 기본 품질은 확보됨 |
| dummy assets | 더미 데이터만으로도 즉시 데모 가능한 점이 강점 |

---

## 6. 다음 단계에서 보강할 부분

| 항목 | 우선순위 | 내용 |
|------|----------|------|
| Playwright happy path | 높음 | Create → Preview → Order → Completion 실제 클릭 흐름 테스트 |
| field-level error UX | 중간 | 현재는 배너 중심이라 어느 입력이 문제인지 즉시 보이진 않음 |
| empty state polish | 중간 | `/preview`, `/order`, `/completion` 진입 시 CTA 흐름을 조금 더 단단하게 |
| draft/book/order source 구분 | 중간 | 단계별로 `api/mock` source를 더 명확히 보여주기 |
| accessibility pass | 낮음 | `alt`, label 연결, keyboard focus 순서 점검 |
| README용 스크린샷 | 낮음 | 주요 화면 캡처 확보로 제출물 완성도 상승 |
