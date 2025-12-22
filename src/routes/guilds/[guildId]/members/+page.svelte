<script lang="ts">
  import { page } from '$app/stores';
  import { guildStore } from '$lib/stores/guildStore';
  import { userStore } from '$lib/stores/userStore'; // 로그인된 유저 정보 (Step 3에서 만들었다고 가정)
  import { goto } from '$app/navigation';
  import { doc, getDoc } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import { onMount } from 'svelte';

  const guildId = $page.params.guildId;
  let guildData: any = null;
  let isMember = false;

  // 길드 정보 및 내 가입 여부 로딩
  onMount(async () => {
    // 1. 길드 정보 가져오기 (단순 표시용)
    const snap = await getDoc(doc(db, "guilds", guildId));
    if (snap.exists()) {
      guildData = snap.data();
    }

    // 2. 내가 이 길드 멤버인지 확인 (userStore에 guildId가 있다고 가정)
    // userStore가 실시간 업데이트 된다면 $userStore.guildId === guildId 로 체크 가능
    if ($userStore && $userStore.guildId === guildId) {
      isMember = true;
    }
  });

  async function handleJoin() {
    if (!confirm('이 길드에 가입하시겠습니까?')) return;
    try {
      await guildStore.joinGuild(guildId, $userStore);
      alert('환영합니다! 길드원이 되었습니다.');
      isMember = true;
      // 페이지 새로고침 혹은 스토어 업데이트 필요
      window.location.reload(); 
    } catch (e: any) {
      alert(e.message);
    }
  }

  function goToMissionManage() {
    goto(`/guilds/${guildId}/admin/missions`); // 5단계에서 만들 경로
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  {#if guildData}
    <h1 class="text-4xl font-bold mb-2">{guildData.name}</h1>
    <p class="text-gray-600 mb-8">{guildData.description}</p>
    
    <div class="bg-gray-100 p-6 rounded-lg text-center">
      {#if !$userStore}
         <p>로그인 후 가입할 수 있습니다.</p>
      
      {:else if isMember}
        <div class="space-y-4">
          <p class="text-green-600 font-bold text-lg">당신은 이 길드의 멤버입니다!</p>
          <button on:click={goToMissionManage}
            class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-bold shadow-lg transition">
            🛡️ 길드 미션 관리하러 가기
          </button>
        </div>

      {:else}
        <button on:click={handleJoin}
          class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-bold text-lg shadow-lg transition">
          가입하고 함께하기
        </button>
      {/if}
    </div>
  {:else}
    <p>로딩 중...</p>
  {/if}
</div>