# GEMINI.md - RPG Guild Project Context (v4.0)

## 1. Project Overview
**목표:** 자율과 책임, 그리고 협동이 공존하는 RPG형 협업 툴.
**핵심 철학:**
1. **Everyone is a Supervisor:** 누구나 미션과 상품을 만들고, 누구나(본인 포함) 승인한다.
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
- `guildId`: string | null (탈퇴 시 null로 변경)

### `guilds` (Collection)
- `name`: string
- `description`: string
- `createdAt`: timestamp

#### ↳ `members` (Sub-collection) -> *현재는 캐릭터(characters)로 대체 사용 중*
*(Note: 초기 설계와 달리 현재는 `characters` 컬렉션이 실질적인 멤버(캐릭터) 역할을 수행함)*

#### ↳ `characters` (Sub-collection)
- `name`: string
- `jobClass`: string ('검사', '마법사' 등)
- `currentGold`: number
- `level`: number
- `description`: string

#### ↳ `missions` (Sub-collection)
- `title`: string
- `description`: string
- `cost`: number (1인당 지급되는 보상)
- `type`: 'solo' | 'party'
- `creatorId`: string
- `status`: 'active' | 'inactive'

#### ↳ `items` (Sub-collection) **(New)**
- `name`: string
- `cost`: number (0 이상)
- `icon`: string (Emoji)
- `description`: string
- `createdAt`: timestamp

#### ↳ `mission_logs` (Sub-collection, 수행 기록)
- `missionId`: string
- `missionTitle`: string
- `performerIds`: string[] (수행자 목록)
- `totalReward`: number
- `performedDate`: string (YYYY-MM-DD)

#### ↳ `usage_logs` (Sub-collection, 상점 이용 기록)
- `characterId`: string
- `itemName`: string
- `cost`: number
- `usedAt`: timestamp

## 4. Business Logic & Requirements

### A. 미션 및 상점 관리 (Management)
- **권한:** 길드원(Guild Member)이라면 누구나 미션과 상점 아이템을 **생성(Create), 수정(Update), 삭제(Delete)** 할 수 있음.
- **제약:**
    - 미션 보상과 아이템 가격은 **음수가 될 수 없음**.
    - 상점 아이템 정렬은 클라이언트 사이드에서 처리 (Firestore Index 회피).

### B. 미션 수행 (Daily Execution)
- **1일 1회 제한:** `performedDate`와 `performerIds`를 대조하여 중복 수행 방지.
- **파티 수행:** 다중 선택된 캐릭터들에게 일괄 보상 지급.

### C. 경제 시스템 (Economy)
- **골드 획득:** 미션 수행 시 즉시 캐릭터의 `currentGold` 증가.
- **골드 소비:** 상점 아이템 구매 시 `currentGold` 차감 및 `usage_logs` 기록. (잔액 부족 시 구매 불가)

### D. 멤버 관리 (Lifecycle)
- **길드 탈퇴:** 유저는 언제든 길드를 탈퇴할 수 있음.
    - 탈퇴 시 `users/{uid}`의 `guildId`를 `null`로 초기화.
    - 메인 페이지로 리다이렉트되어 새로운 길드 생성/가입 가능 상태로 전환.
- **초대:** 대시보드 상단의 길드 ID(초대 코드)를 복사하여 공유.

## 5. Implementation Status

### ✅ Completed
- [x] 길드 생성 및 초대 시스템
- [x] 캐릭터 생성/수정/삭제 (CRUD)
- [x] 미션 보드 (Solo/Party 지원, 1일 1회 제한)
- [x] 활동 로그 타임라인
- [x] **상점 시스템 (아이템 관리 CRUD, 구매 기능)**
- [x] **길드 탈퇴 기능**
- [x] Firebase Security Rules 적용

### 🔜 Future Roadmap (Backlog)
- [ ] 캐릭터 레벨업 및 경험치 시스템
- [ ] 통계 대시보드 (주간/월간 활동량 분석)
- [ ] 알림 시스템 (미션 완료, 새 상품 등록 알림)