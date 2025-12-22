<script lang="ts">
  import { userStore } from '$lib/stores/userStore';
  import { guildStore } from '$lib/stores/guildStore';
  import { login } from '$lib/firebase';
  import { goto } from '$app/navigation';
  import { Shield, Sword } from 'lucide-svelte';

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
  <div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-900">
    <div class="max-w-md w-full bg-slate-800/80 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-2xl text-center">
      <div class="flex justify-center mb-6 space-x-2 text-yellow-500">
        <Sword size={40} /><Shield size={40} />
      </div>
      <h1 class="text-4xl font-black mb-2 text-white">GUILD MANAGER</h1>
      <p class="text-slate-400 mb-8">모험가님, 여정을 시작하세요.</p>
      
      <button on:click={login} class="w-full bg-white hover:bg-gray-100 text-slate-900 font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition">
        <img src="https://www.google.com/favicon.ico" alt="G" class="w-5 h-5" /> 구글 계정으로 시작
      </button>
    </div>
  </div>

{:else}
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <h2 class="text-3xl font-bold mb-8 flex items-center gap-2 text-yellow-500">
        <Sword size={32} /> 모험 준비
      </h2>
      
      <div class="bg-slate-800 p-1 rounded-lg flex w-full max-w-xs mb-6 border border-slate-700">
          <button 
            class={`flex-1 py-2 rounded-md text-sm font-bold transition ${mode === 'join' ? 'bg-slate-600 text-white shadow' : 'text-slate-400'}`} 
            on:click={() => mode = 'join'}>길드 찾기</button>
          <button 
            class={`flex-1 py-2 rounded-md text-sm font-bold transition ${mode === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`} 
            on:click={() => mode = 'create'}>길드 생성</button>
      </div>

      <div class="w-full max-w-xs bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
          {#if mode === 'join'}
              <p class="text-center text-slate-200 font-bold mb-4">초대 코드 입력</p>
              <input bind:value={inputCode} placeholder="예: X7Z9A1" 
                     class="w-full bg-slate-900 text-center text-2xl font-black tracking-widest text-white border border-slate-600 rounded-xl p-4 mb-6 uppercase focus:outline-none focus:border-indigo-500 transition"/>
              <button on:click={handleJoin} disabled={isProcessing}
                      class="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50">
                {isProcessing ? '처리 중...' : '🚀 입장하기'}
              </button>
          
          {:else}
              <p class="text-center text-slate-200 font-bold mb-4">새 길드 이름</p>
              <input bind:value={inputName} placeholder="예: 전설의 용사들" 
                     class="w-full bg-slate-900 text-center text-white border border-slate-600 rounded-xl p-4 mb-6 focus:outline-none focus:border-indigo-500 transition"/>
              <button on:click={handleCreate} disabled={isProcessing}
                      class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition disabled:opacity-50">
                {isProcessing ? '생성 중...' : '✨ 길드 만들기'}
              </button>
          {/if}
      </div>
  </div>
{/if}