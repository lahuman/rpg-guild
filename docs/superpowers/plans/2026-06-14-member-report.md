# Member Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a member report modal that shows each selected character's current weekly, monthly, and yearly mission completions and shop purchases.

**Architecture:** Add a focused report aggregation module under `src/lib/features/members/`, a small Svelte store that fetches existing `mission_logs` and `usage_logs`, and a `MemberReportModal` opened from each member card. Keep calculation outside the Svelte page so period boundaries and summary totals are directly testable.

**Tech Stack:** SvelteKit, Svelte 5, TypeScript, Firebase Firestore, `node:test`, existing app UI classes and `lucide-svelte` icons.

---

## Current Worktree Guardrails

- The worktree already contains unrelated modified files. Do not revert them.
- Only stage files changed by this plan.
- Do not stage `.superpowers/`; it contains visual brainstorming artifacts.
- If `.superpowers/` becomes distracting, leave it untracked and mention it in the final response.

## File Structure

- Create `src/lib/features/members/report.ts`
  - Defines report period keys, report input types, period boundary helpers, and aggregation functions.
  - No Firebase imports.
- Create `src/lib/features/members/report.test.ts`
  - Uses `node:test` and `node:assert/strict`.
  - Tests period boundaries and mission/purchase aggregation.
- Create `src/lib/stores/memberReportStore.ts`
  - Reads `guilds/{guildId}/mission_logs` and `guilds/{guildId}/usage_logs`.
  - Exposes `missionLogs`, `usageLogs`, `isLoading`, and `error`.
- Create `src/lib/components/MemberReportModal.svelte`
  - Uses `ModalBase`.
  - Owns active period tab state.
  - Renders summary cards, mission detail list, purchase detail list, loading state, error state, and empty states.
- Modify `src/routes/guilds/[guildId]/members/+page.svelte`
  - Adds a report action on desktop member cards.
  - Adds a report action to the mobile action sheet.
  - Opens `MemberReportModal` for the selected character.

## Task 1: Report Aggregation Helper

**Files:**
- Create: `src/lib/features/members/report.test.ts`
- Create: `src/lib/features/members/report.ts`

- [ ] **Step 1: Write failing tests for period boundaries and aggregation**

Create `src/lib/features/members/report.test.ts` with this content:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    buildMemberReport,
    formatReportPeriodLabel,
    getMemberReportPeriod
} from './report.ts';

const memberId = 'char-1';

test('weekly report period starts Monday and ends Sunday', () => {
    const period = getMemberReportPeriod('weekly', new Date('2026-06-10T12:00:00.000Z'));

    assert.equal(period.start.getFullYear(), 2026);
    assert.equal(period.start.getMonth(), 5);
    assert.equal(period.start.getDate(), 8);
    assert.equal(period.start.getHours(), 0);
    assert.equal(period.start.getMinutes(), 0);
    assert.equal(period.end.getFullYear(), 2026);
    assert.equal(period.end.getMonth(), 5);
    assert.equal(period.end.getDate(), 14);
    assert.equal(period.end.getHours(), 23);
    assert.equal(period.end.getMinutes(), 59);
    assert.equal(formatReportPeriodLabel(period), '2026-06-08 - 2026-06-14');
});

test('monthly report period covers the current month', () => {
    const period = getMemberReportPeriod('monthly', new Date('2026-02-14T12:00:00.000Z'));

    assert.equal(formatReportPeriodLabel(period), '2026-02-01 - 2026-02-28');
});

test('yearly report period covers the current year', () => {
    const period = getMemberReportPeriod('yearly', new Date('2026-12-31T12:00:00.000Z'));

    assert.equal(formatReportPeriodLabel(period), '2026-01-01 - 2026-12-31');
});

test('member report includes missions and purchases for the selected period only', () => {
    const period = getMemberReportPeriod('weekly', new Date('2026-06-10T12:00:00.000Z'));

    const report = buildMemberReport({
        memberId,
        period,
        missionLogs: [
            {
                id: 'solo-in-period',
                missionId: 'mission-1',
                missionTitle: 'Solo Quest',
                performerCharacterIds: [memberId],
                performerNames: ['Rin'],
                totalReward: 40,
                createdAt: new Date('2026-06-09T03:00:00.000Z')
            },
            {
                id: 'party-in-period',
                missionId: 'mission-2',
                missionTitle: 'Party Raid',
                performerCharacterIds: [memberId, 'char-2'],
                performerNames: ['Rin', 'Mira'],
                totalReward: 100,
                createdAt: new Date('2026-06-11T03:00:00.000Z')
            },
            {
                id: 'attendance-excluded',
                missionId: 'ATTENDANCE',
                missionTitle: '출석 보상',
                performerCharacterIds: [memberId],
                performerNames: ['Rin'],
                totalReward: 1,
                createdAt: new Date('2026-06-12T03:00:00.000Z')
            },
            {
                id: 'outside-period',
                missionId: 'mission-3',
                missionTitle: 'Old Quest',
                performerCharacterIds: [memberId],
                performerNames: ['Rin'],
                totalReward: 500,
                createdAt: new Date('2026-06-01T03:00:00.000Z')
            },
            {
                id: 'other-member',
                missionId: 'mission-4',
                missionTitle: 'Other Quest',
                performerCharacterIds: ['char-2'],
                performerNames: ['Mira'],
                totalReward: 70,
                createdAt: new Date('2026-06-10T03:00:00.000Z')
            }
        ],
        usageLogs: [
            {
                id: 'purchase-in-period',
                characterId: memberId,
                characterName: 'Rin',
                itemName: 'Coffee Coupon',
                cost: 30,
                usedAt: new Date('2026-06-10T04:00:00.000Z')
            },
            {
                id: 'purchase-outside-period',
                characterId: memberId,
                characterName: 'Rin',
                itemName: 'Old Snack',
                cost: 60,
                usedAt: new Date('2026-05-30T04:00:00.000Z')
            },
            {
                id: 'other-member-purchase',
                characterId: 'char-2',
                characterName: 'Mira',
                itemName: 'Tea',
                cost: 20,
                usedAt: new Date('2026-06-10T04:00:00.000Z')
            }
        ]
    });

    assert.equal(report.summary.missionCount, 2);
    assert.equal(report.summary.missionGoldEarned, 90);
    assert.equal(report.summary.purchaseCount, 1);
    assert.equal(report.summary.purchaseGoldSpent, 30);
    assert.deepEqual(report.missions.map((mission) => mission.title), ['Party Raid', 'Solo Quest']);
    assert.deepEqual(report.purchases.map((purchase) => purchase.itemName), ['Coffee Coupon']);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
node --test src/lib/features/members/report.test.ts
```

Expected: FAIL with an import error because `src/lib/features/members/report.ts` does not exist yet.

- [ ] **Step 3: Implement the report helper**

Create `src/lib/features/members/report.ts` with this content:

```ts
import { formatDateKey, toDateOrNull } from '$lib';

export type MemberReportPeriodKey = 'weekly' | 'monthly' | 'yearly';

type FirestoreDateLike =
    | Date
    | string
    | number
    | { seconds: number }
    | { toDate: () => Date }
    | null
    | undefined;

export interface MemberReportPeriod {
    key: MemberReportPeriodKey;
    label: string;
    start: Date;
    end: Date;
}

export interface MemberMissionLogInput {
    id: string;
    missionId?: string;
    missionTitle?: string;
    performerCharacterIds?: string[];
    performerNames?: string[];
    totalReward?: number;
    createdAt?: FirestoreDateLike;
    performedDate?: string;
}

export interface MemberUsageLogInput {
    id: string;
    characterId?: string;
    characterName?: string;
    itemName?: string;
    cost?: number;
    usedAt?: FirestoreDateLike;
}

export interface MemberReportMissionEntry {
    id: string;
    title: string;
    reward: number;
    date: Date;
    performerNames: string[];
}

export interface MemberReportPurchaseEntry {
    id: string;
    itemName: string;
    cost: number;
    date: Date;
}

export interface MemberReportSummary {
    missionCount: number;
    missionGoldEarned: number;
    purchaseCount: number;
    purchaseGoldSpent: number;
}

export interface MemberReport {
    period: MemberReportPeriod;
    summary: MemberReportSummary;
    missions: MemberReportMissionEntry[];
    purchases: MemberReportPurchaseEntry[];
}

export interface BuildMemberReportInput {
    memberId: string;
    period: MemberReportPeriod;
    missionLogs: MemberMissionLogInput[];
    usageLogs: MemberUsageLogInput[];
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function getMemberReportPeriod(key: MemberReportPeriodKey, baseDate = new Date()): MemberReportPeriod {
    if (key === 'weekly') {
        const start = startOfDay(baseDate);
        const day = start.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + mondayOffset);

        const end = endOfDay(start);
        end.setDate(start.getDate() + 6);

        return { key, label: '주간', start, end };
    }

    if (key === 'monthly') {
        const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);

        return { key, label: '월간', start, end };
    }

    const start = new Date(baseDate.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(baseDate.getFullYear(), 11, 31, 23, 59, 59, 999);

    return { key, label: '년간', start, end };
}

export function formatReportPeriodLabel(period: MemberReportPeriod) {
    return `${formatDateKey(period.start)} - ${formatDateKey(period.end)}`;
}

function isInPeriod(date: Date, period: MemberReportPeriod) {
    const time = date.getTime();
    return time >= period.start.getTime() && time <= period.end.getTime();
}

function getMissionDate(log: MemberMissionLogInput) {
    const createdAt = toDateOrNull(log.createdAt);
    if (createdAt) return createdAt;

    if (typeof log.performedDate === 'string') {
        const performedDate = new Date(`${log.performedDate}T00:00:00`);
        if (!Number.isNaN(performedDate.getTime())) return performedDate;
    }

    return null;
}

function getUsageDate(log: MemberUsageLogInput) {
    return toDateOrNull(log.usedAt);
}

function getMemberMissionReward(log: MemberMissionLogInput) {
    const performerIds = log.performerCharacterIds || [];
    if (performerIds.length === 0) return 0;

    return (log.totalReward || 0) / performerIds.length;
}

export function buildMemberReport(input: BuildMemberReportInput): MemberReport {
    const missions = input.missionLogs
        .filter((log) => log.missionId !== 'ATTENDANCE')
        .filter((log) => (log.performerCharacterIds || []).includes(input.memberId))
        .map((log): MemberReportMissionEntry | null => {
            const date = getMissionDate(log);
            if (!date || !isInPeriod(date, input.period)) return null;

            return {
                id: log.id,
                title: log.missionTitle || '미션 완료',
                reward: getMemberMissionReward(log),
                date,
                performerNames: log.performerNames || []
            };
        })
        .filter((entry): entry is MemberReportMissionEntry => Boolean(entry))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    const purchases = input.usageLogs
        .filter((log) => log.characterId === input.memberId)
        .map((log): MemberReportPurchaseEntry | null => {
            const date = getUsageDate(log);
            if (!date || !isInPeriod(date, input.period)) return null;

            return {
                id: log.id,
                itemName: log.itemName || '아이템 구매',
                cost: log.cost || 0,
                date
            };
        })
        .filter((entry): entry is MemberReportPurchaseEntry => Boolean(entry))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
        period: input.period,
        missions,
        purchases,
        summary: {
            missionCount: missions.length,
            missionGoldEarned: missions.reduce((sum, mission) => sum + mission.reward, 0),
            purchaseCount: purchases.length,
            purchaseGoldSpent: purchases.reduce((sum, purchase) => sum + purchase.cost, 0)
        }
    };
}
```

- [ ] **Step 4: Run report tests and verify they pass**

Run:

```bash
node --test src/lib/features/members/report.test.ts
```

Expected: PASS for all report helper tests.

- [ ] **Step 5: Commit report helper**

Run:

```bash
git add src/lib/features/members/report.ts src/lib/features/members/report.test.ts
git commit -m "feat: add member report aggregation"
```

Expected: Commit includes only the report helper and its test.

## Task 2: Member Report Store

**Files:**
- Create: `src/lib/stores/memberReportStore.ts`

- [ ] **Step 1: Create the Firestore-backed report log store**

Create `src/lib/stores/memberReportStore.ts` with this content:

```ts
import { writable } from 'svelte/store';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '$lib/firebase';
import { getErrorMessage } from '$lib';
import type { MemberMissionLogInput, MemberUsageLogInput } from '$lib/features/members/report';

export interface MemberReportStoreState {
    missionLogs: MemberMissionLogInput[];
    usageLogs: MemberUsageLogInput[];
    isLoading: boolean;
    error: string;
}

const initialState: MemberReportStoreState = {
    missionLogs: [],
    usageLogs: [],
    isLoading: false,
    error: ''
};

function createMemberReportStore() {
    const { subscribe, set, update } = writable<MemberReportStoreState>(initialState);

    return {
        subscribe,

        async fetchLogs(guildId: string) {
            update((state) => ({
                ...state,
                isLoading: true,
                error: ''
            }));

            try {
                const [missionSnapshot, usageSnapshot] = await Promise.all([
                    getDocs(collection(db, `guilds/${guildId}/mission_logs`)),
                    getDocs(collection(db, `guilds/${guildId}/usage_logs`))
                ]);

                set({
                    missionLogs: missionSnapshot.docs.map((missionDoc) => ({
                        id: missionDoc.id,
                        ...missionDoc.data()
                    }) as MemberMissionLogInput),
                    usageLogs: usageSnapshot.docs.map((usageDoc) => ({
                        id: usageDoc.id,
                        ...usageDoc.data()
                    }) as MemberUsageLogInput),
                    isLoading: false,
                    error: ''
                });
            } catch (error) {
                set({
                    ...initialState,
                    error: getErrorMessage(error, '멤버 보고서를 불러오지 못했습니다.')
                });
            }
        },

        reset() {
            set(initialState);
        }
    };
}

export const memberReportStore = createMemberReportStore();
```

- [ ] **Step 2: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS, or fail only on pre-existing unrelated worktree changes. If it fails, inspect the error and fix only errors introduced by `memberReportStore.ts`.

- [ ] **Step 3: Commit member report store**

Run:

```bash
git add src/lib/stores/memberReportStore.ts
git commit -m "feat: add member report log store"
```

Expected: Commit includes only `src/lib/stores/memberReportStore.ts`.

## Task 3: Member Report Modal

**Files:**
- Create: `src/lib/components/MemberReportModal.svelte`

- [ ] **Step 1: Create the modal component**

Create `src/lib/components/MemberReportModal.svelte` with this content:

```svelte
<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import ModalBase from "$lib/components/ModalBase.svelte";
  import { buildMemberReport, formatReportPeriodLabel, getMemberReportPeriod, type MemberReportPeriodKey } from "$lib/features/members/report";
  import { memberReportStore } from "$lib/stores/memberReportStore";
  import type { GuildCharacter } from "$lib/stores/guildStore";
  import { formatDateKey, formatGold, formatKoreanTime } from "$lib";
  import { CalendarDays, Coins, ScrollText, ShoppingBag } from "lucide-svelte";

  export let guildId: string;
  export let character: GuildCharacter;

  const dispatch = createEventDispatcher<{ close: void }>();

  const periodOptions: Array<{ key: MemberReportPeriodKey; label: string }> = [
    { key: "weekly", label: "주간" },
    { key: "monthly", label: "월간" },
    { key: "yearly", label: "년간" }
  ];

  let activePeriod: MemberReportPeriodKey = "weekly";

  onMount(() => {
    memberReportStore.fetchLogs(guildId);
  });

  onDestroy(() => {
    memberReportStore.reset();
  });

  $: selectedPeriod = getMemberReportPeriod(activePeriod);
  $: report = buildMemberReport({
    memberId: character.id || "",
    period: selectedPeriod,
    missionLogs: $memberReportStore.missionLogs,
    usageLogs: $memberReportStore.usageLogs
  });

  function close() {
    dispatch("close");
  }

  function formatEntryDate(date: Date) {
    return `${formatDateKey(date)} ${formatKoreanTime(date)}`;
  }
</script>

<ModalBase
  open={true}
  size="xl"
  title={`${character.name}의 보고서`}
  subtitle={formatReportPeriodLabel(selectedPeriod)}
  on:close={close}
>
  <div class="space-y-5">
    <div class="app-tabs-bar grid grid-cols-3 gap-2 p-2">
      {#each periodOptions as option}
        <button
          type="button"
          class={`app-button px-3 py-3 text-sm ${activePeriod === option.key ? "app-button-primary" : "app-button-secondary"}`}
          on:click={() => (activePeriod = option.key)}
        >
          <CalendarDays size={16} />
          {option.label}
        </button>
      {/each}
    </div>

    {#if $memberReportStore.isLoading}
      <div class="app-card py-12 text-center">
        <div class="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[var(--grey-300)] border-t-[var(--black)]"></div>
        <p class="mt-4 text-sm">보고서를 불러오는 중입니다.</p>
      </div>
    {:else if $memberReportStore.error}
      <div class="app-card px-5 py-10 text-center">
        <ScrollText size={28} class="mx-auto text-[var(--red)]" />
        <h3 class="mt-4 text-xl font-semibold">보고서를 불러오지 못했습니다</h3>
        <p class="mt-2 text-sm text-[var(--text-secondary)]">{$memberReportStore.error}</p>
        <button type="button" class="app-button app-button-secondary mt-5 px-4 py-3 text-sm" on:click={() => memberReportStore.fetchLogs(guildId)}>
          다시 시도
        </button>
      </div>
    {:else}
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="app-metal-stat app-metal-stat-cyan">
          <div class="app-label">Missions</div>
          <div class="mt-2 text-3xl font-bold">{report.summary.missionCount}</div>
          <div class="mt-1 text-sm">수행한 미션</div>
        </div>
        <div class="app-metal-stat">
          <div class="app-label">Earned</div>
          <div class="mt-2 flex items-center gap-2 text-3xl font-bold">
            <Coins size={18} />
            <span>{formatGold(report.summary.missionGoldEarned)}</span>
          </div>
          <div class="mt-1 text-sm">미션 획득 골드</div>
        </div>
        <div class="app-metal-stat app-metal-stat-rose">
          <div class="app-label">Purchases</div>
          <div class="mt-2 text-3xl font-bold">{report.summary.purchaseCount}</div>
          <div class="mt-1 text-sm">구매한 아이템</div>
        </div>
        <div class="app-metal-stat">
          <div class="app-label">Spent</div>
          <div class="mt-2 flex items-center gap-2 text-3xl font-bold text-[var(--red)]">
            <Coins size={18} />
            <span>{formatGold(report.summary.purchaseGoldSpent)}</span>
          </div>
          <div class="mt-1 text-sm">사용한 골드</div>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="app-card p-4 md:p-5">
          <div class="flex items-center gap-2">
            <ScrollText size={18} class="text-[var(--blue)]" />
            <h3 class="text-xl font-semibold">수행한 미션</h3>
          </div>

          {#if report.missions.length === 0}
            <div class="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--grey-300)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
              해당 기간에 수행한 미션이 없습니다.
            </div>
          {:else}
            <div class="mt-5 space-y-3">
              {#each report.missions as mission}
                <div class="rounded-[var(--radius-md)] border border-[var(--border-secondary)] bg-[var(--white)] p-4">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div class="min-w-0">
                      <div class="font-semibold">{mission.title}</div>
                      <div class="mt-1 text-sm text-[var(--text-secondary)]">{formatEntryDate(mission.date)}</div>
                      {#if mission.performerNames.length > 1}
                        <div class="mt-1 text-xs text-[var(--text-secondary)]">함께 수행: {mission.performerNames.join(", ")}</div>
                      {/if}
                    </div>
                    <div class="app-stitch-tag shrink-0 text-[var(--blue)]">
                      +{formatGold(mission.reward)}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </section>

        <section class="app-card p-4 md:p-5">
          <div class="flex items-center gap-2">
            <ShoppingBag size={18} class="text-[var(--red)]" />
            <h3 class="text-xl font-semibold">구매한 아이템</h3>
          </div>

          {#if report.purchases.length === 0}
            <div class="mt-5 rounded-[var(--radius-md)] border border-dashed border-[var(--grey-300)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
              해당 기간에 구매한 아이템이 없습니다.
            </div>
          {:else}
            <div class="mt-5 space-y-3">
              {#each report.purchases as purchase}
                <div class="rounded-[var(--radius-md)] border border-[var(--border-secondary)] bg-[var(--white)] p-4">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div class="min-w-0">
                      <div class="font-semibold">{purchase.itemName}</div>
                      <div class="mt-1 text-sm text-[var(--text-secondary)]">{formatEntryDate(purchase.date)}</div>
                    </div>
                    <div class="app-stitch-tag shrink-0 text-[var(--red)]">
                      -{formatGold(purchase.cost)}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </section>
      </div>
    {/if}
  </div>
</ModalBase>
```

- [ ] **Step 2: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS, or fail only on pre-existing unrelated worktree changes. If it fails on `MemberReportModal.svelte`, fix that component before continuing.

- [ ] **Step 3: Commit modal component**

Run:

```bash
git add src/lib/components/MemberReportModal.svelte
git commit -m "feat: add member report modal"
```

Expected: Commit includes only `src/lib/components/MemberReportModal.svelte`.

## Task 4: Members Page Wiring

**Files:**
- Modify: `src/routes/guilds/[guildId]/members/+page.svelte`

- [ ] **Step 1: Wire the modal into the members page**

Apply these changes to `src/routes/guilds/[guildId]/members/+page.svelte`:

```svelte
<!-- Add this import with the other component imports -->
import MemberReportModal from "$lib/components/MemberReportModal.svelte";
```

```svelte
<!-- Add FileText to the lucide-svelte import list -->
FileText,
```

```svelte
<!-- Add this state next to the other selected character state -->
let selectedCharForReport: GuildCharacter | null = null;
```

```ts
// Add the report action in getMemberSheetActions after fundedMission.
{ id: "report", label: "보고서" },
```

```ts
// Add this branch in handleMemberActionSelect after the fundedMission branch.
if (event.detail.id === "report") {
  selectedCharForReport = char;
  return;
}
```

```svelte
<!-- Add this desktop button after the 지정 미션 button. -->
<button
  on:click={() => (selectedCharForReport = char)}
  class="app-button app-button-secondary desktop-card-action hidden px-4 py-3 text-sm sm:inline-flex"
>
  <FileText size={16} />
  보고서
</button>
```

```svelte
<!-- Add this modal block near the other modal blocks, before MobileActionSheet is fine. -->
{#if selectedCharForReport}
  <MemberReportModal
    guildId={guildId}
    character={selectedCharForReport}
    on:close={() => (selectedCharForReport = null)}
  />
{/if}
```

Do not add `selectedCharForReport` to the page-level `hasOpenModal` expression because `MemberReportModal` uses `ModalBase`, and `ModalBase` already manages body scroll locking.

- [ ] **Step 2: Run Svelte/TypeScript check**

Run:

```bash
npm run check
```

Expected: PASS, or fail only on pre-existing unrelated worktree changes. If it fails on the members page, fix only the report wiring.

- [ ] **Step 3: Commit members page wiring**

Run:

```bash
git add 'src/routes/guilds/[guildId]/members/+page.svelte'
git commit -m "feat: open member reports from roster"
```

Expected: Commit includes only `src/routes/guilds/[guildId]/members/+page.svelte`.

## Task 5: Final Verification

**Files:**
- Verify all files touched by Tasks 1-4.

- [ ] **Step 1: Run the report unit tests**

Run:

```bash
node --test src/lib/features/members/report.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the existing reward chest test as a smoke check for the test runner**

Run:

```bash
node --test src/lib/features/missions/rewardChest.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the Svelte/TypeScript project check**

Run:

```bash
npm run check
```

Expected: PASS. If it fails due unrelated pre-existing worktree changes, capture the exact failing file and line in the final response and confirm the member report files are not the cause.

- [ ] **Step 4: Inspect staged and unstaged changes**

Run:

```bash
git status --short
```

Expected: only intentional report files are modified by this work, plus pre-existing unrelated changes. `.superpowers/` remains untracked and unstaged.

- [ ] **Step 5: Commit any remaining report-only verification fixes**

If Tasks 1-4 already committed all implementation files and no fixes were needed, skip this commit. If final verification required report-only fixes, run:

```bash
git add src/lib/features/members/report.ts src/lib/features/members/report.test.ts src/lib/stores/memberReportStore.ts src/lib/components/MemberReportModal.svelte 'src/routes/guilds/[guildId]/members/+page.svelte'
git commit -m "fix: polish member report verification"
```

Expected: commit includes only report-related files.

## Self-Review

- Spec coverage:
  - Mission and purchase-only scope is covered in Task 1 filtering and Task 3 UI.
  - Current weekly, monthly, yearly periods are covered in Task 1 period helpers and tests.
  - Member card report entry is covered in Task 4.
  - Modal report UI with summary cards and detail lists is covered in Task 3.
  - Existing log reuse is covered in Task 2.
  - Loading, error, and empty states are covered in Task 3.
- Placeholder scan: no unfinished markers, vague edge-case instructions, or copy-by-reference steps remain.
- Type consistency:
  - `MemberReportPeriodKey`, `MemberMissionLogInput`, and `MemberUsageLogInput` are defined in Task 1 and reused by Tasks 2 and 3.
  - `memberReportStore.fetchLogs(guildId)` is defined in Task 2 and used by Task 3.
  - `selectedCharForReport` is defined in Task 4 and used only for the new modal.
