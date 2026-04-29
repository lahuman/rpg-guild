<script lang="ts">
  import { page } from "$app/stores";
  import { createEventDispatcher } from "svelte";
  import { scale } from "svelte/transition";

  const dispatch = createEventDispatcher();

  type Section = { id: string; label: string; icon: any; href: string };
  export let sections: Section[] = [];

  $: pathname = $page.url.pathname;
  $: activeSection = sections.find(s => pathname.includes(s.href)) || sections[0];

  function handleNavigate(section: Section) {
    dispatch("navigate", section);
  }

  function handleSwipe(left: boolean) {
    const currentIndex = sections.findIndex(s => s.id === activeSection.id);
    const nextIndex = left ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < sections.length) {
      handleNavigate(sections[nextIndex]);
    }
  }

  let touchStartX = 0;
  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0].screenX;
  }

  function handleTouchEnd(e: TouchEvent) {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 48) handleSwipe(diff > 0);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="mobile-nav"
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
  role="navigation"
  aria-label="Mobile navigation"
>
  <div class="flex items-center justify-around py-2">
    {#each sections as section}
      {@const isActive = section.id === activeSection.id}
      <button
        on:click={() => handleNavigate(section)}
        class="app-nav-item relative"
        class:active={isActive}
        aria-current={isActive ? "page" : undefined}
      >
        {#if isActive}
          <div
            in:scale={{ duration: 200 }}
            class="app-nav-indicator mb-1"
          ></div>
        {:else}
          <div class="mb-1 h-1" style="width: 24px"></div>
        {/if}

        <div class="app-nav-icon" class:active-icon={isActive}>
          <svelte:component this={section.icon} size={18} />
        </div>

        <span class="app-nav-label" class:active-label={isActive}>
          {section.label}
        </span>
      </button>
    {/each}
  </div>

  <div class="h-2"></div>
  <div class="h-2"></div>
</div>

<style>
  .mobile-nav {
    touch-action: manipulation;
  }
</style>