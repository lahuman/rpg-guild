<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Coins, ScrollText, Swords, UserRoundCheck, Users, X } from "lucide-svelte";
  import { JOB_ICONS, createMissionForm, formatGold, notifyError } from "$lib";
  import { calculateBountyTotalGold } from "$lib/features/missions/bounty";
  import { saveFundedMissionAction } from "$lib/features/missions/actions";
  import type { GuildCharacter } from "$lib/stores/guildStore";
  import type { Mission } from "$lib/stores/missionStore";

  export let guildId: string;
  export let sponsorCharacter: GuildCharacter;
  export let allCharacters: GuildCharacter[];

  const dispatch = createEventDispatcher();

  let newMission = createMissionForm();
  let isSubmitting = false;

  $: bountyTotalGold = calculateBountyTotalGold(
    Number(newMission.cost) || 0,
    newMission.type,
    Number(newMission.maxParticipants) || 1
  );
  $: canAfford = (sponsorCharacter.currentGold || 0) >= bountyTotalGold;

  function close() {
    dispatch("close");
  }

  function handleMissionTypeChange(type: Mission["type"]) {
    newMission.type = type;

    if (type !== "party") {
      newMission.maxParticipants = 1;
    } else if (newMission.maxParticipants < 2) {
      newMission.maxParticipants = 2;
    }

    if (type !== "assigned") {
      newMission.assignedCharacterId = "";
      newMission.assignedCharacterName = "";
    }
  }

  function handleAssignedCharacterChange(characterId: string) {
    const assignedCharacter = allCharacters.find((character) => character.id === characterId);
    newMission.assignedCharacterId = characterId;
    newMission.assignedCharacterName = assignedCharacter?.name || "";
  }

  async function handleSave() {
    if (isSubmitting) return;

    isSubmitting = true;
    try {
      const success = await saveFundedMissionAction(guildId, sponsorCharacter, newMission);
      if (success) close();
    } catch (error) {
      notifyError(error, "지정 미션 등록에 실패했습니다.");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--black)]/40 p-3 sm:p-4">
  <div class="app-modal app-modal-scroll w-full max-w-3xl bg-white">
    <div class="flex items-start justify-between gap-4 border-b border-[var(--grey-300)] px-5 py-5 md:px-6">
      <div class="flex items-start gap-3">
        <div class="app-coin-icon">
          <ScrollText size={20} />
        </div>
        <div>
          <div class="app-label">Assigned Bounty</div>
          <h3 class="mt-1 text-2xl font-semibold">지정 미션 등록</h3>
          <p class="mt-2 text-sm text-[var(--text-secondary)]">
            {sponsorCharacter.name}의 골드를 예치하고 24시간 동안 열리는 미션입니다.
          </p>
        </div>
      </div>
      <button on:click={close} class="app-icon-btn" title="닫기">
        <X size={20} />
      </button>
    </div>

    <div class="grid gap-4 px-5 py-5 md:grid-cols-2 md:px-6">
      <div class="app-stat-card md:col-span-2">
        <div class="app-label">의뢰자</div>
        <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span class="font-semibold">{sponsorCharacter.name}</span>
          <span class="app-metric-row flex items-center gap-1.5 text-sm font-bold">
            <Coins size={14} />
            <span class="app-metric-value">{formatGold(sponsorCharacter.currentGold)}</span>
          </span>
        </div>
      </div>

      <div class="md:col-span-2">
        <label for="funded-mission-title" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">퀘스트명</label>
        <input id="funded-mission-title" bind:value={newMission.title} class="app-input" placeholder="예: 오늘의 긴급 지원" />
      </div>

      <div>
        <label for="funded-mission-description" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">설명</label>
        <textarea
          id="funded-mission-description"
          bind:value={newMission.description}
          class="app-textarea min-h-[132px]"
          placeholder="완료 조건이나 확인 방법을 입력하세요."
        ></textarea>
      </div>

      <div class="space-y-4">
        <div>
          <label for="funded-mission-cost" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">보상 (1인당)</label>
          <input id="funded-mission-cost" bind:value={newMission.cost} type="number" min="0" class="app-input" />
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
              <div class="mt-2 text-xs leading-5">한 명 완료</div>
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
              <div class="mt-2 text-xs leading-5">특정 멤버</div>
            </button>

            <button
              type="button"
              on:click={() => handleMissionTypeChange("party")}
              class="mission-type-btn"
              class:active={newMission.type === "party"}
            >
              <div class="flex items-center gap-2 font-semibold">
                <Users size={16} />
                파티
              </div>
              <div class="mt-2 text-xs leading-5">여러 명 완료</div>
            </button>
          </div>
        </div>
      </div>

      {#if newMission.type === "assigned"}
        <div>
          <label for="funded-assigned-character" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">배정 멤버</label>
          <select
            id="funded-assigned-character"
            bind:value={newMission.assignedCharacterId}
            class="app-select"
            on:change={(event) => handleAssignedCharacterChange((event.currentTarget as HTMLSelectElement).value)}
          >
            <option value="">멤버를 선택하세요</option>
            {#each allCharacters as char}
              <option value={char.id}>{JOB_ICONS[char.jobClass]} {char.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      {#if newMission.type === "party"}
        <div>
          <label for="funded-max-participants" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">최대 참여 인원</label>
          <input id="funded-max-participants" bind:value={newMission.maxParticipants} type="number" min="2" class="app-input" />
        </div>
      {/if}

      <div class="app-stat-card md:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="app-label">필요 예치금</div>
            <div class={`mt-2 text-2xl font-bold ${canAfford ? "text-[var(--black)]" : "text-[var(--red)]"}`}>
              {bountyTotalGold} G
            </div>
          </div>
          <div class="max-w-sm text-right text-sm leading-6 text-[var(--text-secondary)]">
            완료되지 않으면 24시간 뒤 남은 예치금이 의뢰자에게 돌아갑니다.
          </div>
        </div>
      </div>
    </div>

    <div class="modal-action-row flex flex-col gap-2 border-t border-[var(--grey-300)] px-5 py-5 md:px-6 sm:flex-row">
      <button on:click={close} class="app-button app-button-secondary flex-1 px-4 py-3 text-sm">
        취소
      </button>
      <button
        on:click={handleSave}
        disabled={isSubmitting || !canAfford}
        class="app-button app-button-primary flex-1 px-4 py-3 text-sm disabled:opacity-50"
      >
        {isSubmitting ? "등록 중..." : "지정 미션 등록"}
      </button>
    </div>
  </div>
</div>
