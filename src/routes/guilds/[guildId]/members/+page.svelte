<script lang="ts">
    import { page } from '$app/stores';
    import { onDestroy } from 'svelte';
    import { guildStore, type GuildCharacter, type JobClass } from '$lib/stores/guildStore';
    import { userStore } from '$lib/stores/userStore';

    const guildId = $page.params.guildId;
    let currentUser = $userStore;

    const unsubscribe = guildStore.init(guildId);
    
    // 상태
    $: characters = $guildStore?.characters || [];

    // 폼 상태
    let isCreating = false;
    let newChar: Partial<GuildCharacter> = {
        name: '',
        jobClass: '검사',
        description: ''
    };
    let editingChar: GuildCharacter | null = null;

    // 직업별 스타일 매핑
    const jobStyles: Record<JobClass, string> = {
        '검사': 'bg-red-100 text-red-800 border-red-200',
        '마법사': 'bg-blue-100 text-blue-800 border-blue-200',
        '힐러': 'bg-green-100 text-green-800 border-green-200',
        '사냥꾼': 'bg-orange-100 text-orange-800 border-orange-200',
        '도적': 'bg-purple-100 text-purple-800 border-purple-200',
        '탱커': 'bg-slate-100 text-slate-800 border-slate-200'
    };

    const jobIcons: Record<JobClass, string> = {
        '검사': '⚔️',
        '마법사': '🔮',
        '힐러': '🌿',
        '사냥꾼': '🏹',
        '도적': '🗡️',
        '탱커': '🛡️'
    };

    async function handleCreate() {
        if (!newChar.name) return alert("캐릭터 이름을 입력해주세요.");
        try {
            await guildStore.createCharacter(guildId, {
                name: newChar.name,
                jobClass: newChar.jobClass as JobClass,
                description: newChar.description || '',
                createdBy: currentUser?.uid || 'unknown'
            });
            isCreating = false;
            newChar = { name: '', jobClass: '검사', description: '' }; // 초기화
        } catch (e: any) {
            alert(e.message);
        }
    }

    async function handleUpdate() {
        if (!editingChar) return;
        try {
            await guildStore.updateCharacter(guildId, editingChar.id!, {
                name: editingChar.name,
                jobClass: editingChar.jobClass,
                description: editingChar.description
            });
            editingChar = null;
        } catch (e: any) {
            alert(e.message);
        }
    }

    async function handleDelete(char: GuildCharacter) {
        if (confirm(`정말 [${char.name}] 캐릭터를 삭제하시겠습니까? (복구 불가)`)) {
            await guildStore.deleteCharacter(guildId, char.id!);
        }
    }
</script>

<div class="p-4 max-w-5xl mx-auto">
    <div class="flex justify-between items-center mb-6">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">📜 등장인물 (길드원)</h1>
            <p class="text-gray-500 text-sm">우리 소설을 이끌어갈 영웅들을 등록하세요.</p>
        </div>
        <button 
            on:click={() => isCreating = !isCreating}
            class="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow transition"
        >
            {isCreating ? '닫기' : '+ 새 캐릭터 생성'}
        </button>
    </div>

    {#if isCreating}
        <div class="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 mb-8 animate-fade-in-down">
            <h3 class="font-bold text-lg mb-4">✨ 새로운 영웅 탄생</h3>
            <div class="grid gap-4 md:grid-cols-2">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input bind:value={newChar.name} placeholder="예: 아라곤 2세" class="w-full border rounded px-3 py-2" />
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
                    <textarea bind:value={newChar.description} placeholder="캐릭터의 성격이나 배경 이야기를 적어주세요." class="w-full border rounded px-3 py-2 h-20"></textarea>
                </div>
            </div>
            <div class="mt-4 flex justify-end">
                <button on:click={handleCreate} class="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700">
                    등록 완료
                </button>
            </div>
        </div>
    {/if}

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each characters as char (char.id)}
            <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition group relative">
                <div class="p-4 border-b flex justify-between items-start bg-gray-50">
                    <span class={`px-2 py-1 rounded text-xs font-bold border ${jobStyles[char.jobClass] || 'bg-gray-100'}`}>
                        {jobIcons[char.jobClass]} {char.jobClass}
                    </span>
                    <div class="text-right">
                        <div class="text-yellow-600 font-bold text-lg">💰 {char.currentGold.toLocaleString()} G</div>
                        <div class="text-xs text-gray-400">Lv.{char.level}</div>
                    </div>
                </div>

                <div class="p-5">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">{char.name}</h3>
                    <p class="text-gray-600 text-sm line-clamp-3 min-h-[3rem]">
                        {char.description || '아직 설정이 없습니다.'}
                    </p>
                </div>

                <div class="absolute top-4 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition flex gap-2">
                    <button on:click={() => editingChar = { ...char }} class="bg-white p-2 rounded-full shadow hover:text-blue-600">✏️</button>
                    <button on:click={() => handleDelete(char)} class="bg-white p-2 rounded-full shadow hover:text-red-600">🗑️</button>
                </div>
            </div>
        {/each}

        {#if characters.length === 0 && !isCreating}
            <div class="col-span-full text-center py-20 text-gray-400">
                <div class="text-4xl mb-4">🧙‍♂️</div>
                <p>아직 등록된 영웅이 없습니다.</p>
                <p class="text-sm">상단 버튼을 눌러 첫 번째 길드원을 생성해주세요.</p>
            </div>
        {/if}
    </div>

    {#if editingChar}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div class="p-5 border-b">
                    <h3 class="font-bold text-lg">캐릭터 정보 수정</h3>
                </div>
                <div class="p-5 grid gap-4">
                    <input bind:value={editingChar.name} class="w-full border rounded p-2" placeholder="이름" />
                    <select bind:value={editingChar.jobClass} class="w-full border rounded p-2">
                        {#each Object.keys(jobIcons) as job}
                            <option value={job}>{jobIcons[job]} {job}</option>
                        {/each}
                    </select>
                    <textarea bind:value={editingChar.description} class="w-full border rounded p-2 h-24"></textarea>
                </div>
                <div class="p-5 border-t flex gap-2">
                    <button on:click={() => editingChar = null} class="flex-1 py-2 text-gray-600 bg-gray-100 rounded">취소</button>
                    <button on:click={handleUpdate} class="flex-1 py-2 bg-blue-600 text-white rounded font-bold">수정 완료</button>
                </div>
            </div>
        </div>
    {/if}
</div>