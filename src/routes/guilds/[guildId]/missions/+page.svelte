<script lang="ts">
    import { page } from '$app/stores';
    import { onMount, onDestroy } from 'svelte';
    import { missionStore, type Mission } from '$lib/stores/missionStore';
    import { guildStore } from '$lib/stores/guildStore';
    import { userStore } from '$lib/stores/userStore';

    const guildId = $page.params.guildId;
    let currentUser = $userStore;
    
    // --- State ---
    let missions: Mission[] = [];
    let members: any[] = [];
    
    // 미션 생성 폼 상태
    let isCreating = false;
    let newMission = {
        title: '',
        description: '',
        cost: 100,
        type: 'solo' as 'solo' | 'party',
        minParticipants: 1,
        maxParticipants: 1
    };

    // 미션 수행(완료) 모달 상태
    let selectedMission: Mission | null = null;
    let selectedPerformerIds: string[] = []; // 선택된 수행자들

    // --- Subscriptions ---
    const unsubscribeMissions = missionStore.init(guildId);
    
    // 길드원 목록 가져오기 (Store에 멤버 리스트 기능이 있다고 가정하거나 직접 fetch)
    // 여기서는 guildStore구독을 통해 멤버를 가져온다고 가정
    // (실제로는 guildStore에 fetchMembers 구현 필요. 임시로 멤버 로딩 로직이 있다고 가정합니다)
    $: missions = $missionStore;
    $: members = $guildStore.members || []; 

    // --- Actions ---
    async function handleCreate() {
        if(!newMission.title) return alert("제목을 입력해주세요.");
        
        try {
            await missionStore.addMission(guildId, newMission);
            isCreating = false;
            // 초기화
            newMission = { title: '', description: '', cost: 100, type: 'solo', minParticipants: 1, maxParticipants: 1 };
        } catch (e) {
            alert(e.message);
        }
    }

    function openCompleteModal(mission: Mission) {
        selectedMission = mission;
        // 기본적으로 나 자신을 선택 상태로 시작
        selectedPerformerIds = currentUser ? [currentUser.uid] : [];
    }

    function closeCompleteModal() {
        selectedMission = null;
        selectedPerformerIds = [];
    }

    function togglePerformer(uid: string) {
        if (selectedPerformerIds.includes(uid)) {
            selectedPerformerIds = selectedPerformerIds.filter(id => id !== uid);
        } else {
            // 최대 인원 체크
            if (selectedMission && selectedMission.type === 'solo' && selectedPerformerIds.length >= 1) {
                // 솔로 미션이면 교체 (혹은 alert)
                selectedPerformerIds = [uid]; 
            } else {
                selectedPerformerIds = [...selectedPerformerIds, uid];
            }
        }
    }

    async function handleComplete() {
        if (!selectedMission || selectedPerformerIds.length === 0) return;
        if (selectedPerformerIds.length > selectedMission.maxParticipants) {
            return alert(`최대 ${selectedMission.maxParticipants}명까지만 참여 가능합니다.`);
        }

        if(!confirm(`${selectedPerformerIds.length}명에게 ${selectedMission.cost}골드씩 지급하시겠습니까?`)) return;

        try {
            await missionStore.completeMission(guildId, selectedMission, selectedPerformerIds);
            alert("보상 지급 완료!");
            closeCompleteModal();
        } catch (e) {
            console.error(e);
            alert("처리 중 오류가 발생했습니다.");
        }
    }

    onDestroy(() => {
        unsubscribeMissions();
    });
</script>

<div class="p-4 max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">📜 길드 미션 보드</h1>
        <button 
            on:click={() => isCreating = !isCreating}
            class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
            {isCreating ? '취소' : '+ 새 미션 만들기'}
        </button>
    </div>

    {#if isCreating}
        <div class="bg-white p-6 rounded-lg shadow-md mb-8 border border-blue-100">
            <h3 class="text-lg font-bold mb-4">새 미션 등록</h3>
            <div class="grid gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">미션명</label>
                    <input bind:value={newMission.title} type="text" class="mt-1 block w-full border rounded p-2" placeholder="예: 매일 아침 스트레칭" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">보상 (1인당 골드)</label>
                    <input bind:value={newMission.cost} type="number" class="mt-1 block w-full border rounded p-2" />
                </div>
                <div>
                    <span class="block text-sm font-medium text-gray-700 mb-2">유형</span>
                    <div class="flex gap-4">
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" bind:group={newMission.type} value="solo" class="form-radio text-blue-600" />
                            <span>👤 개인 (Solo)</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" bind:group={newMission.type} value="party" class="form-radio text-green-600" />
                            <span>👥 파티 (Party)</span>
                        </label>
                    </div>
                </div>
                {#if newMission.type === 'party'}
                <div>
                    <label class="block text-sm font-medium text-gray-700">최대 참여 인원</label>
                    <input bind:value={newMission.maxParticipants} type="number" min="2" class="mt-1 block w-full border rounded p-2" />
                </div>
                {/if}
                <button on:click={handleCreate} class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold">
                    등록하기
                </button>
            </div>
        </div>
    {/if}

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each missions as mission (mission.id)}
            <div class="bg-white rounded-lg shadow p-5 border-l-4 {mission.type === 'party' ? 'border-green-500' : 'border-blue-500'} hover:shadow-lg transition">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold px-2 py-1 rounded {mission.type === 'party' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                        {mission.type === 'party' ? 'PARTY' : 'SOLO'}
                    </span>
                    <span class="text-sm text-gray-500">💰 {mission.cost} G</span>
                </div>
                <h3 class="font-bold text-lg mb-1">{mission.title}</h3>
                <p class="text-gray-600 text-sm mb-4">{mission.description || '설명 없음'}</p>
                
                <button 
                    on:click={() => openCompleteModal(mission)}
                    class="w-full py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium text-sm flex items-center justify-center gap-2"
                >
                    <span>✅ 수행 완료 / 인증</span>
                </button>
            </div>
        {/each}
    </div>

    {#if selectedMission}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div class="p-5 border-b bg-gray-50">
                    <h3 class="font-bold text-xl">누가 수행했나요?</h3>
                    <p class="text-sm text-gray-500 mt-1">{selectedMission.title} (최대 {selectedMission.maxParticipants}명)</p>
                </div>
                
                <div class="p-5 max-h-80 overflow-y-auto">
                    <div class="space-y-2">
                        {#each members as member}
                            <div 
                                class="flex items-center justify-between p-3 rounded border cursor-pointer transition 
                                {selectedPerformerIds.includes(member.uid) ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}"
                                on:click={() => togglePerformer(member.uid)}
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                        {#if member.photoURL}
                                            <img src={member.photoURL} alt={member.displayName} />
                                        {:else}
                                            <span class="text-xs">{member.displayName?.[0]}</span>
                                        {/if}
                                    </div>
                                    <span class="font-medium text-gray-800">
                                        {member.displayName} 
                                        {#if member.uid === currentUser?.uid}<span class="text-xs text-blue-500">(나)</span>{/if}
                                    </span>
                                </div>
                                {#if selectedPerformerIds.includes(member.uid)}
                                    <span class="text-blue-600 font-bold">✓</span>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="p-5 border-t bg-gray-50 flex gap-3">
                    <button on:click={closeCompleteModal} class="flex-1 py-2 text-gray-600 hover:bg-gray-200 rounded">취소</button>
                    <button 
                        on:click={handleComplete} 
                        disabled={selectedPerformerIds.length === 0}
                        class="flex-1 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {selectedPerformerIds.length}명 승인하기
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>