<script lang="ts">
  import { resolveCharacterAppearance } from '$lib/stores/guild/appearance';
  import type { GuildCharacter } from '$lib/stores/guildStore';

  export let character: GuildCharacter;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showTitle = true;

  $: appearance = resolveCharacterAppearance(character);
  $: sizeClass = `avatar-${size}`;
  $: portraitInitial = character.name?.trim()?.slice(0, 1).toUpperCase() || '?';
  $: styleVars = `--avatar-color: ${appearance.color};`;
</script>

<div
  class={`character-avatar ${sizeClass} frame-${appearance.frame} backdrop-${appearance.backdrop} aura-${appearance.aura}`}
  style={styleVars}
  aria-label={`${character.name} avatar`}
>
  <div class="avatar-backdrop"></div>
  <svg class="avatar-mark" viewBox="0 0 96 96" role="img" aria-hidden="true">
    <circle cx="48" cy="30" r="14" />
    <path d="M24 78c3-19 13-30 24-30s21 11 24 30H24z" />
    {#if appearance.portrait === 'mage'}
      <path d="M28 42 48 8l20 34H28z" class="avatar-detail" />
    {:else if appearance.portrait === 'healer'}
      <path d="M44 58h8v18h-8zM35 63h26v8H35z" class="avatar-detail" />
    {:else if appearance.portrait === 'ranger'}
      <path d="M72 22c-17 10-29 23-40 46M34 24c15 8 24 18 32 34" class="avatar-stroke" />
    {:else if appearance.portrait === 'rogue'}
      <path d="M28 28c12 8 28 8 40 0l-6 19c-9 5-19 5-28 0l-6-19z" class="avatar-detail" />
    {:else if appearance.portrait === 'tank'}
      <path d="M48 8 73 19v18c0 18-10 32-25 42-15-10-25-24-25-42V19L48 8z" class="avatar-stroke" />
    {:else}
      <path d="M48 10 58 35H38L48 10z" class="avatar-detail" />
    {/if}
  </svg>
  <div class="avatar-initial">{portraitInitial}</div>
  {#if showTitle && appearance.title}
    <div class="avatar-title">{appearance.title}</div>
  {/if}
</div>

<style>
  .character-avatar {
    position: relative;
    isolation: isolate;
    display: grid;
    place-items: center;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid var(--gc-divider, #dadce0);
    background: var(--gc-surface, #f1f3f4);
    box-shadow: var(--gc-shadow-1, 0 1px 2px rgba(60, 64, 67, 0.1), 0 1px 3px rgba(60, 64, 67, 0.15));
    color: var(--avatar-color);
  }

  .avatar-sm {
    width: 4rem;
    height: 4rem;
    border-radius: 1rem;
  }

  .avatar-md {
    width: 5.75rem;
    height: 5.75rem;
    border-radius: 1.2rem;
  }

  .avatar-lg {
    width: 8rem;
    height: 8rem;
    border-radius: 1.5rem;
  }

  .avatar-backdrop {
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--avatar-color) 18%, white), #fff 54%),
      radial-gradient(circle at 72% 18%, color-mix(in srgb, var(--avatar-color) 22%, transparent), transparent 35%);
  }

  .backdrop-forest .avatar-backdrop {
    background:
      linear-gradient(135deg, #e6f4ea, #ffffff 58%),
      radial-gradient(circle at 28% 22%, #18803833, transparent 34%);
  }

  .backdrop-citadel .avatar-backdrop {
    background:
      linear-gradient(135deg, #e8f0fe, #ffffff 56%),
      repeating-linear-gradient(90deg, transparent 0 13px, #1a73e814 13px 14px);
  }

  .backdrop-sky .avatar-backdrop {
    background:
      linear-gradient(160deg, #e8f0fe, #fff 50%, #fef7e0),
      radial-gradient(circle at 70% 25%, #f9ab0040, transparent 24%);
  }

  .backdrop-void .avatar-backdrop {
    background:
      linear-gradient(135deg, #202124, #3c4043),
      radial-gradient(circle at 50% 24%, color-mix(in srgb, var(--avatar-color) 38%, transparent), transparent 32%);
  }

  .backdrop-void {
    color: color-mix(in srgb, var(--avatar-color) 70%, white);
  }

  .avatar-mark {
    width: 72%;
    height: 72%;
    fill: currentColor;
    opacity: 0.88;
    filter: drop-shadow(0 4px 8px rgba(60, 64, 67, 0.16));
  }

  .avatar-detail {
    fill: color-mix(in srgb, currentColor 22%, white);
    opacity: 0.94;
  }

  .avatar-stroke {
    fill: none;
    stroke: currentColor;
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .avatar-initial {
    position: absolute;
    right: 0.45rem;
    bottom: 0.4rem;
    display: grid;
    place-items: center;
    min-width: 1.5rem;
    height: 1.5rem;
    border-radius: 999px;
    background: #fff;
    color: var(--gc-ink, #202124);
    font-size: 0.75rem;
    font-weight: 700;
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.18);
  }

  .avatar-title {
    position: absolute;
    left: 0.5rem;
    right: 0.5rem;
    bottom: 0.45rem;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    color: var(--gc-ink, #202124);
    padding: 0.18rem 0.45rem;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.64rem;
    font-weight: 600;
  }

  .avatar-sm .avatar-title,
  .avatar-sm .avatar-initial {
    display: none;
  }

  .frame-bronze { border-color: #a79b8e; }
  .frame-silver { border-color: #9e9e9e; }
  .frame-gold { border-color: #f9ab00; box-shadow: 0 1px 2px rgba(60, 64, 67, 0.1), 0 0 0 3px #fef7e0; }
  .frame-arcane { border-color: #8e24aa; box-shadow: 0 1px 2px rgba(60, 64, 67, 0.1), 0 0 0 3px #f3e8fd; }

  .aura-blue,
  .aura-green,
  .aura-amber,
  .aura-rose,
  .aura-violet {
    animation: aura-pulse 3.8s ease-in-out infinite;
  }

  .aura-blue { --avatar-aura: #1a73e8; }
  .aura-green { --avatar-aura: #188038; }
  .aura-amber { --avatar-aura: #f9ab00; }
  .aura-rose { --avatar-aura: #d93025; }
  .aura-violet { --avatar-aura: #8e24aa; }

  .aura-blue::after,
  .aura-green::after,
  .aura-amber::after,
  .aura-rose::after,
  .aura-violet::after {
    content: "";
    position: absolute;
    inset: 0.35rem;
    z-index: -1;
    border-radius: inherit;
    background: radial-gradient(circle, color-mix(in srgb, var(--avatar-aura) 25%, transparent), transparent 68%);
  }

  @media (prefers-reduced-motion: reduce) {
    .aura-blue,
    .aura-green,
    .aura-amber,
    .aura-rose,
    .aura-violet {
      animation: none;
    }
  }
</style>
