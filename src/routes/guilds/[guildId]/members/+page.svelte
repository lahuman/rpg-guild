<script lang="ts">
  import { page } from "$app/stores";
  import { onDestroy } from "svelte";
  import MiniGameModal from "$lib/components/MiniGameModal.svelte";
  import ShopManager from "$lib/components/ShopManager.svelte";
  import { JOB_ICONS, createCharacterForm, notifyError, requireRouteParam } from "$lib";
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
    ShoppingBag,
    Sparkles,
    Trash2,
    UserPlus,
    Users
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
  let shoppingChar: GuildCharacter | null = null;
  let showShopManager = false;
  let newChar: Partial<GuildCharacter> = createCharacterForm();

  function getRankStyle(level = 1) {
    if (level >= 30) {
      return {
        border: "border-amber-300/35",
        glow: "shadow-[0_0_40px_rgba(251,191,36,0.12)]",
        badge: "bg-amber-300/12 text-amber-100",
        accent: "text-amber-200"
      };
    }

    if (level >= 20) {
      return {
        border: "border-fuchsia-300/25",
        glow: "shadow-[0_0_32px_rgba(217,70,239,0.1)]",
        badge: "bg-fuchsia-300/10 text-fuchsia-100",
        accent: "text-fuchsia-200"
      };
    }

    if (level >= 10) {
      return {
        border: "border-cyan-300/25",
        glow: "shadow-[0_0_28px_rgba(103,232,249,0.08)]",
        badge: "bg-cyan-300/10 text-cyan-100",
        accent: "text-cyan-200"
      };
    }

    return {
      border: "border-white/10",
      glow: "",
      badge: "bg-white/6 text-slate-200",
      accent: "text-slate-200"
    };
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

  onDestroy(() => {
    if (unsubscribeGuild) unsubscribeGuild();
    if (unsubscribeItems) unsubscribeItems();
  });
</script>

<div class="space-y-5 pb-20">
  <section class="app-panel-strong app-ledger-panel reveal-rise rounded-[2rem] px-5 py-6 md:px-8 md:py-8">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div class="app-command-strip">
        <div class="eyebrow">Roster</div>
        <h1 class="section-title mt-4 text-3xl text-white md:text-4xl">멤버 & 캐릭터 운영</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
          출석, 성장, 등급전, 상점 소비까지 캐릭터 운영 루프를 하나의 길드 보드로 묶었습니다.
        </p>
      </div>

      <button on:click={() => (isCreating = !isCreating)} class="app-button app-command-button px-5 py-3 text-sm">
        <UserPlus size={18} />
        {isCreating ? "생성 닫기" : "캐릭터 생성"}
      </button>
    </div>

    <div class="mt-5 grid gap-3 md:grid-cols-3">
      <div class="app-metal-stat">
        <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Characters</div>
        <div class="mt-2 text-3xl font-bold text-white">{characters.length}</div>
        <div class="mt-1 text-sm text-slate-400">현재 운영 중인 캐릭터 수</div>
      </div>
      <div class="app-metal-stat app-metal-stat-cyan">
        <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Shop Items</div>
        <div class="mt-2 text-3xl font-bold text-white">{shopItems.length}</div>
        <div class="mt-1 text-sm text-slate-400">교환 가능한 보상 아이템 수</div>
      </div>
      <div class="app-metal-stat app-metal-stat-rose">
        <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Ready</div>
        <div class="mt-2 text-3xl font-bold text-white">{readyCount}</div>
        <div class="mt-1 text-sm text-slate-400">오늘 출석 완료한 캐릭터 수</div>
      </div>
    </div>
  </section>

  {#if isCreating}
    <section class="app-card reveal-rise p-5 md:p-7" style="animation-delay: 120ms">
      <div class="mb-5">
        <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Create Character</div>
        <h2 class="mt-2 text-2xl font-semibold text-white">새로운 모험가 등록</h2>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label for="new-character-name" class="mb-2 block text-sm font-medium text-slate-300">이름</label>
          <input id="new-character-name" bind:value={newChar.name} class="app-input" placeholder="예: 용감한 쿠키" />
        </div>

        <div>
          <label for="new-character-job" class="mb-2 block text-sm font-medium text-slate-300">직업</label>
          <select id="new-character-job" bind:value={newChar.jobClass} class="app-select">
            {#each Object.entries(JOB_ICONS) as [job, icon]}
              <option value={job}>{icon} {job}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="new-character-grade" class="mb-2 block text-sm font-medium text-slate-300">등급</label>
          <select id="new-character-grade" bind:value={newChar.grade} class="app-select">
            {#each gradeOptions as option}
              <option value={option.key}>{option.info.icon} {option.info.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="new-character-description" class="mb-2 block text-sm font-medium text-slate-300">설명 / 특징</label>
          <input id="new-character-description" bind:value={newChar.description} class="app-input" placeholder="예: 잠이 많지만 힘은 셈" />
        </div>
      </div>

      <div class="mt-5 flex justify-end gap-2">
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
      <Users size={28} class="mx-auto text-slate-500" />
      <h2 class="mt-4 text-2xl font-semibold text-white">캐릭터가 아직 없습니다</h2>
      <p class="mt-3 text-sm text-slate-400">첫 번째 모험가를 등록해 길드의 운영 루프를 시작하세요.</p>
    </section>
  {:else}
    <section class="stagger-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {#each characters as char (char.id)}
        {@const style = getRankStyle(char.level)}
        {@const hasCheckedInToday = char.lastCheckInDate === today}
        {@const gradeInfo = getGradeInfo(char.grade)}
        <article class={`app-card app-ledger-panel app-ledger-lines flex flex-col p-5 md:p-6 transition hover:-translate-y-1 ${style.border} ${style.glow}`}>
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class={`app-stitch-tag ${style.badge}`}>
                {JOB_ICONS[char.jobClass] || "❓"} {char.jobClass}
              </div>
              <div class="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <span title={gradeInfo.label}>{gradeInfo.icon}</span>
                <span>{gradeInfo.label}</span>
              </div>
              <div class="mt-2 text-xs text-amber-200">{gradeInfo.title}</div>
            </div>

            <div class="flex gap-1">
              <button on:click={() => (editingChar = { ...char })} class="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-cyan-200">
                <Pencil size={15} />
              </button>
              <button on:click={() => handleDelete(char)} class="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-rose-200">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div class="mt-5">
            <div class="flex items-center gap-2">
              <h3 class="text-2xl font-semibold text-white">{char.name}</h3>
              {#if isMaxGrade(char.grade)}
                <span title="가족의 신">🔱</span>
              {:else if (char.level || 1) >= 30}
                <Crown size={18} class="text-amber-300" />
              {/if}
            </div>

            <p class="mt-3 min-h-[56px] text-sm leading-6 text-slate-400 md:min-h-[72px]">
              {char.description || "설정이 없습니다."}
            </p>
          </div>

          <div class="mt-5 grid gap-3 grid-cols-2">
            <div class="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
              <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Gold</div>
              <div class="mt-2 flex items-center gap-2 text-2xl font-bold text-amber-200">
                <Coins size={18} />
                {char.currentGold?.toLocaleString() || 0}
              </div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
              <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Level</div>
              <div class={`mt-2 text-2xl font-bold ${style.accent}`}>Lv.{char.level || 1}</div>
              {#if (char.consecutiveDays || 0) > 1}
                <div class="mt-1 text-xs text-emerald-300">연속 출석 {char.consecutiveDays}일</div>
              {/if}
            </div>
          </div>

          <div class="mt-5 grid gap-2">
            <div class="touch-grid-2">
              <button
                on:click={() => handleCheckIn(char.id!)}
                disabled={hasCheckedInToday}
                class={`app-button px-4 py-3 text-sm ${hasCheckedInToday ? "border border-white/10 bg-white/5 text-slate-500" : "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100"}`}
              >
                {hasCheckedInToday ? "출석 완료" : "출석 체크"}
              </button>

              <button
                on:click={() => {
                  shoppingChar = char;
                  showShopManager = false;
                }}
                class="app-button border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
              >
                <ShoppingBag size={16} />
                상점 이용
              </button>
            </div>

            {#if isMaxGrade(char.grade)}
              <div class="rounded-2xl border border-indigo-300/14 bg-indigo-300/8 px-4 py-3 text-center text-sm font-semibold text-indigo-100">
                최고 등급 도달
              </div>
            {:else if hasCheckedInToday && char.lastMiniGameDate !== today}
              <button
                on:click={() => (selectedCharForGame = char)}
                class="app-button border border-cyan-300/20 bg-cyan-300/12 px-4 py-3 text-sm text-cyan-100"
              >
                <Sparkles size={16} />
                등급 도전
              </button>
            {:else if hasCheckedInToday && char.lastMiniGameDate === today}
              <div class="rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-center text-sm font-semibold text-slate-400">
                오늘 등급전 완료
              </div>
            {/if}
          </div>
        </article>
      {/each}
    </section>
  {/if}

  {#if editingChar}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
      <div class="app-modal app-modal-scroll w-full max-w-lg p-5 md:p-7">
        <div class="flex items-center justify-between gap-4 border-b border-white/8 pb-5">
          <div>
            <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Edit Character</div>
            <h3 class="mt-2 text-2xl font-semibold text-white">캐릭터 수정</h3>
          </div>
          <button on:click={() => (editingChar = null)} class="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white">✕</button>
        </div>

        <div class="mt-5 space-y-4">
          <div>
            <label for="edit-character-name" class="mb-2 block text-sm font-medium text-slate-300">이름</label>
            <input id="edit-character-name" bind:value={editingChar.name} class="app-input" />
          </div>

          <div>
            <label for="edit-character-job" class="mb-2 block text-sm font-medium text-slate-300">직업</label>
            <select id="edit-character-job" bind:value={editingChar.jobClass} class="app-select">
              {#each Object.entries(JOB_ICONS) as [job, icon]}
                <option value={job}>{icon} {job}</option>
              {/each}
            </select>
          </div>

          <div>
          <label for="edit-character-grade" class="mb-2 block text-sm font-medium text-slate-300">등급</label>
          <select id="edit-character-grade" bind:value={editingChar.grade} class="app-select">
              {#each gradeOptions as option}
                <option value={option.key}>{option.info.icon} {option.info.label}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="edit-character-description" class="mb-2 block text-sm font-medium text-slate-300">설명</label>
            <textarea id="edit-character-description" bind:value={editingChar.description} class="app-textarea min-h-[120px]"></textarea>
          </div>
        </div>

        <div class="mt-5 flex justify-end gap-2 border-t border-white/8 pt-5">
          <button on:click={() => (editingChar = null)} class="app-button app-button-secondary px-4 py-3 text-sm">
            취소
          </button>
          <button on:click={handleUpdate} class="app-button app-button-primary px-4 py-3 text-sm">
            저장
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if shoppingChar}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
      <div class="app-modal app-modal-scroll w-full max-w-4xl p-5 md:p-7">
        <div class="flex flex-col gap-4 border-b border-white/8 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Gold Shop</div>
            <h3 class="mt-2 text-2xl font-semibold text-white">{shoppingChar.name}의 상점</h3>
            <p class="mt-2 text-sm text-slate-400">
              현재 보유 골드 <span class="font-semibold text-amber-200">{shoppingChar.currentGold?.toLocaleString() || 0} G</span>
            </p>
          </div>

          <div class="flex gap-2">
            <button
              on:click={() => (showShopManager = !showShopManager)}
              class="app-button app-button-secondary px-4 py-3 text-sm"
            >
              {showShopManager ? "구매 모드" : "상품 관리"}
            </button>
            <button on:click={() => (shoppingChar = null)} class="app-button app-button-secondary px-4 py-3 text-sm">
              닫기
            </button>
          </div>
        </div>

        {#if showShopManager}
          <div class="mt-5">
            <ShopManager guildId={guildId} />
          </div>
        {:else if shopItems.length === 0}
          <div class="py-14 text-center text-slate-400">
            등록된 상품이 없습니다. 상단의 `상품 관리`에서 아이템을 추가하세요.
          </div>
        {:else}
          <div class="mt-5 grid gap-3 md:grid-cols-2">
            {#each shopItems as item (item.id)}
              {@const canAfford = (shoppingChar.currentGold || 0) >= item.cost}
              <button
                on:click={() => handlePurchase(item)}
                disabled={!canAfford}
                class={`rounded-[1.2rem] border p-4 text-left transition ${canAfford ? "border-white/10 bg-white/4 hover:bg-white/6" : "border-white/8 bg-white/4 opacity-45"}`}
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/40 text-2xl">
                      {item.icon}
                    </div>
                    <div>
                      <div class="flex items-center gap-2 font-semibold text-white">
                        {item.name}
                        {#if item.isOneTime}
                          <span class="rounded-full bg-rose-300/12 px-2 py-0.5 text-[11px] text-rose-200">1회용</span>
                        {/if}
                      </div>
                      {#if item.description}
                        <div class="mt-1 text-xs text-slate-400">{item.description}</div>
                      {/if}
                    </div>
                  </div>

                  <div class={`whitespace-nowrap text-sm font-semibold ${canAfford ? "text-amber-200" : "text-rose-200"}`}>
                    {item.cost} G
                  </div>
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
</div>
