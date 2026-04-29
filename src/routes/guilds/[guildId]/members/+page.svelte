<script lang="ts">
  import { page } from "$app/stores";
  import { onDestroy, tick } from "svelte";
  import MiniGameModal from "$lib/components/MiniGameModal.svelte";
  import ShopManager from "$lib/components/ShopManager.svelte";
  import PointTransferModal from "$lib/components/PointTransferModal.svelte";
  import { JOB_ICONS, createCharacterForm, lockBodyScroll, notifyError, requireRouteParam } from "$lib";
  import {
    checkInCharacterAction,
    createCharacterAction,
    deleteCharacterAction,
    purchaseShopItemAction,
    updateCharacterAction
  } from "$lib/features/members/actions";
  import { GRADE_ORDER, getGradeInfo, guildStore, isMaxGrade, type GuildCharacter } from "$lib/stores/guildStore";
  import { itemStore, type ShopItem } from "$lib/stores/itemStore";
  import { getTodayDateKey } from "$lib/utils/date";
  import {
    Coins,
    Crown,
    Pencil,
    Send,
    ShoppingBag,
    Sparkles,
    Trash2,
    UserPlus,
    Users,
    X
  } from "lucide-svelte";

  const guildId = requireRouteParam($page.params.guildId, "guildId");
  const today = getTodayDateKey();
  const unsubscribeGuild = guildStore.init(guildId);
  const unsubscribeItems = itemStore.init(guildId);

  $: characters = $guildStore?.characters || [];
  $: shopItems = $itemStore || [];
  $: readyCount = characters.filter((character) => character.lastCheckInDate === today).length;
  $: gradeOptions = GRADE_ORDER.map((grade) => ({ key: grade, info: getGradeInfo(grade) }));

  let isCreating = false;
  let editingChar: GuildCharacter | null = null;
  let selectedCharForGame: GuildCharacter | null = null;
  let selectedCharForTransfer: GuildCharacter | null = null;
  let shoppingChar: GuildCharacter | null = null;
  let showShopManager = false;
  let newChar: Partial<GuildCharacter> = createCharacterForm();
  let shopModalBody: HTMLDivElement | null = null;
  let releaseBodyScrollLock: (() => void) | null = null;

  $: hasOpenModal = Boolean(editingChar || shoppingChar || selectedCharForGame || selectedCharForTransfer);
  $: {
    if (hasOpenModal && !releaseBodyScrollLock) {
      releaseBodyScrollLock = lockBodyScroll();
    } else if (!hasOpenModal && releaseBodyScrollLock) {
      releaseBodyScrollLock();
      releaseBodyScrollLock = null;
    }
  }

  async function handleCreate() {
    try {
      const result = await createCharacterAction(guildId, newChar);
      isCreating = result.isCreating;
      newChar = result.newChar;
    } catch (error) {
      notifyError(error, "캐릭터 생성에 실패했습니다.");
    }
  }

  async function handleUpdate() {
    try {
      editingChar = await updateCharacterAction(guildId, editingChar);
    } catch (error) {
      notifyError(error, "캐릭터 수정에 실패했습니다.");
    }
  }

  async function handleDelete(char: GuildCharacter) {
    try {
      await deleteCharacterAction(guildId, char);
    } catch (error) {
      notifyError(error, "캐릭터 삭제에 실패했습니다.");
    }
  }

  async function handleCheckIn(charId: string) {
    try {
      await checkInCharacterAction(guildId, charId);
    } catch (error) {
      notifyError(error, "출석 처리에 실패했습니다.");
    }
  }

  async function handlePurchase(item: ShopItem) {
    try {
      await purchaseShopItemAction(guildId, shoppingChar, item);
    } catch (error) {
      notifyError(error, "아이템 구매에 실패했습니다.");
    }
  }

  async function toggleShopManagerMode() {
    showShopManager = !showShopManager;
    await tick();
    shopModalBody?.scrollTo({ top: 0, behavior: "smooth" });
  }

  onDestroy(() => {
    releaseBodyScrollLock?.();
    if (unsubscribeGuild) unsubscribeGuild();
    if (unsubscribeItems) unsubscribeItems();
  });
</script>

<div class="space-y-5 pb-20">
  <section class="app-panel reveal-rise px-5 py-6 md:px-8 md:py-8">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div class="app-command-strip">
        <div class="eyebrow">Roster</div>
        <h1 class="section-title mt-4 text-3xl md:text-4xl">멤버 & 캐릭터 운영</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 md:text-base">
          출석, 성장, 등급전, 상점 소비까지 캐릭터 운영 루프를 하나의 길드 보드로 묶었습니다.
        </p>
      </div>

      <button on:click={() => (isCreating = !isCreating)} class="app-button app-button-primary px-5 py-3 text-sm">
        <UserPlus size={18} />
        {isCreating ? "생성 닫기" : "캐릭터 생성"}
      </button>
    </div>

    <div class="mt-5 grid gap-3 md:grid-cols-3">
      <div class="app-metal-stat">
        <div class="app-label">Characters</div>
        <div class="mt-2 text-3xl font-bold">{characters.length}</div>
        <div class="mt-1 text-sm">현재 운영 중인 캐릭터 수</div>
      </div>
      <div class="app-metal-stat app-metal-stat-cyan">
        <div class="app-label">Shop Items</div>
        <div class="mt-2 text-3xl font-bold">{shopItems.length}</div>
        <div class="mt-1 text-sm">교환 가능한 보상 아이템 수</div>
      </div>
      <div class="app-metal-stat app-metal-stat-rose">
        <div class="app-label">Ready</div>
        <div class="mt-2 text-3xl font-bold">{readyCount}</div>
        <div class="mt-1 text-sm">오늘 출석 완료한 캐릭터 수</div>
      </div>
    </div>
  </section>

  {#if isCreating}
    <section class="app-card reveal-rise p-5 md:p-7" style="animation-delay: 120ms">
      <div class="mb-5">
        <div class="app-label">Create Character</div>
        <h2 class="mt-2 text-2xl font-semibold">새로운 모험가 등록</h2>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label for="new-character-name" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">이름</label>
          <input id="new-character-name" bind:value={newChar.name} class="app-input" placeholder="예: 용감한 쿠키" />
        </div>

        <div>
          <label for="new-character-job" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">직업</label>
          <select id="new-character-job" bind:value={newChar.jobClass} class="app-select">
            {#each Object.entries(JOB_ICONS) as [job, icon]}
              <option value={job}>{icon} {job}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="new-character-grade" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">등급</label>
          <select id="new-character-grade" bind:value={newChar.grade} class="app-select">
            {#each gradeOptions as option}
              <option value={option.key}>{option.info.icon} {option.info.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="new-character-description" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">설명 / 특징</label>
          <input id="new-character-description" bind:value={newChar.description} class="app-input" placeholder="예: 잠이 많지만 힘은 셈" />
        </div>
      </div>

      <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button on:click={() => (isCreating = false)} class="app-button app-button-secondary px-4 py-3 text-sm">
          취소
        </button>
        <button on:click={handleCreate} class="app-button app-button-primary px-4 py-3 text-sm">
          등록하기
        </button>
      </div>
    </section>
  {/if}

  {#if characters.length === 0}
    <section class="app-card px-6 py-14 text-center">
      <Users size={28} class="mx-auto" />
      <h2 class="mt-4 text-2xl font-semibold">캐릭터가 아직 없습니다</h2>
      <p class="mt-3 text-sm">첫 번째 모험가를 등록해 길드의 운영 루프를 시작하세요.</p>
    </section>
  {:else}
    <section class="stagger-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {#each characters as char (char.id)}
        {@const hasCheckedInToday = char.lastCheckInDate === today}
        {@const gradeInfo = getGradeInfo(char.grade)}
        {@const accentClass = gradeInfo.accent}
        <article class="character-card app-card flex flex-col p-5 md:p-6 {accentClass}">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="app-stitch-tag">
                {JOB_ICONS[char.jobClass] || "❓"} {char.jobClass}
              </div>
              <div class="mt-3 flex items-center gap-2 text-sm">
                <span title={gradeInfo.label}>{gradeInfo.icon}</span>
                <span>{gradeInfo.label}</span>
              </div>
              <div class="mt-2 text-xs">{gradeInfo.title}</div>
            </div>

            <div class="flex gap-1">
              <button on:click={() => (editingChar = { ...char })} class="app-icon-btn" title="수정">
                <Pencil size={15} />
              </button>
              <button on:click={() => handleDelete(char)} class="app-icon-btn" title="삭제">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div class="mt-5">
            <div class="flex items-center gap-2">
              <h3 class="text-2xl font-semibold">{char.name}</h3>
              {#if isMaxGrade(char.grade)}
                <span title="가족의 신">🔱</span>
              {:else if (char.level || 1) >= 30}
                <Crown size={18} class="text-[var(--orange-badge)]" />
              {/if}
            </div>

            <p class="mt-3 min-h-[56px] text-sm leading-6 md:min-h-[72px]">
              {char.description || "설정이 없습니다."}
            </p>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <div class="app-stat-box">
              <div class="app-label">Gold</div>
              <div class="mt-2 flex items-center gap-2 text-2xl font-bold">
                <Coins size={18} />
                {char.currentGold?.toLocaleString() || 0}
              </div>
            </div>
            <div class="app-stat-box">
              <div class="app-label">Level</div>
              <div class="mt-2 text-2xl font-bold {accentClass}">Lv.{char.level || 1}</div>
              {#if (char.consecutiveDays || 0) > 1}
                <div class="mt-1 text-xs text-[var(--green)]">연속 출석 {char.consecutiveDays}일</div>
              {/if}
            </div>
          </div>

          <div class="mt-5 grid gap-2">
            <div class="touch-grid-2">
              <button
                on:click={() => handleCheckIn(char.id!)}
                disabled={hasCheckedInToday}
                class="app-button px-4 py-3 text-sm {hasCheckedInToday ? 'app-button-secondary' : 'app-button-primary'}"
              >
                {hasCheckedInToday ? "출석 완료" : "출석 체크"}
              </button>

              <button
                on:click={() => { shoppingChar = char; showShopManager = false; }}
                class="app-button app-button-secondary px-4 py-3 text-sm"
              >
                <ShoppingBag size={16} />
                상점
              </button>

              <button
                on:click={() => (selectedCharForTransfer = char)}
                class="app-button app-button-secondary px-4 py-3 text-sm"
              >
                <Send size={16} />
                양도
              </button>
            </div>

            {#if isMaxGrade(char.grade)}
              <div class="app-stat-card text-center text-sm font-semibold text-[var(--black)]">
                최고 등급 도달
              </div>
            {:else if hasCheckedInToday && char.lastMiniGameDate !== today}
              <button
                on:click={() => (selectedCharForGame = char)}
                class="app-button app-button-secondary px-4 py-3 text-sm"
              >
                <Sparkles size={16} />
                등급 도전
              </button>
            {:else if hasCheckedInToday && char.lastMiniGameDate === today}
              <div class="app-stat-card text-center text-sm font-semibold text-[var(--text-secondary)]">
                오늘 등급전 완료
              </div>
            {/if}
          </div>
        </article>
      {/each}
    </section>
  {/if}

  {#if editingChar}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--black)]/40 p-3 sm:p-4">
      <div class="member-edit-modal app-modal app-modal-scroll w-full max-w-lg bg-white">
        <div class="flex items-center justify-between gap-4 border-b border-[var(--grey-300)] px-5 py-5 md:px-6">
          <div>
            <div class="app-label">Edit Character</div>
            <h3 class="mt-2 text-2xl font-semibold">캐릭터 수정</h3>
          </div>
          <button on:click={() => (editingChar = null)} class="app-icon-btn">✕</button>
        </div>

        <div class="px-5 py-5 md:px-6">
          <div class="space-y-4">
            <div>
              <label for="edit-character-name" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">이름</label>
              <input id="edit-character-name" bind:value={editingChar.name} class="app-input" />
            </div>

            <div>
              <label for="edit-character-job" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">직업</label>
              <select id="edit-character-job" bind:value={editingChar.jobClass} class="app-select">
                {#each Object.entries(JOB_ICONS) as [job, icon]}
                  <option value={job}>{icon} {job}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="edit-character-grade" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">등급</label>
              <select id="edit-character-grade" bind:value={editingChar.grade} class="app-select">
                {#each gradeOptions as option}
                  <option value={option.key}>{option.info.icon} {option.info.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="edit-character-description" class="mb-2 block text-sm font-medium text-[var(--text-primary)]">설명</label>
              <textarea id="edit-character-description" bind:value={editingChar.description} class="app-textarea min-h-[120px]"></textarea>
            </div>
          </div>

          <div class="modal-action-row mt-5 flex justify-end gap-2 border-t border-[var(--grey-300)] pt-5">
            <button on:click={() => (editingChar = null)} class="app-button app-button-secondary px-4 py-3 text-sm">
              취소
            </button>
            <button on:click={handleUpdate} class="app-button app-button-primary px-4 py-3 text-sm">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if shoppingChar}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--black)]/40 p-3 sm:p-4">
      <div bind:this={shopModalBody} class="shop-modal app-modal app-modal-scroll w-full max-w-4xl bg-white">
        <div class="flex flex-col gap-4 border-b border-[var(--grey-300)] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6 md:py-6">
          <div>
            <div class="app-label">Gold Shop</div>
            <h3 class="mt-2 text-2xl font-semibold">{shoppingChar.name}의 상점</h3>
            <p class="mt-2 text-sm">
              현재 보유 골드 <span class="font-semibold">{shoppingChar.currentGold?.toLocaleString() || 0} G</span>
            </p>
            <p class="mt-2 text-xs uppercase tracking-[0.16em]">
              {showShopManager ? "현재 모드: 상품 관리" : "현재 모드: 구매 목록"}
            </p>
          </div>

          <div class="modal-action-row flex gap-2">
            <button on:click={toggleShopManagerMode} class="app-button app-button-secondary px-4 py-3 text-sm">
              {showShopManager ? "구매 목록 보기" : "상품 관리 열기"}
            </button>
            <button on:click={() => { shoppingChar = null; showShopManager = false; }} class="app-button app-button-secondary px-4 py-3 text-sm">
              닫기
            </button>
          </div>
        </div>

        {#if showShopManager}
          <div class="px-5 py-5 md:px-6 md:py-6">
            <ShopManager guildId={guildId} />
          </div>
        {:else if shopItems.length === 0}
          <div class="px-5 py-14 text-center md:px-6">
            등록된 상품이 없습니다. 상단의 "상품 관리"에서 아이템을 추가하세요.
          </div>
        {:else}
          <div class="shop-grid mt-5 grid gap-3 px-5 md:grid-cols-2 md:px-6">
            {#each shopItems as item (item.id)}
              {@const canAfford = (shoppingChar.currentGold || 0) >= item.cost}
              <button
                on:click={() => handlePurchase(item)}
                disabled={!canAfford}
                class="shop-product-btn {canAfford ? '' : 'shop-product-btn-disabled'}"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--grey-300)] bg-[var(--grey-100)] text-2xl">
                    {item.icon}
                  </div>
                  <div class="min-w-0 text-left">
                    <div class="flex flex-wrap items-center gap-2 font-semibold">
                      {item.name}
                      {#if item.isOneTime}
                        <span class="app-stitch-tag text-[11px] text-[var(--red)]">1회용</span>
                      {/if}
                    </div>
                    {#if item.description}
                      <div class="mt-1 text-xs text-[var(--text-secondary)]">{item.description}</div>
                    {/if}
                  </div>
                </div>
                <div class={`shrink-0 text-sm font-semibold ${canAfford ? "text-[var(--black)]" : "text-[var(--red)]"}`}>
                  {item.cost} G
                </div>
              </button>
            {/each}
          </div>
        {/if}
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

  {#if selectedCharForTransfer}
    <PointTransferModal
      guildId={guildId}
      fromCharacter={selectedCharForTransfer}
      allCharacters={characters}
      on:close={() => (selectedCharForTransfer = null)}
    />
  {/if}
</div>

<style>
  .shop-product-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-secondary);
    background: var(--white);
    padding: 1rem;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .shop-product-btn:hover:not(:disabled) {
    background: var(--grey-100);
    border-color: var(--grey-500);
  }

  .shop-product-btn-disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>