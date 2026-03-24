<script lang="ts">
  import { onDestroy } from "svelte";
  import { slide } from "svelte/transition";
  import { createShopManagerForm, notifyError, SHOP_EMOJI_CATEGORIES } from "$lib";
  import { itemStore, type ShopItem } from "$lib/stores/itemStore";
  import { Pencil, Plus, Store, Trash2 } from "lucide-svelte";

  export let guildId: string;

  const unsubscribe = itemStore.init(guildId);

  let isFormOpen = false;
  let isSaving = false;
  let editingItemId: string | null = null;
  let formData = createShopManagerForm();

  function resetForm() {
    formData = createShopManagerForm();
    editingItemId = null;
    isSaving = false;
  }

  function openForm(item?: ShopItem) {
    if (item) {
      formData = {
        name: item.name,
        cost: item.cost,
        description: item.description || "",
        icon: item.icon,
        isOneTime: item.isOneTime || false
      };
      editingItemId = item.id!;
    } else {
      resetForm();
    }

    isFormOpen = true;
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert("아이템 이름을 입력해주세요.");
      return;
    }

    try {
      isSaving = true;

      if (editingItemId) {
        await itemStore.updateItem(guildId, editingItemId, formData);
        alert("아이템이 수정되었습니다.");
      } else {
        await itemStore.addItem(guildId, formData);
        alert("아이템이 등록되었습니다.");
      }

      resetForm();
      isFormOpen = false;
    } catch (error) {
      notifyError(error, "아이템 저장에 실패했습니다.");
    } finally {
      isSaving = false;
    }
  }

  async function handleDelete(item: ShopItem) {
    if (!confirm(`'${item.name}' 아이템을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await itemStore.deleteItem(guildId, item.id!);
    } catch (error) {
      notifyError(error, "아이템 삭제에 실패했습니다.");
    }
  }

  onDestroy(() => {
    unsubscribe();
  });
</script>

<div class="overflow-hidden">
  <div class="flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-3">
      <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
        <Store size={18} />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-white">상점 관리</h3>
        <p class="text-xs text-slate-400">길드 보상 아이템을 등록하고 수정합니다.</p>
      </div>
    </div>

    <button
      on:click={() => {
        if (isFormOpen) {
          isFormOpen = false;
          resetForm();
        } else {
          openForm();
        }
      }}
      class="app-button app-button-primary px-4 py-2 text-sm"
    >
      <Plus size={16} />
      {isFormOpen ? "닫기" : "상품 등록"}
    </button>
  </div>

  {#if isFormOpen}
    <div class="border-b border-white/8 py-5" transition:slide>
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm font-semibold text-cyan-200">{editingItemId ? "상품 수정" : "새 상품 등록"}</div>
        {#if editingItemId}
          <button
            on:click={() => {
              resetForm();
              isFormOpen = false;
            }}
            class="text-sm text-slate-400 transition hover:text-white"
          >
            취소
          </button>
        {/if}
      </div>

    <div class="space-y-4">
      <div class="rounded-[1.25rem] border border-white/10 bg-white/4 p-4">
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">아이콘 선택</p>
          <div class="space-y-3">
            {#each SHOP_EMOJI_CATEGORIES as category}
              <div>
                <div class="mb-2 text-xs text-slate-500">{category.name}</div>
                <div class="flex flex-wrap gap-2">
                  {#each category.icons as icon}
                    <button
                      type="button"
                      class={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition ${formData.icon === icon ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-slate-950/40 hover:bg-white/6"}`}
                      on:click={() => (formData.icon = icon)}
                    >
                      {icon}
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-[4rem_1fr]">
          <input bind:value={formData.icon} class="app-input text-center text-xl" placeholder="🎁" />
          <input bind:value={formData.name} class="app-input" placeholder="아이템 이름 (예: 롱소드)" />
        </div>

        <div class="grid gap-4 md:grid-cols-[9rem_1fr]">
          <input type="number" bind:value={formData.cost} class="app-input" min="0" placeholder="가격" />
          <input bind:value={formData.description} class="app-input" placeholder="설명 (선택 사항)" />
        </div>

        <label class="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/4 p-4">
          <input type="checkbox" bind:checked={formData.isOneTime} class="mt-1 h-4 w-4 accent-amber-400" />
          <div>
            <span class="font-semibold text-white">일회성 아이템</span>
            <p class="mt-1 text-sm text-slate-400">구매 시 인벤토리에 남지 않고 즉시 소모되는 아이템입니다.</p>
          </div>
        </label>

        <button on:click={handleSave} disabled={isSaving} class="app-button app-button-primary w-full px-4 py-4">
          {isSaving ? "저장 중..." : editingItemId ? "수정 완료" : "등록하기"}
        </button>
      </div>
    </div>
  {/if}

  <div class="mt-5 space-y-3">
    {#if $itemStore.length === 0}
      <div class="rounded-[1.25rem] border border-dashed border-white/10 px-4 py-12 text-center text-sm text-slate-400">
        등록된 상품이 없습니다.
      </div>
    {:else}
      {#each $itemStore as item (item.id)}
        <div class="group flex flex-col gap-4 rounded-[1.25rem] border border-white/10 bg-white/4 p-4 transition hover:bg-white/6 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/40 text-2xl">
              {item.icon}
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 font-semibold text-white">
                {item.name}
                {#if item.isOneTime}
                  <span class="rounded-full bg-rose-300/12 px-2 py-0.5 text-[11px] text-rose-200">1회용</span>
                {/if}
              </div>
              <div class="mt-1 text-sm text-slate-400">
                {item.cost} G
                {#if item.description}
                  <span class="mx-2 text-slate-600">|</span>
                  {item.description}
                {/if}
              </div>
            </div>
          </div>

          <div class="flex shrink-0 gap-2 self-end sm:self-auto">
            <button on:click={() => openForm(item)} class="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-cyan-200" title="수정">
              <Pencil size={15} />
            </button>
            <button on:click={() => handleDelete(item)} class="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-rose-200" title="삭제">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
