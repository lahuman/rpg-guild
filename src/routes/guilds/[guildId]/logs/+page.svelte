<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { requireRouteParam } from "$lib";
  import { logStore } from "$lib/stores/logStore";
  import { ArrowLeft, Coins, ScrollText, ShoppingBag, Shield } from "lucide-svelte";

  const guildId = requireRouteParam($page.params.guildId, "guildId");

  let isLoading = true;
  let isLoadingMore = false;
  let currentLimit = 50;

  async function loadData() {
    try {
      await logStore.fetchLogs(guildId, currentLimit);
    } finally {
      isLoading = false;
    }
  }

  onMount(async () => {
    await loadData();
  });

  async function handleLoadMore() {
    isLoadingMore = true;
    currentLimit += 50;
    await loadData();
    isLoadingMore = false;
  }

  function formatDate(dateStr: string) {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (dateStr === today) return "오늘";
    if (dateStr === yesterday) return "어제";
    return dateStr;
  }

  $: groupedLogs = $logStore;
  $: totalLogs = groupedLogs.reduce((sum, group) => sum + group.logs.length, 0);
  $: missionLogs = groupedLogs.reduce(
    (sum, group) => sum + group.logs.filter((log) => log.type === "mission").length,
    0
  );
  $: usageLogs = totalLogs - missionLogs;
</script>

<div class="space-y-5 pb-20">
  <section class="app-panel-strong reveal-rise rounded-[2rem] px-5 py-6 md:px-8 md:py-8">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div class="eyebrow">Guild History</div>
        <div class="mt-4 flex items-center gap-3">
          <a
            href={`/guilds/${guildId}`}
            class="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={18} />
          </a>
          <div>
            <h1 class="section-title text-3xl text-white md:text-4xl">길드 활동 기록</h1>
            <p class="mt-2 text-sm leading-6 text-slate-400 md:text-base">
              미션 완료와 아이템 사용 내역을 날짜 단위 타임라인으로 정리합니다.
            </p>
          </div>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="app-stat min-w-[10rem]">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Entries</div>
          <div class="mt-2 text-3xl font-bold text-white">{totalLogs}</div>
        </div>
        <div class="app-stat min-w-[10rem]">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Mission</div>
          <div class="mt-2 text-3xl font-bold text-cyan-200">{missionLogs}</div>
        </div>
        <div class="app-stat min-w-[10rem]">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Usage</div>
          <div class="mt-2 text-3xl font-bold text-rose-200">{usageLogs}</div>
        </div>
      </div>
    </div>
  </section>

  {#if isLoading}
    <section class="app-card py-16 text-center">
      <div class="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent"></div>
      <p class="mt-4 text-sm text-slate-400">기록을 불러오는 중입니다.</p>
    </section>
  {:else if groupedLogs.length === 0}
    <section class="app-card px-6 py-16 text-center">
      <ScrollText size={28} class="mx-auto text-slate-500" />
      <h2 class="mt-4 text-2xl font-semibold text-white">아직 기록된 활동이 없습니다</h2>
      <p class="mt-3 text-sm text-slate-400">미션 완료나 아이템 사용이 발생하면 여기에 누적됩니다.</p>
    </section>
  {:else}
    <section class="stagger-grid space-y-5">
      {#each groupedLogs as group}
        <article class="app-card p-4 md:p-6">
          <div class="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              {formatDate(group.date)}
            </div>
            <div class="text-sm text-slate-500">{group.date}</div>
          </div>

          <div class="space-y-3">
            {#each group.logs as log}
              <div class="rounded-[1.25rem] border border-white/10 bg-white/4 p-3.5 transition hover:bg-white/6 md:p-4">
                <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div class="flex items-start gap-3">
                    <div class={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border md:h-12 md:w-12 ${log.type === "mission" ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100"}`}>
                      {#if log.type === "mission"}
                        <Shield size={20} />
                      {:else}
                        <ShoppingBag size={20} />
                      {/if}
                    </div>

                    <div class="min-w-0">
                      <div class="font-semibold text-white">{log.title}</div>
                      <div class="mt-1 text-sm leading-6 text-slate-400">
                        <span class="text-slate-300">{log.names.join(", ")}</span>
                        {log.type === "mission" ? " 수행" : " 구매"}
                        <span class="mx-2 hidden text-slate-600 sm:inline">|</span>
                        <span class="block sm:inline">{log.timeStr}</span>
                      </div>
                    </div>
                  </div>

                  <div class={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${log.type === "mission" ? "bg-cyan-300/10 text-cyan-100" : "bg-rose-300/10 text-rose-100"}`}>
                    <Coins size={15} />
                    {log.type === "mission" ? "+" : "-"}{log.amount.toLocaleString()} G
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </article>
      {/each}
    </section>

    <button on:click={handleLoadMore} disabled={isLoadingMore} class="app-button app-button-secondary w-full px-4 py-4 text-sm">
      {#if isLoadingMore}
        <div class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"></div>
        불러오는 중...
      {:else}
        지난 기록 더 보기
      {/if}
    </button>
  {/if}
</div>
