<script lang="ts">
    import { page } from '$app/stores';
    import { onDestroy } from 'svelte';
    import { guildStore, type GuildCharacter, GRADE_INFO } from '$lib/stores/guildStore';
    import { userStore } from '$lib/stores/userStore';
    import { itemStore, type ShopItem } from '$lib/stores/itemStore';
    import MiniGameModal from '$lib/components/MiniGameModal.svelte';
    import { JOB_ICONS, createCharacterForm, createShopItemForm, getTodayDateKey, requireRouteParam } from '$lib';
    import {
        checkInCharacterAction,
        closeShopItemModal,
        createCharacterAction,
        deleteCharacterAction,
        deleteShopItemAction,
        openShopItemModal,
        purchaseShopItemAction,
        saveShopItemAction,
        updateCharacterAction
    } from '$lib/features/members/actions';
    import { getRankStyle } from '$lib/features/members/helpers';

    // --- 기본 데이터 ---
    const guildId = requireRouteParam($page.params.guildId, 'guildId');
    const today = getTodayDateKey();
    
    // 스토어 구독
    const unsubscribeGuild = guildStore.init(guildId);
    const unsubscribeItems = itemStore.init(guildId);

    $: characters = $guildStore?.characters || [];
    $: shopItems = $itemStore || [];
    $: currentUser = $userStore;

    // --- State: 캐릭터 관리 ---
    let isCreating = false; // 캐릭터 생성 폼 열기/닫기
    let editingChar: GuildCharacter | null = null; // 수정 모달 (null이면 닫힘)
    let selectedCharForGame: GuildCharacter | null = null; // 등급전 모달
    
    // 캐릭터 입력 폼 데이터
    let newChar: Partial<GuildCharacter> = createCharacterForm();

    // --- State: 상점 관리 ---
    let shoppingChar: GuildCharacter | null = null; // 상점 열린 캐릭터
    let isShopManaging = false; // 관리 모드 토글
    let isItemModalOpen = false; // 아이템 생성/수정 모달
    let editingItem: ShopItem | null = null; // 수정 중인 아이템
    
    // 아이템 입력 폼 데이터
    let newItem: Partial<ShopItem> = createShopItemForm();


    // ==========================================
    // 🕹️ Actions: 캐릭터 (Character)
    // ==========================================

    // 1. 캐릭터 생성
    async function handleCreate() {
        try {
            const result = await createCharacterAction(guildId, newChar);
            isCreating = result.isCreating;
            newChar = result.newChar;
        } catch (e: any) {
            alert("생성 실패: " + e.message);
        }
    }

    // 2. 캐릭터 수정 저장
    async function handleUpdate() {
        try {
            editingChar = await updateCharacterAction(guildId, editingChar);
        } catch (e: any) {
            alert("수정 실패: " + e.message);
        }
    }

    // 3. 캐릭터 삭제
    async function handleDelete(char: GuildCharacter) {
        try {
            await deleteCharacterAction(guildId, char);
        } catch (e: any) {
            alert("삭제 실패: " + e.message);
        }
    }

    async function handleCheckIn(charId: string) {
        try {
            await checkInCharacterAction(guildId, charId);
        } catch (e: any) {
            alert("출석 실패: " + e.message);
        }
    }

    // ==========================================
    // 🛒 Actions: 상점 (Shop)
    // ==========================================

    // 1. 아이템 저장 (생성/수정)
    async function handleSaveItem() {
        try {
            const result = await saveShopItemAction(guildId, newItem, editingItem);
            newItem = result.newItem;
            if (result.shouldClose) {
                closeItemModal();
            }
        } catch (e: any) {
            alert("오류 발생: " + e.message);
        }
    }

    // 2. 아이템 삭제
    async function handleDeleteItem(item: ShopItem) {
        await deleteShopItemAction(guildId, item);
    }

    // 3. 구매 (골드 사용)
    async function handlePurchase(item: ShopItem) {
        try {
            await purchaseShopItemAction(guildId, shoppingChar, item);
        } catch (e: any) {
            alert("구매 실패: " + e.message);
        }
    }

    // --- Helpers (Shop) ---
    function openItemModal(item?: ShopItem) {
        const modalState = openShopItemModal(item);
        editingItem = modalState.editingItem;
        newItem = modalState.newItem;
        isItemModalOpen = modalState.isItemModalOpen;
    }

    function closeItemModal() {
        const modalState = closeShopItemModal();
        isItemModalOpen = modalState.isItemModalOpen;
        editingItem = modalState.editingItem;
    }

    // --- Cleanup ---
    onDestroy(() => {
        if (unsubscribeGuild) unsubscribeGuild();
        if (unsubscribeItems) unsubscribeItems();
    });
</script>

<div class="p-4 max-w-5xl mx-auto pb-20">
    
    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">📜 등장인물 관리 & 상점</h1>
            <p class="text-gray-500 text-sm">캐릭터를 등록하고, 모은 골드로 보상을 교환하세요.</p>
        </div>
        <button 
            on:click={() => isCreating = !isCreating}
            class="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow transition"
        >
            {isCreating ? '닫기' : '+ 캐릭터 생성'}
        </button>
    </div>

    {#if isCreating}
        <div class="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 mb-8 animate-fade-in-down">
            <h3 class="font-bold text-lg mb-4 text-indigo-900">✨ 새로운 모험가 등록</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label for="new-char-name" class="block text-sm font-bold text-gray-600 mb-1">이름</label>
                    <input 
                        id="new-char-name"
                        type="text" 
                        bind:value={newChar.name}
                        placeholder="예: 용감한 쿠키"
                        class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label for="new-char-job" class="block text-sm font-bold text-gray-600 mb-1">직업</label>
                    <select 
                        id="new-char-job"
                        bind:value={newChar.jobClass}
                        class="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        {#each Object.entries(JOB_ICONS) as [job, icon]}
                            <option value={job}>{icon} {job}</option>
                        {/each}
                    </select>
                </div>
                <div>
                    <label for="new-char-grade" class="block text-sm font-bold text-gray-600 mb-1">등급</label>
                    <select 
                        id="new-char-grade"
                        bind:value={newChar.grade}
                        class="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        {#each Object.entries(GRADE_INFO) as [key, info]}
                            <option value={key}>{info.icon} {info.label}</option>
                        {/each}
                    </select>
                </div>
                <div class="md:col-span-1">
                    <label for="new-char-description" class="block text-sm font-bold text-gray-600 mb-1">설명 / 특징</label>
                    <input 
                        id="new-char-description"
                        type="text" 
                        bind:value={newChar.description}
                        placeholder="예: 잠이 많지만 힘은 셈"
                        class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
            </div>
            <div class="flex justify-end gap-2">
                <button 
                    on:click={() => isCreating = false}
                    class="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold"
                >취소</button>
                <button 
                    on:click={handleCreate}
                    class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transform hover:-translate-y-0.5 transition"
                >
                    등록하기
                </button>
            </div>
        </div>
    {/if}

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each characters as char (char.id)}
            {@const style = getRankStyle(char.level)}
            {@const hasCheckedInToday = char.lastCheckInDate === today}
            <div class="{style.bg} {style.border} {style.shadow} {style.effect} 
                        rounded-xl overflow-hidden transition-all duration-300 group relative flex flex-col transform hover:-translate-y-1">
                 
                <div class="p-4 border-b border-black/5 flex justify-between items-start">
                    <div class="flex flex-col gap-1">
                        <span class="px-2 py-1 rounded text-xs font-bold shadow-sm {style.badge} w-fit">
                            {JOB_ICONS[char.jobClass] || '❓'} {char.jobClass}
                        </span>
                        {#if char.grade}
                            <span class="text-xs font-bold {GRADE_INFO[char.grade].color} flex items-center gap-1">
                                {GRADE_INFO[char.grade].icon} {GRADE_INFO[char.grade].label}
                            </span>
                        {/if}
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-xl {char.level >= 30 ? 'text-yellow-600 drop-shadow-sm' : 'text-yellow-600'}">
                            💰 {char.currentGold?.toLocaleString() || 0}
                        </div>
                        
                        <div class="text-xs font-mono mt-1 {style.levelText} flex items-center justify-end gap-1">
                            {#if char.grade}
                                <span class="text-lg" title={GRADE_INFO[char.grade].label}>{GRADE_INFO[char.grade].icon}</span>
                            {/if}
                            <span>Lv.{char.level || 1}</span>
                            {#if (char.consecutiveDays || 0) > 1}
                                <span class="text-green-500 font-bold"> (🔥{char.consecutiveDays})</span>
                            {/if}
                        </div>
                    </div>
                </div>

                <div class="p-5 flex-1 relative"> 
                    {#if char.grade === 'God'}
                        <div class="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 animate-pulse pointer-events-none"></div>
                    {/if}
                    <div class="flex justify-between items-start mb-2 relative z-10">
                        <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                            {char.name}
                            {#if char.grade === 'God'}
                                <span class="animate-bounce" title="가족의 신">🔱</span>
                            {:else}
                                {#if char.level >= 30}
                                    <span title="전설적인 영웅">👑</span>
                                {/if}
                            {/if}
                        </h3>
                        <div class="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button on:click={() => editingChar = { ...char }} class="w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-blue-100 text-gray-400 hover:text-blue-600 rounded-full transition">✏️</button>
                             <button on:click={() => handleDelete(char)} class="w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-full transition">🗑️</button>
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm line-clamp-3 min-h-[3rem]">{char.description || '설정이 없습니다.'}</p>
                </div>

                <div class="p-4 pt-0 flex flex-col gap-2">
                    <div class="grid grid-cols-2 gap-2">
                        <button 
                            on:click={() => handleCheckIn(char.id!)}
                            disabled={hasCheckedInToday}
                            class="w-full py-2 bg-green-100/80 hover:bg-green-200 text-green-900 font-bold rounded-lg transition flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                            <span>{hasCheckedInToday ? '✅ 출석완료' : '👋 출석체크'}</span>
                        </button>
                        <button 
                            on:click={() => shoppingChar = char}
                            class="w-full py-2 bg-yellow-100/80 hover:bg-yellow-200 text-yellow-900 font-bold rounded-lg transition flex items-center justify-center gap-2"
                        >
                            <span>🛒 상점 이용</span>
                        </button>
                    </div>

                    {#if hasCheckedInToday && char.lastMiniGameDate !== today}
                        <button 
                            on:click={() => selectedCharForGame = char}
                            class="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg text-sm font-bold shadow-md shadow-orange-200 transition animate-pulse"
                        >
                            🎖️ 등급 도전!
                        </button>
                    {:else if hasCheckedInToday && char.lastMiniGameDate === today}
                        <div class="w-full py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-bold text-center border border-gray-200">
                            ✨ 오늘 등급전 완료
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    {#if editingChar}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-pop-in">
                <h3 class="font-bold text-xl mb-4 text-gray-800">캐릭터 수정</h3>
                
                <div class="space-y-4 mb-6">
                    <div>
                        <label for="edit-char-name" class="block text-sm font-bold text-gray-600 mb-1">이름</label>
                        <input id="edit-char-name" bind:value={editingChar.name} class="w-full border rounded p-2" />
                    </div>
                    <div>
                        <label for="edit-char-job" class="block text-sm font-bold text-gray-600 mb-1">직업</label>
                        <select id="edit-char-job" bind:value={editingChar.jobClass} class="w-full border rounded p-2 bg-white">
                            {#each Object.entries(JOB_ICONS) as [job, icon]}
                                <option value={job}>{icon} {job}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label for="edit-char-grade" class="block text-sm font-bold text-gray-600 mb-1">등급</label>
                        <select id="edit-char-grade" bind:value={editingChar.grade} class="w-full border rounded p-2 bg-white">
                            {#each Object.entries(GRADE_INFO) as [key, info]}
                                <option value={key}>{info.icon} {info.label}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label for="edit-char-description" class="block text-sm font-bold text-gray-600 mb-1">설명</label>
                        <textarea id="edit-char-description" bind:value={editingChar.description} class="w-full border rounded p-2" rows="3"></textarea>
                    </div>
                </div>

                <div class="flex justify-end gap-2">
                    <button on:click={() => editingChar = null} class="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 font-bold">취소</button>
                    <button on:click={handleUpdate} class="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">저장</button>
                </div>
            </div>
        </div>
    {/if}

    {#if shoppingChar}
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
                
                <div class="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 border-b border-yellow-200 shrink-0">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-bold text-xl text-yellow-900">🏰 골드 상점</h3>
                            <p class="text-sm text-yellow-700 mt-1">
                                손님: <strong>{shoppingChar.name}</strong> 
                                <span class="bg-white bg-opacity-50 px-2 rounded-full ml-1 text-xs">💰 {shoppingChar.currentGold?.toLocaleString()} G</span>
                            </p>
                        </div>
                        <!-- <button 
                            on:click={() => isShopManaging = !isShopManaging}
                            class="text-xs text-yellow-800 underline opacity-60 hover:opacity-100"
                        >
                            {isShopManaging ? '관리 종료' : '상품 관리'}
                        </button> -->
                    </div>
                </div>

                <div class="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                    {#if isShopManaging}
                        <button 
                            on:click={() => openItemModal()}
                            class="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition mb-2"
                        >
                            + 새 상품 등록
                        </button>
                    {/if}

                    {#if shopItems.length === 0}
                        <div class="text-center py-8 text-gray-400 text-sm">
                            등록된 상품이 없습니다.<br>관리 버튼을 눌러 추가해보세요!
                        </div>
                    {/if}

                    {#each shopItems as item (item.id)}
                        {@const canAfford = (shoppingChar.currentGold || 0) >= item.cost}
                        <div class="relative group">
                            <button 
                                on:click={() => handlePurchase(item)}
                                disabled={!canAfford || isShopManaging}
                                class="w-full flex items-center justify-between p-4 rounded-xl border-2 transition relative overflow-hidden text-left
                                {canAfford 
                                    ? 'border-gray-100 hover:border-yellow-400 hover:bg-yellow-50 bg-white' 
                                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'}
                                {isShopManaging ? 'opacity-50 pointer-events-none' : ''}"
                            >
                                <div class="flex items-center gap-3 z-10">
                                    <span class="text-2xl">{item.icon}</span>
                                    <div>
                                        <div class="font-bold text-gray-800">{item.name}</div>
                                        {#if item.description}
                                            <div class="text-xs text-gray-500">{item.description}</div>
                                        {/if}
                                    </div>
                                </div>
                                <div class="z-10 font-bold {canAfford ? 'text-yellow-600' : 'text-red-400'}">
                                    {item.cost} G
                                </div>
                            </button>

                            {#if isShopManaging}
                                <div class="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center gap-2 rounded-xl border-2 border-indigo-100 z-20 animate-fade-in">
                                    <button 
                                        on:click|stopPropagation={() => openItemModal(item)}
                                        class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-bold hover:bg-indigo-200"
                                    >수정</button>
                                    <button 
                                        on:click|stopPropagation={() => handleDeleteItem(item)}
                                        class="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-bold hover:bg-red-200"
                                    >삭제</button>
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>

                <div class="p-4 border-t bg-gray-50 shrink-0">
                    <button on:click={() => shoppingChar = null} class="w-full py-3 text-gray-600 hover:bg-gray-200 rounded-lg font-bold">
                        상점 나가기
                    </button>
                </div>
            </div>
        </div>
    {/if}

    {#if isItemModalOpen}
        <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-pop-in">
                <h3 class="font-bold text-lg mb-4 text-gray-800">
                    {editingItem ? '상품 수정' : '새 상품 등록'}
                </h3>
                
                <div class="space-y-3 mb-6">
                    <div>
                        <label for="item-name" class="block text-xs font-bold text-gray-500 mb-1">상품명</label>
                        <input id="item-name" bind:value={newItem.name} class="w-full border rounded p-2" placeholder="예: 휴식 1시간" />
                    </div>
                    <div class="flex gap-3">
                        <div class="flex-1">
                            <label for="item-cost" class="block text-xs font-bold text-gray-500 mb-1">가격 (G)</label>
                            <input id="item-cost" type="number" bind:value={newItem.cost} class="w-full border rounded p-2" min="0" />
                        </div>
                        <div class="w-1/3">
                            <label for="item-icon" class="block text-xs font-bold text-gray-500 mb-1">아이콘</label>
                            <input id="item-icon" bind:value={newItem.icon} class="w-full border rounded p-2 text-center" placeholder="🎁" />
                        </div>
                    </div>
                    <div>
                        <label for="item-description" class="block text-xs font-bold text-gray-500 mb-1">설명 (선택)</label>
                        <input id="item-description" bind:value={newItem.description} class="w-full border rounded p-2" placeholder="예: 주말에만 사용 가능" />
                    </div>
                </div>

                <div class="flex gap-2">
                    <button on:click={closeItemModal} class="flex-1 py-2 bg-gray-100 rounded hover:bg-gray-200 font-bold">취소</button>
                    <button on:click={handleSaveItem} class="flex-1 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">
                        {editingItem ? '수정' : '등록'}
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
            on:close={() => selectedCharForGame = null}
        />
    {/if}

</div>

<style>
    /* 팝업 애니메이션 */
    @keyframes pop-in {
        0% { transform: scale(0.95); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
    }
    .animate-pop-in {
        animation: pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    @keyframes fade-in-down {
        0% { transform: translateY(-10px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
    }
    .animate-fade-in-down {
        animation: fade-in-down 0.3s ease-out;
    }

    /* 커스텀 스크롤바 */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(0,0,0,0.1);
        border-radius: 20px;
    }
    /* 기존 스타일 아래에 추가 */
    .animate-pulse-slow {
        animation: pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 15px rgba(250, 204, 21, 0.4); }
        50% { box-shadow: 0 0 25px rgba(250, 204, 21, 0.8); }
    }
</style>
