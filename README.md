# 상세뚝딱 (Sangse-Ttukttak)

> **AI 상세페이지 마법사 2.0** — 제품 이미지 한 장으로 전자상거래 상세페이지를 뚝딱 만들어내는 창작 워크벤치

제품 이미지를 업로드하면 Google Gemini가 상품을 분석해 섹션 구조·카피 문구·섹션별 이미지까지 자동 생성하고, 사용자는 드래그 가능한 캔버스 위에서 텍스트와 도형을 배치해 최종 상세페이지를 완성할 수 있습니다. API 키와 작업 초안은 서버가 아닌 **사용자 브라우저에만** 저장되어 프라이버시가 보장됩니다.

---

## ✨ 주요 기능

### 🪄 AI 상품 분석 & 섹션 설계
- 제품 이미지 한 장만 업로드하면 Gemini가 **상품 블루프린트**(Executive Summary, Scorecard, 섹션별 구조)를 자동 생성
- 히어로·베네핏·근거·CTA 등 일반적인 상세페이지 섹션 구조를 자동 제안
- 비율(1:1 / 3:4 / 9:16 / 4:3 / 16:9) 및 톤(프리미엄·모던·테크·미니멀 등) 커스터마이징
- 선택 옵션: **모델(인물) 이미지 업로드** → 히어로우만 사용 또는 전체 섹션 일관성 유지 모드

### 🎨 섹션별 이미지 자동 생성
- 각 섹션에 대해 **스튜디오컷 / 라이프스타일컷 / 아웃도어컷** 3가지 스타일 선택
- 모델 성별·연령대·국가 지정 가능
- 생성 이미지 위에 텍스트·도형 레이어를 자유롭게 배치

### 🖌 캔버스 에디터
- 좌측 정렬된 대형 캔버스로 생성 이미지가 최대 크기로 표시
- **플로팅 워크벤치**가 캔버스 우측에 고정되어 이미지 옵션·텍스트·카피·가이드 탭을 실시간 조작
- `react-rnd` 기반 드래그·리사이즈, 텍스트 배경·그림자·폰트 세부 조정
- **Canvas Workbench 자동 세로 확장**: 캔버스 높이에 맞춰 워크벤치가 풀사이즈로 늘어남

### ↶↷ Undo / Redo 시스템
- `sections`·`sectionOptions`·`overlaysBySection`·`defaultCopyLanguage` 4개 슬라이스 기반 히스토리 추적
- **500ms 디바운스 코얼레싱**: 연속 타이핑은 하나의 undo 엔트리로 병합되어 자연스러운 되돌리기
- **최대 50 엔트리** 스택, 편집 섹션 헤더 우측에 아이콘 버튼 배치
- **키보드 단축키**:
  - `⌘Z` (`Ctrl+Z`) — 되돌리기
  - `⌘⇧Z` (`Ctrl+Shift+Z`) / `⌘Y` — 다시 실행
- 입력 필드 포커스 시 브라우저 네이티브 undo로 자동 양보

### 🗂 드래프트 자동 저장
- 브라우저 **IndexedDB**에 작업 상태 저장 (이미지·블루프린트·레이어·텍스트 편집 이력 포함)
- **30초 자동 저장** + 수동 저장 버튼
- 작업 목록에서 이전 초안을 즉시 복원

### 📦 최종 다운로드
- 현재 섹션 단일 PNG 다운로드 (`html2canvas`)
- 전체 섹션을 **ZIP**으로 일괄 다운로드 (`jszip`)

### 🔐 프라이버시 우선 설계
- **Gemini API 키는 사용자 브라우저(localStorage)에만** 저장 — 서버 미전송
- 작업 초안도 브라우저 내부에만 저장 → 팀 간 공유 없음
- 첫 진입 시 "안내 사항" 팝업으로 정책 안내 (**"하루동안 안보기"** 체크박스, localStorage 24h)

---

## 🛠 기술 스택

| 영역 | 기술 |
|---|---|
| **프론트엔드** | Next.js 14.2.5 (App Router) · React 18.3.1 · TypeScript 5.5.4 |
| **UI** | Tailwind CSS 3.4.10 · Radix UI · Lucide React · react-rnd · html2canvas · jszip |
| **AI** | `@google/genai` (Gemini API) — 브라우저에서 개인 키로 직접 호출 |
| **백엔드** | NestJS 10.4.2 · Node.js (tsx watch) · Prisma 5.17.0 |
| **데이터베이스** | PostgreSQL (관리자·지식베이스·채팅 이력용, PDP 생성과는 무관) |
| **빌드** | pnpm 9.0.0 workspace (모노레포) |

---

## 📁 모노레포 구조

```
sangse-ttukttak/
├── apps/
│   ├── web/          # Next.js 프론트엔드 (포트 3000)
│   │   ├── app/
│   │   │   ├── page.tsx                    # 홈
│   │   │   └── pdp-maker/                  # 메인 워크스페이스
│   │   │       ├── PdpMakerClient.tsx      # 업로드·설정·드래프트
│   │   │       ├── PdpEditor.tsx           # 캔버스 에디터 (undo/redo 포함)
│   │   │       ├── PdpAnnouncementPopup.tsx # 안내 사항 팝업
│   │   │       └── pdp-drafts.ts           # IndexedDB 드래프트 관리
│   │   └── components/
│   └── api/          # NestJS 백엔드 (포트 4000)
│       └── src/
│           ├── main.ts                     # HTTP 서버 + 라우팅
│           └── modules/pdp/                # 상품 분석 & 이미지 생성
├── packages/
│   └── shared/       # 프론트·백엔드 공용 타입 (PDP, Tennis 등)
├── scripts/
│   └── push-all.sh   # 다중 원격 동기화 스크립트
├── package.json      # pnpm workspace 루트
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── tsconfig.base.json
```

---

## 🚀 빠른 시작

### 사전 요구사항
- **Node.js 20 LTS** 또는 **22 LTS**
- **pnpm 9.0.0+** (Corepack 권장: `corepack enable && corepack prepare pnpm@9 --activate`)
- **PostgreSQL** (관리자·채팅 기능을 쓰지 않으면 생략 가능)
- **Google Gemini API 키** — [Google AI Studio](https://aistudio.google.com/apikey)에서 발급

### 1) 의존성 설치

```bash
git clone https://github.com/jjjh7401/Sangse-Ttukttak.git
cd Sangse-Ttukttak
pnpm install
```

### 2) 환경변수 설정 (선택 — 백엔드 사용 시)

`apps/api/.env` 생성:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sangse_ttukttak
PORT=4000
```

`apps/web/.env.local` 생성 (선택):
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000
```

> ⚠️ **주의**: Gemini API 키는 여기에 넣지 마세요. 앱 실행 후 UI의 설정 시트에서 입력합니다 (브라우저 localStorage에만 저장).

### 3) 데이터베이스 마이그레이션 (선택)

```bash
pnpm --filter @runacademy/api prisma:generate
pnpm --filter @runacademy/api prisma:migrate
```

### 4) 개발 서버 실행

**전체(권장)**:
```bash
pnpm dev
```
→ `apps/web` (http://localhost:3000) + `apps/api` (http://127.0.0.1:4000) 병렬 기동

**개별**:
```bash
pnpm --filter @runacademy/web dev   # 프론트만
pnpm --filter @runacademy/api dev   # 백엔드만
```

### 5) 앱 접속 및 초기 설정

1. 브라우저에서 **http://localhost:3000/pdp-maker** 접속
2. 첫 진입 시 "안내 사항" 팝업 확인 → 닫기
3. 상단의 **설정(⚙️)** 아이콘 클릭
4. **개인 Gemini API 키** 입력 → 저장
5. 제품 이미지 업로드 → 톤·비율 설정 → **AI 분석 시작하기**

---

## 🗺 주요 라우트

| URL | 설명 |
|---|---|
| `http://localhost:3000/` | 홈 — 프로젝트 소개 |
| `http://localhost:3000/pdp-maker` | **상세뚝딱** 메인 워크스페이스 |
| `http://127.0.0.1:4000/v1/health` | 백엔드 헬스 체크 |
| `http://localhost:3000/api/pdp/analyze` | (프록시) POST - Gemini 상품 분석 |
| `http://localhost:3000/api/pdp/images` | (프록시) POST - 섹션 이미지 생성 |
| `http://localhost:3000/api/pdp/validate-key` | (프록시) GET - Gemini 키 검증 |

---

## ⌨️ 키보드 단축키 (에디터)

| 단축키 | 동작 |
|---|---|
| `⌘Z` / `Ctrl+Z` | 되돌리기 (Undo) |
| `⌘⇧Z` / `Ctrl+Shift+Z` | 다시 실행 (Redo) |
| `⌘Y` / `Ctrl+Y` | 다시 실행 (Windows 관행) |
| `Escape` | 팝업 닫기 |

> ℹ️ `<input>`·`<textarea>` 입력 중에는 브라우저 네이티브 undo가 우선해서 에디터 히스토리를 방해하지 않습니다.

---

## 🧑‍💻 개발 스크립트

```bash
pnpm dev           # 모든 워크스페이스 개발 서버 병렬 실행
pnpm build         # 전체 빌드
pnpm lint          # ESLint / Next lint
pnpm typecheck     # TypeScript 타입 체크
pnpm test          # 테스트 (현재 placeholder — 추후 테스트 스위트 추가 예정)
```

### 프로덕션 실행

```bash
pnpm build
pnpm --filter @runacademy/web start   # 포트 3000
node apps/api/dist/main.js            # 포트 4000
```

---

## 🔒 보안 & 프라이버시

- **API 키 저장 위치**: 오직 사용자 브라우저 `localStorage` (키: `hanirum-pdp-maker-settings-v1`)
- **요청 전달 방식**: 요청마다 `X-Gemini-Api-Key` 헤더로 프록시 API에 전달, 백엔드는 포워딩만 수행
- **작업 초안**: 브라우저 `IndexedDB`에 저장, 서버 미보관
- **시크릿 모드**: 브라우저 저장 공간이 초기화되면 작업이 사라질 수 있음 (앱 내 안내 팝업에 명시)
- **HTTPS 권장**: 프로덕션 환경에서는 반드시 HTTPS 사용

---

## 🧪 알려진 제한 & 로드맵

### 현재 제한사항
- `pnpm test`는 현재 placeholder — 단위 테스트 스위트 미구성
- 오래된 드래프트의 오버레이 좌표는 460px 기준이라 확장된 캔버스에서 약간 시프트될 수 있음 (드래그로 재조정)
- 시크릿 모드에서는 작업 초안이 세션 종료 시 사라짐

### 향후 계획
- [ ] 단위·통합 테스트 (Vitest) 구축
- [ ] 오버레이 좌표의 상대 비율(%) 변환 마이그레이션
- [ ] 다국어(영문) 카피 자동 생성
- [ ] 섹션 템플릿 라이브러리 확장
- [ ] PWA 지원으로 오프라인 편집 가능

---

## 🤝 기여

이 프로젝트는 현재 개인 창작 워크스페이스로 개발 중입니다. 이슈 제보나 기능 제안은 GitHub Issues를 통해 남겨주세요.

```bash
# 기여 시
git checkout -b feat/your-feature
# 변경 후
git commit -m "feat: 설명"
git push origin feat/your-feature
# GitHub에서 PR 생성
```

---

## 📄 라이선스

이 프로젝트는 [LICENSE](./LICENSE) 파일에 명시된 라이선스를 따릅니다.

---

## 🙏 감사의 말

- **Google Gemini** — 상품 분석 및 이미지 생성 엔진
- **Next.js / React / NestJS** — 견고한 풀스택 기반
- **Tailwind CSS / Radix UI / Lucide** — 깔끔한 UI 빌딩 블록
- **react-rnd** — 캔버스 드래그/리사이즈 경험

---

**Made with ❤️ by [@jjjh7401](https://github.com/jjjh7401)**
