# SPEC-UX-001: UI 심플화 및 시작 안내사항 팝업

## Metadata

| Field | Value |
|---|---|
| **ID** | SPEC-UX-001 |
| **Title** | 시작 안내사항 팝업 + UI 심플화 |
| **Status** | ✅ Completed |
| **Priority** | High |
| **Created** | 2026-04-13 |
| **Completed** | 2026-04-13 |
| **Commit** | `2b01ca0` |

## Overview

사용 전 필수 안내(API 키 개인 사용, 생성 속도, 브라우저 저장, 시크릿 모드 주의)는 팝업으로 분리해 페이지 노이즈를 줄이고, 각 기능 섹션 하위의 장황한 설명 문구를 제거해 "상세뚝딱"이 추구하는 간결한 UX를 실현한다. Hydration mismatch 에러도 동반 수정한다.

## Background

- 기존 `/pdp-maker` 페이지는 화면 상단에 4개 항목의 "안내 사항" 패널을 항상 표시해 공간 낭비
- Step 1·2 섹션 제목 아래 부가 설명, Empty State 패널의 불릿 가이드가 UI 밀도를 높임
- `PdpMakerClient`의 `useState` 초기화 시 `loadPdpClientSettings()`를 호출해 Hydration mismatch 경고 발생 ("키 필요" vs "개인 API 키")

## Requirements (EARS Format)

### REQ-UX-001-01: 시작 팝업 렌더링
**WHEN** 사용자가 `/pdp-maker` 페이지에 진입할 때,
**THE** 시스템 **SHALL** 페이지 첫 마운트 시점에 "안내 사항" 모달 팝업을 전체 화면 오버레이로 노출해야 한다.

### REQ-UX-001-02: 팝업 콘텐츠 구성
**WHEN** 안내사항 팝업이 렌더링될 때,
**THE** 팝업 **SHALL** 다음 4개 항목을 2열 그리드로 표시해야 한다:
1. "Gemini API 키는 개인용으로 사용됩니다"
2. "생성 속도는 Gemini API 서버 영향이 가장 큽니다"
3. "API 키와 작업 내용은 서버에 저장되지 않습니다"
4. "시크릿 모드에서는 저장 내용이 사라질 수 있습니다"

### REQ-UX-001-03: 하루동안 안보기
**WHEN** 사용자가 "하루동안 안보기" 체크박스를 체크하고 확인 버튼을 누를 때,
**THE** 시스템 **SHALL** localStorage 키 `hanirum:pdp-announcement:hideUntil` 에 `Date.now() + 24h` 타임스탬프를 저장해야 한다.

### REQ-UX-001-04: 1일 숨김 검증
**WHEN** 사용자가 `/pdp-maker` 페이지에 재진입할 때,
**IF** 저장된 `hideUntil` 타임스탬프가 현재 시각보다 미래라면,
**THE** 시스템 **SHALL** 팝업을 표시하지 않아야 한다.

### REQ-UX-001-05: 접근성
**WHEN** 팝업이 렌더될 때,
**THE** 팝업 **SHALL** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 속성을 가져야 하며, ESC 키로 닫히고 body 스크롤을 잠가야 한다.

### REQ-UX-001-06: UI 심플화 — 설명 문구 제거
**THE** 시스템 **SHALL** 다음 8개 설명 문구 및 빈 상태 패널을 `PdpMakerClient.tsx` 에서 제거해야 한다:
- 저장된 작업: "수동 저장과 30초 자동 저장으로…"
- Step 1 원본 이미지: "한 장만 올려도 됩니다…"
- 원본 이미지 Empty State: "업로드 후 바로 미리보기가 들어옵니다" + 불릿 2개
- 모델 이미지 설명: "인물 이미지를 올리면 첫 히어로우에만…"
- 모델 이미지 Empty State: "없어도 상세페이지 생성은 가능합니다" + 불릿 2개
- Step 2 생성 설정: "상품 맥락과 원하는 분위기를 정하면…"
- AI 분석 버튼 하단: "첫 분석에서는 블루프린트와 함께…"
- `notice` 상태 초기값

### REQ-UX-001-07: 에디터 헤더 심플화
**WHEN** 에디터 헤더가 렌더될 때,
**THE** 시스템 **SHALL** wrapper `<div>` + 서브카피 "섹션 컷을 고르고 텍스트를 배치한 뒤…" `<p>` 요소를 제거하고, `<h1>` 을 `<header>` 의 직속 자식으로 배치해야 한다.

### REQ-UX-001-08: Hydration 일치
**WHEN** `PdpMakerClient` 가 서버·클라이언트에서 첫 렌더될 때,
**THE** `clientSettings` useState 초기값 **SHALL** 빈 객체 `{ customGeminiApiKey: "" }` 로 시작해야 하며, `useEffect` 내에서만 localStorage 로드를 수행해야 한다.

## Acceptance Criteria

- [x] 첫 진입 시 안내 팝업이 전체 화면 오버레이로 노출
- [x] "하루동안 안보기" 체크 → 확인 → 24h 내 재진입 시 팝업 숨김
- [x] ESC 키, 오버레이 클릭, 확인 버튼 모두로 팝업 닫기 가능
- [x] 8종 설명 문구 및 빈 상태 패널 모두 제거됨 (grep 검증 통과)
- [x] 에디터 헤더가 `<header>` → `<h1>` 직계 구조로 단순화
- [x] DevTools Console에 Hydration mismatch 경고 없음
- [x] CSS 선택자 `.editorHeader > :first-child` 로 완화되어 z-index 스태킹 유지

## Implementation Files

| 파일 | 역할 |
|---|---|
| `apps/web/app/pdp-maker/PdpAnnouncementPopup.tsx` (신규) | 팝업 클라이언트 컴포넌트 |
| `apps/web/app/pdp-maker/pdp-announcement-popup.module.css` (신규) | 팝업 스타일 |
| `apps/web/app/pdp-maker/PdpMakerClient.tsx` | 설명 문구 제거, 팝업 마운트, hydration 수정 |
| `apps/web/app/pdp-maker/PdpEditor.tsx` | 에디터 헤더 wrapper 제거 |
| `apps/web/app/pdp-maker/pdp-maker.module.css` | `.editorHeader > :first-child` 선택자 |

## Test Notes

수동 검증 시나리오:
1. Chrome 시크릿 창으로 `/pdp-maker` 접속 → 팝업 자동 노출 확인
2. "하루동안 안보기" 체크 → 확인 → 새로고침 → 팝업 미노출
3. DevTools → Application → Local Storage → `hanirum:pdp-announcement:hideUntil` 삭제 → 새로고침 → 팝업 재노출
4. Console 탭에서 React hydration warning 없음 확인
5. 각 섹션 제목 하단에 부가 설명 없음 확인
