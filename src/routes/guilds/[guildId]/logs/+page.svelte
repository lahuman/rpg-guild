<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { formatGold, requireRouteParam } from "$lib";
  import { logStore } from "$lib/stores/logStore";
  import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Coins, ScrollText, Send, ShoppingBag, Shield, Sparkles, Users } from "lucide-svelte";

  const guildId = requireRouteParam($page.params.guildId, "guildId");

  let isLoading = true;
  let isLoadingMore = false;
  let currentLimit = 50;
  let viewMode: "timeline" | "calendar" = "timeline";
  let selectedCharacter = "all";
  let selectedType: "all" | "mission" | "grade" | "usage" | "transfer" = "all";
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
    logs: Array<{ dateStr: string; type: "mission" | "usage" | "grade" | "transfer"; title: string; names: string[]; amount: number; timeStr: string }>
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
  $: filteredLogs = allLogs.filter((log) => {
    const matchesCharacter = selectedCharacter === "all" || log.names.includes(selectedCharacter);
    const matchesType = selectedType === "all" || log.type === selectedType;
    const keyword = searchQuery.trim().toLowerCase();
    const haystack = `${log.title} ${log.names.join(" ")}`.toLowerCase();
    return matchesCharacter && matchesType && (!keyword || haystack.includes(keyword));
  });
  $: filteredGroups = filteredLogs.reduce<typeof groupedLogs>((groups, log) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === log.dateStr) {
      lastGroup.logs.push(log);
    } else {
      groups.push({ date: log.dateStr, logs: [log] });
    }
    return groups;
  }, []);
  $: if (selectedDate && !filteredLogs.some((log) => log.dateStr === selectedDate)) {
    selectedDate = "";
  }
  $: calendarDays = buildCalendarDays(calendarMonth, filteredLogs);
  $: monthLogs = filteredLogs.filter((log) => {
    const logDate = new Date(`${log.dateStr}T00:00:00`);
    return logDate.getFullYear() === calendarMonth.getFullYear() && logDate.getMonth() === calendarMonth.getMonth();
  });
  $: selectedDateLogs = selectedDate ? filteredLogs.filter((log) => log.dateStr === selectedDate) : [];
  $: totalLogs = filteredLogs.length;
  $: missionLogs = filteredLogs.filter((log) => log.type === "mission").length;
  $: gradeLogs = filteredLogs.filter((log) => log.type === "grade").length;
  $: usageLogs = filteredLogs.filter((log) => log.type === "usage").length;
  $: transferLogs = filteredLogs.filter((log) => log.type === "transfer").length;
  $: activeDaysInMonth = new Set(monthLogs.map((log) => log.dateStr)).size;
  $: selectedDayLabel = selectedDate ? formatDate(selectedDate) : "";
  $: monthMissionLogs = monthLogs.filter((log) => log.type === "mission").length;
  $: monthGradeLogs = monthLogs.filter((log) => log.type === "grade").length;
  $: monthUsageLogs = monthLogs.filter((log) => log.type === "usage").length;
  $: monthTransferLogs = monthLogs.filter((log) => log.type === "transfer").length;
  $: monthMaxTypeCount = Math.max(monthMissionLogs, monthGradeLogs, monthUsageLogs, monthTransferLogs, 1);
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
    return { dateStr, label: formatShortDayLabel(dateStr), count };
  });
  $: weeklyTrendMax = Math.max(...weeklyTrend.map((day) => day.count), 1);

  function logAccentClass(type: string) {
    if (type === "mission") return "text-[var(--blue)]";
    if (type === "grade") return "text-[var(--orange-badge)]";
    if (type === "transfer") return "text-[var(--orange-badge)]";
    return "text-[var(--red)]";
  }
</script>

<div class="space-y-5 pb-20">
  <section class="app-panel reveal-rise px-5 py-6 md:px-8 md:py-8">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div class="app-command-strip">
        <div class="eyebrow">History Report</div>
        <div class="logs-title-row mt-4 flex items-center gap-3">
          <a href={`/guilds/${guildId}`} class="app-icon-btn">
            <ArrowLeft size={18} />
          </a>
          <div>
            <h1 class="logs-hero-title section-title text-3xl md:text-4xl">길드 활동 기록</h1>
            <p class="app-reading-copy mt-2 text-sm leading-6 md:text-base">
              특정 멤버 기준으로 모아보거나, 달력 기준으로 활동 밀도를 확인하세요.
            </p>
          </div>
        </div>
      </div>

      <div class="logs-summary-grid grid gap-3 grid-cols-2 xl:grid-cols-5">
        <div class="app-metal-stat min-w-0">
          <div class="app-label">Entries</div>
          <div class="mt-2 text-3xl font-bold">{totalLogs}</div>
        </div>
        <div class="app-metal-stat app-metal-stat-cyan min-w-0">
          <div class="app-label">Mission</div>
          <div class="mt-2 text-3xl font-bold text-[var(--blue)]">{missionLogs}</div>
        </div>
        <div class="app-metal-stat min-w-0">
          <div class="app-label">Grade</div>
          <div class="mt-2 text-3xl font-bold text-[var(--orange-badge)]">{gradeLogs}</div>
        </div>
        <div class="app-metal-stat app-metal-stat-rose min-w-0">
          <div class="app-label">Usage</div>
          <div class="mt-2 text-3xl font-bold text-[var(--red)]">{usageLogs}</div>
        </div>
        <div class="app-metal-stat min-w-0">
          <div class="app-label">Transfer</div>
          <div class="mt-2 text-3xl font-bold text-[var(--orange-badge)]">{transferLogs}</div>
        </div>
      </div>
    </div>

    <div class="mt-5 grid gap-3 lg:grid-cols-[1fr_14rem]">
      <div class="space-y-3">
        <div class="app-tabs-bar grid grid-cols-2 gap-2 p-2">
          <button
            class={`app-button px-3 py-3 text-sm ${viewMode === "timeline" ? "app-button-primary" : "app-button-secondary"}`}
            on:click={() => (viewMode = "timeline")}
          >
            <ScrollText size={16} />
            타임라인
          </button>
          <button
            class={`app-button px-3 py-3 text-sm ${viewMode === "calendar" ? "app-button-primary" : "app-button-secondary"}`}
            on:click={() => (viewMode = "calendar")}
          >
            <CalendarDays size={16} />
            달력 보기
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          <button on:click={() => (selectedType = "all")} class={`app-filter-chip ${selectedType === "all" ? "app-filter-chip-active" : ""}`}>전체</button>
          <button on:click={() => (selectedType = "mission")} class={`app-filter-chip ${selectedType === "mission" ? "app-filter-chip-active" : ""}`}>미션</button>
          <button on:click={() => (selectedType = "grade")} class={`app-filter-chip ${selectedType === "grade" ? "app-filter-chip-active" : ""}`}>등급전</button>
          <button on:click={() => (selectedType = "usage")} class={`app-filter-chip ${selectedType === "usage" ? "app-filter-chip-active" : ""}`}>사용</button>
          <button on:click={() => (selectedType = "transfer")} class={`app-filter-chip ${selectedType === "transfer" ? "app-filter-chip-active" : ""}`}>양도</button>
        </div>

        <div class="app-filter-shell">
          <span class="app-filter-label">검색</span>
          <input bind:value={searchQuery} class="app-input" placeholder="로그 제목, 멤버 이름 검색" />
        </div>
      </div>

      <label class="app-filter-shell">
        <span class="app-filter-label"><Users size={14} /> 멤버 기준</span>
        <select bind:value={selectedCharacter} class="app-select">
          <option value="all">전체 멤버</option>
          {#each characterOptions as name}
            <option value={name}>{name}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="mt-5 app-info-strip">
      <span>System Online</span>
      <span>{totalLogs} Records Indexed</span>
    </div>
  </section>

  {#if isLoading}
    <section class="app-card py-16 text-center">
      <div class="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[var(--grey-300)] border-t-[var(--black)]"></div>
      <p class="mt-4 text-sm">기록을 불러오는 중입니다.</p>
    </section>
  {:else if allLogs.length === 0}
    <section class="app-card px-6 py-16 text-center">
      <ScrollText size={28} class="mx-auto" />
      <h2 class="mt-4 text-2xl font-semibold">아직 기록된 활동이 없습니다</h2>
      <p class="mt-3 text-sm">미션 완료, 등급전, 아이템 사용이 발생하면 여기에 누적됩니다.</p>
    </section>
  {:else if filteredLogs.length === 0}
    <section class="app-card px-6 py-16 text-center">
      <ScrollText size={28} class="mx-auto" />
      <h2 class="mt-4 text-2xl font-semibold">조건에 맞는 활동 기록이 없습니다</h2>
      <p class="mt-3 text-sm">
        현재 필터: {selectedCharacter === "all" ? "전체 멤버" : selectedCharacter} ·
        {selectedType === "all" ? "전체 타입" : selectedType}
        {searchQuery.trim() ? ` · 검색어 "${searchQuery.trim()}"` : ""}
      </p>
      <button on:click={resetFilters} class="app-button app-button-secondary mt-6 px-5 py-3 text-sm">
        필터 초기화
      </button>
    </section>
  {:else if viewMode === "timeline"}
    <section class="space-y-5">
      <article class="app-card p-4 md:p-6">
        <div class="app-label">Weekly Trend</div>
        <h2 class="mt-2 text-2xl font-semibold">최근 7일 활동 추이</h2>
        <div class="logs-week-grid mt-5 grid grid-cols-7 gap-1.5 md:gap-3">
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
              <div class="app-stitch-tag">{formatDate(group.date)}</div>
              <div class="text-sm text-[var(--text-secondary)]">{group.date}</div>
            </div>

            <div class="space-y-3">
              {#each group.logs as log}
                <div class="log-entry log-entry-{log.type} p-3.5 transition md:p-4">
                  <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div class="flex min-w-0 items-start gap-3">
                      <div class={`app-seal h-11 w-11 shrink-0 md:h-12 md:w-12 ${logAccentClass(log.type)}`}>
                        {#if log.type === "mission"}<Shield size={20} />
                        {:else if log.type === "grade"}<Sparkles size={20} />
                        {:else if log.type === "transfer"}<Send size={20} />
                        {:else}<ShoppingBag size={20} />
                        {/if}
                      </div>
                      <div class="min-w-0">
                        <div class={`log-type-pill log-type-pill-{log.type} mb-2`}>
                          {log.type === "mission" ? "Mission" : log.type === "grade" ? "Grade" : log.type === "transfer" ? "Transfer" : "Usage"}
                        </div>
                        <div class="font-semibold">{log.title}</div>
                        <div class="app-dense-copy mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                          {#if log.type === "transfer"}
                            <span>{log.names[0]}</span>
                            <span class="mx-1">→</span>
                            <span>{log.names[1]}</span>
                            <span> 골드 양도</span>
                          {:else}
                            <span>{log.names.join(", ")}</span>
                            {log.type === "mission" ? " 수행" : log.type === "grade" ? " 등급전" : " 구매"}
                          {/if}
                          <span class="mx-2 hidden text-[var(--grey-500)] sm:inline">|</span>
                          <span class="block sm:inline">{log.timeStr}</span>
                        </div>
                      </div>
                    </div>
                    <div class={`app-stitch-tag self-start md:self-center ${logAccentClass(log.type)}`}>
                      <Coins size={15} />
                      {log.type === "usage" ? "-" : "+"}{formatGold(log.amount)}
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
        <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div class="app-label">Calendar View</div>
            <h2 class="mt-2 text-2xl font-semibold">{formatMonthLabel(calendarMonth)}</h2>
          </div>
          <div class="flex gap-2 self-end sm:self-auto">
            <button on:click={() => shiftMonth(-1)} class="app-icon-btn">
              <ChevronLeft size={16} />
            </button>
            <button on:click={() => shiftMonth(1)} class="app-icon-btn">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-4">
          <div class="app-metal-stat">
            <div class="app-label">Month Logs</div>
            <div class="mt-2 text-2xl font-bold">{monthLogs.length}</div>
          </div>
          <div class="app-metal-stat app-metal-stat-cyan">
            <div class="app-label">Active Days</div>
            <div class="mt-2 text-2xl font-bold text-[var(--blue)]">{activeDaysInMonth}</div>
          </div>
          <div class="app-metal-stat">
            <div class="app-label">Focus</div>
            <div class="mt-2 text-lg font-bold">{selectedCharacter === "all" ? "전체" : selectedCharacter}</div>
          </div>
          <div class="app-metal-stat app-metal-stat-rose">
            <div class="app-label">Selected Day</div>
            <div class="mt-2 text-lg font-bold">{selectedDate ? selectedDayLabel : "-"}</div>
          </div>
        </div>

        <div class="app-stat-card mt-5 p-4">
          <div class="app-label">Monthly Stats</div>
          <h3 class="mt-2 text-lg font-semibold">월별 타입 분포</h3>
          <div class="mt-4 space-y-3">
            <div class="app-chart-row">
              <div class="app-chart-label text-[var(--blue)]">미션</div>
              <div class="app-chart-track">
                <div class="app-chart-fill" style={`width: ${(monthMissionLogs / monthMaxTypeCount) * 100}%; background: var(--blue);`}></div>
              </div>
              <div class="app-chart-value">{monthMissionLogs}</div>
            </div>
            <div class="app-chart-row">
              <div class="app-chart-label text-[var(--orange-badge)]">등급전</div>
              <div class="app-chart-track">
                <div class="app-chart-fill" style={`width: ${(monthGradeLogs / monthMaxTypeCount) * 100}%; background: var(--orange-badge);`}></div>
              </div>
              <div class="app-chart-value">{monthGradeLogs}</div>
            </div>
            <div class="app-chart-row">
              <div class="app-chart-label text-[var(--red)]">사용</div>
              <div class="app-chart-track">
                <div class="app-chart-fill" style={`width: ${(monthUsageLogs / monthMaxTypeCount) * 100}%; background: var(--red);`}></div>
              </div>
              <div class="app-chart-value">{monthUsageLogs}</div>
            </div>
          </div>
        </div>

        <div class="logs-calendar-head mt-6 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] md:gap-2 md:text-xs">
          {#each ["일", "월", "화", "수", "목", "금", "토"] as day}
            <div class="py-2">{day}</div>
          {/each}
        </div>

        <div class="logs-calendar-grid mt-2 grid grid-cols-7 gap-1 md:gap-2">
          {#each calendarDays as day}
            <button
              on:click={() => (selectedDate = day.dateStr)}
              class={`app-calendar-day ${day.inMonth ? "" : "app-calendar-day-muted"} ${day.count > 0 ? "app-calendar-day-active" : ""} ${selectedDate === day.dateStr ? "app-calendar-day-selected" : ""}`}
            >
              <div class="text-sm font-semibold">{day.dayNumber}</div>
              <div class="mt-2 text-[11px]">{day.count > 0 ? `${day.count}건` : "-"}</div>
            </button>
          {/each}
        </div>
      </article>

      <article class="app-card p-4 md:p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="app-label">Day Detail</div>
            <h2 class="mt-2 text-2xl font-semibold">{selectedDate ? `${selectedDayLabel} 활동` : "날짜를 선택하세요"}</h2>
          </div>
          {#if selectedDate}
            <button on:click={() => (selectedDate = "")} class="app-button app-button-secondary px-4 py-2 text-sm">
              선택 해제
            </button>
          {/if}
        </div>

        {#if !selectedDate}
          <div class="mt-8 rounded-[1.25rem] border border-dashed border-[var(--grey-300)] px-4 py-12 text-center text-[var(--text-secondary)]">
            달력에서 날짜를 누르면 해당 날짜의 활동만 보여줍니다.
          </div>
        {:else if selectedDateLogs.length === 0}
          <div class="mt-8 rounded-[1.25rem] border border-dashed border-[var(--grey-300)] px-4 py-12 text-center text-[var(--text-secondary)]">
            선택한 날짜에는 기록이 없습니다.
          </div>
        {:else}
          <div class="mt-5 space-y-3">
            {#each selectedDateLogs as log}
              <div class="log-entry log-entry-{log.type} p-3.5 transition md:p-4">
                <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div class="flex min-w-0 items-start gap-3">
                    <div class={`app-seal h-11 w-11 shrink-0 md:h-12 md:w-12 ${logAccentClass(log.type)}`}>
                      {#if log.type === "mission"}<Shield size={20} />
                      {:else if log.type === "grade"}<Sparkles size={20} />
                      {:else if log.type === "transfer"}<Send size={20} />
                      {:else}<ShoppingBag size={20} />
                      {/if}
                    </div>
                    <div class="min-w-0">
                      <div class={`log-type-pill log-type-pill-{log.type} mb-2`}>
                        {log.type === "mission" ? "Mission" : log.type === "grade" ? "Grade" : log.type === "transfer" ? "Transfer" : "Usage"}
                      </div>
                      <div class="font-semibold">{log.title}</div>
                      <div class="app-dense-copy mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                        {#if log.type === "transfer"}
                          <span>{log.names[0]}</span>
                          <span class="mx-1">→</span>
                          <span>{log.names[1]}</span>
                          <span> 골드 양도</span>
                        {:else}
                          <span>{log.names.join(", ")}</span>
                        {/if}
                        <span class="mx-2 hidden text-[var(--grey-500)] sm:inline">|</span>
                        <span class="block sm:inline">{log.timeStr}</span>
                      </div>
                    </div>
                  </div>
                  <div class={`app-stitch-tag self-start md:self-center ${logAccentClass(log.type)}`}>
                    <Coins size={15} />
                    {log.type === "usage" ? "-" : "+"}{formatGold(log.amount)}
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
      <div class="h-4 w-4 animate-spin rounded-full border-2 border-[var(--grey-300)] border-t-[var(--black)]"></div>
      불러오는 중...
    {:else}
      지난 기록 더 보기
    {/if}
  </button>
</div>

<style>
  .log-entry {
    border-radius: var(--radius-md);
    border: 1px solid var(--border-secondary);
    background: var(--white);
  }

  .log-entry-mission { border-left: 3px solid var(--blue); }
  .log-entry-grade   { border-left: 3px solid var(--orange-badge); }
  .log-entry-transfer { border-left: 3px solid var(--orange-badge); }
  .log-entry-usage   { border-left: 3px solid var(--red); }

  .log-type-pill {
    display: inline-block;
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .log-type-pill-mission   { background: #e8efff; color: var(--blue); }
  .log-type-pill-grade     { background: #fdf0eb; color: var(--orange-badge); }
  .log-type-pill-transfer  { background: #fdf0eb; color: var(--orange-badge); }
  .log-type-pill-usage     { background: #fef2f2; color: var(--red); }
</style>
