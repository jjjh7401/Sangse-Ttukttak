# SPEC Index

이 디렉토리는 "상세뚝딱" 프로젝트의 **EARS 형식 요구사항 명세서**(SPEC) 모음입니다. 각 SPEC은 하나의 의미 단위(기능·리팩토링·UX 개선 등)를 담으며, 구현 완료 여부와 관련 파일을 함께 기록합니다.

## SPEC List

| ID | Title | Status | Priority |
|---|---|---|---|
| [SPEC-BRAND-001](./SPEC-BRAND-001/spec.md) | 상세뚝딱 브랜드 전환 | ✅ Completed | High |
| [SPEC-UX-001](./SPEC-UX-001/spec.md) | 시작 안내사항 팝업 + UI 심플화 | ✅ Completed | High |
| [SPEC-EDITOR-001](./SPEC-EDITOR-001/spec.md) | 카피·도형 편집 Undo/Redo 시스템 | ✅ Completed | Critical |
| [SPEC-CANVAS-001](./SPEC-CANVAS-001/spec.md) | 캔버스 레이아웃 + 플로팅 워크벤치 재설계 | ✅ Completed | Critical |

## Format Convention

각 SPEC은 다음 구조를 따릅니다:

1. **Metadata** — ID, Title, Status, Priority, 커밋 해시
2. **Overview** — 요약
3. **Background** — 문제 상황 / 배경
4. **Requirements (EARS Format)** — `WHEN ... THE ... SHALL ...` 형식의 요구사항
5. **Acceptance Criteria** — 체크리스트 형태의 검수 조건
6. **Implementation Files** — 변경된 파일 맵
7. **Out of Scope** / **Known Limitations** — 제외 범위 및 알려진 제약

## EARS Keywords

- **WHEN** `<trigger>`: 조건 트리거
- **THE** `<system>`: 주체 (시스템·컴포넌트)
- **SHALL** `<behavior>`: 필수 동작
- **IF** `<condition>`: 조건부 분기
- **SHALL NOT**: 금지 동작

## 새 SPEC 추가 방법

```bash
# 디렉토리 생성
mkdir -p .moai/specs/SPEC-<CATEGORY>-<NUMBER>

# spec.md 작성 (위 Format Convention 참고)
$EDITOR .moai/specs/SPEC-<CATEGORY>-<NUMBER>/spec.md

# INDEX에 추가
$EDITOR .moai/specs/README.md
```
