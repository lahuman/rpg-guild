<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Coins, Send, X } from "lucide-svelte";
  import { transferGoldAction } from "$lib/features/members/actions";
  import type { GuildCharacter } from "$lib/stores/guildStore";

  export let guildId: string;
  export let fromCharacter: GuildCharacter;
  export let allCharacters: GuildCharacter[];

  const dispatch = createEventDispatcher();

  let toCharacterId = "";
  let amount = 0;
  let reason = "";
  let isSubmitting = false;

  $: otherCharacters = allCharacters.filter(c => c.id !== fromCharacter.id);

  async function handleTransfer() {
    if (isSubmitting) return;
    
    isSubmitting = true;
    const success = await transferGoldAction(
      guildId,
      fromCharacter.id!,
      toCharacterId,
      amount,
      reason
    );
    isSubmitting = false;

    if (success) {
      dispatch("close");
    }
  }

  function close() {
    dispatch("close");
  }
</script>

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
  <div class="app-modal w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl">
    <div class="flex items-center justify-between border-b border-white/5 px-6 py-5 md:px-8">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
          <Send size={20} />
        </div>
        <div>
          <h3 class="text-xl font-bold text-white">포인트 양도</h3>
          <p class="text-xs text-slate-400">동료에게 골드를 선물합니다.</p>
        </div>
      </div>
      <button on:click={close} class="rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white">
        <X size={20} />
      </button>
    </div>

    <div class="space-y-6 px-6 py-6 md:px-8">
      <!-- From info -->
      <div class="rounded-2xl bg-white/5 p-4">
        <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500">보내는 이</div>
        <div class="mt-1 flex items-center justify-between">
          <span class="font-semibold text-white">{fromCharacter.name}</span>
          <span class="flex items-center gap-1.5 text-sm font-bold text-amber-200">
            <Coins size={14} />
            {fromCharacter.currentGold.toLocaleString()} G
          </span>
        </div>
      </div>

      <!-- To selection -->
      <div class="space-y-2">
        <label for="to-char" class="text-sm font-medium text-slate-300">받는 이</label>
        <select id="to-char" bind:value={toCharacterId} class="app-select w-full">
          <option value="" disabled>캐릭터를 선택하세요</option>
          {#each otherCharacters as char}
            <option value={char.id}>{char.name} (Lv.{char.level})</option>
          {/each}
        </select>
      </div>

      <!-- Amount -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="amount" class="text-sm font-medium text-slate-300">양도 수량</label>
          <button 
            on:click={() => amount = fromCharacter.currentGold}
            class="text-[10px] font-bold text-cyan-400 hover:text-cyan-300"
          >
            MAX
          </button>
        </div>
        <div class="relative">
          <input 
            id="amount" 
            type="number" 
            bind:value={amount} 
            min="0" 
            max={fromCharacter.currentGold}
            class="app-input w-full pr-12" 
            placeholder="0"
          />
          <div class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">G</div>
        </div>
      </div>

      <!-- Reason -->
      <div class="space-y-2">
        <label for="reason" class="text-sm font-medium text-slate-300">양도 사유</label>
        <textarea 
          id="reason" 
          bind:value={reason} 
          class="app-textarea min-h-[80px] w-full" 
          placeholder="예: 미션 도와줘서 고마워요!"
        ></textarea>
      </div>
    </div>

    <div class="flex flex-col gap-2 border-t border-white/5 bg-white/[0.02] px-6 py-5 md:px-8">
      <button 
        on:click={handleTransfer}
        disabled={isSubmitting || !toCharacterId || amount <= 0 || amount > fromCharacter.currentGold || !reason.trim()}
        class="app-button app-button-primary w-full py-4 text-base font-bold shadow-lg shadow-cyan-500/10 disabled:opacity-50"
      >
        {#if isSubmitting}
          <span class="flex items-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
            처리 중...
          </span>
        {:else}
          양도 보내기
        {/if}
      </button>
      <button on:click={close} class="app-button app-button-secondary w-full py-3 text-sm font-medium">
        취소
      </button>
    </div>
  </div>
</div>
