<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { JOB_ICONS, getGradeInfo } from '$lib';
  import { isMaxGrade } from '$lib/stores/guildStore';
  import { Coins, Pencil, Trash2, ShoppingBag, Send, Gamepad2, Crown } from 'lucide-svelte';
  import type { GuildCharacter } from '$lib/stores/guildStore';

  export let character: GuildCharacter;
  export let today: string;
  export let allowCheckIn: boolean = true;

  const dispatch = createEventDispatcher<{
    edit: { character: GuildCharacter };
    delete: { character: GuildCharacter };
    checkIn: { characterId: string };
    shop: { character: GuildCharacter };
    transfer: { character: GuildCharacter };
    miniGame: { character: GuildCharacter };
  }>();

  const hasCheckedInToday = character.lastCheckInDate === today;
  $: gradeInfo = getGradeInfo(character.grade);
  $: accentClass = gradeInfo.accent;
</script>

<article class={`character-card app-card flex flex-col p-5 md:p-6 ${accentClass}`}>
  <div class="flex items-start justify-between gap-4">
    <div>
      <div class="app-stitch-tag">
        {JOB_ICONS[character.jobClass] || "❓"} {character.jobClass}
      </div>
      <div class="mt-3 flex items-center gap-2 text-sm">
        <span title={gradeInfo.label}>{gradeInfo.icon}</span>
        <span>{gradeInfo.label}</span>
      </div>
      <div class="mt-2 text-xs">
        {gradeInfo.title}
      </div>
    </div>
    <div class="flex gap-1">
      <button on:click={() => dispatch('edit', { character })} class="app-icon-btn" title="수정">
        <Pencil size={15} />
      </button>
      <button on:click={() => dispatch('delete', { character })} class="app-icon-btn" title="삭제">
        <Trash2 size={15} />
      </button>
    </div>
  </div>

  <div class="mt-5">
    <div class="flex items-center gap-2">
      <h3 class="text-2xl font-semibold">{character.name}</h3>
      {#if isMaxGrade(character.grade)}
        <span title="가족의 신">🔱</span>
      {:else if (character.level || 1) >= 30}
        <Crown size={18} class="text-[var(--orange)]" />
      {/if}
    </div>
    <p class="mt-3 min-h-[56px] text-sm leading-6 md:min-h-[72px]">
      {character.description || "설정이 없습니다."}
    </p>
  </div>

  <div class="mt-5 grid grid-cols-2 gap-3">
    <div class="app-stat-box">
      <div class="app-label">Gold</div>
      <div class="mt-2 flex items-center gap-2 text-2xl font-bold">
        <Coins size={18} />
        {character.currentGold?.toLocaleString() || 0}
      </div>
    </div>
    <div class="app-stat-box">
      <div class="app-label">Level</div>
      <div class="mt-2 text-2xl font-bold {accentClass}">
        Lv.{character.level || 1}
      </div>
      {#if (character.consecutiveDays || 0) > 1}
        <div class="mt-1 text-xs text-[var(--green)]">연속 출석 {character.consecutiveDays}일</div>
      {/if}
    </div>
  </div>

  <div class="mt-5 grid gap-2">
    <div class="touch-grid-2">
      <button
        on:click={() => dispatch('checkIn', { characterId: character.id! })}
        disabled={!allowCheckIn || hasCheckedInToday}
        class="app-button px-4 py-3 text-sm {hasCheckedInToday ? 'app-button-secondary opacity-60' : 'app-button-primary'}"
      >
        {hasCheckedInToday ? "출석 완료" : "출석 체크"}
      </button>
      <button
        on:click={() => dispatch('shop', { character })}
        class="app-button app-button-secondary px-4 py-3 text-sm"
      >
        <ShoppingBag size={16} />
        상점
      </button>
      <button
        on:click={() => dispatch('transfer', { character })}
        class="app-button app-button-secondary px-4 py-3 text-sm"
      >
        <Send size={16} />
        양도
      </button>
      {#if allowCheckIn}
        <button
          on:click={() => dispatch('miniGame', { character })}
          class="app-button app-button-secondary px-4 py-3 text-sm"
        >
          <Gamepad2 size={16} />
          게임
        </button>
      {/if}
    </div>
  </div>
</article>