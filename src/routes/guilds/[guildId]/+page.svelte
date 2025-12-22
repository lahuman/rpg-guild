<script lang="ts">
  import { page } from '$app/stores';
  import { userStore } from '$lib/stores/userStore';
  import { guildStore } from '$lib/stores/guildStore';
  import { doc, getDoc } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import { onMount } from 'svelte';

  const guildId = $page.params.guildId;
  let guildData: any = null;
  let isMember = false;

  onMount(async () => {
    // 1. 길드 데이터 로드
    const snap = await getDoc(doc(db, "guilds", guildId));
    if (snap.exists()) guildData = snap.data();

    // 2. 멤버 여부 확인
    // userStore가 로드된 후 체크 (reactive하게 $userStore 사용 권장)
  });

  // userStore가 변경될 때마다 멤버 여부 재확인
  $: if ($userStore && $userStore.guildId === guildId) {
    isMember = true;
  }

  async function handleJoin() {
    if (!confirm('정말 가입하시겠습니까?')) return;
    try {
      await guildStore.joinGuild(guildId, $userStore);
      alert('가입 완료! 이제 길드 활동을 시작하세요.');
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    }
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  {#if guildData}
    <header class="mb-10 text-center">
      <h1 class="text-4xl font-extrabold text-gray-900 mb-2">{guildData.name}</h1>
      <p class="text-lg text-gray-600">{guildData.description}</p>
      <div class="mt-4 flex justify-center gap-4 text-sm text-gray-500">
        <span>👥 멤버 {guildData.memberCount || 0}명</span>
        <span>📅 개설일 {guildData.createdAt?.toDate().toLocaleDateString()}</span>
      </div>
    </header>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      
      {#if !isMember}
        <div class="text-center py-10">
          <h3 class="text-2xl font-bold text-gray-800 mb-4">아직 멤버가 아니군요!</h3>
          <p class="text-gray-500 mb-8">길드원이 되어 미션을 수행하고 보상을 획득하세요.</p>
          <button on:click={handleJoin}
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition transform hover:-translate-y-1">
            🚀 길드 가입하기
          </button>
        </div>

      {:else}
        <div>
          <h2 class="text-xl font-bold text-gray-800 mb-6 border-b pb-2">📋 길드 관리 메뉴</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <a href={`/guilds/${guildId}/missions`} 
               class="group block p-6 border rounded-xl hover:border-blue-500 hover:shadow-md transition bg-blue-50">
              <div class="flex items-center justify-between mb-4">
                <span class="text-3xl">📜</span>
                <span class="text-blue-600 text-sm font-bold bg-white px-2 py-1 rounded">Mission</span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 group-hover:text-blue-600">미션 관리</h3>
              <p class="text-gray-600 mt-2 text-sm">
                매일 수행할 미션을 등록하고,<br/>
                난이도와 보상을 설정합니다.
              </p>
            </a>

            <a href={`/guilds/${guildId}/members`} 
               class="group block p-6 border rounded-xl hover:border-green-500 hover:shadow-md transition bg-green-50">
              <div class="flex items-center justify-between mb-4">
                <span class="text-3xl">👥</span>
                <span class="text-green-600 text-sm font-bold bg-white px-2 py-1 rounded">Members</span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 group-hover:text-green-600">길드원 관리</h3>
              <p class="text-gray-600 mt-2 text-sm">
                누가 미션을 완료했는지 확인하고,<br/>
                길드원의 활동을 관리합니다.
              </p>
            </a>

          </div>
        </div>
      {/if}

    </div>
  {:else}
    <div class="text-center py-20 text-gray-500">길드 정보를 불러오는 중...</div>
  {/if}
</div>