<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import ModalBase from "$lib/components/ModalBase.svelte";
  import {
    buildMemberReport,
    formatReportPeriodLabel,
    getMemberReportPeriod,
    type MemberReportPeriodKey
  } from "$lib/features/members/report";
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
