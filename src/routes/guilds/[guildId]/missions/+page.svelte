<script lang="ts">
    import { page } from '$app/stores';
    import { onDestroy } from 'svelte';
    import { missionStore, type Mission } from '$lib/stores/missionStore';
    import { guildStore, type GuildCharacter } from '$lib/stores/guildStore';
    
    const guildId = $page.params.guildId;
    
    // 1. 구독 시작
    const unsubMissions = missionStore.init(guildId);
    const unsubStatus = missionStore.initTodayStatus(guildId);
    const unsubGuild = guildStore.init(guildId);

    // 2. 데이터 바인딩
    $: missions = $missionStore;
    $: characters = $guildStore?.characters || [];
    
    // [FIX] 스토어 객체에서 직접 꺼내와야 합니다 ($ 기호 없음)
    const completedIds = missionStore.completedMissionIds; 

    // ... 기존 변수들 ...
    let isCreating = false;
    let newMission = { title: '', description: '', cost: 100, type: 'solo' as 'solo' | 'party', minParticipants: 1, maxParticipants: 1 };
    
    let selectedMission: Mission | null = null;
    let selectedCharIds: string[] = [];
    const jobIcons: Record<string, string> = { '검사': '⚔️', '마법사': '🔮', '힐러': '🌿', '사냥꾼': '🏹', '도적': '🗡️', '탱커': '🛡️' };

    // ... 핸들러 함수들 ...
    async function handleCreate() {
        if(!newMission.title) return;
        try {
            // 타입 단언 추가
            await missionStore.addMission(guildId, newMission as any);
            isCreating = false;
            // 초기화
            newMission = { title: '', description: '', cost: 100, type: 'solo', minParticipants: 1, maxParticipants: 1 };
        } catch (e: any) { alert(e.message); }
    }

    function openCompleteModal(mission: Mission) {
        selectedMission = mission;
        selectedCharIds = [];
    }

    function toggleCharacter(id: string) {
        if (selectedCharIds.includes(id)) selectedCharIds = selectedCharIds.filter(x => x !== id);
        else selectedCharIds = [...selectedCharIds, id];
    }

    async function handleComplete() {
        if(!selectedMission || selectedCharIds.length === 0) return;
        const targets = characters.filter(c => selectedCharIds.includes(c.id!)).map(c => ({ id: c.id!, name: c.name }));
        
        // maxParticipants 체크 추가
        if (selectedMission.type === 'party' && targets.length > selectedMission.maxParticipants) {
             return alert(`최대 ${selectedMission.maxParticipants}명까지만 가능합니다.`);
        }

        if(confirm(`${targets.length}명에게 보상을 지급하시겠습니까?`)) {
            try {
                await missionStore.completeMission(guildId, selectedMission, targets);
                selectedMission = null;
            } catch(e: any) { alert(e.message); }
        }
    }

    onDestroy(() => {
        unsubMissions();
        unsubStatus();
        unsubGuild();
    });
</script>

<div class="p-4 max-w-5xl mx-auto">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">🛡️ 퀘스트 게시판</h1>
        <button on:click={() => isCreating = !isCreating} class="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700">
            {isCreating ? '닫기' : '+ 새 퀘스트'}
        </button>
    </div>

    {#if isCreating}
        <div class="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8">
             <div class="grid gap-4 md:grid-cols-2">
                <div class="col-span-2"><label class="block text-sm">퀘스트명</label><input bind:value={newMission.title} class="w-full border rounded p-2"/></div>
                <div><label class="block text-sm">보상</label><input bind:value={newMission.cost} type="number" class="w-full border rounded p-2"/></div>
                <div>
                     <span class="block text-sm mb-2">유형</span>
                    <div class="flex gap-4">
                        <label class="flex items-center space-x-2"><input type="radio" bind:group={newMission.type} value="solo"><span>개인</span></label>
                        <label class="flex items-center space-x-2"><input type="radio" bind:group={newMission.type} value="party"><span>파티</span></label>
                    </div>
                </div>
                <button on:click={handleCreate} class="col-span-2 bg-indigo-600 text-white py-2 rounded font-bold">등록</button>
            </div>
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each missions as mission (mission.id)}
            {@const isCompleted = $completedIds.has(mission.id || '')}

            <div class="rounded-xl shadow-sm border transition flex flex-col relative overflow-hidden group
                {isCompleted 
                    ? 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed grayscale' 
                    : 'bg-white hover:border-indigo-300'}"
            >
                <div class="h-2 w-full absolute top-0 left-0
                    {isCompleted ? 'bg-gray-400' : (mission.type === 'party' ? 'bg-green-500' : 'bg-indigo-500')}">
                </div>
                
                <div class="p-5 flex-1 flex flex-col">
                    <div class="flex justify-between items-start mb-3">
                        {#if isCompleted}
                            <span class="text-xs font-bold px-2 py-1 rounded bg-gray-200 text-gray-600">완료됨 (Sold Out)</span>
                        {:else}
                            <span class="text-xs font-bold px-2 py-1 rounded {mission.type === 'party' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}">
                                {mission.type === 'party' ? 'PARTY' : 'SOLO'}
                            </span>
                        {/if}
                        <span class="{isCompleted ? 'text-gray-500' : 'text-yellow-600'} font-bold">💰 {mission.cost}</span>
                    </div>
                    
                    <h3 class="font-bold text-lg text-gray-800 mb-2 {isCompleted ? 'line-through decoration-gray-400' : ''}">{mission.title}</h3>
                    <p class="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{mission.description}</p>
                    
                    <button 
                        on:click={() => !isCompleted && openCompleteModal(mission)}
                        disabled={isCompleted}
                        class="w-full py-2.5 rounded-lg font-bold border flex items-center justify-center gap-2 transition
                        {isCompleted 
                            ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' 
                            : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'}"
                    >
                        <span>{isCompleted ? '🚫 오늘 마감됨' : '✨ 수행 완료 보고'}</span>
                    </button>
                </div>
            </div>
        {/each}
    </div>

    {#if selectedMission}
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div class="p-6 border-b">
                    <h3 class="font-bold text-xl">수행자 선택</h3>
                    <p class="text-sm text-gray-500">{selectedMission.title}</p>
                </div>
                <div class="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                    {#each characters as char}
                        <div 
                            class="flex items-center justify-between p-3 rounded-lg border cursor-pointer
                            {selectedCharIds.includes(char.id!) ? 'bg-indigo-50 border-indigo-500' : 'bg-white hover:bg-gray-50'}"
                            on:click={() => toggleCharacter(char.id!)}
                        >
                            <div class="flex items-center gap-2">
                                <span>{jobIcons[char.jobClass]}</span>
                                <b>{char.name}</b>
                            </div>
                            {#if selectedCharIds.includes(char.id!)}<span class="text-indigo-600 font-bold">✓</span>{/if}
                        </div>
                    {/each}
                </div>
                <div class="p-5 border-t flex gap-2">
                    <button on:click={() => selectedMission = null} class="flex-1 py-2 bg-gray-100 rounded">취소</button>
                    <button on:click={handleComplete} class="flex-1 py-2 bg-indigo-600 text-white rounded font-bold">완료</button>
                </div>
            </div>
        </div>
    {/if}
</div>