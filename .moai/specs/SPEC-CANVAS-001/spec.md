# SPEC-CANVAS-001: 캔버스 레이아웃 및 플로팅 워크벤치 재설계

## Metadata

| Field | Value |
|---|---|
| **ID** | SPEC-CANVAS-001 |
| **Title** | 좌측 정렬 대형 캔버스 + 우측 고정 세로 확장 워크벤치 |
| **Status** | ✅ Completed |
| **Priority** | Critical |
| **Created** | 2026-04-13 |
| **Completed** | 2026-04-13 |
| **Commit** | `2b01ca0` |

## Overview

기존 캔버스는 생성 이미지가 460px로 하드캡되어 실제 캔버스 면적 대비 너무 작게 표시되었고, 가운데 정렬로 인해 플로팅 워크벤치와 겹치는 문제가 있었다. 이를 해결하기 위해 **이미지를 좌측 정렬 + 최대화**하고, **플로팅 워크벤치를 캔버스 우측 상단에 고정 + 세로로 최대 확장**하도록 레이아웃을 전면 재설계한다.

## Background

- 기존 `.previewStage` 는 `display: grid; place-items: center` 로 이미지를 정가운데 배치
- `.imageCanvas { width: min(100%, 460px) }` 하드캡으로 세로 9:16 이미지만 460×818 로 고정
- 플로팅 워크벤치 기본 위치가 임의의 `x: 756, y: 24` 였고 높이 500px 로 캡되어 캔버스 크기와 무관
- 결과적으로 이미지와 워크벤치가 시각적으로 겹치고 캔버스의 넓은 영역이 낭비됨

## Requirements (EARS Format)

### 1. 캔버스 레이아웃

### REQ-CANVAS-001-01: 스테이지 flex 좌측 정렬
**WHEN** `.previewStage` 가 렌더될 때,
**THE** 시스템 **SHALL** `display: flex; align-items: center; justify-content: flex-start; box-sizing: border-box; overflow: hidden` 스타일을 적용해 내부 이미지를 좌측 정렬해야 한다.

### REQ-CANVAS-001-02: 우측 워크벤치 영역 예약
**THE** `.previewStage` **SHALL** `padding: 24px 380px 24px 24px` 를 설정해 우측 380px 영역을 플로팅 워크벤치 전용 공간으로 예약해야 한다.

### REQ-CANVAS-001-03: 스테이지 최소 높이
**THE** `.previewStage` **SHALL** `min-height: 640px` 을 가져 기본 이미지가 생성되기 전에도 충분한 캔버스 공간을 확보해야 한다.

### REQ-CANVAS-001-04: 이미지 캔버스 하드캡 제거
**THE** `.imageCanvas` **SHALL** 기존의 `width: min(100%, 460px)` 하드캡을 제거하고, `max-width: 100%; flex: 0 0 auto; position: relative` 로 컨텐츠(이미지)에 맞춰 shrink-fit 되어야 한다.

### REQ-CANVAS-001-05: 이미지 최대 치수
**THE** `.sectionImage` **SHALL** 다음 제약으로 렌더되어야 한다:
- `max-width: 100%`
- `max-height: clamp(560px, calc(100vh - 240px), 960px)`
- `width: auto; height: auto`
- 기존 border-radius / box-shadow 유지

### REQ-CANVAS-001-06: 오버레이 좌표 호환성
**THE** `.imageCanvas` **SHALL** `position: relative` 를 유지하며, 내부 절대 위치 오버레이(`react-rnd`)는 이미지 실제 표시 영역을 기준으로 배치되어야 한다.

### REQ-CANVAS-001-07: 반응형 (1220px 이하)
**WHEN** 뷰포트가 1220px 이하일 때,
**THE** `.previewStage` **SHALL** `min-height: 580px; padding-right: 360px` 로 축소되어야 한다.

### REQ-CANVAS-001-08: 반응형 (780px 이하)
**WHEN** 뷰포트가 780px 이하일 때,
**THE** `.previewStage` **SHALL** `padding: 16px; justify-content: center` 로 전환되고, 워크벤치는 이미 `.workbenchShell { width: calc(100% - 24px) !important; left: 12px !important }` 규칙으로 풀너비화되어야 한다.

### 2. 플로팅 워크벤치

### REQ-CANVAS-001-09: 우측 앵커링 (마운트 시)
**WHEN** `PdpEditor` 가 첫 마운트될 때,
**THE** 시스템 **SHALL** 전용 `useEffect` 로 플로팅 워크벤치를 스테이지 우측에 스냅해야 한다:
- `x = stage.clientWidth - workbench.width - 16`
- `y = 16`

### REQ-CANVAS-001-10: 세로 최대화
**WHEN** 동일한 마운트 `useEffect` 가 실행될 때,
**THE** 시스템 **SHALL** 워크벤치 높이를 `Math.max(420, stage.clientHeight - 32)` 로 설정해 캔버스 세로 영역을 상하 16px 여백만 남기고 꽉 채워야 한다.

### REQ-CANVAS-001-11: getWorkbenchPosition 갱신
**THE** `getWorkbenchPosition(stageEl)` 함수 **SHALL** 기존 `Math.min(500, ...)` 높이 하드캡을 제거하고, `Math.max(420, stageHeight - 32)` 를 반환해 "옆으로 붙이기" 버튼 사용 시에도 캔버스 크기에 맞게 재조정되어야 한다.

### REQ-CANVAS-001-12: 초기 상태 fallback
**THE** `workbenchState` `useState` 초기값 **SHALL** `initialDraftState?.workbenchState` 이 없을 때 `{ x: 9999, y: 16, width: 332, height: 680, isOpen: true }` 를 사용해야 한다. `x: 9999` 는 마운트 후 `clampWorkbenchToStage` 에 의해 우측 최대값으로 스냅된다.

### REQ-CANVAS-001-13: 최소 크기 보장
**THE** `react-rnd` 컴포넌트 **SHALL** `minWidth={320}`, `minHeight={420}` 로 사용자 리사이즈 시 최소 크기를 보장해야 한다.

## Acceptance Criteria

### 캔버스
- [x] 이미지가 캔버스 좌측 상단에 정렬되어 렌더
- [x] 1:1, 3:4, 9:16, 4:3, 16:9 모든 비율에서 좌측 정렬 확인
- [x] 뷰포트가 넓을수록 이미지 크기 증가 (기존 460px 고정 → 최대 960px)
- [x] 측정 결과: 16:9 이미지가 460×259 → 756×425로 +64% 확대
- [x] 1220px 이하에서 워크벤치 영역 360px로 축소
- [x] 780px 이하 모바일에서 워크벤치 풀너비 전환 및 이미지 센터 정렬

### 워크벤치
- [x] 첫 마운트 시 우측 상단에 자동 스냅
- [x] 워크벤치 높이가 캔버스 높이에 맞춰 확장 (예: 스테이지 640 → 워크벤치 608)
- [x] 사용자 드래그/리사이즈 시 위치·크기 유지
- [x] "옆으로 붙이기" 버튼으로 재정렬 시에도 세로 최대화 적용
- [x] `bounds="parent"` 로 스테이지 밖 이동 불가

### 기능 무결성
- [x] 오버레이 좌표가 새 캔버스 크기에서도 정상 배치
- [x] `captureSectionBlob` 의 `imageContainerRef.current?.clientWidth` 가 실제 표시 폭 반영
- [x] `html2canvas` 내보내기 품질 유지

## Implementation Files

| 파일 | 변경 사항 |
|---|---|
| `apps/web/app/pdp-maker/pdp-maker.module.css` | `.previewStage`, `.imageCanvas`, `.sectionImage`, 1220px·780px 반응형 |
| `apps/web/app/pdp-maker/PdpEditor.tsx` | `getWorkbenchPosition`, `workbenchState` 초기값, 마운트 `useEffect` (우측 앵커링 + 세로 최대화) |

## Cross-Section Size Table (1440×900 뷰포트 기준)

| 섹션 비율 | 기존 (460 hardcap) | 변경 후 (new) | 증가율 |
|---|---|---|---|
| 1:1 정사각 | 460×460 | 660×660 | **+43%** |
| 9:16 세로 | 460×818 | 472×840 | +3% |
| 3:4 세로 | 460×613 | 630×840 | **+37%** |
| 16:9 가로 | 460×259 | 756×425 | **+64%** |
| 4:3 가로 | 460×345 | 756×567 | **+64%** |

## Out of Scope

- 오버레이 좌표의 상대 비율(%) 변환 — 기존 드래프트 호환성 유지
- 워크벤치 오버레이 대신 도킹(stage 옆 고정) 모드
- 캔버스 줌·팬 기능 (별도 SPEC으로 분리)

## Known Limitations

1. **기존 드래프트**: 460px 기준 픽셀 좌표로 저장된 오버레이는 새 가변 폭 캔버스에서 약간 좌상단 방향으로 치우침. 사용자가 드래그로 재조정 가능
2. **극단적으로 긴 이미지**: `max-height: 960px` 로 캡되어 일부 긴 세로 이미지는 축소 표시
3. **매우 좁은 창 (<1000px)**: 우측 380px 예약으로 이미지 영역 타이트. 1220px 이하 반응형에서 360px로 축소 적용
