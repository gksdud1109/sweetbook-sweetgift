# SweetGift

SweetGift는 커플이 기념일 사진, 편지, 짧은 추억 기록을 입력하면 선물용 앨범 초안을 만들고, SweetBook의 `Books API`와 `Orders API`로 실제 제작/주문까지 이어지는 웹 서비스입니다.

이 저장소는 스위트북 바이브코딩 풀스택 과제 제출용 구현입니다.

## 서비스 소개

- 서비스명: `SweetGift`
- 한 줄 설명: 사진과 편지를 기념일 선물용 앨범으로 정리해 주는 커플 대상 포토북 제작 서비스
- 핵심 사용자: `100일`, `200일`, `1주년` 같은 기념일 선물을 준비하는 커플
- 해결하려는 문제:
  - 사진은 많지만 선물용 앨범으로 정리하는 과정이 번거롭다
  - 추억 설명, 표지 이미지, 편지, 배송 정보까지 한 번에 준비하기 어렵다
  - 포토북 제작과 주문 과정이 분리되어 있어 사용 흐름이 끊긴다

## 주요 기능

1. 기념일 정보, 커플 이름, 편지, 추억 데이터를 입력해 앨범 초안을 생성합니다.
2. 표지 이미지와 추억 사진을 업로드할 수 있습니다.
3. 추억 카드에 데코레이션 이모지를 배치해 앨범을 꾸밀 수 있습니다.
4. 생성된 페이지를 미리보기 화면에서 확인한 뒤 인쇄용 책 생성을 요청할 수 있습니다.
5. 배송 정보와 포장 옵션을 입력해 주문을 생성할 수 있습니다.
6. 더미 데이터와 mock 모드를 제공해 API 키가 없어도 기본 흐름을 바로 확인할 수 있습니다.

## 화면 흐름

1. `Landing`
2. `Create Album`
3. `Album Preview`
4. `Order`
5. `Completion`

## 기술 스택

### Frontend

- `Next.js` App Router
- `TypeScript`
- `Tailwind CSS`

### Backend

- `Fastify`
- `TypeScript`
- `Zod`
- `better-sqlite3`
- `sharp`

## 사용한 API 목록

### SweetBook API

| API | 용도 |
| --- | --- |
| `POST /books` | 앨범 초안을 실제 제작 가능한 book으로 생성 |
| `POST /orders` | 생성된 book을 기반으로 주문 생성 |

### 프로젝트 내부 API

| API | 용도 |
| --- | --- |
| `POST /api/v1/uploads` | 이미지 업로드 및 서버 정적 파일 URL 반환 |
| `POST /api/v1/album-drafts` | 입력 데이터를 바탕으로 앨범 초안/미리보기 페이지 생성 |
| `GET /api/v1/album-drafts/:draftId` | 저장된 앨범 초안 조회 |
| `GET /api/v1/recent-drafts` | 최근 생성한 앨범 초안 조회 |
| `POST /api/v1/books` | SweetBook `Books API` 호출 |
| `POST /api/v1/orders` | SweetBook `Orders API` 호출 |

### 구현 방식

과제 안내문에 따라 공식 SDK 대신 `SweetBook REST API direct integration` 방식을 사용했습니다.  
백엔드의 [client.ts](/Users/hanyoung-jeong/Development/sweetgift/apps/api/src/adapters/sweetbook/client.ts) 에서 `fetch` 기반 adapter로 SweetBook API를 호출합니다.

## 실행 방법

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

루트 `.env` 파일을 생성합니다.

```bash
cp .env.example .env
```

필수 환경 변수:

```env
PORT=3001
CORS_ORIGIN=http://localhost:3000
SWEETBOOK_API_KEY=YOUR_SANDBOX_KEY
SWEETBOOK_BASE_URL=https://api-sandbox.sweetbook.com/v1
SWEETBOOK_MOCK=false
BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

로컬 데모만 빠르게 확인하려면 아래처럼 mock 모드로 실행할 수 있습니다.

```env
SWEETBOOK_MOCK=true
```

### 3. 실행

```bash
pnpm dev
```

`pnpm dev`는 프론트엔드와 백엔드를 함께 실행합니다.

개별 실행이 필요하면 아래 명령을 사용할 수 있습니다.

```bash
pnpm dev:web
pnpm dev:api
```

### 4. 접속 주소

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Health Check: `http://localhost:3001/api/v1/health`

## 데모 방법

1. `pnpm dev`로 서버를 실행합니다.
2. `http://localhost:3000/create`로 이동합니다.
3. `샘플 데이터 로드` 버튼을 눌러 더미 데이터를 채웁니다.
4. 필요하면 표지/추억 사진을 업로드하고 데코레이션을 추가합니다.
5. `미리보기 만들기` 버튼을 눌러 앨범 초안을 생성하고 미리보기 화면으로 이동합니다.
6. `실물 도서로 제작하기`를 눌러 book 생성을 요청합니다.
7. 주문 화면에서 배송 정보를 입력하고 주문을 완료합니다.

## 더미 데이터

- 더미 사진: [apps/web/public/dummy/photos](/Users/hanyoung-jeong/Development/sweetgift/apps/web/public/dummy/photos)
- 샘플 초안 데이터: [apps/web/src/data/sample-draft.ts](/Users/hanyoung-jeong/Development/sweetgift/apps/web/src/data/sample-draft.ts)

## AI 도구 사용 내역

| AI 도구 | 활용 내용 |
| --- | --- |
| `Codex` | 기획 요구사항 구체화, MVP/프론트-백엔드 계약 문서 작성, 프론트 버그 수정, 디자인/UI/UX 보정, README 정리 |
| `Claude` | 백엔드 구현, 코드 리뷰, 에이전트 역할/지침 정리 |
| `Gemini CLI` | 프론트 구현 보조 |
| `VS Code` | 전체 개발 및 수정 작업 |

진행 방식은 다음과 같았습니다.

1. 과제 확인 이후, 외부 API 스펙과 요구사항을 먼저 확인했습니다.
2. 기획의 초안을 놓고 Codex와 대화형으로 요구사항을 구체화했고, MVP 요구사항 문서와 프론트-백엔드 계약을 `md` 문서로 정리했습니다.
3. `/agents`에 프론트, 백엔드, 코드리뷰어 역할과 지침을 명시했고, `/skills`에는 각 에이전트가 참고할 수 있는 스킬 문서를 배치했습니다. Git 작업 환경은 `worktree`를 분리해 병렬 작업이 가능하도록 구성했습니다.
4. 프론트/백엔드 작업이 일정 수준 완료되면 리뷰어가 PR 단위로 검토하고, 수정사항을 문서로 정리한 뒤 다시 프론트/백엔드 에이전트가 반영하는 흐름을 여러 번 반복했습니다.
5. 마지막에는 Codex로 요구사항 점검, 프론트 버그 수정, 디자인/UI/UX 정리, README 정리를 진행했습니다.

AI 도구는 구현 보조와 문서 정리에 활용했고, 최종 요구사항 해석과 기능 범위 결정은 직접 검토하며 조정했습니다.

## 설계 의도

- 입력은 가볍게, 결과물은 선물답게 보이도록 구성했습니다.
- 사용자는 기념일 정보, 사진, 편지 정도만 입력하고 나머지 구성은 초안 생성 흐름에서 정리되게 했습니다.
- SweetBook API는 프론트엔드에서 직접 호출하지 않고 백엔드에서만 관리해 API Key가 노출되지 않도록 했습니다.
- 과제 요구사항에 맞춰 `Books API`, `Orders API`, 더미 데이터, 로컬 실행 재현성을 우선했습니다.

## 비즈니스 가능성

- 1차 타겟은 커플 기념일 선물 시장입니다.
- 이후 확장 가능 영역:
  - 웨딩 포토북
  - 가족 여행 앨범
  - 육아 성장 기록
  - 반려동물 추억 앨범
- 단순 인쇄 주문이 아니라 “입력 -> 편집 -> 선물 제작” 경험을 묶어 주는 서비스로 확장할 수 있습니다.

## 더 시간이 있었다면 추가할 기능

- 사진 EXIF 기반 날짜 자동 추출 고도화
- 더 자연스러운 추억 입력용 bulk editor
- 실제 SweetBook 상품 옵션과 더 잘 맞는 편집 레이아웃
- 주문 상태 조회
- 모바일 입력 UX 보강
- 실제 Sandbox/Live 연동 smoke test 자동화

## 테스트 및 검증

주요 검증 대상:

- 백엔드 route 테스트
- 업로드 validation 테스트
- SweetBook upstream error mapping 테스트
- 프론트 typecheck / build

예시 명령:

```bash
pnpm --filter @sweetgift/api test
pnpm --filter @sweetgift/api type-check
pnpm --filter web typecheck
pnpm --filter web build
```

## 제출 전 확인 사항

- 실제 API 키는 커밋하지 않습니다.
- GitHub 저장소는 `Public`으로 제출해야 합니다.
- Google Form 서술형 문항과 GitHub URL 제출은 별도로 진행해야 합니다.

## 추가 개선 아이디어

- 사진 EXIF 기반 날짜 추출과 자동 정렬을 더 정교하게 다듬기
- 추억 입력용 bulk editor와 자동 문구 추천 추가
- 모바일 입력 UX와 편집 흐름 보강
- 실제 SweetBook 상품 옵션과 더 잘 맞는 편집 레이아웃 확장
- 주문 상태 조회와 Sandbox/Live smoke test 자동화
- README와 함께 시연 이미지 또는 짧은 녹화본을 추가해 전달력 보강

## 저장소 구조

```text
apps/
  api/        Fastify backend
  web/        Next.js frontend
packages/
  contracts/  shared request/response schemas
docs/         MVP contract, QA, review notes
skills/       agent skill documents
```
