<script lang="ts">
    import { itemStore, type ShopItem } from '$lib/stores/itemStore';
    import { slide } from 'svelte/transition';
    import { onDestroy } from 'svelte';

    export let guildId: string;

    // 아이템 스토어 구독
    const unsubscribe = itemStore.init(guildId);
    onDestroy(() => unsubscribe());

    // 폼 상태 관리
    let isFormOpen = false;
    let isSaving = false;
    let editingItemId: string | null = null; // 수정 중인 아이템 ID (null이면 새 등록)

    // 입력 폼 데이터
    let formData = {
        name: "",
        cost: 100,
        description: "",
        icon: "🗡️",
        isOneTime: false
    };

    // 폼 초기화
    function resetForm() {
        formData = { name: "", cost: 100, description: "", icon: "🗡️", isOneTime: false };
        editingItemId = null;
        isSaving = false;
    }

    // 등록/수정 모드 진입
    function openForm(item?: ShopItem) {
        if (item) {
            // 수정 모드: 기존 데이터 복사
            formData = { 
                name: item.name, 
                cost: item.cost, 
                description: item.description || "", 
                icon: item.icon, 
                isOneTime: item.isOneTime || false 
            };
            editingItemId = item.id!;
        } else {
            // 새 등록 모드
            resetForm();
        }
        isFormOpen = true;
    }

    // 저장 핸들러 (등록 & 수정 공용)
    async function handleSave() {
        if (!formData.name) return alert("아이템 이름을 입력해주세요.");
        
        try {
            isSaving = true;
            if (editingItemId) {
                // [수정] 기존 아이템 업데이트
                await itemStore.updateItem(guildId, editingItemId, formData);
                alert("아이템이 수정되었습니다.");
            } else {
                // [등록] 새 아이템 추가
                await itemStore.addItem(guildId, formData);
                alert("아이템이 등록되었습니다!");
            }
            
            resetForm();
            isFormOpen = false; // 저장 후 폼 닫기
        } catch (e: any) {
            alert("저장 실패: " + e.message);
        } finally {
            isSaving = false;
        }
    }

    // 아이템 삭제
    async function handleDelete(item: ShopItem) {
        if (confirm(`'${item.name}' 아이템을 삭제하시겠습니까?`)) {
            try {
                await itemStore.deleteItem(guildId, item.id!);
            } catch (e: any) {
                alert("삭제 실패: " + e.message);
            }
        }
    }
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="p-4 bg-gray-50 border-b flex justify-between items-center">
        <h3 class="font-bold text-gray-800">🏪 상점 관리</h3>
        <button 
            on:click={() => {
                if (isFormOpen) {
                    isFormOpen = false;
                    resetForm();
                } else {
                    openForm();
                }
            }}
            class="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 transition"
        >
            {isFormOpen ? '닫기' : '+ 상품 등록'}
        </button>
    </div>

    {#if isFormOpen}
        <div class="p-4 bg-indigo-50 border-b space-y-3" transition:slide>
            <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-indigo-800 uppercase">
                    {editingItemId ? '✏️ 상품 수정' : '✨ 새 상품 등록'}
                </span>
                {#if editingItemId}
                    <button on:click={() => { resetForm(); isFormOpen = false; }} class="text-xs text-gray-500 underline">취소</button>
                {/if}
            </div>

            <div class="flex gap-2">
                <input bind:value={formData.icon} class="w-14 text-center border rounded-lg p-2" placeholder="이모지">
                <input bind:value={formData.name} class="flex-1 border rounded-lg p-2" placeholder="아이템 이름">
            </div>
            <div class="flex gap-2">
                <input type="number" bind:value={formData.cost} class="w-24 border rounded-lg p-2" placeholder="가격">
                <input bind:value={formData.description} class="flex-1 border rounded-lg p-2" placeholder="설명 (선택)">
            </div>
            
            <label class="flex items-center gap-2 p-2 bg-white rounded border border-indigo-100 cursor-pointer">
                <input type="checkbox" bind:checked={formData.isOneTime} class="w-4 h-4 text-indigo-600 rounded">
                <div>
                    <span class="font-bold text-sm text-gray-700">🔥 일회성 아이템</span>
                    <span class="text-xs text-gray-500 ml-1">(구매 시 즉시 소모됨)</span>
                </div>
            </label>

            <button 
                on:click={handleSave} 
                disabled={isSaving}
                class="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
                {isSaving ? '저장 중...' : (editingItemId ? '수정 완료' : '등록하기')}
            </button>
        </div>
    {/if}

    <div class="divide-y max-h-[400px] overflow-y-auto">
        {#if $itemStore.length === 0}
            <div class="p-8 text-center text-gray-400 text-sm">등록된 상품이 없습니다.</div>
        {:else}
            {#each $itemStore as item (item.id)}
                <div class="p-3 flex justify-between items-center hover:bg-gray-50 transition group">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">{item.icon}</span>
                        <div>
                            <div class="font-bold text-gray-800 flex items-center gap-2">
                                {item.name}
                                {#if item.isOneTime}
                                    <span class="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">1회용</span>
                                {/if}
                            </div>
                            <div class="text-xs text-gray-500">💰 {item.cost} G</div>
                        </div>
                    </div>
                    
                    <div class="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                            on:click={() => openForm(item)}
                            class="text-gray-400 hover:text-blue-600 p-1.5 rounded-md transition bg-white border border-gray-200 shadow-sm"
                            title="수정"
                        >
                            ✏️
                        </button>
                        <button 
                            on:click={() => handleDelete(item)}
                            class="text-gray-400 hover:text-red-500 p-1.5 rounded-md transition bg-white border border-gray-200 shadow-sm"
                            title="삭제"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>