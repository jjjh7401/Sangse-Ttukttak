# SPEC-EDITOR-001: 에디터 Undo/Redo 시스템

## Metadata

| Field | Value |
|---|---|
| **ID** | SPEC-EDITOR-001 |
| **Title** | 카피·도형 편집 Undo/Redo 시스템 + 키보드 단축키 |
| **Status** | ✅ Completed |
| **Priority** | Critical |
| **Created** | 2026-04-13 |
| **Completed** | 2026-04-13 |
| **Commit** | `2b01ca0` |

## Overview

상세페이지 제작 중 텍스트·도형 레이어 편집에서 실수를 복구할 수 있도록 **Undo/Redo 히스토리 엔진**과 **키보드 단축키**(⌘Z / ⌘⇧Z / ⌘Y)를 구현한다. 편집 섹션 헤더 우측에 아이콘 버튼을 배치해 마우스 접근성도 확보한다.

## Background

- 기존 에디터는 편집 이력을 저장하지 않아 오타나 실수 배치를 되돌릴 수 없었음
- Gemini 이미지 재생성·옵션 변경 후 이전 상태로 돌아갈 수 없어 사용자가 반복 작업 부담
- 캔버스 편집 도구의 표준 UX인 `⌘Z` 가 동작하지 않아 사용자 기대와 불일치

## Requirements (EARS Format)

### REQ-EDITOR-001-01: 히스토리 추적 대상
**THE** 시스템 **SHALL** 다음 4개 상태 슬라이스만 히스토리로 추적해야 한다:
- `sections` (SectionBlueprint[])
- `sectionOptions` (Record<number, ImageGenOptions>)
- `overlaysBySection` (Record<number, CanvasLayer[]>)
- `defaultCopyLanguage` (PdpCopyLanguage)

**THE** 시스템 **SHALL NOT** `currentSectionIndex`, `notice`, `workbenchTab`, `workbenchState`, `selectedOverlayId`, `editingOverlayId` 등의 UI/내비게이션 상태를 히스토리에 포함하지 말아야 한다.

### REQ-EDITOR-001-02: 디바운스 코얼레싱
**WHEN** 추적 상태가 변경될 때,
**THE** 시스템 **SHALL** 500ms 타이머를 시작하고, 타이머 만료 전 추가 변경이 감지되면 타이머를 재설정(coalesce)하여 연속 편집(타이핑 등)을 하나의 undo 엔트리로 병합해야 한다.

### REQ-EDITOR-001-03: 스택 상한
**THE** 히스토리 스택 **SHALL** 최대 50개 엔트리를 유지하며, 초과 시 가장 오래된 엔트리를 `shift()` 로 제거해야 한다.

### REQ-EDITOR-001-04: Undo 동작
**WHEN** 사용자가 Undo를 트리거할 때,
**THE** 시스템 **SHALL**:
1. 대기 중인 디바운스 타이머를 즉시 flush
2. `past` 스택에서 이전 스냅샷을 pop
3. 현재 상태를 `future` 스택에 push
4. 이전 스냅샷을 4개 state setter에 적용
5. `selectedOverlayId`, `editingOverlayId`, `activeColorPalette` 을 초기화

### REQ-EDITOR-001-05: Redo 동작
**WHEN** 사용자가 Redo를 트리거할 때,
**THE** 시스템 **SHALL** `future` 스택에서 스냅샷을 pop하여 동일한 방식으로 적용해야 한다.

### REQ-EDITOR-001-06: 재귀 방지 플래그
**WHEN** Undo/Redo가 setState를 호출할 때,
**THE** 시스템 **SHALL** `isApplying` 플래그를 설정하여 히스토리 추적 useEffect가 해당 변경을 새 엔트리로 기록하지 않도록 해야 한다.

### REQ-EDITOR-001-07: 새 편집 시 Redo 무효화
**WHEN** 사용자가 Undo 후 새로운 편집을 시작할 때,
**THE** 시스템 **SHALL** `future` 스택을 즉시 초기화하고 UI의 Redo 버튼을 비활성화해야 한다.

### REQ-EDITOR-001-08: 키보드 단축키
**WHEN** 사용자가 다음 단축키를 누를 때,
**THE** 시스템 **SHALL** 해당 동작을 실행해야 한다:
- `⌘Z` / `Ctrl+Z` (no Shift) → Undo
- `⌘⇧Z` / `Ctrl+Shift+Z` → Redo
- `⌘Y` / `Ctrl+Y` → Redo (Windows 관행)

### REQ-EDITOR-001-09: 입력 필드 양보
**WHEN** 키보드 이벤트의 타겟이 `<input>`, `<textarea>`, 또는 `contentEditable` 요소일 때,
**THE** 시스템 **SHALL** preventDefault를 호출하지 않고 브라우저 네이티브 undo에 양보해야 한다.

### REQ-EDITOR-001-10: UI 버튼 배치
**WHEN** 에디터가 렌더될 때,
**THE** 시스템 **SHALL** 편집 섹션 헤더의 우측 `canvasActions` 영역에 Undo/Redo 아이콘 버튼을 페이지네이션(Prev/Next) 버튼 앞에 배치하고, 수직 구분선(`canvasActionsDivider`)으로 두 그룹을 분리해야 한다.

### REQ-EDITOR-001-11: 버튼 상태
**THE** Undo/Redo 버튼 **SHALL**:
- `past` 스택이 비어있고 pendingLive도 없으면 Undo 버튼 disabled
- `future` 스택이 비어있으면 Redo 버튼 disabled
- `title` 속성에 단축키 힌트 (`"되돌리기 (⌘Z)"`, `"다시 실행 (⌘⇧Z)"`) 제공

## Acceptance Criteria

- [x] 텍스트 레이어 추가 → Cmd+Z → 레이어 사라짐
- [x] 연속 타이핑 ("안녕하세요") 후 Cmd+Z 한 번 → 타이핑 이전 상태 복원
- [x] Cmd+Z 여러 번 → Cmd+Shift+Z 여러 번으로 정확히 왕복
- [x] 섹션 이미지 재생성 후 Cmd+Z → 이전 이미지로 복원
- [x] 버튼 클릭 동작이 키보드 단축키와 동일한 결과
- [x] `<textarea>` 포커스 중 Cmd+Z → 브라우저 기본 undo (에디터 히스토리 간섭 없음)
- [x] Undo 후 새 편집 시 Redo 버튼 즉시 비활성화
- [x] 50 엔트리 초과 시 가장 오래된 엔트리 자동 제거

## Implementation Files

| 파일 | 역할 |
|---|---|
| `apps/web/app/pdp-maker/PdpEditor.tsx` | `EditorHistoryState` 타입, `historyRef`, `flushPendingHistoryCommit`, `applyHistorySnapshot`, `handleUndo`, `handleRedo`, 키보드 리스너, UI 버튼 |
| `apps/web/app/pdp-maker/pdp-maker.module.css` | `.canvasActionsDivider` 수직 구분선 |

## Out of Scope

- 오버레이 좌표의 상대 비율(%) 변환 — 기존 픽셀 좌표 유지
- 드래프트 저장 포맷에 히스토리 직렬화 — 세션 내 메모리에만 유지
- 섹션 전환 시 히스토리 보존 — `currentSectionIndex` 변경은 히스토리와 독립

## Test Notes

수동 검증 시나리오:
1. 에디터 진입 → 텍스트 레이어 추가 → Cmd+Z → 레이어 사라짐 확인
2. 레이어 추가 → "안녕" 타이핑 → Cmd+Z 한 번 → 빈 레이어로 복원
3. Cmd+Shift+Z → 타이핑 복원
4. 좌측 사이드바 textarea 포커스 → Cmd+Z → 브라우저 기본 undo 동작
5. 50회 이상 편집 반복 → 메모리 누수 없음
