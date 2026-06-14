<script lang="ts">
  import { page } from "$app/stores";
  import { onDestroy, onMount } from "svelte";
  import CharacterAvatar from "$lib/components/CharacterAvatar.svelte";
  import MobileActionSheet, {
    type MobileActionSheetAction,
    type MobileActionSheetSelectDetail
  } from "$lib/components/MobileActionSheet.svelte";
  import RewardChestModal from "$lib/components/RewardChestModal.svelte";
  import { JOB_ICONS, createMissionForm, formatGold, lockBodyScroll, notifyError, requireRouteParam, toDateOrNull } from "$lib";
  import { formatBountyTimeRemaining, isBountyExpired } from "$lib/features/missions/bounty";
  import type { RewardChestResult } from "$lib/features/missions/rewardChest";
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
    MoreHorizontal,
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
  $: activeCount = sortedMissions.filter((mission) => !$completedIds.has(mission.id || "") && !isFundedMissionExpired(mission)).length;
  $: completedCount = sortedMissions.filter((mission) => $completedIds.has(mission.id || "")).length;
  $: selectableCharacters =
    selectedMission?.type === "assigned" && selectedMission?.assignedCharacterId
      ? characters.filter((char) => char.id === selectedMission?.assignedCharacterId)
      : characters;
  $: {
    for (const mission of missions) {
      if (isFundedMissionExpired(mission)) {
        void expireFundedMission(mission);
      }
    }
  }

  let isCreating = false;
  let editingMissionId: string | null = null;
  let newMission = createMissionForm();

  let selectedMission: Mission | null = null;
  let selectedCharIds: string[] = [];
  let completedCharIds: string[] = [];
  let isLoadingLogs = false;

  let showChestModal = false;
  let rewardChest: RewardChestResult | null = null;
  let actionSheetMission: Mission | null = null;
  let now = Date.now();
  let expiringMissionIds = new Set<string>();
  let releaseBodyScrollLock: (() => void) | null = null;

  $: hasOpenModal = Boolean(selectedMission || showChestModal);
  $: {
    if (hasOpenModal && !releaseBodyScrollLock) {
      releaseBodyScrollLock = lockBodyScroll();
    } else if (!hasOpenModal && releaseBodyScrollLock) {
      releaseBodyScrollLock();
      releaseBodyScrollLock = null;
    }
  }

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

  function getBountyExpiryDate(mission: Mission) {
    return toDateOrNull(mission.bountyExpiresAt);
  }

  function isFundedMissionExpired(mission: Mission) {
    const expiresAt = getBountyExpiryDate(mission);
    return mission.fundingType === "character" && Boolean(expiresAt && isBountyExpired(expiresAt, new Date(now)));
  }

  function formatMissionBountyRemaining(mission: Mission) {
    const expiresAt = getBountyExpiryDate(mission);
    if (!expiresAt) return "시간 없음";

    return formatBountyTimeRemaining(expiresAt.getTime() - now);
  }

  async function expireFundedMission(mission: Mission) {
    if (!mission.id || expiringMissionIds.has(mission.id)) return;

    expiringMissionIds = new Set(expiringMissionIds).add(mission.id);
    try {
      await missionStore.expireFundedMission(guildId, mission.id);
    } catch (error) {
      notifyError(error, "지정 미션 만료 처리에 실패했습니다.");
      setTimeout(() => {
        expiringMissionIds.delete(mission.id!);
        expiringMissionIds = new Set(expiringMissionIds);
      }, 30000);
    }
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
    if (mission.fundingType === "character") return;

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

  function getMissionSheetActions(mission: Mission): MobileActionSheetAction[] {
    const isBountyMission = mission.fundingType === "character";

    return [
      {
        id: "edit",
        label: isBountyMission ? "지정 미션은 수정할 수 없음" : "수정",
        disabled: isBountyMission
      },
      { id: "delete", label: "삭제", tone: "danger" }
    ];
  }

  function closeMissionActionSheet() {
    actionSheetMission = null;
  }

  async function handleMissionActionSelect(event: CustomEvent<MobileActionSheetSelectDetail>) {
    const mission = actionSheetMission;
    if (!mission) return;

    actionSheetMission = null;

    if (event.detail.id === "edit") {
      startEdit(mission);
      return;
    }

    if (event.detail.id === "delete") {
      await handleDelete(mission);
    }
  }

  async function openCompleteModal(mission: Mission) {
    if (isFundedMissionExpired(mission)) {
      await expireFundedMission(mission);
      return;
    }

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
      rewardChest = result.rewardChest;
      showChestModal = result.showChestModal && Boolean(result.rewardChest);
    } catch (error) {
      notifyError(error, "퀘스트 완료 처리에 실패했습니다.");
    }
  }

  function closeChestModal() {
    showChestModal = false;
    rewardChest = null;
  }

  onDestroy(() => {
    releaseBodyScrollLock?.();
    unsubMissions();
    unsubStatus();
    unsubGuild();
  });

  onMount(() => {
    const timer = setInterval(() => {
      now = Date.now();
    }, 30000);

    return () => clearInterval(timer);
  });
</script>

<div class="space-y-5 pb-20">
  <section class="app-panel reveal-rise px-5 py-6 md:px-8 md:py-8">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div class="app-command-strip">
        <div class="eyebrow">Mission Board</div>
        <h1 class="section-title mt-4 text-3xl md:text-4xl">퀘스트 게시판</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 md:text-base">
          활성 미션, 오늘 완료 상태, 이벤트 퀘스트를 같은 보드 언어로 관리합니다.
        </p>
      </div>

      <button
        on:click={() => {
          isCreating = !isCreating;
          if (!isCreating) resetForm();
        }}
        class="app-button app-button-primary px-5 py-3 text-sm"
      >
        <Plus size={18} />
        {isCreating ? "작성 닫기" : "새 퀘스트"}
      </button>
    </div>

    <div class="mt-6 grid gap-3 md:grid-cols-3">
      <div class="app-metal-stat">
        <div class="app-label">Active</div>
        <div class="mt-2 text-3xl font-bold">{activeCount}</div>
        <div class="mt-1 text-sm">오늘 아직 남은 퀘스트</div>
      </div>
      <div class="app-metal-stat app-metal-stat-cyan">
        <div class="app-label">Completed</div>
        <div class="mt-2 text-3xl font-bold">{completedCount}</div>
        <div class="mt-1 text-sm">오늘 완료 처리된 퀘스트</div>
      </div>
      <div class="app-metal-stat app-metal-stat-rose">
        <div class="app-label">Roster</div>
        <div class="mt-2 text-3xl font-bold">{characters.length}</div>
        <div class="mt-1 text-sm">완료 처리 가능한 캐릭터 수</div>
      </div>
    </div>

    <div class="mt-5 app-info-strip">
      <span class="font-semibold">Available Missions</span>
      <span>{sortedMissions.length} Entries</span>
    </div>
  </section>

  {#if isCreating}
    <section class="app-card reveal-rise p-5 md:p-7" style="animation-delay: 120ms">
      <div class="mb-5 flex items-center justify-between gap-4">
        <div>
          <div class="app-stitch-tag">{editingMissionId ? "Edit Quest" : "Create Quest"}</div>
          <h2 class="mt-2 text-2xl font-semibold">
            {editingMissionId ? "퀘스트 수정" : "새 퀘스트 등록"}
          </h2>
        </div>
        {#if editingMissionId}
          <div class="app-stitch-tag">수정 모드</div>
        {/if}
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="md:col-span-2">
          <label for="mission-title" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">퀘스트명</label>
          <input id="mission-title" bind:value={newMission.title} class="app-input" placeholder="예: 아침 회의 참석" />
        </div>

        <div>
          <label for="mission-description" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">설명</label>
          <textarea
            id="mission-description"
            bind:value={newMission.description}
            class="app-textarea min-h-[120px]"
            placeholder="퀘스트 규칙이나 조건을 입력하세요."
          ></textarea>
        </div>

        <div class="space-y-4">
          <div>
            <label for="mission-cost" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">보상 (1인당)</label>
            <input id="mission-cost" bind:value={newMission.cost} type="number" min="0" class="app-input" />
          </div>

          <div>
            <span class="mb-2 block text-sm font-medium text-[var(--text-primary)]">유형</span>
            <div class="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                on:click={() => handleMissionTypeChange("solo")}
                class="mission-type-btn"
                class:active={newMission.type === "solo"}
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
                class="mission-type-btn"
                class:active={newMission.type === "assigned"}
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
                class="mission-type-btn"
                class:active={newMission.type === "party"}
              >
                <div class="flex items-center gap-2 font-semibold">
                  <Users size={16} />
                  파티
                </div>
                <div class="mt-2 text-xs leading-5">여러 캐릭터 공동 수행</div>
              </button>
            </div>
          </div>
        </div>

        {#if newMission.type === "assigned"}
          <div>
            <label for="assigned-character" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">배정 멤버</label>
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
            <label for="max-participants" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">최대 참여 인원</label>
            <input id="max-participants" bind:value={newMission.maxParticipants} type="number" min="2" class="app-input" />
          </div>
        {/if}

        <label class="md:col-span-2 flex cursor-pointer items-start gap-3 rounded-[1rem] border border-[var(--grey-300)] p-4">
          <input type="checkbox" bind:checked={newMission.isOneTime} class="mt-1 h-4 w-4" />
          <div>
            <div class="font-semibold">일회성 퀘스트</div>
            <p class="mt-1 text-sm leading-6">
              완료 시 목록에서 자동으로 사라지는 이벤트성 퀘스트입니다.
            </p>
          </div>
        </label>

        <div class="md:col-span-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
    <section class="app-card px-6 py-14 text-center">
      <ScrollText size={28} class="mx-auto" />
      <h2 class="mt-4 text-2xl font-semibold">등록된 퀘스트가 없습니다</h2>
      <p class="mt-3 text-sm">새 퀘스트를 만들어 길드 운영 루프를 시작하세요.</p>
    </section>
  {:else}
    <section class="stagger-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {#each sortedMissions as mission (mission.id)}
        {@const isSoldOut = $completedIds.has(mission.id || "")}
        {@const isBountyMission = mission.fundingType === "character"}
        {@const isExpiredBounty = isFundedMissionExpired(mission)}
        <article class={`quest-card app-card mobile-daily-card flex flex-col p-5 md:p-6 ${isSoldOut ? "quest-card-done" : ""}`}>
          <div class="mb-4 flex items-start justify-between gap-3">
            <div class="flex flex-wrap gap-2">
              <span class={`app-stitch-tag ${mission.type === "party" ? "" : mission.type === "assigned" ? "" : ""}`}>
                {mission.type === "party" ? "PARTY" : mission.type === "assigned" ? "ASSIGNED" : "SOLO"}
              </span>
              {#if isBountyMission}
                <span class="app-stitch-tag">지정</span>
              {/if}
              {#if mission.isOneTime}
                <span class="app-stitch-tag">1회 한정</span>
              {/if}
              {#if isSoldOut}
                <span class="app-stitch-tag">오늘 완료</span>
              {/if}
            </div>

            <div class="flex flex-col items-end gap-2">
              {#if isBountyMission}
                <span class={`app-stitch-tag ${isExpiredBounty ? "text-[var(--red)]" : ""}`}>
                  {isExpiredBounty ? "만료 처리 중" : formatMissionBountyRemaining(mission)}
                </span>
              {/if}

              <div class="desktop-card-actions hidden gap-1 sm:flex">
                {#if !isBountyMission}
                  <button on:click={() => startEdit(mission)} class="app-icon-btn" title="수정">
                    <Pencil size={15} />
                  </button>
                {/if}
                <button on:click={() => handleDelete(mission)} class="app-icon-btn" title="삭제">
                  <Trash2 size={15} />
                </button>
              </div>

              <button
                on:click={() => (actionSheetMission = mission)}
                class="app-icon-btn mobile-more-action"
                aria-label={`${mission.title} 더보기`}
                title="더보기"
              >
                <MoreHorizontal size={17} />
              </button>
            </div>
          </div>

          <div class="flex flex-col items-start justify-between gap-3 sm:flex-row">
            <h3 class="text-xl font-semibold">{mission.title}</h3>
            <div class="shrink-0 text-left sm:text-right">
              <div class="app-label">Reward</div>
              <div class="mt-1 text-sm font-bold">
                {mission.cost} G · {mission.type === "party" ? mission.maxParticipants : 1}명
              </div>
            </div>
          </div>
          <p class="mobile-card-description mt-3 min-h-[56px] text-sm leading-6 md:min-h-[72px]">{mission.description || "설명이 없는 퀘스트입니다."}</p>

          {#if mission.type === "assigned" && mission.assignedCharacterName}
            <div class="mt-3 app-info-strip text-sm">
              배정 멤버: {mission.assignedCharacterName}
            </div>
          {/if}

          {#if isBountyMission && mission.sponsorCharacterName}
            <div class="mt-3 app-info-strip text-sm">
              의뢰자: {mission.sponsorCharacterName}
            </div>
          {/if}

          <div class="mobile-card-secondary-stat mt-5 grid gap-3 sm:grid-cols-2">
            <div class="app-stat-card">
              <div class="app-label">Reward</div>
              <div class="mt-2 text-2xl font-bold">{mission.cost} G</div>
            </div>
            <div class="app-stat-card">
              <div class="app-label">Party Size</div>
              <div class="mt-2 text-2xl font-bold">{mission.type === "party" ? mission.maxParticipants : 1}</div>
            </div>
          </div>

          <button
            on:click={() => !isSoldOut && !isExpiredBounty && openCompleteModal(mission)}
            disabled={isSoldOut || isExpiredBounty}
            class={`app-button mt-5 w-full px-4 py-3 text-sm ${isSoldOut || isExpiredBounty ? "app-button-secondary" : "app-button-primary"}`}
          >
            <CheckCircle2 size={17} />
            {isExpiredBounty ? "만료 처리 중" : isSoldOut ? "오늘 마감됨" : "수행 완료 보고"}
          </button>
        </article>
      {/each}
    </section>
  {/if}

  {#if selectedMission}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--black)]/40 p-3 md:p-4">
      <div class="app-modal mission-complete-modal w-full max-w-2xl bg-white">
        <div class="flex items-start justify-between gap-4 border-b border-[var(--grey-300)] px-5 py-5 md:px-7">
          <div>
            <div class="app-stitch-tag">Pending Distribution</div>
            <h3 class="mt-2 text-2xl font-semibold">{selectedMission.title}</h3>
            <p class="mt-2 text-sm">보상을 받을 캐릭터를 선택하세요.</p>
          </div>
          <button on:click={() => (selectedMission = null)} class="app-icon-btn">
            ✕
          </button>
        </div>

        <div class="mission-complete-body space-y-4 px-5 md:px-7">
          {#if isLoadingLogs}
            <div class="py-14 text-center">
              <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--grey-300)] border-t-[var(--black)]"></div>
              <p class="mt-3 text-sm">오늘 기록을 확인하는 중입니다.</p>
            </div>
          {:else if selectableCharacters.length === 0}
            <div class="rounded-[1.5rem] border border-dashed border-[var(--grey-300)] px-4 py-12 text-center">
              선택 가능한 캐릭터가 없습니다.
            </div>
          {:else}
            <div class="app-info-strip text-sm">
              <span class="font-semibold">Reward Targets</span>
              <span>
                {selectedMission.type === "party"
                  ? `최대 ${selectedMission.maxParticipants}명 선택`
                  : "한 명만 선택"}
              </span>
            </div>

            <div class="mission-character-grid">
              {#each selectableCharacters as char}
                {@const isDone = completedCharIds.includes(char.id || "")}
                {@const isSelected = selectedCharIds.includes(char.id || "")}

                <button
                  on:click={() => toggleCharacter(char.id!)}
                  disabled={isDone}
                  class="char-select-btn"
                  class:selected={isSelected}
                  class:done={isDone}
                >
                  <CharacterAvatar character={char} size="sm" showTitle={false} />

                  <div class="char-select-main">
                    <div class="char-select-name">{char.name}</div>
                    <div class="char-select-meta">{formatGold(char.currentGold)} 보유</div>
                    {#if isDone}
                      <div class="char-select-note">오늘 이미 완료 처리됨</div>
                    {/if}
                  </div>

                  <div class="char-select-state">
                    {#if isSelected}
                      <span class="char-state-pill char-state-selected">선택됨</span>
                    {:else if isDone}
                      <span class="char-state-pill char-state-done">완료</span>
                    {:else}
                      <span class="char-state-pill">선택</span>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <div class="modal-action-row mt-5 flex flex-col gap-2 border-t border-[var(--grey-300)] px-5 py-5 md:px-7 sm:flex-row">
          <button on:click={() => (selectedMission = null)} class="app-button app-button-secondary flex-1 px-4 py-3 text-sm">
            취소
          </button>
          <button
            on:click={handleComplete}
            disabled={selectedCharIds.length === 0}
            class="app-button app-button-primary flex-1 px-4 py-3 text-sm"
          >
            완료 처리
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showChestModal && rewardChest}
    <RewardChestModal result={rewardChest} on:close={closeChestModal} />
  {/if}

  <MobileActionSheet
    open={Boolean(actionSheetMission)}
    title={actionSheetMission?.title || ""}
    subtitle={actionSheetMission ? `${actionSheetMission.cost} G · ${actionSheetMission.type === "party" ? actionSheetMission.maxParticipants : 1}명` : undefined}
    actions={actionSheetMission ? getMissionSheetActions(actionSheetMission) : []}
    on:select={handleMissionActionSelect}
    on:close={closeMissionActionSheet}
  />
</div>
