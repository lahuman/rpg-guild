<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { scale } from "svelte/transition";

  interface ButtonConfig {
    icon: any;
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
  }

  export let primary: ButtonConfig;
  export let secondary: ButtonConfig | null = null;
  export let direction: 'horizontal' | 'vertical' = 'horizontal';

  const dispatch = createEventDispatcher();

  let ripples: Array<{ id: number; x: number; y: number; size: number }> = [];

  function createRipple(event: MouseEvent | TouchEvent) {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const size = Math.max(rect.width, rect.height);
    const x = clientX - rect.left - size / 2;
    const y = clientY - rect.top - size / 2;
    const ripple = { id: Date.now(), x, y, size };
    ripples = [...ripples, ripple];
    setTimeout(() => {
      ripples = ripples.filter(r => r.id !== ripple.id);
    }, 600);
  }

  function triggerHaptic() {
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function handleAction(config: ButtonConfig, event: MouseEvent | TouchEvent) {
    createRipple(event);
    triggerHaptic();
    dispatch(config.variant ?? primary.variant ?? 'primary');
  }

  function getButtonClasses(config: ButtonConfig) {
    const v = config.variant ?? 'primary';
    if (v === 'primary') return 'app-button app-button-primary';
    if (v === 'danger') return 'app-button bg-[var(--red)] text-white hover:bg-[var(--red-500)]';
    return 'app-button app-button-secondary';
  }
</script>

<div
  class:flex={direction === 'horizontal'}
  class:flex-col={direction === 'vertical'}
  class:gap-2={direction === 'horizontal'}
  class:gap-3={direction === 'vertical'}
>
  <!-- Primary Action -->
  <button
    on:click={(e) => handleAction(primary, e)}
    on:touchstart|preventDefault={(e) => handleAction(primary, e)}
    class="{getButtonClasses(primary)} ripple-button"
    aria-label={primary.label}
  >
    {#if primary.icon}
      <svelte:component this={primary.icon} size={16} class="flex-shrink-0" />
    {/if}
    <span class="whitespace-nowrap">{primary.label}</span>
    {#each ripples as ripple}
      <span
        in:scale={{ duration: 600 }}
        style="left: {ripple.x}px; top: {ripple.y}px; width: {ripple.size}px; height: {ripple.size}px;"
        class="pointer-events-none absolute rounded-full bg-white/20"
      ></span>
    {/each}
  </button>

  <!-- Secondary Action (optional) -->
  {#if secondary}
    <button
      on:click={(e) => handleAction(secondary, e)}
      on:touchstart|preventDefault={(e) => handleAction(secondary, e)}
      class="{getButtonClasses(secondary)} ripple-button"
      aria-label={secondary.label}
    >
      {#if secondary.icon}
        <svelte:component this={secondary.icon} size={16} class="flex-shrink-0" />
      {/if}
      <span class="whitespace-nowrap">{secondary.label}</span>
    </button>
  {/if}
</div>

<style>
  .ripple-button {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
</style>