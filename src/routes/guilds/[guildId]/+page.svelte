<script lang="ts">
    import { page } from "$app/stores";
    import { onDestroy } from "svelte";
    import { goto } from "$app/navigation";
    import { guildStore } from "$lib/stores/guildStore";
    import { userStore } from "$lib/stores/userStore";
    import ShopManager from '$lib/components/ShopManager.svelte';

    const guildId = $page.params.guildId;

    // 길드 데이터 & 멤버 목록 실시간 구독
    const unsubscribe = guildStore.init(guildId);

    // 스토어 상태 반응형 변수
    $: guild = $guildStore;
    $: characters = $guildStore?.characters || []; // 멤버 목록 배열
    $: currentUser = $userStore;

    // [NEW] 수정 모드 상태 관리
    let isEditingName = false;
    let newName = "";
    let isSavingName = false;
    let showShopManager = false;

    // 수정 모드 진입
    function startEditing() {
        newName = guild?.name || "";
        isEditingName = true;
    }

    // 수정 취소
    function cancelEditing() {
        isEditingName = false;
    }

    // [NEW] 길드명 저장 핸들러
    async function saveGuildName() {
        if (!newName.trim()) return alert("길드 이름을 입력해주세요.");

        try {
            isSavingName = true;
            await guildStore.updateGuildName(guildId, newName);
            isEditingName = false;
            // alert("길드 이름이 변경되었습니다."); // UX상 자연스러운 흐름을 위해 생략 가능
        } catch (e: any) {
            console.error(e);
            alert("변경 실패: " + e.message);
        } finally {
            isSavingName = false;
        }
    }

    // [NEW] 설명 수정 모드 상태 관리
    let isEditingDesc = false;
    let newDesc = "";
    let isSavingDesc = false;

    // 설명 수정 시작
    function startEditingDesc() {
        newDesc = guild?.description || "";
        isEditingDesc = true;
    }

    // 설명 저장 핸들러
    async function saveGuildDesc() {
        try {
            isSavingDesc = true;
            // 스토어의 설명 변경 함수 호출
            await guildStore.updateGuildDescription(guildId, newDesc);
            isEditingDesc = false;
        } catch (e: any) {
            console.error(e);
            alert("설명 변경 실패: " + e.message);
        } finally {
            isSavingDesc = false;
        }
    }

    // [NEW] 초대 코드 복사 기능
    async function copyInviteCode() {
        try {
            await navigator.clipboard.writeText(guild?.code || "");
            alert(
                `초대 코드가 복사되었습니다!\n친구에게 공유하세요: ${guild?.code}`,
            );
        } catch (err) {
            alert("복사에 실패했습니다. 직접 복사해주세요: " + guild?.code);
        }
    }

    // [EXISTING] 길드 탈퇴 핸들러
    async function handleLeaveGuild() {
        if (
            !confirm(
                "정말로 길드를 탈퇴하시겠습니까?\n\n탈퇴 후에는 이 길드의 캐릭터나 데이터를 관리할 수 없게 되며, 다시 가입하거나 새로운 길드를 만들어야 합니다.",
            )
        ) {
            return;
        }

        try {
            if (currentUser?.uid) {
                // userStore의 leaveGuild 함수 호출 (DB 업데이트)
                await userStore.leaveGuild(currentUser.uid);
                alert("길드를 탈퇴했습니다. 메인으로 이동합니다.");

                // 메인 페이지로 이동하면서 강제로 상태 갱신
                goto("/", { replaceState: true });
            }
        } catch (e: any) {
            console.error(e);
            alert("탈퇴 중 오류가 발생했습니다: " + e.message);
        }
    }

    // 컴포넌트 파괴 시 구독 해제
    onDestroy(() => {
        unsubscribe();
    });
</script>



<div class="p-4 max-w-4xl mx-auto pb-20">
    <div class="flex flex-wrap gap-2 mb-6 justify-end">
    {#if currentUser}
        <button 
            on:click={() => showShopManager = true}
            class="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 px-4 py-2 rounded-lg shadow-sm font-bold flex items-center gap-2 transition"
        >
            🏪 상점 관리
        </button>
    {/if}
</div>
    <div
        class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden"
    >
    
        <div class="relative z-10">
            <div class="flex items-center gap-3 mb-2 min-h-[3rem]">
                {#if isEditingName}
                    <div
                        class="flex items-center gap-2 w-full max-w-md bg-white/10 p-1 rounded"
                    >
                        <input
                            type="text"
                            bind:value={newName}
                            class="bg-transparent border-b border-white/50 text-white text-2xl font-bold w-full px-2 focus:outline-none focus:border-white placeholder-white/50"
                            placeholder="길드 이름 입력"
                            disabled={isSavingName}
                            on:keydown={(e) =>
                                e.key === "Enter" && saveGuildName()}
                        />
                        <button
                            on:click={saveGuildName}
                            disabled={isSavingName}
                            class="text-sm bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-white disabled:opacity-50 whitespace-nowrap transition"
                        >
                            {isSavingName ? "저장 중..." : "확인"}
                        </button>
                        <button
                            on:click={cancelEditing}
                            disabled={isSavingName}
                            class="text-sm bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded text-white disabled:opacity-50 whitespace-nowrap transition"
                        >
                            취소
                        </button>
                    </div>
                {:else}
                    <h1 class="text-3xl font-bold">
                        🏰 {guild?.name || "로딩 중..."}
                    </h1>

                    {#if guild && currentUser }
                        <button
                            on:click={startEditing}
                            class="text-white/50 hover:text-white transition p-1"
                            title="길드 이름 수정"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                            </svg>
                        </button>
                    {/if}
                {/if}
            </div>
            <div class="mb-4">
                {#if isEditingDesc}
                    <div class="bg-white/10 p-2 rounded backdrop-blur-sm">
                        <textarea
                            bind:value={newDesc}
                            class="w-full bg-transparent border-none text-white placeholder-white/50 focus:ring-0 focus:outline-none resize-none"
                            rows="2"
                            placeholder="우리 길드를 소개해주세요!"
                            disabled={isSavingDesc}
                        ></textarea>
                        <div class="flex justify-end gap-2 mt-2">
                            <button
                                on:click={saveGuildDesc}
                                disabled={isSavingDesc}
                                class="text-xs bg-white text-indigo-600 px-3 py-1 rounded font-bold hover:bg-gray-100 transition"
                            >
                                {isSavingDesc ? "저장 중..." : "완료"}
                            </button>
                            <button
                                on:click={() => (isEditingDesc = false)}
                                disabled={isSavingDesc}
                                class="text-xs bg-transparent border border-white/30 text-white px-3 py-1 rounded hover:bg-white/10 transition"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                {:else}
                    <div class="group flex items-start gap-2">
                        <p
                            class="text-indigo-100 opacity-90 leading-relaxed whitespace-pre-wrap"
                        >
                            {guild?.description ||
                                "함께 성장하는 우리만의 길드"}
                        </p>

                        {#if currentUser}
                            <button
                                on:click={startEditingDesc}
                                class="opacity-0 group-hover:opacity-100 transition text-white/50 hover:text-white p-1 shrink-0"
                                title="길드 설명 수정 (누구나 가능)"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                </svg>
                            </button>
                        {/if}
                    </div>
                {/if}
            </div>

            <div
                class="flex flex-wrap gap-3 text-sm font-bold opacity-80 items-center"
            >
                <span
                    class="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1"
                >
                    👥 멤버 {characters.length}명
                </span>
                <span class="bg-white/20 px-3 py-1 rounded-full">
                    📅 생성일: {guild?.createdAt
                        ? new Date(
                              guild.createdAt.seconds * 1000,
                          ).toLocaleDateString()
                        : "-"}
                </span>

                <button
                    on:click={copyInviteCode}
                    class="bg-white/20 px-3 py-1 rounded-full hover:bg-white/40 transition flex items-center gap-1 cursor-pointer border border-transparent hover:border-white/50"
                    title="클릭하여 초대 코드 복사"
                >
                    🎟️ 초대 코드 복사 : {guild?.code}
                </button>
            </div>
        </div>
        <div
            class="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"
        ></div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <a
            href="/guilds/{guildId}/members"
            class="group bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition text-center"
        >
            <div class="text-4xl mb-3 group-hover:scale-110 transition">🛡️</div>
            <h3 class="font-bold text-gray-800 text-lg">멤버 & 캐릭터</h3>
            <p class="text-gray-500 text-sm mt-1">
                동료들의 상태를 확인하고<br />내 캐릭터를 관리합니다.
            </p>
        </a>

        <a
            href="/guilds/{guildId}/missions"
            class="group bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition text-center"
        >
            <div class="text-4xl mb-3 group-hover:scale-110 transition">📜</div>
            <h3 class="font-bold text-gray-800 text-lg">퀘스트 보드</h3>
            <p class="text-gray-500 text-sm mt-1">
                새로운 미션을 등록하고<br />완료하여 보상을 받으세요.
            </p>
        </a>

        <a
            href="/guilds/{guildId}/logs"
            class="group bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition text-center"
        >
            <div class="text-4xl mb-3 group-hover:scale-110 transition">🔔</div>
            <h3 class="font-bold text-gray-800 text-lg">활동 로그</h3>
            <p class="text-gray-500 text-sm mt-1">
                길드원들의 모든 활동 내역을<br />한눈에 파악합니다.
            </p>
        </a>
    </div>

    <div class="border-t pt-8 mt-8">
        <div
            class="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-6 rounded-xl border border-gray-200 gap-4"
        >
            <div class="text-center md:text-left">
                <h4 class="font-bold text-gray-700">길드 탈퇴</h4>
                <p class="text-sm text-gray-500 mt-1">
                    현재 길드에서 나가고, 소속을 초기화합니다.
                </p>
            </div>
            <button
                on:click={handleLeaveGuild}
                class="px-5 py-2 bg-white border border-red-300 text-red-600 font-bold rounded-lg hover:bg-red-50 hover:border-red-400 transition shadow-sm whitespace-nowrap"
            >
                ⚠️ 길드 탈퇴하기
            </button>
        </div>
    </div>
    {#if showShopManager}
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="w-full max-w-md relative animate-fade-in-up">
            <button 
                on:click={() => showShopManager = false} 
                class="absolute -top-10 right-0 text-white hover:text-gray-200 font-bold"
            >
                닫기 ✕
            </button>
            
            <ShopManager guildId={guildId} />
        </div>
    </div>
{/if}
</div>
