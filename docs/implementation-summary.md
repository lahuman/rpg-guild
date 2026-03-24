# RPG Guild Implementation Summary

## 개요

이 문서는 현재 프로젝트에 반영된 주요 구현 결과를 정리한다.
설계 방향은 `docs/design-upgrade-plan.md`를 따르고, 실제 코드 반영 내용은 이 문서를 기준으로 확인한다.

## 반영 범위

### 1. 전역 디자인 시스템 정비

- `src/app.css` 기준으로 전역 토큰과 HUD 계열 공통 스타일을 확장했다.
- 주요 공통 레이어:
  - `app-hero`
  - `app-panel`
  - `app-card`
  - `app-hud`
  - `app-action-tile`
  - `app-modal`
  - `app-badge`
- 게이밍 톤을 유지하면서도 정보 위계를 해치지 않도록 `amber`, `cyan`, `rose` 중심 컬러 체계를 사용한다.
- `prefers-reduced-motion` 대응을 포함해 반복 애니메이션 부담을 줄였다.

### 2. 레이아웃 및 메인 허브 고도화

- `src/routes/+layout.svelte`
  - 글로벌 상단 바를 게임 HUD 스타일로 강화했다.
- `src/routes/guilds/[guildId]/+layout.svelte`
  - 길드 내부 탭을 워크스페이스 네비게이션 구조로 정리했다.
- `src/routes/guilds/[guildId]/+page.svelte`
  - 길드 허브를 대시보드 중심 구조로 재구성했다.
  - 대표 멤버 영역은 이제 레벨 우선이 아니라 등급 우선으로 정렬한다.
  - 메인 허브 상단에 최고 등급 멤버 정보를 바로 보여준다.
  - 대표 멤버 카드에서 등급 아이콘, 스테이지, 등급명, 칭호를 핵심 정보로 강조한다.

### 3. 멤버 / 미션 / 모달 UI 정리

- `src/routes/guilds/[guildId]/members/+page.svelte`
  - 캐릭터 카드에 등급/골드/레벨 HUD 구조를 강화했다.
  - 모바일에서도 액션 버튼이 무너지지 않도록 레이아웃을 보정했다.
- `src/routes/guilds/[guildId]/missions/+page.svelte`
  - 미션 선택 카드, 완료 흐름, 보상 상자 연출을 개선했다.
- `src/lib/components/MiniGameModal.svelte`
  - 등급전 전용 시그니처 모달로 재구성했다.
  - 시험 타입 안내, 보상, 패널티, 결과 화면까지 하나의 플로우로 연결했다.
- `src/lib/components/ShopManager.svelte`
  - 관리 화면을 전체 UI 톤에 맞게 정리했다.

### 4. 20단계 등급전 시스템 도입

- `src/lib/stores/guild/types.ts`
  - 신규 등급 체계를 `Rank01`부터 `Rank20`까지 정의했다.
- `src/lib/stores/guild/constants.ts`
  - 20단계 등급 순서, 라벨, 칭호, 아이콘, 보상, 패널티, 시험 구성을 정의했다.
- 단계별 시험 구조:
  - `Rank01` ~ `Rank04`: 가위바위보
  - `Rank05` ~ `Rank08`: 상자 선택
  - `Rank09` ~ `Rank12`: 하이로우
  - `Rank13` ~ `Rank16`: 순방향 룬 기억
  - `Rank17` ~ `Rank19`: 역순 룬 기억
  - `Rank20`: 최고 등급
- 승급 보상 규칙:
  - 기본 승급은 `1포인트`
  - `Rank19 -> Rank20`은 `50포인트`

### 5. 기존 등급 데이터 호환

- 예전 데이터의 `Bronze`, `Silver`, `Gold` 등급값은 DB를 직접 마이그레이션하지 않고 앱에서 호환 처리한다.
- 현재 정책:
  - 모든 레거시 등급값은 런타임에서 `Rank01`로 정규화된다.
- 목적:
  - 기존 멤버가 화면에서 사라지지 않게 유지
  - 모든 기존 멤버가 새 20단계 등급전을 초기 단계부터 다시 진행 가능

### 6. 등급전 결과 처리 및 로그 저장

- `src/lib/stores/guild/characters.ts`
  - 승급 시 보상 포인트 지급
  - 실패 시 단계별 강등 처리
  - 등급전 결과를 `grade_logs`에 저장
- 로그 저장 항목:
  - 캐릭터 이름
  - 이전 등급 / 다음 등급
  - 시험 결과
  - 보상 포인트
  - 패널티 단계 수
  - 수행 일자

### 7. 로그 화면 고도화

- `src/lib/stores/logStore.ts`
  - `mission_logs`, `usage_logs`, `grade_logs`를 통합 로그로 합친다.
  - 날짜 필드가 일부 달라도 `createdAt`, `usedAt`, `performedDate` 순으로 복구한다.
  - 컬렉션별 권한 오류가 발생해도 전체 화면이 죽지 않도록 개별적으로 흡수한다.
- `src/routes/guilds/[guildId]/logs/+page.svelte`
  - 기본 타임라인 보기
  - 멤버 기준 필터
  - 타입 필터
  - 검색
  - 달력 보기
  - 선택 날짜 상세 보기
  - 최근 7일 활동 추이
  - 월별 타입 분포 차트
  - 빈 상태 문구를 실제 무로그 / 필터 결과 없음으로 분리

## 현재 로그 동작 규칙

- 로그는 현재 접속한 `guildId` 기준으로만 읽는다.
- 로그 소스:
  - `guilds/{guildId}/mission_logs`
  - `guilds/{guildId}/usage_logs`
  - `guilds/{guildId}/grade_logs`
- 특정 컬렉션이 Firestore 규칙상 읽기 불가여도, 허용된 컬렉션 로그는 계속 표시한다.

## 관련 주요 파일

- `docs/design-upgrade-plan.md`
- `src/app.css`
- `src/lib/components/MiniGameModal.svelte`
- `src/lib/stores/guild/constants.ts`
- `src/lib/stores/guild/characters.ts`
- `src/lib/stores/guild/types.ts`
- `src/lib/stores/guildStore.ts`
- `src/lib/stores/logStore.ts`
- `src/routes/guilds/[guildId]/+page.svelte`
- `src/routes/guilds/[guildId]/members/+page.svelte`
- `src/routes/guilds/[guildId]/missions/+page.svelte`
- `src/routes/guilds/[guildId]/logs/+page.svelte`

## 확인된 주의사항

- Firestore 규칙에 따라 일부 로그 컬렉션은 읽기 권한이 없을 수 있다.
- 이 경우 전체 로그 화면이 아니라 특정 로그 타입만 비어 보일 수 있다.
- 기존 레거시 등급 데이터는 현재 모두 `Rank01`로 간주된다.
- 로그는 현재 길드 기준으로만 읽기 때문에, 다른 길드에 쌓인 기록은 보이지 않는다.

## 최근 주요 커밋

- `e1e5f5a` `docs: add design upgrade plan`
- `c9155a9` `feat: add guild HUD design system`
- `a8d5a7f` `feat: redesign guild management screens`
- `9339405` `feat: expand grade system and upgrade logs`
