<script lang="ts">
    import { page } from '$app/stores';
    import { onDestroy } from 'svelte';
    import { missionStore, type Mission } from '$lib/stores/missionStore';
    import { guildStore, type GuildCharacter, type JobClass } from '$lib/stores/guildStore';
    import { userStore } from '$lib/stores/userStore';

    const guildId = $page.params.guildId;
    
    // Stores
    const unsubMissions = missionStore.init(guildId);
    const unsubGuild = guildStore.init(guildId); // 캐릭터 목록 불러오기 위해 필요

    // State
    $: missions = $missionStore;
    $: characters = $guildStore?.characters || []; // 가상 인물 리스트

    // Create Form State
    let isCreating = false;
    let newMission = {
        title: '',
        description: '',
        cost: 100,
        type: 'solo' as 'solo' | 'party',
        minParticipants: 1,
        maxParticipants: 1
    };

    // Modal State
    let selectedMission: Mission | null = null;
    let selectedCharIds: string[] = []; 

    // Helper: 직업 아이콘
    const jobIcons: Record<string, string> = {
        '검사': '⚔️', '마법사': '🔮', '힐러': '🌿', '사냥꾼': '🏹', '도적': '🗡️', '탱커': '🛡️'
    };

    // --- Actions ---

    // 1. 미션 등록
    async function handleCreate() {
        if(!newMission.title) return alert("제목을 입력해주세요.");
        try {
            await missionStore.addMission(guildId, newMission);
            isCreating = false;
            newMission = { title: '', description: '', cost: 100, type: 'solo', minParticipants: 1, maxParticipants: 1 };
        } catch (e: any) {
            alert(e.message);
        }
    }

    // 2. 모달 열기
    function openCompleteModal(mission: Mission) {
        selectedMission = mission;
        selectedCharIds = [];
    }

    // 3. 캐릭터 선택 토글
    function toggleCharacter(charId: string) {
        if (selectedCharIds.includes(charId)) {
            selectedCharIds = selectedCharIds.filter(id => id !== charId);
        } else {
            // Solo 미션이면 하나만 선택 가능하게 교체
            if (selectedMission?.type === 'solo' && selectedCharIds.length >= 1) {
                selectedCharIds = [charId];
            } else {
                selectedCharIds = [...selectedCharIds, charId];
            }
        }
    }

    // 4. 완료 처리 (캐릭터에게 보상 지급)
    async function handleComplete() {
        if (!selectedMission || selectedCharIds.length === 0) return;
        
        // 인원수 체크
        if (selectedCharIds.length > selectedMission.maxParticipants) {
            return alert(`최대 ${selectedMission.maxParticipants}명까지만 참여 가능합니다.`);
        }

        // 선택된 캐릭터 객체 찾기
        const targets = characters
            .filter(c => selectedCharIds.includes(c.id!))
            .map(c => ({ id: c.id!, name: c.name }));

        const confirmMsg = `[${targets.map(t => t.name).join(', ')}] 캐릭터들이 미션을 완료했나요?\n각자 ${selectedMission.cost}골드를 획득합니다.`;

        if(!confirm(confirmMsg)) return;

        try {
            await missionStore.completeMission(guildId, selectedMission, targets);
            alert("✅ 보상이 지급되었습니다! 캐릭터 정보를 확인해보세요.");
            selectedMission = null;
            selectedCharIds = [];
        } catch (e: any) {
            console.error(e);
            alert("처리 실패: " + e.message);
        }
    }

    onDestroy(() => {
        unsubMissions();
        unsubGuild();
    });
</script>

<div class="p-4 max-w-5xl mx-auto">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">🛡️ 퀘스트 게시판</h1>
        <button 
            on:click={() => isCreating = !isCreating}
            class="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 font-bold transition"
        >
            {isCreating ? '닫기' : '+ 새 퀘스트 의뢰'}
        </button>
    </div>

    {#if isCreating}
        <div class="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8 animate-fade-in-down">
            <h3 class="text-lg font-bold text-indigo-900 mb-4">새로운 의뢰서 작성</h3>
            <div class="grid gap-4 md:grid-cols-2">
                <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700">퀘스트명</label>
                    <input bind:value={newMission.title} type="text" class="w-full border rounded p-2" placeholder="예: 고블린 동굴 정찰 (청소하기)" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">보상 (1인당 골드)</label>
                    <input bind:value={newMission.cost} type="number" class="w-full border rounded p-2" />
                </div>
                <div>
                    <span class="block text-sm font-medium text-gray-700 mb-2">유형</span>
                    <div class="flex gap-4 bg-white p-2 rounded border">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" bind:group={newMission.type} value="solo" class="text-indigo-600" />
                            <span>👤 단독 수행</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" bind:group={newMission.type} value="party" class="text-green-600" />
                            <span>👥 파티 수행</span>
                        </label>
                    </div>
                </div>
                {#if newMission.type === 'party'}
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700">최대 파티원 수</label>
                        <input bind:value={newMission.maxParticipants} type="number" min="2" class="w-full border rounded p-2" />
                    </div>
                {/if}
                <button on:click={handleCreate} class="col-span-2 w-full bg-indigo-600 text-white py-3 rounded font-bold hover:bg-indigo-700 mt-2">
                    게시판에 등록
                </button>
            </div>
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each missions as mission (mission.id)}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 transition group flex flex-col h-full relative overflow-hidden">
                <div class="h-2 {mission.type === 'party' ? 'bg-green-500' : 'bg-indigo-500'} w-full"></div>
                
                <div class="p-5 flex-1 flex flex-col">
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-xs font-bold px-2 py-1 rounded 
                            {mission.type === 'party' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}">
                            {mission.type === 'party' ? 'PARTY' : 'SOLO'}
                        </span>
                        <div class="flex items-center text-yellow-600 font-bold">
                            <span>💰 {mission.cost}</span>
                        </div>
                    </div>
                    
                    <h3 class="font-bold text-lg text-gray-800 mb-2">{mission.title}</h3>
                    <p class="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{mission.description || '상세 내용 없음'}</p>
                    
                    <button 
                        on:click={() => openCompleteModal(mission)}
                        class="w-full py-2.5 bg-gray-50 text-gray-700 font-bold rounded-lg hover:bg-gray-100 border border-gray-200 flex items-center justify-center gap-2 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-200 transition"
                    >
                        <span>✨ 수행 완료 보고</span>
                    </button>
                </div>
            </div>
        {/each}
    </div>

    {#if selectedMission}
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div class="p-6 border-b bg-gray-50">
                    <h3 class="font-bold text-xl text-gray-800">누가 임무를 완수했나요?</h3>
                    <p class="text-sm text-gray-500 mt-1">
                        [{selectedMission.title}] 
                        {#if selectedMission.type === 'party'}
                            <span class="text-green-600 font-medium">(최대 {selectedMission.maxParticipants}명)</span>
                        {/if}
                    </p>
                </div>
                
                <div class="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {#if characters.length === 0}
                        <div class="text-center py-8 text-gray-400">
                            <p>등록된 캐릭터가 없습니다.</p>
                            <p class="text-sm">먼저 캐릭터를 생성해주세요.</p>
                        </div>
                    {:else}
                        <div class="space-y-2">
                            {#each characters as char}
                                <div 
                                    class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition select-none
                                    {selectedCharIds.includes(char.id!) 
                                        ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' 
                                        : 'bg-white border-gray-200 hover:bg-gray-50'}"
                                    on:click={() => toggleCharacter(char.id!)}
                                >
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl shadow-inner">
                                            {jobIcons[char.jobClass] || '😐'}
                                        </div>
                                        <div>
                                            <div class="font-bold text-gray-800">{char.name}</div>
                                            <div class="text-xs text-gray-500">{char.jobClass} · Lv.{char.level}</div>
                                        </div>
                                    </div>
                                    {#if selectedCharIds.includes(char.id!)}
                                        <span class="text-indigo-600 font-bold text-xl">✓</span>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div class="p-5 border-t bg-gray-50 flex gap-3">
                    <button 
                        on:click={() => selectedMission = null} 
                        class="flex-1 py-3 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
                    >
                        취소
                    </button>
                    <button 
                        on:click={handleComplete} 
                        disabled={selectedCharIds.length === 0}
                        class="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                    >
                        {selectedCharIds.length}명 보상 지급
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>