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
    
    // 완료 목록 스토어
    const completedIds = missionStore.completedMissionIds;

    // 3. 정렬 로직 (반응형)
    $: sortedMissions = [...missions].sort((a, b) => {
        const isDoneA = $completedIds.has(a.id || '');
        const isDoneB = $completedIds.has(b.id || '');

        // 둘 다 완료했거나, 둘 다 안 했으면 -> 순서 유지
        if (isDoneA === isDoneB) return 0;
        
        // A가 완료(true)면 뒤로(1), B가 완료면 A가 앞으로(-1)
        return isDoneA ? 1 : -1;
    });

    let isCreating = false;
    let editingMissionId: string | null = null; // [NEW] 수정 중인 미션 ID

    let newMission = { 
        title: '', description: '', cost: 100, 
        type: 'solo' as 'solo' | 'party', 
        minParticipants: 1, maxParticipants: 1 
    };

    let selectedMission: Mission | null = null;
    let selectedCharIds: string[] = [];
    let completedCharIds: string[] = [];
    let isLoadingLogs = false;

    const jobIcons: Record<string, string> = { 
        '검사': '⚔️', '마법사': '🔮', '힐러': '🌿', 
        '사냥꾼': '🏹', '도적': '🗡️', '탱커': '🛡️' 
    };

    // [NEW] 폼 초기화 함수
    function resetForm() {
        newMission = { title: '', description: '', cost: 100, type: 'solo', minParticipants: 1, maxParticipants: 1 };
        editingMissionId = null;
        // isCreating은 상황에 따라 닫지 않고 유지할 수도 있음 (연속 등록 편의성)
    }

    // [MODIFIED] 저장(생성 및 수정) 핸들러 통합
    async function handleSave() {
        if(!newMission.title) return alert("퀘스트명을 입력해주세요.");

        try {
            if (editingMissionId) {
                // 수정
                await missionStore.updateMission(guildId, editingMissionId, newMission);
                alert("퀘스트가 수정되었습니다.");
                resetForm();
                isCreating = false; // 수정 후엔 폼 닫기
            } else {
                // 생성
                await missionStore.addMission(guildId, newMission);
                // 생성 후엔 초기화만 하고 폼은 열어둠 (연속 등록 유도)
                resetForm(); 
            }
        } catch (e: any) { alert(e.message); }
    }

    // [NEW] 수정 시작
    function startEdit(mission: Mission) {
        newMission = { ...mission };
        editingMissionId = mission.id!;
        isCreating = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // [NEW] 삭제 핸들러
    async function handleDelete(mission: Mission) {
        if (confirm(`🗑️ 정말 삭제하시겠습니까?\n[${mission.title}] 퀘스트가 목록에서 사라집니다.`)) {
            try {
                await missionStore.deleteMission(guildId, mission.id!);
            } catch (e: any) { alert(e.message); }
        }
    }

    // 완료 처리 모달 열기
    async function openCompleteModal(mission: Mission) {
        selectedMission = mission;
        selectedCharIds = [];
        completedCharIds = []; 
        isLoadingLogs = true;

        try {
            const logs = await missionStore.fetchMissionLogsByDate(guildId, mission.id!);
            const doneIds = new Set<string>();
            logs.forEach((log: any) => {
                if (log.performerCharacterIds) {
                    log.performerCharacterIds.forEach((id: string) => doneIds.add(id));
                }
            });
            completedCharIds = Array.from(doneIds);
        } catch (e) {
            console.error(e);
        } finally {
            isLoadingLogs = false;
        }
    }

    function toggleCharacter(id: string) {
        if (completedCharIds.includes(id)) return;
        if (selectedCharIds.includes(id)) {
            selectedCharIds = selectedCharIds.filter(x => x !== id);
        } else {
            if (selectedMission?.type === 'solo') {
                selectedCharIds = [id];
            } else {
                selectedCharIds = [...selectedCharIds, id];
            }
        }
    }

    async function handleComplete() {
        if(!selectedMission || selectedCharIds.length === 0) return;
        const targets = characters
            .filter(c => selectedCharIds.includes(c.id!))
            .map(c => ({ id: c.id!, name: c.name }));
            
        if (selectedMission.type === 'solo' && targets.length > 1) {
             return alert("🚫 개인(Solo) 미션은 한 번에 한 명만 수행할 수 있습니다.");
        }
        if (selectedMission.type === 'party' && targets.length > selectedMission.maxParticipants) {
             return alert(`🚫 파티 최대 인원(${selectedMission.maxParticipants}명)을 초과했습니다.`);
        }

        const confirmMsg = selectedMission.type === 'solo'
            ? `[${targets[0].name}] 캐릭터에게 ${selectedMission.cost}골드를 지급하시겠습니까?`
            : `${targets.length}명에게 각각 ${selectedMission.cost}골드를 지급하시겠습니까?`;
            
        if(confirm(confirmMsg)) {
            try {
                await missionStore.completeMission(guildId, selectedMission, targets);
                selectedMission = null;
                selectedCharIds = [];
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
        <button on:click={() => { 
                isCreating = !isCreating; 
                if(!isCreating) resetForm(); 
            }} 
            class="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 transition">
            {isCreating ? '닫기' : '+ 새 퀘스트'}
        </button>
    </div>

    {#if isCreating}
        <div class="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8 animate-fade-in-down relative">
             {#if editingMissionId}
                <div class="absolute top-4 right-4 text-xs font-bold text-indigo-500 bg-white px-2 py-1 rounded border border-indigo-200">
                    ✏️ 수정 모드
                </div>
            {/if}

             <div class="grid gap-4 md:grid-cols-2">
                <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700">퀘스트명</label>
                    <input bind:value={newMission.title} class="w-full border rounded p-2" placeholder="예: 아침 회의 참석"/>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">보상 (1인당)</label>
                    <input bind:value={newMission.cost} type="number" class="w-full border rounded p-2"/>
                </div>
                <div>
                     <span class="block text-sm font-medium text-gray-700 mb-2">유형</span>
                    <div class="flex gap-4">
                         <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" bind:group={newMission.type} value="solo" class="text-indigo-600"><span>개인</span></label>
                        <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" bind:group={newMission.type} value="party" class="text-green-600"><span>파티</span></label>
                    </div>
                </div>
               
                  {#if newMission.type === 'party'}
                    <div class="col-span-2">
                        <label class="block text-sm font-medium text-gray-700">최대 참여 인원</label>
                        <input bind:value={newMission.maxParticipants} type="number" min="2" class="w-full border rounded p-2" />
                    </div>
                {/if}
                <button on:click={handleSave} class="col-span-2 bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700 transition">
                    {editingMissionId ? '수정 완료' : '등록하기'}
                </button>
            </div>
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each sortedMissions as mission (mission.id)}
            {@const isSoldOut = $completedIds.has(mission.id || '')}

            <div class="rounded-xl shadow-sm border transition flex flex-col relative overflow-hidden group
                {isSoldOut 
                    ? 'bg-gray-100 border-gray-200 opacity-70 grayscale order-last' 
                    : 'bg-white hover:border-indigo-300 order-first'}">
                
                <div class="h-2 w-full absolute top-0 left-0
                    {isSoldOut ? 'bg-gray-400' : (mission.type === 'party' ? 'bg-green-500' : 'bg-indigo-500')}">
                </div>
                
                <div class="p-5 flex-1 flex flex-col">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex gap-2">
                            {#if isSoldOut}
                                <span class="text-xs font-bold px-2 py-1 rounded bg-gray-200 text-gray-600">완료됨</span>
                            {:else}
                                <span class="text-xs font-bold px-2 py-1 rounded {mission.type === 'party' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'}">
                                    {mission.type === 'party' ? 'PARTY' : 'SOLO'}
                                </span>
                            {/if}
                        </div>

                        <div class="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button on:click|stopPropagation={() => startEdit(mission)} 
                                    class="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition" title="수정">
                                ✏️
                            </button>
                            <button on:click|stopPropagation={() => handleDelete(mission)} 
                                    class="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition" title="삭제">
                                🗑️
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center justify-between mb-2">
                        <span class="{isSoldOut ? 'text-gray-500' : 'text-yellow-600'} font-bold">💰 {mission.cost}</span>
                    </div>
                    
                    <h3 class="font-bold text-lg text-gray-800 mb-2 {isSoldOut ? 'line-through decoration-gray-400' : ''}">{mission.title}</h3>
                    <p class="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{mission.description || ''}</p>
                    
                    <button 
                        on:click={() => !isSoldOut && openCompleteModal(mission)}
                        disabled={isSoldOut}
                        class="w-full py-2.5 rounded-lg font-bold border flex items-center justify-center gap-2 transition
                        {isSoldOut 
                            ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' 
                            : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'}"
                    >
                        <span>{isSoldOut ? '🚫 오늘 마감됨' : '✨ 수행 완료 보고'}</span>
                    </button>
                </div>
            </div>
        {/each}
    </div>

    {#if selectedMission}
        <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div class="p-6 border-b bg-gray-50">
                    <h3 class="font-bold text-xl">수행자 선택</h3>
                    <p class="text-sm text-gray-500 mt-1">{selectedMission.title}</p>
                </div>
                
                <div class="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {#if isLoadingLogs}
                         <div class="text-center py-8 text-gray-400">
                             <div class="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                            <p>기록 확인 중...</p>
                        </div>
                    {:else if characters.length === 0}
                         <div class="text-center py-8 text-gray-400">등록된 캐릭터가 없습니다.</div>
                    {:else}
                        <div class="space-y-2">
                            {#each characters as char}
                                {@const isDone = completedCharIds.includes(char.id || '')}
                                {@const isSelected = selectedCharIds.includes(char.id || '')}
                                
                                <div 
                                    class="flex items-center justify-between p-3 rounded-lg border transition select-none
                                    {isDone 
                                        ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' 
                                        : 'cursor-pointer hover:bg-gray-50'}
                                    {isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : ''}"
                                    on:click={() => toggleCharacter(char.id!)}
                                >
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                                            {jobIcons[char.jobClass] || '😐'}
                                        </div>
                                        <div>
                                            <div class="font-bold text-gray-800">{char.name}</div>
                                            {#if isDone}
                                                 <div class="text-xs text-green-600 font-bold">✓ 오늘 완료함</div>
                                            {:else}
                                                 <div class="text-xs text-gray-500">{char.jobClass}</div>
                                            {/if}
                                        </div>
                                    </div>
                                    {#if isSelected}
                                         <span class="text-indigo-600 font-bold text-xl">✓</span>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>

                <div class="p-5 border-t bg-gray-50 flex gap-3">
                    <button on:click={() => selectedMission = null} class="flex-1 py-3 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">취소</button>
                    <button 
                        on:click={handleComplete} 
                        disabled={selectedCharIds.length === 0}
                        class="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                    >
                        완료 처리
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>