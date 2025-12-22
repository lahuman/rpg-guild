<script lang="ts">
  import { user, isLoading, createGuild, joinGuild, leaveGuild, guild } from '$lib/store';
  import { login, logout } from '$lib/firebase';
  import { Shield, Sword, Sparkles, LogIn, LogOut } from 'lucide-svelte';

  let mode = 'join';
  let inputCode = '';
  let inputName = '';

  const handleCreate = async () => {
      if(!inputName) return alert("길드 이름을 입력해주세요!");
      try {
          await createGuild(inputName, $user!.uid);
      } catch(e: any) {
          alert("생성 실패: " + e.message);
      }
  };

  const handleJoin = async () => {
      if(!inputCode) return alert("코드를 입력해주세요!");
      try {
          await joinGuild(inputCode.toUpperCase(), $user!.uid);
      } catch(e: any) {
          alert("가입 실패: " + e.message);
      }
  };
</script>

{#if $isLoading}
  <div class="h-screen flex flex-col items-center justify-center space-y-4">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
  </div>

{:else if !$user}
  <div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <div class="max-w-md w-full bg-slate-900/80 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-2xl text-center">
      <div class="flex justify-center mb-6 space-x-2 text-yellow-500">
        <Sword size={40} /><Shield size={40} />
      </div>
      <h1 class="text-4xl font-black mb-2 text-white">GUILD MANAGER</h1>
      <button on:click={login} class="w-full bg-white text-slate-900 font-bold py-4 rounded-xl shadow-lg mt-8 flex items-center justify-center gap-3">
        <img src="https://www.google.com/favicon.ico" alt="G" class="w-5 h-5" /> 구글 계정으로 시작
      </button>
    </div>
  </div>

{:else if !$user.guildId}
  <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
      <h2 class="text-3xl font-bold mb-8 flex items-center gap-2 text-yellow-500"><Sword size={32} /> 모험 준비</h2>
      
      <div class="bg-slate-800 p-1 rounded-lg flex w-full max-w-xs mb-6 border border-slate-700">
          <button class={`flex-1 py-2 rounded-md text-sm font-bold transition ${mode === 'join' ? 'bg-slate-600 text-white shadow' : 'text-slate-400'}`} on:click={() => mode = 'join'}>길드 찾기</button>
          <button class={`flex-1 py-2 rounded-md text-sm font-bold transition ${mode === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`} on:click={() => mode = 'create'}>길드 생성</button>
      </div>

      <div class="w-full max-w-xs bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
          {#if mode === 'join'}
              <p class="text-center text-slate-200 font-bold mb-4">초대 코드 입력</p>
              <input bind:value={inputCode} placeholder="예: X7Z9A1" class="w-full bg-slate-900 text-center text-2xl font-black tracking-widest text-white border border-slate-600 rounded-xl p-4 mb-6 uppercase"/>
              <button on:click={handleJoin} class="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-4 rounded-xl">🚀 입장하기</button>
          {:else}
              <p class="text-center text-slate-200 font-bold mb-4">새 길드 창설</p>
              <input bind:value={inputName} placeholder="예: 행복한 우리집" class="w-full bg-slate-900 text-center text-white border border-slate-600 rounded-xl p-4 mb-6"/>
              <button on:click={handleCreate} class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl">✨ 길드 만들기</button>
          {/if}
      </div>
      <button on:click={logout} class="mt-8 text-slate-500 text-sm underline">로그아웃</button>
  </div>

{:else}
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header class="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
              <h1 class="text-xl font-bold text-yellow-400 flex items-center gap-2">
                  <Shield size={24}/> {$guild?.name || '로딩...'}
              </h1>
              <p class="text-xs text-slate-500">Lv.1 {$user.job}</p>
          </div>
          <button on:click={() => leaveGuild($user.uid)} class="p-2 text-slate-600 hover:text-red-500"><LogOut size={20}/></button>
      </header>
      <main class="p-4 max-w-md mx-auto space-y-6">
          <div class="bg-indigo-900/30 border border-indigo-500/30 p-5 rounded-xl text-center">
              <p class="text-indigo-300 text-sm mb-2 font-bold">초대 코드</p>
              <div class="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
                  <span class="text-2xl font-black text-white tracking-widest flex-1">{$guild?.code || '...'}</span>
              </div>
          </div>
          <div class="text-center py-10 text-slate-500">
              <p>5단계에서 미션 기능이 추가됩니다.</p>
          </div>
      </main>
  </div>
{/if}