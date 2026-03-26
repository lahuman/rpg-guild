<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onDestroy } from "svelte";
  import MiniGameModal from "$lib/components/MiniGameModal.svelte";
  import ShopManager from "$lib/components/ShopManager.svelte";
  import { confirmAction, notify, notifyError, requireRouteParam, toDateOrNull } from "$lib";
  import { getGradeInfo, guildStore, isMaxGrade, type GuildCharacter } from "$lib/stores/guildStore";
  import { userStore } from "$lib/stores/userStore";
  import {
    Coins,
    Copy,
    DoorOpen,
    Gem,
    Pencil,
    Settings2,
    Store,
    Users
  } from "lucide-svelte";

  const guildId = requireRouteParam($page.params.guildId, "guildId");
  const unsubscribe = guildStore.init(guildId);

  $: guild = $guildStore;
  $: characters = $guildStore?.characters || [];
  $: currentUser = $userStore;
  $: createdDate = toDateOrNull(guild?.createdAt)?.toLocaleDateString() ?? "-";
  $: totalGold = characters.reduce((sum, character) => sum + (character.currentGold || 0), 0);
  $: averageLevel = characters.length
    ? (characters.reduce((sum, character) => sum + (character.level || 1), 0) / characters.length).toFixed(1)
    : "0.0";
  $: rankedCharacters = [...characters].sort((a, b) => {
    const gradeDiff = getGradeInfo(b.grade).level - getGradeInfo(a.grade).level;
    if (gradeDiff !== 0) return gradeDiff;
    return (b.level || 1) - (a.level || 1);
  });
  $: featuredCharacters = rankedCharacters.slice(0, 3);
  $: topRankCharacter = rankedCharacters[0] ?? null;
  $: topRankInfo = topRankCharacter ? getGradeInfo(topRankCharacter.grade) : null;

  let selectedCharForGame: GuildCharacter | null = null;
  let showShopManager = false;

  let isEditingName = false;
  let newName = "";
  let isSavingName = false;

  let isEditingDesc = false;
  let newDesc = "";
  let isSavingDesc = false;

  let isEditingSettings = false;
  let isSavingSettings = false;
  let newBoxChance = 0.2;
  let newMaxBonusGold = 36;

  function toggleShopManagerPanel() {
    showShopManager = !showShopManager;
  }

  function startEditingName() {
    newName = guild?.name || "";
    isEditingName = true;
  }

  function cancelEditingName() {
    isEditingName = false;
    newName = guild?.name || "";
  }

  async function saveGuildName() {
    if (!newName.trim()) {
      notify("길드 이름을 입력해주세요.");
      return;
    }

    try {
      isSavingName = true;
      await guildStore.updateGuildName(guildId, newName.trim());
      isEditingName = false;
      notify("길드 이름이 변경되었습니다.");
    } catch (error) {
      notifyError(error, "길드 이름 변경에 실패했습니다.");
    } finally {
      isSavingName = false;
    }
  }

  function startEditingDesc() {
    newDesc = guild?.description || "";
    isEditingDesc = true;
  }

  async function saveGuildDesc() {
    try {
      isSavingDesc = true;
      await guildStore.updateGuildDescription(guildId, newDesc);
      isEditingDesc = false;
      notify("길드 설명이 저장되었습니다.");
    } catch (error) {
      notifyError(error, "길드 설명 변경에 실패했습니다.");
    } finally {
      isSavingDesc = false;
    }
  }

  function startEditingSettings() {
    newBoxChance = guild?.boxChance ?? 0.2;
    newMaxBonusGold = guild?.maxBonusGold ?? 36;
    isEditingSettings = true;
  }

  async function saveGuildSettings() {
    try {
      isSavingSettings = true;
      await guildStore.updateGuildRewardSettings(guildId, newBoxChance, newMaxBonusGold);
      isEditingSettings = false;
      notify("보상 설정이 저장되었습니다.");
    } catch (error) {
      notifyError(error, "보상 설정 저장에 실패했습니다.");
    } finally {
      isSavingSettings = false;
    }
  }

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(guild?.code || "");
      notify(`초대 코드가 복사되었습니다.\n${guild?.code}`);
    } catch (error) {
      notifyError(error, `복사에 실패했습니다. 직접 복사해주세요: ${guild?.code}`);
    }
  }

  async function handleLeaveGuild() {
    if (
      !confirmAction(
        "정말로 길드를 탈퇴하시겠습니까?\n\n탈퇴 후에는 이 길드의 데이터를 관리할 수 없으며, 다시 가입하거나 새로운 길드를 만들어야 합니다."
      )
    ) {
      return;
    }

    try {
      if (currentUser?.uid) {
        await userStore.leaveGuild(currentUser.uid);
        notify("길드를 탈퇴했습니다.");
        goto("/", { replaceState: true });
      }
    } catch (error) {
      notifyError(error, "길드 탈퇴 중 오류가 발생했습니다.");
    }
  }

  onDestroy(() => {
    unsubscribe();
  });
</script>

<div class="space-y-5 pb-20 md:space-y-6">
  <section class="app-hero reveal-rise overflow-hidden rounded-[1.6rem] px-4 py-5 sm:px-6 sm:py-8 md:rounded-[2rem] md:px-8 md:py-9">
    <div class="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div>
        <div class="eyebrow">Sector Alpha-9</div>

        <div class="mt-5 flex flex-wrap items-start gap-3">
          {#if isEditingName}
            <div class="flex w-full max-w-xl flex-col gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-4 md:flex-row md:items-center">
              <input
                type="text"
                bind:value={newName}
                class="app-input text-xl font-semibold"
                placeholder="길드 이름 입력"
                disabled={isSavingName}
                on:keydown={(event) => event.key === "Enter" && saveGuildName()}
              />
              <div class="modal-action-row flex gap-2">
                <button on:click={saveGuildName} disabled={isSavingName} class="app-button app-button-primary px-4 py-3 text-sm">
                  {isSavingName ? "저장 중..." : "저장"}
                </button>
                <button on:click={cancelEditingName} disabled={isSavingName} class="app-button app-button-secondary px-4 py-3 text-sm">
                  취소
                </button>
              </div>
            </div>
          {:else}
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="guild-hero-title section-title text-3xl font-black text-white sm:text-4xl md:text-5xl">
                {guild?.name || "길드 정보를 불러오는 중"}
              </h1>
              {#if guild && currentUser}
                <button
                  on:click={startEditingName}
                  class="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  title="길드 이름 수정"
                >
                  <Pencil size={17} />
                </button>
              {/if}
            </div>
          {/if}
        </div>

        <div class="mt-6 max-w-3xl">
          {#if isEditingDesc}
            <div class="rounded-[1.25rem] border border-white/10 bg-slate-950/35 p-4">
              <textarea
                bind:value={newDesc}
                class="app-textarea min-h-[120px]"
                placeholder="우리 길드를 소개해주세요."
                disabled={isSavingDesc}
              ></textarea>
              <div class="modal-action-row mt-3 flex justify-end gap-2">
                <button on:click={() => (isEditingDesc = false)} disabled={isSavingDesc} class="app-button app-button-secondary px-4 py-3 text-sm">
                  취소
                </button>
                <button on:click={saveGuildDesc} disabled={isSavingDesc} class="app-button app-button-primary px-4 py-3 text-sm">
                  {isSavingDesc ? "저장 중..." : "설명 저장"}
                </button>
              </div>
            </div>
          {:else}
            <div class="group flex items-start gap-2">
              <p class="app-reading-copy text-base leading-7 text-slate-300 md:text-lg">
                {guild?.description || "함께 성장하는 우리만의 길드"}
              </p>
              {#if currentUser}
                <button
                  on:click={startEditingDesc}
                  class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-transparent text-slate-500 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
                  title="길드 설명 수정"
                >
                  <Pencil size={15} />
                </button>
              {/if}
            </div>
          {/if}
        </div>

        <div class="guild-stat-grid mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div class="app-metal-stat">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Members</div>
            <div class="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
              <Users size={18} class="text-cyan-300" />
              {characters.length}
            </div>
            <div class="mt-2 text-sm text-slate-400">등록된 모험가 수</div>
          </div>
          <div class="app-metal-stat app-metal-stat-cyan">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Economy</div>
            <div class="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
              <Coins size={18} class="text-amber-300" />
              {totalGold.toLocaleString()}
            </div>
            <div class="mt-2 text-sm text-slate-400">길드 전체 보유 골드</div>
          </div>
          <div class="app-metal-stat app-metal-stat-rose">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Average Lv</div>
            <div class="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
              <Gem size={18} class="text-fuchsia-300" />
              {averageLevel}
            </div>
            <div class="mt-2 text-sm text-slate-400">파티 평균 레벨</div>
          </div>
          <div class="app-metal-stat">
            <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Top Rank</div>
            {#if topRankCharacter && topRankInfo}
              <div class="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
                <span class="text-amber-200">{topRankInfo.icon}</span>
                {topRankInfo.label}
              </div>
              <div class="mt-2 text-sm text-amber-200">{topRankCharacter.name} · {topRankInfo.title}</div>
            {:else}
              <div class="mt-2 text-2xl font-bold text-white">-</div>
              <div class="mt-2 text-sm text-slate-400">등급 데이터 없음</div>
            {/if}
          </div>
        </div>
      </div>

      <aside class="dashboard-action-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <button on:click={copyInviteCode} class="app-action-tile app-ledger-panel flex w-full justify-between px-4 py-4 text-left">
          <span>
            <span class="block text-xs uppercase tracking-[0.18em] text-slate-500">Invite Code</span>
            <span class="mt-1 block text-lg font-semibold text-white">{guild?.code || "------"}</span>
          </span>
          <div class="app-brass-coin text-cyan-200">
            <Copy size={18} />
          </div>
        </button>

        <button on:click={toggleShopManagerPanel} class="app-action-tile app-ledger-panel flex w-full justify-between px-4 py-4 text-left">
          <span>
            <span class="block text-xs uppercase tracking-[0.18em] text-slate-500">Reward System</span>
            <span class="mt-1 block text-lg font-semibold text-white">
              {showShopManager ? "상점 관리자 닫기" : "상점 관리 열기"}
            </span>
          </span>
          <div class="app-seal text-amber-200">
            <Store size={18} class="float-gentle" />
          </div>
        </button>

        <button on:click={startEditingSettings} class="app-action-tile app-ledger-panel flex w-full justify-between px-4 py-4 text-left">
          <span>
            <span class="block text-xs uppercase tracking-[0.18em] text-slate-500">Reward Rules</span>
            <span class="mt-1 block text-lg font-semibold text-white">보상 확률 설정</span>
          </span>
          <div class="app-seal text-fuchsia-200">
            <Settings2 size={18} />
          </div>
        </button>

        <button on:click={handleLeaveGuild} class="app-action-tile app-ledger-panel flex w-full justify-between border border-rose-300/18 bg-rose-300/8 px-4 py-4 text-left text-rose-100 sm:col-span-2 lg:col-span-1">
          <span>
            <span class="block text-xs uppercase tracking-[0.18em] text-rose-200/70">Danger Zone</span>
            <span class="mt-1 block text-lg font-semibold">길드 탈퇴</span>
          </span>
          <DoorOpen size={18} />
        </button>
      </aside>
    </div>
  </section>

  <section class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
    <article class="app-card app-ledger-panel reveal-rise p-5 sm:p-6" style="animation-delay: 120ms">
      <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div class="app-command-strip">
          <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Global Standing</div>
          <h2 class="mt-2 text-2xl font-semibold text-white">길드 운영 정보</h2>
        </div>
        <div class="app-stitch-tag">Active Status</div>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-2">
        <div class="app-ledger-panel p-4">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Created</div>
          <div class="mt-2 text-lg font-semibold text-white">{createdDate}</div>
          <p class="mt-2 text-sm text-slate-400">길드가 처음 개설된 날짜입니다.</p>
        </div>
        <div class="app-ledger-panel p-4">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Reward Chest</div>
          <div class="mt-2 text-lg font-semibold text-white">
            {(guild?.boxChance ?? 0.2) * 100}% / 최대 {guild?.maxBonusGold ?? 36}G
          </div>
          <p class="mt-2 text-sm text-slate-400">미션 완료 시 랜덤 상자 확률과 최대 보너스입니다.</p>
        </div>
      </div>
    </article>

    <article class="app-card app-ledger-panel reveal-rise p-5 sm:p-6" style="animation-delay: 180ms">
      <div class="app-command-strip">
      <div class="text-sm uppercase tracking-[0.18em] text-cyan-300">Top Operatives</div>
      <h2 class="mt-2 text-2xl font-semibold text-white">핵심 멤버</h2>
      </div>

      {#if featuredCharacters.length === 0}
        <div class="mt-5 rounded-[1.25rem] border border-dashed border-white/10 px-4 py-10 text-center text-slate-400">
          등록된 캐릭터가 없습니다.
        </div>
      {:else}
        <div class="mt-5 space-y-3">
          {#each featuredCharacters as character}
            {@const gradeInfo = getGradeInfo(character.grade)}
            <button
              on:click={() => (selectedCharForGame = character)}
              class="app-rank-focus app-action-tile app-ledger-panel flex w-full flex-col items-start justify-between gap-4 px-4 py-4 text-left sm:flex-row sm:items-center"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-start gap-3">
                  <div class="app-rank-medal shrink-0">
                    <div class="text-2xl font-black text-amber-200">{gradeInfo.icon}</div>
                    <div class="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                      Stage {gradeInfo.level}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <div class="font-semibold text-white">{character.name}</div>
                      <div class="app-rank-pill">
                        {gradeInfo.label}
                      </div>
                    </div>
                    <div class="mt-2 text-sm font-medium text-amber-200">{gradeInfo.title}</div>
                    <div class="app-dense-copy mt-1 text-sm text-slate-400">
                      Lv.{character.level || 1} · {character.jobClass}
                    </div>
                  </div>
                </div>
              </div>

              <div class="w-full shrink-0 text-left sm:min-w-[5.5rem] sm:text-right">
                <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">Status</div>
                <div class="mt-2 text-sm font-semibold text-amber-200">{character.currentGold || 0} G</div>
                <div class={`app-stitch-tag mt-2 text-[11px] ${isMaxGrade(character.grade) ? "text-amber-100" : "text-cyan-100"}`}>
                  {isMaxGrade(character.grade) ? "최고 등급" : "등급전 진입"}
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </article>
  </section>

  {#if showShopManager}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md">
      <div class="shop-modal app-modal app-modal-scroll w-full max-w-4xl p-4 sm:p-5 md:p-7">
        <div class="flex flex-col gap-4 border-b border-white/8 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Reward System</div>
            <h3 class="mt-2 text-2xl font-semibold text-white">길드 상점 관리</h3>
            <p class="mt-2 text-sm text-slate-400">길드 보상 아이템을 등록하고 수정합니다.</p>
          </div>

          <div class="modal-action-row flex gap-2">
            <button on:click={() => (showShopManager = false)} class="app-button app-button-secondary px-4 py-3 text-sm">
              닫기
            </button>
          </div>
        </div>

        <div class="mt-5">
          <ShopManager guildId={guildId} />
        </div>
      </div>
    </div>
  {/if}

  {#if isEditingSettings}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-md">
      <div class="settings-modal app-modal app-ledger-panel w-full max-w-lg p-4 sm:p-6 md:p-7">
        <div class="border-b border-white/8 pb-5">
          <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Reward Rules</div>
          <h3 class="mt-2 text-2xl font-semibold text-white">길드 보상 설정</h3>
        </div>

        <div class="mt-5 space-y-4">
          <div>
            <label for="box-chance" class="mb-2 block text-sm font-medium text-slate-300">보너스 상자 확률</label>
            <input id="box-chance" bind:value={newBoxChance} type="number" min="0" max="1" step="0.05" class="app-input" />
            <p class="mt-2 text-sm text-slate-500">`0`에서 `1` 사이의 값으로 입력합니다. 예: `0.2` = 20%</p>
          </div>
          <div>
            <label for="max-bonus-gold" class="mb-2 block text-sm font-medium text-slate-300">최대 보너스 골드</label>
            <input id="max-bonus-gold" bind:value={newMaxBonusGold} type="number" min="0" class="app-input" />
          </div>
        </div>

        <div class="modal-action-row mt-5 flex justify-end gap-2 border-t border-white/8 pt-5">
          <button on:click={() => (isEditingSettings = false)} disabled={isSavingSettings} class="app-button app-button-secondary px-4 py-3 text-sm">
            취소
          </button>
          <button on:click={saveGuildSettings} disabled={isSavingSettings} class="app-button app-button-primary px-4 py-3 text-sm">
            {isSavingSettings ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if selectedCharForGame}
    <MiniGameModal
      guildId={guildId}
      characterId={selectedCharForGame.id!}
      characterName={selectedCharForGame.name}
      characterGrade={selectedCharForGame.grade}
      on:close={() => (selectedCharForGame = null)}
    />
  {/if}
</div>
