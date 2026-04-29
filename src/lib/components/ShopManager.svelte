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
  <div class="flex flex-col gap-4 border-b border-[var(--grey-300)] pb-5 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-3">
      <div class="app-coin-icon">
        <Store size={18} />
      </div>
      <div>
        <h3 class="text-lg font-semibold">상점 관리</h3>
        <p class="text-xs text-[var(--text-secondary)]">길드 보상 아이템을 등록하고 수정합니다.</p>
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
      class="app-button app-button-primary w-full px-4 py-3 text-sm sm:w-auto sm:py-2"
    >
      <Plus size={16} />
      {isFormOpen ? "닫기" : "상품 등록"}
    </button>
  </div>

  {#if isFormOpen}
    <div class="border-b border-[var(--grey-300)] py-5" transition:slide>
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="app-stitch-tag">{editingItemId ? "상품 수정" : "새 상품 등록"}</div>
        {#if editingItemId}
          <button
            on:click={() => {
              resetForm();
              isFormOpen = false;
            }}
            class="text-sm text-[var(--text-secondary)] transition hover:text-[var(--black)]"
          >
            취소
          </button>
        {/if}
      </div>

      <div class="space-y-4">
        <div class="app-stat-card p-4">
          <p class="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">아이콘 선택</p>
          <div class="space-y-3">
            {#each SHOP_EMOJI_CATEGORIES as category}
              <div>
                <div class="mb-2 text-xs">{category.name}</div>
                <div class="flex flex-wrap gap-2">
                  {#each category.icons as icon}
                    <button
                      type="button"
                      class={`shop-icon-btn ${formData.icon === icon ? "shop-icon-btn-active" : ""}`}
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

        <label class="flex items-start gap-3 rounded-[1rem] border border-[var(--grey-300)] p-4">
          <input type="checkbox" bind:checked={formData.isOneTime} class="mt-1 h-4 w-4" />
          <div>
            <span class="font-semibold">일회성 아이템</span>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">구매 시 인벤토리에 남지 않고 즉시 소모되는 아이템입니다.</p>
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
      <div class="rounded-[1.25rem] border border-dashed border-[var(--grey-300)] px-4 py-12 text-center">
        등록된 상품이 없습니다.
      </div>
    {:else}
      {#each $itemStore as item (item.id)}
        <div class="app-stat-card group flex flex-col gap-4 p-4 transition sm:flex-row sm:items-center sm:justify-between">
          <div class="flex min-w-0 items-center gap-3">
            <div class="app-seal text-2xl">
              {item.icon}
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 font-semibold">
                {item.name}
                {#if item.isOneTime}
                  <span class="app-stitch-tag text-[11px] text-[var(--red)]">1회용</span>
                {/if}
              </div>
              <div class="mt-1 text-sm text-[var(--text-secondary)]">
                {item.cost} G
                {#if item.description}
                  <span class="mx-2">·</span>
                  {item.description}
                {/if}
              </div>
            </div>
          </div>

          <div class="flex shrink-0 gap-2 self-end sm:self-auto">
            <button on:click={() => openForm(item)} class="app-icon-btn" title="수정">
              <Pencil size={15} />
            </button>
            <button on:click={() => handleDelete(item)} class="app-icon-btn" title="삭제">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .shop-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-secondary);
    background: var(--white);
    font-size: 1rem;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .shop-icon-btn:hover {
    background: var(--grey-100);
    border-color: var(--grey-500);
  }

  .shop-icon-btn-active {
    border-color: var(--black);
    background: var(--grey-100);
  }
</style>