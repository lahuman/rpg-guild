# GEMINI.md - RPG Guild Project Context (v3.0)

## 1. Project Overview
**목표:** 자율과 책임, 그리고 협동이 공존하는 RPG형 협업 툴.
**핵심 철학:**
1. **Everyone is a Supervisor:** 누구나 미션을 만들고, 누구나(본인 포함) 승인한다.
2. **Transparent Logging:** 모든 행동은 기록되어 투명하게 공개된다(상호 감시).
3. **Daily Routine & Party:** 하루 한 번 수행 가능하며, 동료와 함께하는 퀘스트를 지원한다.

## 2. Tech Stack
- **Frontend:** SvelteKit + TypeScript + TailwindCSS
- **Backend:** Firebase (Auth, Firestore)
- **State:** Svelte Stores

## 3. Data Model (Firestore)

### `users` (Global)
- `uid`: string
- `displayName`: string
- `guildId`: string | null

### `guilds` (Collection)
- `name`: string
- `code`: string (초대 코드)

#### ↳ `members` (Sub-collection)
- `uid`: string
- `role`: 'supervisor' (전원 관리자)
- `currentGold`: number (탈퇴 시 소멸)

#### ↳ `missions` (Sub-collection)
- `title`: string
- `description`: string
- `cost`: number (1인당 지급되는 보상)
- `type`: 'solo' | 'party' **(New)**
- `minParticipants`: number (Default: 1)
- `maxParticipants`: number (솔로는 1, 파티는 2 이상)
- `creatorId`: string **(New: 누가 이 미션을 만들었는가)**
- `status`: 'active' | 'inactive'

#### ↳ `mission_logs` (Sub-collection, 수행 기록)
- `missionId`: string
- `missionTitle`: string (스냅샷: 미션 삭제 대비)
- `creatorId`: string (미션 만든 사람, 로깅용)
- `performerIds`: string[] **(New: 수행한 사람 목록 - 본인 포함 가능)**
- `approverId`: string (기록/승인한 사람 - 본인일 수 있음)
- `totalReward`: number (지급된 총 골드 = cost * 인원수)
- `performedDate`: string (YYYY-MM-DD)
- `createdAt`: timestamp

## 4. Business Logic & Requirements

### A. 미션 생성 (Creation)
- **누구나 생성 가능:** 미션 생성 시 `creatorId`에 본인 UID 자동 주입.
- **타입 설정:**
    - **Solo:** 혼자 하는 일 (예: 설거지, 개인 공부). `maxParticipants: 1`.
    - **Party:** 여럿이 하는 일 (예: 회의 참여, 대청소). `maxParticipants: N`.

### B. 미션 수행 및 인증 (Daily Execution)
- **1일 1회 제한 (Rule):**
    - 특정 미션에 대해, **오늘 날짜(`YYYY-MM-DD`)**로 생성된 `mission_logs` 중 `performerIds`에 내 ID가 있다면 수행 불가.
- **본인 인증 / 상호 인증:**
    - 내가 한 일을 내가 체크(Approve)해도 됨.
    - 동료가 한 일을 내가 대신 체크해줘도 됨.
- **파티 수행 로직:**
    - 수행자 선택 모달에서 **여러 명(Multi-select)** 선택 가능.
    - 선택된 **모든 멤버**에게 보상 골드 즉시 지급.
    - `mission_logs` 문서 1개에 참여자 전원 기록 (`performerIds: [A, B, C]`).

### C. 로그 및 감시 (Logging)
- 대시보드에서 "누가(Approver) 누구(Performers)에게 보상을 줬는지" 투명하게 표시.
- **필수 로깅 정보:** 미션명, 수행 날짜, 참여자 목록, 승인자(증인).

### D. 멤버 관리
- 탈퇴/추방 시 해당 유저의 `currentGold` 정보 파기.

## 5. Implementation Plan (Next Sprint)

### Step 4: Co-Management & Party System
1. **미션 생성 UI:** 솔로/파티 선택 및 최대 인원 설정 인풋 추가.
2. **미션 수행 UI:**
   - [완료] 버튼 클릭 시 -> **멤버 다중 선택(Multi-Select)** 모달 팝업.
   - 이미 오늘 수행한 멤버는 선택 불가(Disabled) 처리.
3. **보상 트랜잭션:**
   - `runTransaction` 사용: (로그 생성 + 멤버 N명 골드 업데이트)를 원자적으로 처리.

### Step 5: Economy
- 골드 사용 기능 (기존 계획 유지).