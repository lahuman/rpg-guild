<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { logStore } from '$lib/stores/logStore';
    import { formatRelativeDateLabel, requireRouteParam } from '$lib';
    
    const guildId = requireRouteParam($page.params.guildId, 'guildId');
    
    // 상태 관리
    let isLoading = true;
    let isLoadingMore = false; // 더 보기 로딩 상태
    let currentLimit = 50;     // 현재 불러올 개수 (기본 50개)

    // 데이터 로드 함수
    async function loadData() {
        try {
            // logStore의 fetchLogs는 두 번째 인자로 limitCount를 받음
            await logStore.fetchLogs(guildId, currentLimit);
        } catch (e) {
            console.error(e);
        }
    }

    // 초기 로드
    onMount(async () => {
        await loadData();
        isLoading = false;
    });

    // [NEW] 더 보기 버튼 핸들러
    async function handleLoadMore() {
        isLoadingMore = true;
        currentLimit += 50; // 50개씩 더 불러오기
        await loadData();
        isLoadingMore = false;
    }

    $: groupedLogs = $logStore;

</script>

<div class="p-4 max-w-2xl mx-auto pb-20"> <div class="flex items-center gap-3 mb-6">
        <a href={`/guilds/${guildId}`} class="text-2xl hover:bg-gray-100 p-1 rounded transition">⬅️</a>
        <h1 class="text-2xl font-bold text-gray-800">📜 길드 활동 기록</h1>
    </div>

    {#if isLoading}
        <div class="text-center py-12">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3"></div>
            <p class="text-gray-500">기록을 불러오는 중...</p>
        </div>
    {:else if groupedLogs.length === 0}
        <div class="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p class="text-gray-400 text-lg">아직 기록된 활동이 없습니다.</p>
        </div>
    {:else}
        <div class="space-y-8 mb-8">
            {#each groupedLogs as group}
                <section>
                    <h3 class="font-bold text-gray-500 mb-3 ml-1 flex items-center gap-2">
                        📅 {formatRelativeDateLabel(group.date)}
                    </h3>
                    
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {#each group.logs as log}
                            <div class="p-4 flex items-center justify-between hover:bg-gray-50 transition border-b last:border-b-0 border-gray-100">
                                <div class="flex items-center gap-3">
                                    <div class={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0
                                        ${log.type === 'mission' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                        {log.type === 'mission' ? '🛡️' : '🛒'}
                                    </div>
                                    <div>
                                        <div class="font-bold text-gray-800">{log.title}</div>
                                        <div class="text-sm text-gray-500">
                                            <span class="font-medium text-gray-700">{log.names.join(', ')}</span>
                                            {log.type === 'mission' ? '수행함' : '구매함'}
                                            <span class="text-gray-300 mx-1">|</span>
                                            <span class="text-xs">{log.timeStr}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class={`font-bold whitespace-nowrap ${log.type === 'mission' ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {log.type === 'mission' ? '+' : '-'}{log.amount.toLocaleString()} G
                                </div>
                            </div>
                        {/each}
                    </div>
                </section>
            {/each}
        </div>

        <button 
            on:click={handleLoadMore} 
            disabled={isLoadingMore}
            class="w-full py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition flex justify-center items-center gap-2 disabled:opacity-50"
        >
            {#if isLoadingMore}
                <div class="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                불러오는 중...
            {:else}
                ⬇️ 지난 기록 더 보기
            {/if}
        </button>
    {/if}
</div>
