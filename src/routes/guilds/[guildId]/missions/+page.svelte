<script lang="ts">
    import { page } from '$app/stores';
    import { onDestroy } from 'svelte';
    import { missionStore, type Mission } from '$lib/stores/missionStore';
    import { guildStore, GRADE_INFO } from '$lib/stores/guildStore';
    
    // [NEW] 애니메이션 효과를 위한 모듈 추가
    import { fade, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { JOB_ICONS, createMissionForm, requireRouteParam } from '$lib';
    import {
        completeMissionAction,
        deleteMissionAction,
        openCompleteMissionModalAction,
        resetMissionFormAction,
        saveMissionAction,
        sortMissionsAction,
        startEditMissionAction,
        toggleMissionCharacterAction
    } from '$lib/features/missions/actions';
    
    const guildId = requireRouteParam($page.params.guildId, 'guildId');

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
    // [수정됨] 정렬 로직 변경
    $: sortedMissions = sortMissionsAction(missions, $completedIds);

    let isCreating = false;
    let editingMissionId: string | null = null;

    let newMission = createMissionForm();

    let selectedMission: Mission | null = null;
    let selectedCharIds: string[] = [];
    let completedCharIds: string[] = [];
    let isLoadingLogs = false;

    // [NEW] 상자 이펙트 관련 상태값
    let showChestModal = false;
    let chestOpened = false;
    let chestBonus = 0;

    function resetForm() {
        const resetState = resetMissionFormAction();
        newMission = resetState.newMission;
        editingMissionId = resetState.editingMissionId;
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
        } catch (e: any) { alert(e.message); }
    }

    function startEdit(mission: Mission) {
        const nextState = startEditMissionAction(mission);
        newMission = nextState.newMission;
        editingMissionId = nextState.editingMissionId;
        isCreating = nextState.isCreating;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleDelete(mission: Mission) {
        try {
            await deleteMissionAction(guildId, mission);
        } catch (e: any) { alert(e.message); }
    }

    async function openCompleteModal(mission: Mission) {
        selectedMission = mission;
        selectedCharIds = [];
        completedCharIds = []; 
        isLoadingLogs = true;

        try {
            const modalState = await openCompleteMissionModalAction(guildId, mission);
            selectedMission = modalState.selectedMission;
            selectedCharIds = modalState.selectedCharIds;
            completedCharIds = modalState.completedCharIds;
            isLoadingLogs = modalState.isLoadingLogs;
        } catch (e) {
            console.error(e);
        } finally {
            isLoadingLogs = false;
        }
    }

    function toggleCharacter(id: string) {
        selectedCharIds = toggleMissionCharacterAction(selectedMission, selectedCharIds, completedCharIds, id);
    }

    // [MODIFIED] 완료 처리 핸들러 (상자 이펙트 로직 추가)
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
            showChestModal = result.showChestModal;
            chestOpened = result.chestOpened;
            chestBonus = result.chestBonus;

            if (showChestModal) {
                setTimeout(() => {
                    chestOpened = true;
                }, 1500);
            }
        } catch(e: any) { 
            alert(e.message); 
        }
    }

    // [NEW] 상자 모달 닫기
    function closeChestModal() {
        showChestModal = false;
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
                    <label for="mission-title" class="block text-sm font-medium text-gray-700">퀘스트명</label>
                    <input id="mission-title" bind:value={newMission.title} class="w-full border rounded p-2" placeholder="예: 아침 회의 참석"/>
                </div>
                <div>
                    <label for="mission-cost" class="block text-sm font-medium text-gray-700">보상 (1인당)</label>
                    <input id="mission-cost" bind:value={newMission.cost} type="number" class="w-full border rounded p-2"/>
                </div>
                <div>
                     <span class="block text-sm font-medium text-gray-700 mb-2">유형</span>
                    <div class="flex gap-4">
                        <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" bind:group={newMission.type} value="solo" class="text-indigo-600"><span>개인</span></label>
                        <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" bind:group={newMission.type} value="party" class="text-green-600"><span>파티</span></label>
                    </div>
                </div>
               
                <div class="col-span-2 bg-white p-3 rounded border border-indigo-100">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" bind:checked={newMission.isOneTime} class="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500">
                        <div>
                            <span class="font-bold text-gray-700">🔥 일회성 퀘스트</span>
                            <p class="text-xs text-gray-500">완료 시 목록에서 자동으로 사라집니다. (이벤트성)</p>
                        </div>
                    </label>
                </div>

                {#if newMission.type === 'party'}
                    <div class="col-span-2">
                        <label for="mission-max-participants" class="block text-sm font-medium text-gray-700">최대 참여 인원</label>
                        <input id="mission-max-participants" bind:value={newMission.maxParticipants} type="number" min="2" class="w-full border rounded p-2" />
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
                            {#if mission.isOneTime}
                                <span class="text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-800 border border-orange-200">
                                    🔥 1회 한정
                                </span>
                            {/if}
                    
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
                                
                                <button
                                    type="button"
                                    class="flex items-center justify-between p-3 rounded-lg border transition select-none
                                    {isDone 
                                        ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' 
                                        : 'cursor-pointer hover:bg-gray-50'}
                                    {isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : ''}"
                                    on:click={() => toggleCharacter(char.id!)}
                                    disabled={isDone}
                                >
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                                            {JOB_ICONS[char.jobClass] || '😐'}
                                        </div>
                                        <div>
                                            <div class="font-bold text-gray-800 flex items-center gap-1">
                                                {#if char.grade}
                                                    <span title={GRADE_INFO[char.grade].label}>{GRADE_INFO[char.grade].icon}</span>
                                                {/if}
                                                {char.name}
                                            </div>
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
                                </button>
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

    {#if showChestModal}
        <div class="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-hidden" 
            transition:fade={{duration: 300}}>
            
            <div class="text-center relative w-full max-w-sm">
                
                <div class="relative h-64 flex items-center justify-center">
                    {#if !chestOpened}
                        <button
                            type="button"
                            class="text-[8rem] shake-animation cursor-pointer select-none bg-transparent border-0"
                            on:click={() => chestOpened = true}
                            in:scale={{duration: 500, start: 0, easing: quintOut}}
                        >
                            🎁
                        </button>
                        <p class="text-white/80 mt-4 animate-pulse font-medium">상자를 발견했습니다!</p>
                    {:else}
                        <div class="flex flex-col items-center" in:scale={{duration: 300, start: 0.8, easing: quintOut}}>
                            <div class="text-[8rem] mb-2 animate-bounce-short">
                                💰
                            </div>
                            <h2 class="text-3xl font-bold text-yellow-400 mb-2 drop-shadow-md pop-in-text">
                                BONUS!
                            </h2>
                            <div class="text-5xl font-black text-white drop-shadow-lg mb-8 pop-in-text-delayed">
                                +{chestBonus} <span class="text-2xl text-yellow-300">G</span>
                            </div>
                            
                            <button class="bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold py-3 px-10 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 text-lg"
                                    on:click={closeChestModal}>
                                확인
                            </button>
                        </div>
                    {/if}
                </div>

                {#if chestOpened}
                    <div class="absolute inset-0 -z-10 pointer-events-none">
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    /* 상자 흔들림 애니메이션 */
    @keyframes shake {
        0% { transform: translate(1px, 1px) rotate(0deg); }
        10% { transform: translate(-1px, -2px) rotate(-1deg); }
        20% { transform: translate(-3px, 0px) rotate(1deg); }
        30% { transform: translate(3px, 2px) rotate(0deg); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 2px) rotate(-1deg); }
        60% { transform: translate(-3px, 1px) rotate(0deg); }
        70% { transform: translate(3px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0deg); }
        100% { transform: translate(1px, -2px) rotate(-1deg); }
    }

    .shake-animation {
        animation: shake 0.5s;
        animation-iteration-count: infinite;
        display: inline-block;
    }

    /* 짧은 바운스 */
    @keyframes bounce-short {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }
    .animate-bounce-short {
        animation: bounce-short 0.5s ease-out 1;
    }

    /* 텍스트 팝인 */
    @keyframes pop-in {
        0% { opacity: 0; transform: scale(0.5); }
        70% { transform: scale(1.2); }
        100% { opacity: 1; transform: scale(1); }
    }
    .pop-in-text {
        animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    .pop-in-text-delayed {
        opacity: 0;
        animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s forwards;
    }
</style>
