<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { requireRouteParam } from "$lib";
  import { logStore } from "$lib/stores/logStore";
  import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Coins, ScrollText, ShoppingBag, Shield, Sparkles, Users } from "lucide-svelte";

  const guildId = requireRouteParam($page.params.guildId, "guildId");

  let isLoading = true;
  let isLoadingMore = false;
  let currentLimit = 50;
  let viewMode: "timeline" | "calendar" = "timeline";
  let selectedCharacter = "all";
  let selectedType: "all" | "mission" | "grade" | "usage" = "all";
  let searchQuery = "";
  let selectedDate = "";
  let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

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

  function formatMonthLabel(date: Date) {
    return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
  }

  function shiftMonth(offset: number) {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
  }

  function resetFilters() {
    selectedCharacter = "all";
    selectedType = "all";
    searchQuery = "";
    selectedDate = "";
  }

  function formatShortDayLabel(dateStr: string) {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
  }

  function buildCalendarDays(
    date: Date,
    logs: Array<{
      dateStr: string;
      type: "mission" | "usage" | "grade";
      title: string;
      names: string[];
      amount: number;
      timeStr: string;
    }>
  ) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startWeekday = startOfMonth.getDay();
    const totalCells = Math.ceil((startWeekday + endOfMonth.getDate()) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const cellDate = new Date(date.getFullYear(), date.getMonth(), index - startWeekday + 1);
      const dateStr = [
        cellDate.getFullYear(),
        String(cellDate.getMonth() + 1).padStart(2, "0"),
        String(cellDate.getDate()).padStart(2, "0")
      ].join("-");
      const dayLogs = logs.filter((log) => log.dateStr === dateStr);

      return {
        dateStr,
        dayNumber: cellDate.getDate(),
        inMonth: cellDate.getMonth() === date.getMonth(),
        count: dayLogs.length
      };
    });
  }

  $: groupedLogs = $logStore;
  $: allLogs = groupedLogs.flatMap((group) => group.logs);
  $: characterOptions = Array.from(new Set(allLogs.flatMap((log) => log.names))).sort((a, b) => a.localeCompare(b, "ko"));
  $: filteredLogs =
    allLogs.filter((log) => {
      const matchesCharacter = selectedCharacter === "all" || log.names.includes(selectedCharacter);
      const matchesType = selectedType === "all" || log.type === selectedType;
      const keyword = searchQuery.trim().toLowerCase();
      const haystack = `${log.title} ${log.names.join(" ")}`.toLowerCase();
      const matchesSearch = !keyword || haystack.includes(keyword);
      return matchesCharacter && matchesType && matchesSearch;
    });
  $: filteredGroups = filteredLogs.reduce<typeof groupedLogs>((groups, log) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.date === log.dateStr) {
      lastGroup.logs.push(log);
      return groups;
    }

    groups.push({ date: log.dateStr, logs: [log] });
    return groups;
  }, []);
  $: if (selectedDate && !filteredLogs.some((log) => log.dateStr === selectedDate)) {
    selectedDate = "";
  }
  $: calendarDays = buildCalendarDays(calendarMonth, filteredLogs);
  $: monthLogs = filteredLogs.filter((log) => {
    const logDate = new Date(`${log.dateStr}T00:00:00`);
    return (
      logDate.getFullYear() === calendarMonth.getFullYear() &&
      logDate.getMonth() === calendarMonth.getMonth()
    );
  });
  $: selectedDateLogs = selectedDate ? filteredLogs.filter((log) => log.dateStr === selectedDate) : [];
  $: totalLogs = filteredLogs.length;
  $: missionLogs = filteredLogs.filter((log) => log.type === "mission").length;
  $: gradeLogs = filteredLogs.filter((log) => log.type === "grade").length;
  $: usageLogs = filteredLogs.filter((log) => log.type === "usage").length;
  $: activeDaysInMonth = new Set(monthLogs.map((log) => log.dateStr)).size;
  $: selectedDayLabel = selectedDate ? formatDate(selectedDate) : "";
  $: monthMissionLogs = monthLogs.filter((log) => log.type === "mission").length;
  $: monthGradeLogs = monthLogs.filter((log) => log.type === "grade").length;
  $: monthUsageLogs = monthLogs.filter((log) => log.type === "usage").length;
  $: monthMaxTypeCount = Math.max(monthMissionLogs, monthGradeLogs, monthUsageLogs, 1);
  $: weeklyTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const dateStr = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
    const count = filteredLogs.filter((log) => log.dateStr === dateStr).length;

    return {
      dateStr,
      label: formatShortDayLabel(dateStr),
      count
    };
  });
  $: weeklyTrendMax = Math.max(...weeklyTrend.map((day) => day.count), 1);
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
              특정 멤버 기준으로 모아보거나, 달력 기준으로 활동 밀도를 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-4">
        <div class="app-stat min-w-[10rem]">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Entries</div>
          <div class="mt-2 text-3xl font-bold text-white">{totalLogs}</div>
        </div>
        <div class="app-stat min-w-[10rem]">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Mission</div>
          <div class="mt-2 text-3xl font-bold text-cyan-200">{missionLogs}</div>
        </div>
        <div class="app-stat min-w-[10rem]">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Grade</div>
          <div class="mt-2 text-3xl font-bold text-amber-200">{gradeLogs}</div>
        </div>
        <div class="app-stat min-w-[10rem]">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Usage</div>
          <div class="mt-2 text-3xl font-bold text-rose-200">{usageLogs}</div>
        </div>
      </div>
    </div>

    <div class="mt-5 grid gap-3 lg:grid-cols-[1fr_14rem]">
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-2 rounded-[1.25rem] bg-slate-950/40 p-2">
          <button
            class={`app-button px-3 py-3 text-sm ${viewMode === "timeline" ? "bg-amber-400 text-slate-950" : "text-slate-400"}`}
            on:click={() => (viewMode = "timeline")}
          >
            <ScrollText size={16} />
            타임라인
          </button>
          <button
            class={`app-button px-3 py-3 text-sm ${viewMode === "calendar" ? "bg-cyan-300 text-slate-950" : "text-slate-400"}`}
            on:click={() => (viewMode = "calendar")}
          >
            <CalendarDays size={16} />
            달력 보기
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          <button on:click={() => (selectedType = "all")} class={`app-filter-chip ${selectedType === "all" ? "app-filter-chip-active" : ""}`}>
            전체 타입
          </button>
          <button on:click={() => (selectedType = "mission")} class={`app-filter-chip ${selectedType === "mission" ? "app-filter-chip-active app-filter-chip-cyan" : ""}`}>
            미션
          </button>
          <button on:click={() => (selectedType = "grade")} class={`app-filter-chip ${selectedType === "grade" ? "app-filter-chip-active app-filter-chip-amber" : ""}`}>
            등급전
          </button>
          <button on:click={() => (selectedType = "usage")} class={`app-filter-chip ${selectedType === "usage" ? "app-filter-chip-active app-filter-chip-rose" : ""}`}>
            사용
          </button>
        </div>

        <div class="app-filter-shell">
          <span class="app-filter-label">검색</span>
          <input bind:value={searchQuery} class="app-input" placeholder="로그 제목, 멤버 이름 검색" />
        </div>
      </div>

      <label class="app-filter-shell">
        <span class="app-filter-label">
          <Users size={14} />
          멤버 기준
        </span>
        <select bind:value={selectedCharacter} class="app-select">
          <option value="all">전체 멤버</option>
          {#each characterOptions as name}
            <option value={name}>{name}</option>
          {/each}
        </select>
      </label>
    </div>

  </section>

  {#if isLoading}
    <section class="app-card py-16 text-center">
      <div class="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent"></div>
      <p class="mt-4 text-sm text-slate-400">기록을 불러오는 중입니다.</p>
    </section>
  {:else if allLogs.length === 0}
    <section class="app-card px-6 py-16 text-center">
      <ScrollText size={28} class="mx-auto text-slate-500" />
      <h2 class="mt-4 text-2xl font-semibold text-white">아직 기록된 활동이 없습니다</h2>
      <p class="mt-3 text-sm text-slate-400">미션 완료, 등급전, 아이템 사용이 발생하면 여기에 누적됩니다.</p>
    </section>
  {:else if filteredLogs.length === 0}
    <section class="app-card px-6 py-16 text-center">
      <ScrollText size={28} class="mx-auto text-slate-500" />
      <h2 class="mt-4 text-2xl font-semibold text-white">조건에 맞는 활동 기록이 없습니다</h2>
      <p class="mt-3 text-sm text-slate-400">
        현재 필터:
        {selectedCharacter === "all" ? " 전체 멤버" : ` ${selectedCharacter}`}
        ·
        {selectedType === "all" ? " 전체 타입" : ` ${selectedType}`}
        {searchQuery.trim() ? ` · 검색어 "${searchQuery.trim()}"` : ""}
      </p>
      <button on:click={resetFilters} class="app-button app-button-secondary mt-6 px-5 py-3 text-sm">
        필터 초기화
      </button>
    </section>
  {:else if viewMode === "timeline"}
    <section class="space-y-5">
      <article class="app-card p-4 md:p-6">
        <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Weekly Trend</div>
        <h2 class="mt-2 text-2xl font-semibold text-white">최근 7일 활동 추이</h2>
        <div class="mt-5 grid grid-cols-7 gap-3">
          {#each weeklyTrend as day}
            <div class="app-trend-col">
              <div class="app-trend-value">{day.count}</div>
              <div class="app-trend-track">
                <div class="app-trend-bar" style={`height: ${Math.max((day.count / weeklyTrendMax) * 100, day.count > 0 ? 12 : 0)}%`}></div>
              </div>
              <div class="app-trend-label">{day.label}</div>
            </div>
          {/each}
        </div>
      </article>

      <section class="stagger-grid space-y-5">
      {#each filteredGroups as group}
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
                    <div class={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border md:h-12 md:w-12 ${log.type === "mission" ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100" : log.type === "grade" ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100"}`}>
                      {#if log.type === "mission"}
                        <Shield size={20} />
                      {:else if log.type === "grade"}
                        <Sparkles size={20} />
                      {:else}
                        <ShoppingBag size={20} />
                      {/if}
                    </div>

                    <div class="min-w-0">
                      <div class="font-semibold text-white">{log.title}</div>
                      <div class="mt-1 text-sm leading-6 text-slate-400">
                        <span class="text-slate-300">{log.names.join(", ")}</span>
                        {log.type === "mission" ? " 수행" : log.type === "grade" ? " 등급전" : " 구매"}
                        <span class="mx-2 hidden text-slate-600 sm:inline">|</span>
                        <span class="block sm:inline">{log.timeStr}</span>
                      </div>
                    </div>
                  </div>

                  <div class={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${log.type === "mission" ? "bg-cyan-300/10 text-cyan-100" : log.type === "grade" ? "bg-amber-300/10 text-amber-100" : "bg-rose-300/10 text-rose-100"}`}>
                    <Coins size={15} />
                    {log.type === "usage" ? "-" : "+"}{log.amount.toLocaleString()} G
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </article>
      {/each}
      </section>
    </section>
  {:else}
    <section class="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <article class="app-card p-4 md:p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Calendar View</div>
            <h2 class="mt-2 text-2xl font-semibold text-white">{formatMonthLabel(calendarMonth)}</h2>
          </div>
          <div class="flex gap-2">
            <button on:click={() => shiftMonth(-1)} class="app-button app-button-secondary h-11 w-11 !p-0">
              <ChevronLeft size={16} />
            </button>
            <button on:click={() => shiftMonth(1)} class="app-button app-button-secondary h-11 w-11 !p-0">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div class="app-stat">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Month Logs</div>
            <div class="mt-2 text-2xl font-bold text-white">{monthLogs.length}</div>
          </div>
          <div class="app-stat">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Active Days</div>
            <div class="mt-2 text-2xl font-bold text-cyan-200">{activeDaysInMonth}</div>
          </div>
          <div class="app-stat">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Focus</div>
            <div class="mt-2 text-lg font-bold text-amber-200">{selectedCharacter === "all" ? "전체" : selectedCharacter}</div>
          </div>
          <div class="app-stat">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Day</div>
            <div class="mt-2 text-lg font-bold text-white">{selectedDate ? selectedDayLabel : "-"}</div>
          </div>
        </div>

        <div class="mt-5 rounded-[1.25rem] border border-white/10 bg-white/4 p-4">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Monthly Stats</div>
          <h3 class="mt-2 text-lg font-semibold text-white">월별 타입 분포</h3>
          <div class="mt-4 space-y-3">
            <div class="app-chart-row">
              <div class="app-chart-label text-cyan-200">미션</div>
              <div class="app-chart-track">
                <div class="app-chart-fill bg-cyan-300/75" style={`width: ${(monthMissionLogs / monthMaxTypeCount) * 100}%`}></div>
              </div>
              <div class="app-chart-value">{monthMissionLogs}</div>
            </div>
            <div class="app-chart-row">
              <div class="app-chart-label text-amber-200">등급전</div>
              <div class="app-chart-track">
                <div class="app-chart-fill bg-amber-300/75" style={`width: ${(monthGradeLogs / monthMaxTypeCount) * 100}%`}></div>
              </div>
              <div class="app-chart-value">{monthGradeLogs}</div>
            </div>
            <div class="app-chart-row">
              <div class="app-chart-label text-rose-200">사용</div>
              <div class="app-chart-track">
                <div class="app-chart-fill bg-rose-300/75" style={`width: ${(monthUsageLogs / monthMaxTypeCount) * 100}%`}></div>
              </div>
              <div class="app-chart-value">{monthUsageLogs}</div>
            </div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {#each ["일", "월", "화", "수", "목", "금", "토"] as day}
            <div class="py-2">{day}</div>
          {/each}
        </div>

        <div class="mt-2 grid grid-cols-7 gap-2">
          {#each calendarDays as day}
            <button
              on:click={() => (selectedDate = day.dateStr)}
              class={`app-calendar-day ${day.inMonth ? "" : "app-calendar-day-muted"} ${day.count > 0 ? "app-calendar-day-active" : ""} ${selectedDate === day.dateStr ? "app-calendar-day-selected" : ""}`}
            >
              <div class="text-sm font-semibold">{day.dayNumber}</div>
              <div class="mt-2 text-[11px] text-slate-400">
                {day.count > 0 ? `${day.count}건` : "-"}
              </div>
            </button>
          {/each}
        </div>
      </article>

      <article class="app-card p-4 md:p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Day Detail</div>
            <h2 class="mt-2 text-2xl font-semibold text-white">
              {selectedDate ? `${selectedDayLabel} 활동` : "날짜를 선택하세요"}
            </h2>
          </div>
          {#if selectedDate}
            <button on:click={() => (selectedDate = "")} class="app-button app-button-secondary px-4 py-2 text-sm">
              선택 해제
            </button>
          {/if}
        </div>

        {#if !selectedDate}
          <div class="mt-8 rounded-[1.25rem] border border-dashed border-white/10 px-4 py-12 text-center text-slate-400">
            달력에서 날짜를 누르면 해당 날짜의 활동만 모아서 보여줍니다.
          </div>
        {:else if selectedDateLogs.length === 0}
          <div class="mt-8 rounded-[1.25rem] border border-dashed border-white/10 px-4 py-12 text-center text-slate-400">
            선택한 날짜에는 기록이 없습니다.
          </div>
        {:else}
          <div class="mt-5 space-y-3">
            {#each selectedDateLogs as log}
              <div class="rounded-[1.25rem] border border-white/10 bg-white/4 p-3.5 transition hover:bg-white/6 md:p-4">
                <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div class="flex items-start gap-3">
                    <div class={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border md:h-12 md:w-12 ${log.type === "mission" ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100" : log.type === "grade" ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100"}`}>
                      {#if log.type === "mission"}
                        <Shield size={20} />
                      {:else if log.type === "grade"}
                        <Sparkles size={20} />
                      {:else}
                        <ShoppingBag size={20} />
                      {/if}
                    </div>

                    <div class="min-w-0">
                      <div class="font-semibold text-white">{log.title}</div>
                      <div class="mt-1 text-sm leading-6 text-slate-400">
                        <span class="text-slate-300">{log.names.join(", ")}</span>
                        <span class="mx-2 hidden text-slate-600 sm:inline">|</span>
                        <span class="block sm:inline">{log.timeStr}</span>
                      </div>
                    </div>
                  </div>

                  <div class={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${log.type === "mission" ? "bg-cyan-300/10 text-cyan-100" : log.type === "grade" ? "bg-amber-300/10 text-amber-100" : "bg-rose-300/10 text-rose-100"}`}>
                    <Coins size={15} />
                    {log.type === "usage" ? "-" : "+"}{log.amount.toLocaleString()} G
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </article>
    </section>
  {/if}

  <button on:click={handleLoadMore} disabled={isLoadingMore} class="app-button app-button-secondary w-full px-4 py-4 text-sm">
    {#if isLoadingMore}
      <div class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"></div>
      불러오는 중...
    {:else}
      지난 기록 더 보기
    {/if}
  </button>
</div>
