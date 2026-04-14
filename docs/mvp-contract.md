# SweetGift MVP Contract

## 1. Product Summary

### Service concept
`SweetGift` is a gift-focused web app for couples. A user enters anniversary information, photos, short diary moments, and a letter, then the app automatically composes a print-ready memory album and lets the user submit a print order through SweetBook.

### Target user
- A person preparing a milestone gift for their partner
- Common use cases: `100 days`, `200 days`, `1 year`, custom anniversary

### Core value proposition
- Reduce the effort required to turn scattered memories into a polished physical gift
- Turn emotional input into a structured album in a few minutes
- Provide a preview-first flow before creating a book and placing an order

## 2. Recommended Technical Stack

### Overall structure
- Monorepo with `pnpm` workspaces
- Shared language: `TypeScript`

### Frontend
- `Next.js` App Router
- `React` + `TypeScript`
- `Tailwind CSS`
- `zod` for client-side payload validation

### Backend
- `Fastify`
- `TypeScript`
- `zod` for request/response validation
- SweetBook official `Node.js SDK` as first choice

### Why this stack
- Same language on both sides reduces coordination cost
- Next.js is the fastest path to a presentable user-facing UI for the assignment
- Fastify keeps the backend small, explicit, and easy to document
- `zod` gives a single source of truth for contracts and validation
- A monorepo makes local execution and README instructions much simpler

### Explicit non-goals for the MVP
- No auth
- No payment integration
- No real BGM playback
- No cloud/S3 file storage (local disk upload only for the assignment)
- No admin page
- No database requirement for the first submission

## 3. MVP Scope

### Included
- Anniversary type selection
- Anniversary date input
- Couple names input
- Album title and subtitle input
- Letter input
- `3-8` memory moments with date, title, text, photo URL
- Preview of generated album pages
- Book creation using SweetBook `Books API`
- Order submission using SweetBook `Orders API`
- Dummy dataset included in the repository for instant local demo

### Excluded
- User accounts
- Saved drafts across sessions
- Real payment/checkout
- Cloud/S3 media storage (uploads are stored on local disk only)
- Collaborative editing
- AI content generation
- BGM playback and sync

## 4. UX Flow

### Required screens
1. Landing
   - Service pitch
   - CTA to start album creation
2. Create Album
   - Form for anniversary, names, title, letter, and moments
   - Button to load dummy sample data
3. Album Preview
   - Cover page
   - Timeline/moment pages
   - Letter page
   - Summary page
   - CTA to create printable book
4. Order Form
   - Recipient name, phone, address, zip code
   - CTA to submit order
5. Completion
   - Show `bookId`, `orderId`, and status

### UX principles
- One happy path
- Minimal branching
- Preview before irreversible API calls
- Clear pending/error/success states

## 5. Domain Model

### AnniversaryDraft
- `draftId: string`
- `anniversaryType: "100days" | "200days" | "1year" | "custom"`
- `anniversaryDate: string`
- `couple.senderName: string`
- `couple.receiverName: string`
- `title: string`
- `subtitle: string`
- `letter: string`
- `moments: Moment[]`
- `coverPhotoUrl: string`
- `generatedPages: GeneratedPage[]`
- `status: "draft" | "book_created" | "ordered"`

### Moment
- `id: string`
- `date: string`
- `title: string`
- `body: string`
- `photoUrl: string`

### GeneratedPage
- `pageNumber: number`
- `type: "cover" | "moment" | "letter" | "closing"`
- `title?: string`
- `body?: string`
- `photoUrl?: string`

## 6. Environment Variables

### Backend required
- `SWEETBOOK_API_KEY`
- `SWEETBOOK_BASE_URL`
- `PORT`
- `CORS_ORIGIN`
- `BASE_URL` — public base URL of the API server, used to construct upload file URLs (default: `http://localhost:3001`)

### Frontend required
- `NEXT_PUBLIC_API_BASE_URL`

### Rules
- Real keys must never be committed
- Root `.env.example` must document all required values

## 7. API Contract

## 7.1 Conventions

### Base path
- `/api/v1`

### Content type
- `application/json`

### Success response shape
```json
{
  "data": {}
}
```

### Error response shape
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Readable message for UI",
    "details": {}
  }
}
```

### Error codes
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UPSTREAM_TIMEOUT`
- `UPSTREAM_ERROR`
- `BOOK_CREATION_FAILED`
- `ORDER_CREATION_FAILED`
- `INTERNAL_ERROR`

## 7.2 Health Check

### `GET /api/v1/health`

Purpose:
- Used by frontend and reviewers to verify the backend is alive

Response:
```json
{
  "data": {
    "status": "ok"
  }
}
```

## 7.3 Create Album Draft

### `POST /api/v1/album-drafts`

Purpose:
- Validate user input
- Normalize content
- Generate preview page structure

Request:
```json
{
  "anniversaryType": "100days",
  "anniversaryDate": "2026-04-20",
  "couple": {
    "senderName": "민수",
    "receiverName": "지은"
  },
  "title": "Our 100 Days",
  "subtitle": "사진과 편지로 만드는 기념일 앨범",
  "letter": "지은아, 벌써 100일이야.",
  "coverPhotoUrl": "https://images.example.com/cover.jpg",
  "moments": [
    {
      "date": "2026-01-10",
      "title": "처음 만난 날",
      "body": "카페에서 처음 봤던 날",
      "photoUrl": "https://images.example.com/01.jpg"
    },
    {
      "date": "2026-02-14",
      "title": "첫 데이트",
      "body": "비 오는 날 함께 걸었던 밤",
      "photoUrl": "https://images.example.com/02.jpg"
    }
  ]
}
```

Response:
```json
{
  "data": {
    "draftId": "draft_01HXYZ",
    "status": "draft",
    "title": "Our 100 Days",
    "subtitle": "사진과 편지로 만드는 기념일 앨범",
    "coverPhotoUrl": "https://images.example.com/cover.jpg",
    "generatedPages": [
      {
        "pageNumber": 1,
        "type": "cover",
        "title": "Our 100 Days",
        "photoUrl": "https://images.example.com/cover.jpg"
      },
      {
        "pageNumber": 2,
        "type": "moment",
        "title": "처음 만난 날",
        "body": "카페에서 처음 봤던 날",
        "photoUrl": "https://images.example.com/01.jpg"
      },
      {
        "pageNumber": 3,
        "type": "letter",
        "title": "To. 지은",
        "body": "지은아, 벌써 100일이야."
      }
    ]
  }
}
```

Validation rules:
- `title`: `1-40` chars
- `subtitle`: `0-80` chars
- `letter`: `1-2000` chars
- `moments`: minimum `3`, maximum `8`
- `photoUrl`: valid URL string

## 7.4 Get Album Draft

### `GET /api/v1/album-drafts/:draftId`

Purpose:
- Retrieve preview data after navigation or refresh

Response:
```json
{
  "data": {
    "draftId": "draft_01HXYZ",
    "status": "draft",
    "anniversaryType": "100days",
    "anniversaryDate": "2026-04-20",
    "couple": {
      "senderName": "민수",
      "receiverName": "지은"
    },
    "title": "Our 100 Days",
    "subtitle": "사진과 편지로 만드는 기념일 앨범",
    "letter": "지은아, 벌써 100일이야.",
    "coverPhotoUrl": "https://images.example.com/cover.jpg",
    "moments": [],
    "generatedPages": []
  }
}
```

## 7.5 Create Book

### `POST /api/v1/books`

Purpose:
- Convert a draft into a SweetBook printable book

Request:
```json
{
  "draftId": "draft_01HXYZ"
}
```

Response:
```json
{
  "data": {
    "draftId": "draft_01HXYZ",
    "bookId": "book_01HXYZ",
    "status": "book_created"
  }
}
```

Backend responsibilities:
- Read draft data
- Map draft content into SweetBook `Books API` payload
- Return only frontend-safe fields
- Never expose raw API key or internal SDK details

## 7.6 Create Order

### `POST /api/v1/orders`

Purpose:
- Submit an order for an already-created book

Request:
```json
{
  "bookId": "book_01HXYZ",
  "recipient": {
    "name": "홍길동",
    "phone": "010-0000-0000",
    "address1": "서울특별시 강남구 테헤란로 1",
    "address2": "101동 101호",
    "zipCode": "06123"
  }
}
```

Response:
```json
{
  "data": {
    "orderId": "order_01HXYZ",
    "bookId": "book_01HXYZ",
    "status": "ordered"
  }
}
```

Backend responsibilities:
- Validate required recipient fields
- Call SweetBook `Orders API`
- Return stable, minimal response fields

## 7.7 Upload File

### `POST /api/v1/uploads`

Purpose:
- Accept a single image file from the frontend
- Store it on local disk
- Return a publicly accessible URL for use as `coverPhotoUrl` or `moments[].photoUrl`

Request:
- Content-Type: `multipart/form-data`
- Field name: `file`
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Maximum file size: `5MB`

Response:
```json
{
  "data": {
    "url": "http://localhost:3001/uploads/abc123def456.webp",
    "filename": "abc123def456.webp",
    "printQualityWarning": false
  }
}
```

`printQualityWarning` is `true` when the shorter side of the image is below 800px, indicating the image may be too low-resolution for print.

Error codes:
- `VALIDATION_ERROR` — no file provided, unsupported MIME type, magic-byte mismatch, or file exceeds 5MB

Backend responsibilities:
- Validate file magic bytes (not just declared MIME type)
- Validate MIME type and file size before writing to disk
- Convert image to WebP via `sharp` (quality 85, resize if either dimension > 3000px)
- Check print quality (warn if min dimension < 800px)
- Generate a UUID-based filename to prevent collisions
- Save to `DATA_DIR/uploads/` (default: `apps/api/data/uploads/`)
- Serve uploaded files statically at `/uploads/*`
- Return `url` as `BASE_URL + /uploads/<filename>`

Notes:
- Uploaded files are stored on local disk only — not suitable for production multi-instance deployment
- The `data/uploads/` directory is git-ignored; reviewers must start the server before upload URLs are resolvable
- All uploads are converted to `.webp` regardless of input format

## 7.8 Recent Drafts

### `GET /api/v1/recent-drafts`

Purpose:
- Return the 5 most recently created album drafts for quick resume

Response:
```json
{
  "data": {
    "drafts": [
      {
        "draftId": "draft_01HXYZ",
        "title": "Our 100 Days",
        "status": "draft",
        "coverPhotoUrl": "https://images.example.com/cover.jpg",
        "createdAt": 1713090000
      }
    ]
  }
}
```

Notes:
- No user identification — returns the 5 most recently created drafts in the current DB
- `createdAt` is a Unix timestamp (seconds)
- Returns an empty `drafts` array if no drafts exist

## 7.9 Database

All data is persisted in a SQLite database (`DATA_DIR/sweetgift.db`, default: `apps/api/data/sweetgift.db`).

Schema is created automatically on first server startup. To reset the database, delete the file and restart the server.

Tables:
- `drafts` — stores all album drafts including generated pages and status
- `order_index` — stores `bookId → orderId` mapping for order idempotency

## 8. Frontend and Backend Boundary

### Frontend owns
- User input UI
- Form validation before submit
- Dummy data loading
- Preview rendering from `generatedPages`
- Pending, error, success states
- Order form UI

### Backend owns
- Input validation at server boundary
- Draft normalization
- Preview page generation logic
- SweetBook API integration
- Error mapping from upstream to UI-safe error objects
- Environment variable management
- File upload handling and local disk storage
- Static serving of uploaded files at `/uploads/*`

### Shared rules
- Frontend must never call SweetBook directly
- Backend must not return raw upstream response objects to frontend
- Any contract change must be reflected in this file first

## 9. Dummy Data Contract

### Goal
- Reviewers must be able to run the app immediately without writing their own content

### Minimum seed content
- `1` complete sample anniversary draft
- `5-8` sample photos
- `1` sample letter
- `3-5` sample moments

### Suggested paths
- `apps/web/public/dummy/photos/*`
- `apps/web/src/data/sample-draft.ts`

## 10. Repository Layout Recommendation

```text
apps/
  web/
  api/
packages/
  contracts/
docs/
  mvp-contract.md
CLAUDE.md
AGENT.md
README.md
```

## 11. Branching and Parallel Collaboration Contract

### Required branch flow
1. Merge this contract into `main`
2. Cut both branches from the same contract commit
3. Work in parallel with explicit ownership
4. Rebase frequently onto `main`
5. Contract changes go through docs first, then code

### Branch names
- `feat/frontend-mvp`
- `feat/backend-mvp`

### Ownership
- `feat/frontend-mvp`
  - owns `apps/web`
  - owns dummy assets and preview UI
  - may read but must not redefine API contracts
- `feat/backend-mvp`
  - owns `apps/api`
  - owns SweetBook integration
  - owns `.env.example`
  - may read but must not silently change response shapes

### Shared area rule
- `packages/contracts` and `docs/mvp-contract.md` are shared
- If either side needs a contract change:
  - update this file first
  - communicate the exact diff
  - only then implement code changes

### Merge order
1. Shared contract/docs
2. Backend API skeleton with mock responses
3. Frontend integration against mock or stable contract
4. SweetBook real API wiring
5. End-to-end smoke test

## 12. Delivery Checklist

- Frontend shows a real user-facing flow
- Backend owns API key and SweetBook communication
- `Books API` is used
- `Orders API` is used
- Dummy data exists in the repo
- `.env.example` exists
- Local run instructions can be written in one README
- Public GitHub repository is ready for submission
