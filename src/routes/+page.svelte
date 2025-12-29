<script lang="ts">
  import { userStore } from '$lib/stores/userStore';
  import { guildStore } from '$lib/stores/guildStore';
  import { login } from '$lib/firebase';
  import { goto } from '$app/navigation';
  import { Shield, Sword, Scroll, Users, History, Gem, Loader2 } from 'lucide-svelte';
  // 아이콘 추가 (Loader2는 로딩 스피너용)
  
  let mode = 'join'; // 'join' | 'create'
  let inputCode = '';
  let inputName = '';
  let isProcessing = false;

  // [Step 3 & 4 연동 로직]
  // 유저가 이미 길드에 소속되어 있다면 대시보드로 납치(!)
  $: if ($userStore && $userStore.guildId) {
    goto(`/guilds/${$userStore.guildId}`);
  }

  const handleCreate = async () => {
    if (!inputName) return alert("길드 이름을 입력해주세요!");
    isProcessing = true;
    try {
      const newGuildId = await guildStore.createGuild(inputName, $userStore);
      alert("길드가 창설되었습니다!");
      goto(`/guilds/${newGuildId}`);
    } catch (e: any) {
      alert("생성 실패: " + e.message);
    } finally {
      isProcessing = false;
    }
  };
  const handleJoin = async () => {
    if (!inputCode) return alert("코드를 입력해주세요!");
    isProcessing = true;
    try {
      const guildId = await guildStore.joinGuild(inputCode.toUpperCase(), $userStore);
      alert("길드에 가입되었습니다!");
      goto(`/guilds/${guildId}`);
    } catch (e: any) {
      alert("가입 실패: " + e.message);
    } finally {
      isProcessing = false;
    }
  };
</script>

{#if !$userStore}
  <div class="min-h-screen flex flex-col items-center justify-start p-4 relative overflow-y-auto bg-slate-900">
    
    <div class="mt-20 max-w-md w-full bg-slate-800/80 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-2xl text-center z-10">
      <div class="flex justify-center mb-6 space-x-2 text-yellow-500">
        <Sword size={40} /><Shield size={40} />
      </div>
      <h1 class="text-4xl font-black mb-2 text-white">GUILD MANAGER</h1>
      <p class="text-slate-400 mb-8">모험가님, 여정을 시작하세요.</p>
      
      {#if $userStore === undefined}
        <div class="w-full py-4 flex flex-col items-center justify-center gap-3 text-slate-300 animate-pulse">
          <Loader2 class="animate-spin text-indigo-500" size={32} />
          <span class="font-bold text-lg">모험가 자격 확인 중...</span>
          <p class="text-sm text-slate-500">길드 본부와 통신하고 있습니다.</p>
        </div>
      {:else}
        <button on:click={login} class="w-full bg-white hover:bg-gray-100 text-slate-900 
          font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition">
          <img src="https://www.google.com/favicon.ico" alt="G" class="w-5 h-5" /> 구글 계정으로 시작
        </button>
      {/if}
    </div>

    <div class="mt-16 max-w-4xl w-full text-slate-300 pb-20">
      <h2 class="text-2xl font-bold text-center text-white mb-10">주요 기능 소개</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-indigo-500/50 transition">
          <div class="flex items-center 
            gap-3 mb-3 text-indigo-400">
            <Scroll size={28} />
            <h3 class="text-xl font-bold text-white">길드 미션 관리</h3>
          </div>
          <p class="text-slate-400 leading-relaxed">
            길드원들과 함께 수행할 퀘스트를 등록하고 진행 상황을 공유하세요.
            경험치를 쌓고 길드를 성장시킬 수 있습니다.
          </p>
        </div>

        <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-green-500/50 transition">
          <div class="flex items-center gap-3 mb-3 text-green-400">
            <Users size={28} />
            <h3 class="text-xl font-bold text-white">멤버 관리</h3>
          </div>
          <p class="text-slate-400 leading-relaxed">
            함께하는 동료들의 역할과 기여도를 한눈에 파악하세요.
            새로운 모험가를 초대하여 더 강력한 길드를 만들 수 있습니다.
          </p>
        </div>

        <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-yellow-500/50 transition">
          <div class="flex items-center gap-3 mb-3 text-yellow-400">
            <History size={28} />
            <h3 class="text-xl font-bold text-white">활동 로그</h3>
          </div>
          <p class="text-slate-400 leading-relaxed">
            길드 내에서 일어나는 모든 중요한 사건들이 기록됩니다.
            지난 모험의 발자취를 언제든지 확인할 수 있습니다.
          </p>
        </div>

        <div class="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition">
          <div class="flex items-center gap-3 mb-3 text-purple-400">
            <Gem size={28} />
            <h3 class="text-xl font-bold text-white">전리품 & 아이템</h3>
          </div>
          <p class="text-slate-400 leading-relaxed">
            모험을 통해 획득한 보상을 관리하고 분배하세요.
            길드 운영에 필요한 자원을 체계적으로 정리할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  </div>

{:else}
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <h2 class="text-3xl font-bold mb-8 flex items-center gap-2 text-yellow-500">
        <Sword size={32} /> 모험 준비
      </h2>
      
      <div class="bg-slate-800 p-1 rounded-lg flex w-full max-w-xs mb-6 border border-slate-700">
          
            <button 
            class={`flex-1 py-2 rounded-md text-sm font-bold transition ${mode === 'join' ?
            'bg-slate-600 text-white shadow' : 'text-slate-400'}`} 
            on:click={() => mode = 'join'}>길드 찾기</button>
          <button 
            class={`flex-1 py-2 rounded-md text-sm font-bold transition ${mode === 'create' ?
            'bg-indigo-600 text-white shadow' : 'text-slate-400'}`} 
            on:click={() => mode = 'create'}>길드 생성</button>
      </div>

      <div class="w-full max-w-xs bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
          {#if mode === 'join'}
              <p class="text-center text-slate-200 font-bold mb-4">초대 코드 입력</p>
              <input bind:value={inputCode} placeholder="예: X7Z9A1" 
                     class="w-full bg-slate-900 text-center text-2xl font-black tracking-widest text-white border border-slate-600 rounded-xl p-4 mb-6 uppercase focus:outline-none focus:border-indigo-500 transition"/>
              <button on:click={handleJoin} disabled={isProcessing}
                      class="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50">
                {isProcessing ?
                '처리 중...' : '🚀 입장하기'}
              </button>
          
          {:else}
              <p class="text-center text-slate-200 font-bold mb-4">새 길드 이름</p>
              <input bind:value={inputName} placeholder="예: 전설의 용사들" 
                     class="w-full bg-slate-900 
                     text-center text-white border border-slate-600 rounded-xl p-4 mb-6 focus:outline-none focus:border-indigo-500 transition"/>
              <button on:click={handleCreate} disabled={isProcessing}
                      class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50">
                {isProcessing ?
                '생성 중...' : '✨ 길드 만들기'}
              </button>
          {/if}
      </div>
  </div>
{/if}