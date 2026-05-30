<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onDestroy } from 'svelte';
  import { X } from 'lucide-svelte';
  import { lockBodyScroll } from '$lib';

  export let open: boolean = true;
  export let title: string = '';
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let subtitle: string = '';
  export let showCloseButton: boolean = true;

  const dispatch = createEventDispatcher();

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  let releaseBodyScrollLock: (() => void) | null = null;

  $: {
    if (open && !releaseBodyScrollLock) {
      releaseBodyScrollLock = lockBodyScroll();
    } else if (!open && releaseBodyScrollLock) {
      releaseBodyScrollLock();
      releaseBodyScrollLock = null;
    }
  }

  onDestroy(() => {
    releaseBodyScrollLock?.();
  });

  function handleClose() {
    dispatch('close');
  }
</script>

{#if open}
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--black)]/40 p-3 sm:p-4 py-3 sm:items-center sm:py-4"
  on:click|self={handleClose}
>
  <div class="app-modal app-modal-scroll w-full {sizeClasses[size]} overflow-x-hidden overflow-y-auto">
    {#if title || showCloseButton}
      <div class="flex items-center justify-between border-b border-[var(--grey-300)] px-5 py-4 sm:px-6 sm:py-5">
        <div>
          {#if title}
            <h3 class="text-2xl font-semibold text-[var(--black)]">{title}</h3>
          {/if}
          {#if subtitle}
            <p class="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p>
          {/if}
        </div>
        {#if showCloseButton}
          <button
            on:click={handleClose}
            class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--grey-100)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--grey-300)] hover:text-[var(--black)] sm:h-8 sm:w-8"
            aria-label="Close modal"
          >
            <X size={18} class="sm:w-4 sm:h-4" />
          </button>
        {/if}
      </div>
    {/if}

    <div class="px-5 py-5 sm:px-6 sm:py-6">
      <slot />
    </div>
  </div>
</div>
{/if}
