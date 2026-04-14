# SweetGift API — Sandbox Smoke Test

## 참고 사항

SweetBook은 과제용 가상 외부 API입니다.
공개된 실제 Sandbox 환경이 확인되지 않아 모든 SweetBook 호출은
**SWEETBOOK_MOCK=true 모드**로 검증합니다.

실제 Sandbox 키가 발급된 경우, 아래 3단계 환경 설정만 변경하면
코드 수정 없이 실제 API로 전환됩니다.

---

## 1. 필요한 환경 변수

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Mock 모드 (키 없이 실행)
SWEETBOOK_API_KEY=sk_test_replace_me
SWEETBOOK_BASE_URL=https://api-sandbox.sweetbook.com/v1
SWEETBOOK_MOCK=true

# 실제 Sandbox로 전환 시
# SWEETBOOK_API_KEY=sk_sandbox_YOUR_ACTUAL_KEY
# SWEETBOOK_BASE_URL=https://api-sandbox.sweetbook.com/v1
# SWEETBOOK_MOCK=false

# Live 환경
# SWEETBOOK_BASE_URL=https://api.sweetbook.com/v1
```

파일 위치: `apps/api/.env` (`.gitignore`에 포함됨)

---

## 2. 서버 실행

```bash
# 저장소 루트에서
pnpm install
cp apps/api/.env.example apps/api/.env

# 백엔드 서버 시작
cd /Users/hanyoung-jeong/Development/sweetgift-be
pnpm dev
# → Server listening at http://0.0.0.0:3001
# → SWEETBOOK_MOCK=true — SweetBook calls are mocked  (mock 모드 확인)
```

---

## 3. 호출 순서 및 기대 응답

### Step 1 — Health check

```bash
curl http://localhost:3001/api/v1/health
```

기대 응답 (`200`):
```json
{ "data": { "status": "ok" } }
```

---

### Step 2 — 앨범 초안 생성

```bash
curl -s -X POST http://localhost:3001/api/v1/album-drafts \
  -H "Content-Type: application/json" \
  -d '{
    "anniversaryType": "100days",
    "anniversaryDate": "2026-04-20",
    "couple": { "senderName": "민수", "receiverName": "지은" },
    "title": "Our 100 Days",
    "subtitle": "사진과 편지로 만드는 기념일 앨범",
    "letter": "지은아, 벌써 100일이야.",
    "coverPhotoUrl": "https://images.example.com/cover.jpg",
    "moments": [
      { "date": "2026-01-10", "title": "처음 만난 날", "body": "카페에서 처음 봤던 날", "photoUrl": "https://images.example.com/01.jpg" },
      { "date": "2026-02-14", "title": "첫 데이트", "body": "비 오는 날", "photoUrl": "https://images.example.com/02.jpg" },
      { "date": "2026-03-01", "title": "삼일절", "body": "공원 산책", "photoUrl": "https://images.example.com/03.jpg" }
    ]
  }' | jq .
```

기대 응답 (`201`):
```json
{
  "data": {
    "draftId": "draft_xxxxxxxxxx",
    "status": "draft",
    "title": "Our 100 Days",
    "generatedPages": [ ... ]
  }
}
```

→ `draftId` 저장 후 다음 단계 진행

---

### Step 3 — 책 생성

```bash
DRAFT_ID="<Step 2의 draftId>"

curl -s -X POST http://localhost:3001/api/v1/books \
  -H "Content-Type: application/json" \
  -d "{\"draftId\": \"$DRAFT_ID\"}" | jq .
```

기대 응답 (`201`):
```json
{
  "data": {
    "draftId": "draft_xxxxxxxxxx",
    "bookId": "book_mock_xxxxxxxxxxxxxxx",
    "status": "book_created"
  }
}
```

→ `bookId` 저장. 동일 `draftId`로 재요청 시 동일 `bookId` 반환 (idempotency 확인)

---

### Step 4 — 주문 생성

```bash
BOOK_ID="<Step 3의 bookId>"

curl -s -X POST http://localhost:3001/api/v1/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"bookId\": \"$BOOK_ID\",
    \"recipient\": {
      \"name\": \"홍길동\",
      \"phone\": \"010-0000-0000\",
      \"address1\": \"서울특별시 강남구 테헤란로 1\",
      \"address2\": \"101동 101호\",
      \"zipCode\": \"06123\"
    }
  }" | jq .
```

기대 응답 (`201`):
```json
{
  "data": {
    "orderId": "order_mock_xxxxxxxxxxxxxxx",
    "bookId": "book_mock_xxxxxxxxxxxxxxx",
    "status": "ordered"
  }
}
```

→ 동일 `bookId`로 재요청 시 동일 `orderId` 반환 (idempotency 확인)

---

### Step 5 — 서버 재시작 후 연속성 확인

```bash
# 서버 재시작
# Ctrl+C → pnpm dev

# Step 2에서 받은 draftId로 조회
curl http://localhost:3001/api/v1/album-drafts/$DRAFT_ID
# → 200 with full draft data (JSON 파일 persistence로 생존 확인)
```

---

## 4. 에러 시나리오 확인

### Validation error
```bash
curl -s -X POST http://localhost:3001/api/v1/album-drafts \
  -H "Content-Type: application/json" \
  -d '{"title": ""}' | jq .
# → 400 VALIDATION_ERROR
```

### NOT_FOUND
```bash
curl http://localhost:3001/api/v1/album-drafts/draft_doesnotexist | jq .
# → 404 NOT_FOUND
```

### 잘못된 zipCode
```bash
curl -s -X POST http://localhost:3001/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"bookId":"b","recipient":{"name":"홍","phone":"010-0000-0000","address1":"서울","address2":"","zipCode":"abc"}}' | jq .
# → 400 VALIDATION_ERROR
```

---

## 5. 최종 검증 날짜

- Mock 모드 전체 흐름 검증: 2026-04-14
- 실제 Sandbox 검증: 미실시 (SweetBook 공개 Sandbox 미확인)
