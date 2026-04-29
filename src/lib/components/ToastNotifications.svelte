<script lang="ts">
  import { fly } from 'svelte/transition';
  import { toastStore, type Toast } from '$lib/stores/toastStore';
  import { CheckCircle2, XCircle, Info, X } from 'lucide-svelte';

  $: toasts = $toastStore;

  function getIcon(type: Toast['type']) {
    if (type === 'success') return CheckCircle2;
    if (type === 'error')   return XCircle;
    return Info;
  }

  const colorMap: Record<NonNullable<Toast['type']>, { accent: string }> = {
    success: { accent: 'app-toast-success' },
    error:   { accent: 'app-toast-error'   },
    info:    { accent: 'app-toast-info'    },
  };
</script>

<div class="fixed top-5 right-5 z-[100] flex max-w-md flex-col gap-3 sm:top-6 sm:right-6">
  {#each toasts as toast (toast.id)}
    <div
      class="app-toast {colorMap[toast.type].accent}"
      transition:fly={{ x: 320, duration: 250 }}
    >
      <div class="flex items-start gap-3">
        <svelte:component this={getIcon(toast.type)} size={16} class="mt-0.5 shrink-0 text-[var(--black)]" />
        <p class="min-w-0 flex-1 text-sm font-medium text-[var(--black)] leading-5">
          {toast.message}
        </p>
        <button
          on:click={() => toastStore.remove(toast.id)}
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:text-[var(--black)] hover:bg-[var(--grey-100)]"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  {/each}
</div>