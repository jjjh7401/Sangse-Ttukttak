# SPEC-BRAND-001: 상세뚝딱 브랜드 전환

## Metadata

| Field | Value |
|---|---|
| **ID** | SPEC-BRAND-001 |
| **Title** | 앱 전반 "상세뚝딱" 브랜드 일괄 적용 |
| **Status** | ✅ Completed |
| **Priority** | High |
| **Created** | 2026-04-13 |
| **Completed** | 2026-04-13 |
| **Commit** | `2b01ca0` |

## Overview

기존 "한이룸 상세페이지 마법사 2.0" / "PDP Maker 20" 브랜드를 친숙하고 간결한 **"상세뚝딱"** 으로 전환한다. 사용자에게 노출되는 모든 타이틀(메타데이터, 홈 히어로, 카드, 에디터 헤더)을 일괄 변경하되, 설명문과 시스템 에러 메시지는 보존해 기능 영향을 최소화한다.

## Background

- 기존 브랜드명이 길고 내부 조직명을 포함해 최종 사용자에게 부담
- "뚝딱"이라는 의성어가 AI로 빠르게 상세페이지를 만드는 UX를 직관적으로 전달
- 브라우저 탭 제목, 홈 화면, PDP 마법사 진입점, 에디터 홈 버튼 등 진입점 전체에서 일관된 경험 필요

## Requirements (EARS Format)

### REQ-BRAND-001-01: 메타데이터 타이틀
**WHEN** 사용자가 `/`, `/pdp-maker` 페이지를 열 때,
**THE** 애플리케이션 **SHALL** 브라우저 탭 제목을 `"상세뚝딱"` 으로 표시한다.

### REQ-BRAND-001-02: 홈 히어로 타이틀
**WHEN** 사용자가 홈 (`/`) 페이지를 방문할 때,
**THE** 시스템 **SHALL** 메인 `<h1>` 타이틀을 `"상세뚝딱"` 으로 렌더한다.

### REQ-BRAND-001-03: 메인 워크스페이스 카드
**WHEN** 홈 페이지에 워크스페이스 카드가 렌더될 때,
**THE** 시스템 **SHALL** 카드의 `<h2>` 제목을 `"상세뚝딱"` 으로 표시한다.

### REQ-BRAND-001-04: 브랜드 홈 버튼 (PDP Maker Client)
**WHEN** 사용자가 `/pdp-maker` 페이지의 헤더를 볼 때,
**THE** 시스템 **SHALL** 홈으로 돌아가는 브랜드 버튼에 `"상세뚝딱"` 을 표시한다.

### REQ-BRAND-001-05: 브랜드 홈 버튼 (에디터)
**WHEN** 사용자가 에디터 뷰(`PdpEditor`) 헤더를 볼 때,
**THE** 시스템 **SHALL** `.editorHeading` 내부 버튼에 `"상세뚝딱"` 을 표시한다.

### REQ-BRAND-001-06: 설명문 보존
**THE** 시스템 **SHALL** metadata description, 에러 메시지(`pdp.service.ts`), 내부 식별자(`package.json name`)를 기존 값으로 유지해야 한다.

## Acceptance Criteria

- [x] 브라우저 탭 제목이 모든 진입점에서 "상세뚝딱"으로 표시됨
- [x] 홈 페이지 히어로 영역에 "상세뚝딱" h1 노출
- [x] 홈 카드 제목에 "상세뚝딱" 표시
- [x] `/pdp-maker` 상단 브랜드 버튼이 "상세뚝딱" 표시
- [x] 에디터 헤더 브랜드 버튼이 "상세뚝딱" 표시
- [x] `pnpm typecheck` 통과
- [x] 에러 메시지 및 설명문은 원본 유지 (grep 검증)

## Implementation Files

| 파일 | 변경 지점 |
|---|---|
| `apps/web/app/layout.tsx` | metadata.title (L5) |
| `apps/web/app/page.tsx` | metadata.title (L6), `<h1>` (L16), 카드 `<h2>` (L32) |
| `apps/web/app/pdp-maker/page.tsx` | metadata.title (L5) |
| `apps/web/app/pdp-maker/PdpMakerClient.tsx` | 브랜드 홈 버튼 |
| `apps/web/app/pdp-maker/PdpEditor.tsx` | 에디터 헤딩 버튼 |

## Out of Scope

- `package.json`의 `name` 필드 (`hanirum-pdp-maker-20`) — 코드 레벨 식별자이므로 변경하지 않음
- README.md 내 프로젝트 소개 — 별도 문서 업데이트 (SPEC-DOCS-001 후속)
- 에러 메시지 문구 변경 — 시스템 메시지는 보존
