<script lang="ts">
  import { page } from "$app/stores";
  import { onDestroy } from "svelte";
  import { quintOut } from "svelte/easing";
  import { fade, scale } from "svelte/transition";
  import { JOB_ICONS, createMissionForm, notifyError, requireRouteParam } from "$lib";
  import {
    completeMissionAction,
    deleteMissionAction,
    openCompleteMissionModalAction,
    resetMissionFormAction,
    saveMissionAction,
    sortMissionsAction,
    startEditMissionAction,
    toggleMissionCharacterAction
  } from "$lib/features/missions/actions";
  import { getGradeInfo, guildStore } from "$lib/stores/guildStore";
  import { missionStore, type Mission } from "$lib/stores/missionStore";
  import {
    CheckCircle2,
    Pencil,
    Plus,
    ScrollText,
    Swords,
    Trash2,
    UserRoundCheck,
    Users
  } from "lucide-svelte";

  const guildId = requireRouteParam($page.params.guildId, "guildId");
  const unsubMissions = missionStore.init(guildId);
  const unsubStatus = missionStore.initTodayStatus(guildId);
  const unsubGuild = guildStore.init(guildId);
  const completedIds = missionStore.completedMissionIds;

  $: missions = $missionStore;
  $: characters = $guildStore?.characters || [];
  $: sortedMissions = sortMissionsAction(missions, $completedIds);
  $: activeCount = sortedMissions.filter((mission) => !$completedIds.has(mission.id || "")).length;
  $: completedCount = sortedMissions.length - activeCount;
  $: selectableCharacters =
    selectedMission?.type === "assigned" && selectedMission?.assignedCharacterId
      ? characters.filter((char) => char.id === selectedMission?.assignedCharacterId)
      : characters;

  let isCreating = false;
  let editingMissionId: string | null = null;
  let newMission = createMissionForm();

  let selectedMission: Mission | null = null;
  let selectedCharIds: string[] = [];
  let completedCharIds: string[] = [];
  let isLoadingLogs = false;

  let showChestModal = false;
  let chestOpened = false;
  let chestBonus = 0;

  function resetForm() {
    const resetState = resetMissionFormAction();
    newMission = resetState.newMission;
    editingMissionId = resetState.editingMissionId;
  }

  function handleMissionTypeChange(type: Mission["type"]) {
    newMission.type = type;

    if (type !== "party") {
      newMission.maxParticipants = 1;
    }

    if (type !== "assigned") {
      newMission.assignedCharacterId = "";
      newMission.assignedCharacterName = "";
    }
  }

  function handleAssignedCharacterChange(characterId: string) {
    const assignedCharacter = characters.find((character) => character.id === characterId);
    newMission.assignedCharacterId = characterId;
    newMission.assignedCharacterName = assignedCharacter?.name || "";
  }

  async function handleSave() {
    try {
      const result = await saveMissionAction(guildId, editingMissionId, newMission);

      if (result.preservedMission) {
        newMission = result.preservedMission;
        return;
      }

      newMission = result.newMission;
      editingMissionId = result.editingMissionId;
      isCreating = !result.shouldClose;
    } catch (error) {
      notifyError(error, "퀘스트 저장에 실패했습니다.");
    }
  }

  function startEdit(mission: Mission) {
    const nextState = startEditMissionAction(mission);
    newMission = nextState.newMission;
    editingMissionId = nextState.editingMissionId;
    isCreating = nextState.isCreating;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(mission: Mission) {
    try {
      await deleteMissionAction(guildId, mission);
    } catch (error) {
      notifyError(error, "퀘스트 삭제에 실패했습니다.");
    }
  }

  async function openCompleteModal(mission: Mission) {
    isLoadingLogs = true;

    try {
      const modalState = await openCompleteMissionModalAction(guildId, mission);
      selectedMission = modalState.selectedMission;
      selectedCharIds = modalState.selectedCharIds;
      completedCharIds = modalState.completedCharIds;
      isLoadingLogs = modalState.isLoadingLogs;
    } catch (error) {
      notifyError(error, "완료 처리 화면을 열지 못했습니다.");
      isLoadingLogs = false;
    }
  }

  function toggleCharacter(id: string) {
    selectedCharIds = toggleMissionCharacterAction(selectedMission, selectedCharIds, completedCharIds, id);
  }

  async function handleComplete() {
    try {
      const result = await completeMissionAction(
        guildId,
        selectedMission,
        selectedCharIds,
        characters,
        $guildStore
      );

      if (!result) return;

      selectedMission = result.selectedMission;
      selectedCharIds = result.selectedCharIds;
      showChestModal = result.showChestModal;
      chestOpened = result.chestOpened;
      chestBonus = result.chestBonus;

      if (showChestModal) {
        setTimeout(() => {
          chestOpened = true;
        }, 1500);
      }
    } catch (error) {
      notifyError(error, "퀘스트 완료 처리에 실패했습니다.");
    }
  }

  function closeChestModal() {
    showChestModal = false;
  }

  onDestroy(() => {
    unsubMissions();
    unsubStatus();
    unsubGuild();
  });
</script>

<div class="space-y-5 pb-20">
  <section class="app-panel-strong app-ledger-panel reveal-rise rounded-[2rem] px-5 py-6 md:px-8 md:py-8">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div class="app-command-strip">
        <div class="eyebrow">Mission Board</div>
        <h1 class="section-title mt-4 text-3xl text-white md:text-4xl">퀘스트 게시판</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
          활성 미션, 오늘 완료 상태, 이벤트 퀘스트를 같은 보드 언어로 관리합니다.
        </p>
      </div>

      <button
        on:click={() => {
          isCreating = !isCreating;
          if (!isCreating) resetForm();
        }}
        class="app-button app-command-button px-5 py-3 text-sm"
      >
        <Plus size={18} />
        {isCreating ? "작성 닫기" : "새 퀘스트"}
      </button>
    </div>

    <div class="mt-6 grid gap-3 md:grid-cols-3">
      <div class="app-metal-stat">
        <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Active</div>
        <div class="mt-2 text-3xl font-bold text-white">{activeCount}</div>
        <div class="mt-1 text-sm text-slate-400">오늘 아직 남은 퀘스트</div>
      </div>
      <div class="app-metal-stat app-metal-stat-cyan">
        <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Completed</div>
        <div class="mt-2 text-3xl font-bold text-white">{completedCount}</div>
        <div class="mt-1 text-sm text-slate-400">오늘 완료 처리된 퀘스트</div>
      </div>
      <div class="app-metal-stat app-metal-stat-rose">
        <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Roster</div>
        <div class="mt-2 text-3xl font-bold text-white">{characters.length}</div>
        <div class="mt-1 text-sm text-slate-400">완료 처리 가능한 캐릭터 수</div>
      </div>
    </div>

    <div class="mt-5 flex items-center justify-between rounded-[1rem] border border-cyan-300/18 bg-cyan-300/8 px-4 py-3 text-xs uppercase tracking-[0.2em] text-cyan-100">
      <span>Available Missions</span>
      <span>{sortedMissions.length} Entries</span>
    </div>
  </section>

  {#if isCreating}
    <section class="app-card app-ledger-panel reveal-rise p-5 md:p-7" style="animation-delay: 120ms">
      <div class="mb-5 flex items-center justify-between gap-4">
        <div>
          <div class="app-stitch-tag">
            {editingMissionId ? "Edit Quest" : "Create Quest"}
          </div>
          <h2 class="mt-2 text-2xl font-semibold text-white">
            {editingMissionId ? "퀘스트 수정" : "새 퀘스트 등록"}
          </h2>
        </div>
        {#if editingMissionId}
          <div class="app-stitch-tag text-cyan-100">
            수정 모드
          </div>
        {/if}
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="md:col-span-2">
          <label for="mission-title" class="mb-2 block text-sm font-medium text-slate-300">퀘스트명</label>
          <input id="mission-title" bind:value={newMission.title} class="app-input" placeholder="예: 아침 회의 참석" />
        </div>

        <div>
          <label for="mission-description" class="mb-2 block text-sm font-medium text-slate-300">설명</label>
          <textarea
            id="mission-description"
            bind:value={newMission.description}
            class="app-textarea min-h-[120px]"
            placeholder="퀘스트 규칙이나 조건을 입력하세요."
          ></textarea>
        </div>

        <div class="space-y-4">
          <div>
            <label for="mission-cost" class="mb-2 block text-sm font-medium text-slate-300">보상 (1인당)</label>
            <input id="mission-cost" bind:value={newMission.cost} type="number" min="0" class="app-input" />
          </div>

          <div>
            <span class="mb-2 block text-sm font-medium text-slate-300">유형</span>
            <div class="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                on:click={() => handleMissionTypeChange("solo")}
                class={`app-ledger-panel rounded-2xl border px-3 py-3 text-left transition md:px-4 md:py-4 ${newMission.type === "solo" ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/4 text-slate-400"}`}
              >
                <div class="flex items-center gap-2 font-semibold">
                  <Swords size={16} />
                  개인
                </div>
                <div class="mt-2 text-xs leading-5">기본 개인 퀘스트</div>
              </button>

              <button
                type="button"
                on:click={() => handleMissionTypeChange("assigned")}
                class={`app-ledger-panel rounded-2xl border px-3 py-3 text-left transition md:px-4 md:py-4 ${newMission.type === "assigned" ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-white/10 bg-white/4 text-slate-400"}`}
              >
                <div class="flex items-center gap-2 font-semibold">
                  <UserRoundCheck size={16} />
                  배정
                </div>
                <div class="mt-2 text-xs leading-5">특정 멤버 전용 퀘스트</div>
              </button>

              <button
                type="button"
                on:click={() => {
                  handleMissionTypeChange("party");
                  if (newMission.maxParticipants < 2) newMission.maxParticipants = 2;
                }}
                class={`app-ledger-panel rounded-2xl border px-3 py-3 text-left transition md:px-4 md:py-4 ${newMission.type === "party" ? "border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100" : "border-white/10 bg-white/4 text-slate-400"}`}
              >
                <div class="flex items-center gap-2 font-semibold">
                  <Users size={16} />
                  파티
                </div>
                <div class="mt-2 text-xs leading-5">여러 캐릭터 공동 수행</div>
              </button>
            </div>
          </div>

          {#if newMission.type === "assigned"}
            <div>
              <label for="assigned-character" class="mb-2 block text-sm font-medium text-slate-300">배정 멤버</label>
              <select
                id="assigned-character"
                bind:value={newMission.assignedCharacterId}
                class="app-select"
                on:change={(event) => handleAssignedCharacterChange((event.currentTarget as HTMLSelectElement).value)}
              >
                <option value="">멤버를 선택하세요</option>
                {#each characters as char}
                  <option value={char.id}>{JOB_ICONS[char.jobClass]} {char.name}</option>
                {/each}
              </select>
            </div>
          {/if}

          {#if newMission.type === "party"}
            <div>
              <label for="max-participants" class="mb-2 block text-sm font-medium text-slate-300">최대 참여 인원</label>
              <input id="max-participants" bind:value={newMission.maxParticipants} type="number" min="2" class="app-input" />
            </div>
          {/if}
        </div>

        <label class="app-ledger-panel md:col-span-2 flex cursor-pointer items-start gap-3 p-4">
          <input type="checkbox" bind:checked={newMission.isOneTime} class="mt-1 h-4 w-4 accent-amber-400" />
          <div>
            <div class="font-semibold text-white">일회성 퀘스트</div>
            <p class="mt-1 text-sm leading-6 text-slate-400">
              완료 시 목록에서 자동으로 사라지는 이벤트성 퀘스트입니다.
            </p>
          </div>
        </label>

        <div class="md:col-span-2 flex justify-end gap-2">
          <button
            on:click={() => {
              isCreating = false;
              resetForm();
            }}
            class="app-button app-button-secondary px-4 py-3 text-sm"
          >
            취소
          </button>
          <button on:click={handleSave} class="app-button app-button-primary px-4 py-3 text-sm">
            {editingMissionId ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </section>
  {/if}

  {#if sortedMissions.length === 0}
    <section class="app-card app-ledger-panel px-6 py-14 text-center">
      <ScrollText size={28} class="mx-auto text-slate-500" />
      <h2 class="mt-4 text-2xl font-semibold text-white">등록된 퀘스트가 없습니다</h2>
      <p class="mt-3 text-sm text-slate-400">새 퀘스트를 만들어 길드 운영 루프를 시작하세요.</p>
    </section>
  {:else}
    <section class="stagger-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {#each sortedMissions as mission (mission.id)}
        {@const isSoldOut = $completedIds.has(mission.id || "")}
        <article class={`app-card app-ledger-panel app-ledger-lines app-command-strip flex flex-col p-5 md:p-6 transition ${isSoldOut ? "quest-card-done opacity-60 grayscale" : "quest-card-active hover:-translate-y-1"}`}>
          <div class="mb-4 flex items-start justify-between gap-3">
            <div class="flex flex-wrap gap-2">
              <span class={`app-stitch-tag ${mission.type === "party" ? "bg-fuchsia-300/12 text-fuchsia-200" : mission.type === "assigned" ? "bg-amber-300/12 text-amber-200" : "bg-cyan-300/12 text-cyan-200"}`}>
                {mission.type === "party" ? "PARTY" : mission.type === "assigned" ? "ASSIGNED" : "SOLO"}
              </span>
              {#if mission.isOneTime}
                <span class="app-stitch-tag bg-rose-300/12 text-rose-200">
                  1회 한정
                </span>
              {/if}
              {#if isSoldOut}
                <span class="app-stitch-tag bg-white/8 text-slate-400">오늘 완료</span>
              {/if}
            </div>

            <div class="flex gap-1">
              <button on:click={() => startEdit(mission)} class="app-seal h-9 w-9 text-slate-400 transition hover:text-cyan-200" title="수정">
                <Pencil size={15} />
              </button>
              <button on:click={() => handleDelete(mission)} class="app-seal h-9 w-9 text-slate-400 transition hover:text-rose-200" title="삭제">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div class="flex items-start justify-between gap-3">
            <h3 class={`text-xl font-semibold ${isSoldOut ? "text-slate-400 line-through" : "text-white"}`}>{mission.title}</h3>
            <div class="shrink-0 text-right">
              <div class="text-[10px] uppercase tracking-[0.18em] text-slate-500">Reward</div>
              <div class="mt-1 text-sm font-bold text-amber-300">{mission.cost} G</div>
            </div>
          </div>
          <p class="mt-3 min-h-[56px] text-sm leading-6 text-slate-400 md:min-h-[72px]">{mission.description || "설명이 없는 퀘스트입니다."}</p>

          {#if mission.type === "assigned" && mission.assignedCharacterName}
            <div class="mt-3 rounded-[1rem] border border-amber-300/14 bg-amber-300/8 px-3 py-2 text-sm text-amber-100">
              배정 멤버: {mission.assignedCharacterName}
            </div>
          {/if}

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="app-ledger-panel px-4 py-3">
              <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Reward</div>
              <div class="mt-2 text-2xl font-bold text-amber-200">{mission.cost} G</div>
            </div>
            <div class="app-ledger-panel px-4 py-3">
              <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Party Size</div>
              <div class="mt-2 text-2xl font-bold text-white">
                {mission.type === "party" ? mission.maxParticipants : 1}
              </div>
            </div>
          </div>

          <button
            on:click={() => !isSoldOut && openCompleteModal(mission)}
            disabled={isSoldOut}
            class={`app-button mt-5 w-full px-4 py-3 text-sm ${isSoldOut ? "border border-white/10 bg-white/5 text-slate-500" : "app-command-button pulse-amber"}`}
          >
            <CheckCircle2 size={17} />
            {isSoldOut ? "오늘 마감됨" : "수행 완료 보고"}
          </button>
        </article>
      {/each}
    </section>
  {/if}

  {#if selectedMission}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 md:p-4 backdrop-blur-md">
      <div class="app-modal app-ledger-panel app-modal-scroll w-full max-w-2xl p-5 md:p-7">
        <div class="flex items-start justify-between gap-4 border-b border-white/8 pb-5">
          <div>
            <div class="app-stitch-tag">Pending Distribution</div>
            <h3 class="mt-2 text-2xl font-semibold text-white">{selectedMission.title}</h3>
            <p class="mt-2 text-sm text-slate-400">보상을 받을 캐릭터를 선택하세요.</p>
          </div>
          <button on:click={() => (selectedMission = null)} class="app-brass-coin p-2 text-slate-400 transition hover:text-white">✕</button>
        </div>

        <div class="mt-5 max-h-[58vh] space-y-3 overflow-y-auto pr-1">
          {#if isLoadingLogs}
            <div class="py-14 text-center text-slate-400">
              <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent"></div>
              <p class="mt-3 text-sm">오늘 기록을 확인하는 중입니다.</p>
            </div>
          {:else if selectableCharacters.length === 0}
            <div class="rounded-[1.5rem] border border-dashed border-white/10 px-4 py-12 text-center text-slate-400">
              선택 가능한 캐릭터가 없습니다.
            </div>
          {:else}
            <div class="rounded-[1rem] border border-amber-300/18 bg-amber-300/8 px-4 py-3 text-xs uppercase tracking-[0.2em] text-amber-100">
              Select Party Members for Reward Split
            </div>

            {#each selectableCharacters as char}
              {@const isDone = completedCharIds.includes(char.id || "")}
              {@const isSelected = selectedCharIds.includes(char.id || "")}

              <button
                on:click={() => toggleCharacter(char.id!)}
                disabled={isDone}
                class={`app-ledger-panel flex w-full items-center justify-between rounded-[1.25rem] border p-3.5 text-left transition md:p-4 ${isDone ? "border-white/8 bg-white/4 opacity-50" : isSelected ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/4 hover:bg-white/6"}`}
              >
                <div class="flex items-center gap-3">
                  <div class="app-seal h-11 w-11 text-xl md:h-12 md:w-12">
                    {JOB_ICONS[char.jobClass] || "😐"}
                  </div>
                  <div>
                    <div class="flex items-center gap-2 font-semibold text-white">
                      {#if char.grade}
                        <span title={getGradeInfo(char.grade).label}>{getGradeInfo(char.grade).icon}</span>
                      {/if}
                      {char.name}
                    </div>
                    <div class="mt-1 text-xs text-slate-400">
                      {isDone ? "오늘 이미 완료 처리됨" : `${char.jobClass} · Lv.${char.level || 1}`}
                    </div>
                  </div>
                </div>

                {#if isSelected}
                  <span class="app-stitch-tag text-cyan-100">선택됨</span>
                {:else if isDone}
                  <span class="app-stitch-tag text-slate-300">완료</span>
                {/if}
              </button>
            {/each}
          {/if}
        </div>

        <div class="mt-5 flex flex-col gap-2 border-t border-white/8 pt-5 sm:flex-row">
          <button on:click={() => (selectedMission = null)} class="app-button app-button-secondary flex-1 px-4 py-3 text-sm">
            취소
          </button>
          <button
            on:click={handleComplete}
            disabled={selectedCharIds.length === 0}
            class="app-button app-command-button flex-1 px-4 py-3 text-sm"
          >
            완료 처리
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showChestModal}
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-3 md:p-4 overflow-hidden" transition:fade={{ duration: 300 }}>
      <div class="relative w-full max-w-md text-center">
        <div class="absolute inset-0 -z-10 rounded-full bg-amber-400/15 blur-3xl"></div>
        <div class="app-panel-strong app-ledger-panel rounded-[2rem] px-5 py-8 md:px-6 md:py-10">
          {#if !chestOpened}
            <button
              type="button"
              class="shake-animation select-none bg-transparent pulse-amber"
              on:click={() => (chestOpened = true)}
              in:scale={{ duration: 500, start: 0, easing: quintOut }}
            >
              🎁
            </button>
            <p class="mt-5 text-lg font-semibold text-white">Secure Vault Opened</p>
            <p class="mt-2 text-sm text-slate-400">잠시 후 자동으로 열리며, 직접 클릭해도 됩니다.</p>
          {:else}
            <div class="flex flex-col items-center" in:scale={{ duration: 300, start: 0.8, easing: quintOut }}>
              <div class="text-[7rem] animate-bounce-short">💰</div>
              <h2 class="pop-in-text mt-2 text-3xl font-black text-amber-300">BONUS</h2>
              <div class="pop-in-text-delayed mt-3 text-5xl font-black text-white">
                +{chestBonus}<span class="ml-2 text-2xl text-amber-300">G</span>
              </div>
              <button on:click={closeChestModal} class="app-button app-button-primary mt-8 px-8 py-3">
                확인
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes shake {
    0% { transform: translate(1px, 1px) rotate(0deg); }
    10% { transform: translate(-1px, -2px) rotate(-1deg); }
    20% { transform: translate(-3px, 0) rotate(1deg); }
    30% { transform: translate(3px, 2px) rotate(0deg); }
    40% { transform: translate(1px, -1px) rotate(1deg); }
    50% { transform: translate(-1px, 2px) rotate(-1deg); }
    60% { transform: translate(-3px, 1px) rotate(0deg); }
    70% { transform: translate(3px, 1px) rotate(-1deg); }
    80% { transform: translate(-1px, -1px) rotate(1deg); }
    90% { transform: translate(1px, 2px) rotate(0deg); }
    100% { transform: translate(1px, -2px) rotate(-1deg); }
  }

  .shake-animation {
    animation: shake 0.5s infinite;
    cursor: pointer;
    display: inline-block;
    font-size: 7rem;
  }

  @keyframes bounce-short {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }

  .animate-bounce-short {
    animation: bounce-short 0.5s ease-out 1;
  }

  @keyframes pop-in {
    0% { opacity: 0; transform: scale(0.5); }
    70% { transform: scale(1.15); }
    100% { opacity: 1; transform: scale(1); }
  }

  .pop-in-text {
    animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  .pop-in-text-delayed {
    opacity: 0;
    animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.18s forwards;
  }
</style>
