# SweetGift 🎁
**"흩어진 기억을 한 권의 다정한 선물로, 감성 기반 지능형 앨범 서비스"**

SweetGift는 커플들이 소중한 추억을 단순히 보관하는 것을 넘어, **'다꾸(다이어리 꾸미기)'의 감성과 'AI의 지능'**을 결합해 세상에 단 하나뿐인 에디토리얼 앨범으로 만들어주는 프리미엄 기프트 플랫폼입니다.

---

## 🚀 왜 'SweetGift' 인가요? (핵심 경쟁력)

### 1. 지능형 스크랩북 (Intelligent Scrapbook)
- **Smart Dropzone**: 사진 여러 장을 던지기만 하세요. 자동으로 추억 카드가 생성되고 업로드가 시작됩니다.
- **Auto-Fill Metadata**: 사진의 촬영 날짜를 분석해 타임라인을 자동으로 구성합니다. 사용자는 기억을 더듬을 필요가 없습니다.
- **Poetic Curation**: 사진의 분위기에 어울리는 시적인 문구를 AI가 자동으로 추천하여 작문의 부담을 없앴습니다.

### 2. 스윗 데코 (Sweet-Decor)
- **Interactive Sticking**: 사진 위 원하는 곳 어디든 ❤️, ✨, 🌸 등 감성 이모지 스티커를 붙여보세요. 
- **Personalization**: 단순한 사진첩이 아닌, 사용자의 취향이 듬뿍 담긴 '나만의 작품'으로 변모합니다.

### 3. 몰입형 감상 경험 (Experience)
- **Magazine-style Preview**: 실제 사진 잡지를 한 페이지씩 넘겨보는 듯한 **가로형 스크롤 뷰어**와 책등 그림자 효과를 통해 실제 결과물의 물성을 미리 체험합니다.
- **Mood BGM Player**: 앨범 감상 중 Classic, Acoustic, Jazz 등 분위기에 맞는 음악을 선택해 정서적 몰입감을 극대화할 수 있습니다.

### 4. 실무 수준의 커머스 옵션
- **Custom Packaging**: 용지 재질(무광/유광), 리본 포장(Red/Gold) 옵션을 직접 선택할 수 있습니다.
- **Dynamic Billing**: 선택한 옵션(기프트 카드 등)에 따라 실시간으로 변하는 가격 요약 정보를 제공합니다.

---

## 🛠 실행 방법 (Quick Start)

### 설치 및 설정
```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정
cp .env.example .env

# 3. .env 파일에 SweetBook API Key 입력 (또는 SWEETBOOK_MOCK=true 설정)
```

### 실행
```bash
# 프론트엔드와 백엔드를 동시에 실행합니다.
pnpm dev
```
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:3001` (API 및 정적 파일 서빙)

---

## 📡 사용한 API 목록

| API 엔드포인트 | 용도 | 사용 기술 |
| :--- | :--- | :--- |
| `POST /api/v1/uploads` | 이미지 업로드 및 UUID 기반 파일 관리 | Fastify Multipart |
| `POST /api/v1/album-drafts` | 앨범 레이아웃 계산 및 초안 생성 | Zod Validation |
| `POST /api/v1/books` | **SweetBook Books API** 연동 (도서 생성) | SweetBook SDK |
| `POST /api/v1/orders` | **SweetBook Orders API** 연동 (주문 접수) | SweetBook SDK |

---

## 🤖 AI 협업 및 설계 의도

본 프로젝트는 **AI 에이전트와 시니어 개발자의 긴밀한 협업**을 통해 단기간에 높은 완성도를 달성했습니다.

- **Claude Code**: 시스템 아키텍처 설계 및 백엔드 비즈니스 로직(DB 영속성, 이미지 처리) 구현.
- **Gemini CLI (Google)**: 프론트엔드 UX 혁신(지능형 드롭존, 스티커 편집기), Typography 폴리싱, QA 검증.
- **설계 핵심**: "Frictionless Input, Emotional Feedback" — 사용자의 입력은 최소화하고, 결과물에서 느끼는 감동은 최대화하는 데 집중했습니다.

---

## ✅ 품질 보증 (QA)
- `pnpm typecheck`: TypeScript 정적 분석 100% 통과.
- `pnpm build`: Next.js 14 프로덕션 빌드 성공.
- **Responsive Design**: 데스크탑 매거진 뷰부터 모바일 최적화 레이아웃까지 완벽 대응.

---
**SweetGift**는 기술로 추억의 온기를 더합니다. _우리의 소중한 순간들이 종이 위에서 영원히 빛날 수 있도록._
