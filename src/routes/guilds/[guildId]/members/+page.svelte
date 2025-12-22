<script lang="ts">
    import { page } from '$app/stores';
    import { onDestroy } from 'svelte';
    import { guildStore, type GuildCharacter, type JobClass } from '$lib/stores/guildStore';
    import { userStore } from '$lib/stores/userStore';

    const guildId = $page.params.guildId;
    let currentUser = $userStore;

    const unsubscribe = guildStore.init(guildId);
    
    // Data
    $: characters = $guildStore?.characters || [];

    // --- State ---
    let isCreating = false;
    let editingChar: GuildCharacter | null = null;
    let shoppingChar: GuildCharacter | null = null; // 상점 이용 중인 캐릭터

    // Form Data
    let newChar: Partial<GuildCharacter> = { name: '', jobClass: '검사', description: '' };

    // --- Constants ---
    const jobIcons: Record<string, string> = {
        '검사': '⚔️', '마법사': '🔮', '힐러': '🌿', '사냥꾼': '🏹', '도적': '🗡️', '탱커': '🛡️'
    };
    
    // [NEW] 판매 상품 목록
    const shopItems = [
        { name: '📱 핸드폰 시간 30분', cost: 30, icon: '⏳' },
        { name: '💵 현금 1만원', cost: 100, icon: '💸' }
    ];

    // --- Actions ---

    // 1. 캐릭터 생성
    async function handleCreate() {
        if (!newChar.name) return alert("이름을 입력해주세요.");
        try {
            await guildStore.createCharacter(guildId, {
                name: newChar.name,
                jobClass: newChar.jobClass as JobClass,
                description: newChar.description || '',
                createdBy: currentUser?.uid || 'unknown'
            });
            isCreating = false;
            newChar = { name: '', jobClass: '검사', description: '' };
        } catch (e: any) { alert(e.message); }
    }

    // 2. 캐릭터 수정
    async function handleUpdate() {
        if (!editingChar) return;
        try {
            await guildStore.updateCharacter(guildId, editingChar.id!, {
                name: editingChar.name,
                jobClass: editingChar.jobClass,
                description: editingChar.description
            });
            editingChar = null;
        } catch (e: any) { alert(e.message); }
    }

    // 3. 캐릭터 삭제
    async function handleDelete(char: GuildCharacter) {
        if (confirm(`⚠️ 경고: [${char.name}] 캐릭터를 정말 삭제하시겠습니까?\n보유한 골드(${char.currentGold} G)도 모두 사라집니다.`)) {
            await guildStore.deleteCharacter(guildId, char.id!);
        }
    }

    // 4. [NEW] 골드 사용 (구매)
    async function handlePurchase(item: { name: string, cost: number }) {
        if (!shoppingChar) return;
        
        if (shoppingChar.currentGold < item.cost) {
            return alert(`골드가 부족합니다! (현재: ${shoppingChar.currentGold} G)`);
        }

        if (confirm(`[${shoppingChar.name}] 캐릭터로\n'${item.name}'을(를) 구매하시겠습니까?\n💰 ${item.cost} 골드가 차감됩니다.`)) {
            try {
                await guildStore.useGold(guildId, shoppingChar.id!, item.name, item.cost);
                alert(`구매 완료! ${item.name} 획득.`);
                shoppingChar = null; // 모달 닫기
            } catch (e: any) {
                alert("구매 실패: " + e.message);
            }
        }
    }

    onDestroy(() => unsubscribe());
</script>

<div class="p-4 max-w-5xl mx-auto">
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
        <div class="bg-indigo-50 p-6 rounded-xl shadow-inner border border-indigo-100 mb-8 animate-fade-in-down">
            <h3 class="font-bold text-lg mb-4 text-indigo-900">✨ 새 캐릭터 등록</h3>
            <div class="grid gap-4 md:grid-cols-2">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input bind:value={newChar.name} placeholder="예: 용사 김철수" class="w-full border rounded px-3 py-2" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">직업</label>
                    <select bind:value={newChar.jobClass} class="w-full border rounded px-3 py-2">
                        {#each Object.keys(jobIcons) as job}
                            <option value={job}>{jobIcons[job]} {job}</option>
                        {/each}
                    </select>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">설정 / 소개</label>
                    <textarea bind:value={newChar.description} placeholder="캐릭터의 특징을 적어주세요." class="w-full border rounded px-3 py-2 h-20"></textarea>
                </div>
            </div>
            <div class="mt-4 flex justify-end">
                <button on:click={handleCreate} class="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700">
                    등록하기
                </button>
            </div>
        </div>
    {/if}
<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each characters as char (char.id)}
            <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition group relative flex flex-col">
                <div class="p-4 border-b flex justify-between items-start bg-gray-50">
                    <span class="px-2 py-1 rounded text-xs font-bold bg-white border shadow-sm">
                        {jobIcons[char.jobClass]} {char.jobClass}
                    </span>
                    <div class="text-right">
                        <div class="text-yellow-600 font-bold text-xl">💰 {char.currentGold.toLocaleString()}</div>
                        <div class="text-xs text-gray-400">Lv.{char.level}</div>
                    </div>
                </div>

                <div class="p-5 flex-1 relative"> <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-gray-800">{char.name}</h3>
                        
                        <div class="flex gap-1 ml-2">
                            <button 
                                on:click={() => editingChar = { ...char }} 
                                class="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-600 transition" 
                                title="수정"
                            >
                                ✏️
                            </button>
                            <button 
                                on:click={() => handleDelete(char)} 
                                class="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition" 
                                title="삭제"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    <p class="text-gray-600 text-sm line-clamp-3 min-h-[3rem]">
                        {char.description || '설정이 없습니다.'}
                    </p>
                </div>

                <div class="p-4 pt-0">
                    <button 
                        on:click={() => shoppingChar = char}
                        class="w-full py-2 bg-yellow-100 text-yellow-800 font-bold rounded-lg hover:bg-yellow-200 transition flex items-center justify-center gap-2"
                    >
                        <span>🛒 골드 사용 (상점)</span>
                    </button>
                </div>
            </div>
        {/each}
        
        {#if characters.length === 0 && !isCreating}
            <div class="col-span-full text-center py-20 text-gray-400">
                <p>등록된 캐릭터가 없습니다. 새로운 영웅을 만들어보세요!</p>
            </div>
        {/if}

    </div>

    {#if editingChar}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div class="p-5 border-b">
                    <h3 class="font-bold text-lg">정보 수정</h3>
                </div>
                <div class="p-5 grid gap-4">
                    <input bind:value={editingChar.name} class="w-full border rounded p-2" />
                    <select bind:value={editingChar.jobClass} class="w-full border rounded p-2">
                        {#each Object.keys(jobIcons) as job}
                            <option value={job}>{jobIcons[job]} {job}</option>
                        {/each}
                    </select>
                    <textarea bind:value={editingChar.description} class="w-full border rounded p-2 h-24"></textarea>
                </div>
                <div class="p-5 border-t flex gap-2">
                    <button on:click={() => editingChar = null} class="flex-1 py-2 bg-gray-100 rounded">취소</button>
                    <button on:click={handleUpdate} class="flex-1 py-2 bg-blue-600 text-white rounded font-bold">수정</button>
                </div>
            </div>
        </div>
    {/if}

    {#if shoppingChar}
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-all">
                <div class="bg-gradient-to-r from-yellow-100 to-orange-100 p-6 border-b border-yellow-200">
                    <h3 class="font-bold text-xl text-yellow-900">🏰 골드 상점</h3>
                    <p class="text-sm text-yellow-700 mt-1">
                        손님: <strong>{shoppingChar.name}</strong> 
                        <span class="bg-white bg-opacity-50 px-2 rounded-full ml-1 text-xs">💰 {shoppingChar.currentGold} G</span>
                    </p>
                </div>

                <div class="p-4 space-y-3">
                    {#each shopItems as item}
                        {@const canAfford = shoppingChar.currentGold >= item.cost}
                        <button 
                            on:click={() => handlePurchase(item)}
                            disabled={!canAfford}
                            class="w-full flex items-center justify-between p-4 rounded-xl border-2 transition relative overflow-hidden group
                            {canAfford 
                                ? 'border-gray-100 hover:border-yellow-400 hover:bg-yellow-50 bg-white' 
                                : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'}"
                        >
                            <div class="flex items-center gap-3 z-10">
                                <span class="text-2xl">{item.icon}</span>
                                <div class="text-left">
                                    <div class="font-bold text-gray-800">{item.name}</div>
                                    <div class="text-xs text-gray-500">즉시 사용</div>
                                </div>
                            </div>
                            <div class="z-10 font-bold {canAfford ? 'text-yellow-600' : 'text-red-400'}">
                                {item.cost} G
                            </div>
                        </button>
                    {/each}
                </div>

                <div class="p-4 border-t bg-gray-50">
                    <button on:click={() => shoppingChar = null} class="w-full py-3 text-gray-600 hover:bg-gray-200 rounded-lg font-bold">
                        나가기
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>