<script lang="ts">
    import { page } from '$app/stores';
    import { onDestroy } from 'svelte';
    import { guildStore } from '$lib/stores/guildStore';
    
    const guildId = $page.params.guildId;
    
    // 길드 정보 구독
    const unsubscribe = guildStore.init(guildId);
    $: guild = $guildStore;

    onDestroy(() => {
        unsubscribe();
    });

    function copyCode() {
        if (guild?.code) {
            navigator.clipboard.writeText(guild.code);
            alert(`초대 코드 [${guild.code}] 복사 완료!`);
        }
    }
</script>

<div class="p-4 max-w-lg mx-auto min-h-screen flex flex-col">
    <div class="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
        <div class="relative z-10">
            <h1 class="text-2xl font-black mb-1">{guild?.name || '로딩 중...'}</h1>
            <p class="text-indigo-200 text-sm mb-4">{guild?.description || '함께하는 즐거움'}</p>
            
            {#if guild?.code}
                <div class="bg-indigo-700/50 rounded-lg p-3 flex items-center justify-between border border-indigo-500/30">
                    <div>
                        <span class="text-xs text-indigo-300 block mb-1">길드 초대 코드</span>
                        <span class="text-xl font-mono font-bold tracking-widest">{guild.code}</span>
                    </div>
                    <button 
                        on:click={copyCode}
                        class="bg-white text-indigo-600 px-3 py-1.5 rounded font-bold text-sm hover:bg-indigo-50 transition shadow-sm"
                    >
                        복사
                    </button>
                </div>
            {/if}
        </div>
        <div class="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
    </div>

    <div class="grid grid-cols-2 gap-4 mb-6">
        <a href={`/guilds/${guildId}/missions`} class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition flex flex-col items-center justify-center gap-2 group">
            <span class="text-4xl group-hover:scale-110 transition transform">🛡️</span>
            <span class="font-bold text-gray-700">퀘스트 보드</span>
        </a>
        <a href={`/guilds/${guildId}/members`} class="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition flex flex-col items-center justify-center gap-2 group">
            <span class="text-4xl group-hover:scale-110 transition transform">🏰</span>
            <span class="font-bold text-gray-700">길드원/상점</span>
        </a>
    </div>

    <a href={`/guilds/${guildId}/logs`} class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition mb-6">
        <div class="flex items-center gap-3">
            <span class="bg-gray-100 p-2 rounded-lg">📜</span>
            <div>
                <h3 class="font-bold text-gray-800">활동 기록 (Logs)</h3>
                <p class="text-xs text-gray-500">누가 뭘 했는지 날짜별로 확인하세요.</p>
            </div>
        </div>
        <span class="text-gray-400">→</span>
    </a>
</div>