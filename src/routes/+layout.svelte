<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import { auth } from "$lib/firebase";
  import { userStore } from "$lib/stores/userStore";
  import { Crown, LogOut, Shield, ScrollText } from "lucide-svelte";

  function logout() { auth.signOut(); }

  $: isGuildRoute = $page.url.pathname.startsWith("/guilds/");
</script>

<div class="app-shell">
  <!-- Nike Sticky Navigation Bar -->
  <header class="app-topbar">
    <div class="page-wrap app-topbar-inner flex justify-between items-center w-full">
      <!-- Logo -->
      <a href="/" class="flex min-w-0 items-center gap-3 no-underline">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--grey-300)] bg-[var(--grey-100)] text-[var(--black)]">
          <Crown size={18} />
        </div>
        <div class="min-w-0">
          <div class="section-title truncate text-base font-semibold text-[var(--black)] sm:text-lg">RPG GUILD</div>
          <div class="hidden truncate text-xs tracking-[0.12em] text-[var(--text-secondary)] uppercase sm:block">Guild Operations</div>
        </div>
      </a>

      <!-- Right controls -->
      <div class="flex shrink-0 items-center gap-3">
        {#if $userStore}
          <!-- User chip -->
          <div class="hidden items-center gap-3 rounded-full border border-[var(--grey-300)] bg-[var(--grey-100)] px-4 py-2 md:flex">
            {#if $userStore.photoURL}
              <img
                src={$userStore.photoURL}
                alt={$userStore.displayName || "user"}
                class="h-8 w-8 rounded-full border border-[var(--grey-300)] object-cover"
              />
            {:else}
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--grey-800)] text-white">
                <Shield size={14} />
              </div>
            {/if}
            <div class="leading-tight">
              <div class="max-w-48 truncate text-sm font-medium text-[var(--black)]">
                {$userStore.displayName || "Unknown Adventurer"}
              </div>
              <div class="max-w-48 truncate text-xs text-[var(--text-secondary)]">
                {$userStore.email}
              </div>
            </div>
          </div>

          <!-- Logout button -->
          <button on:click={logout} class="app-button app-button-secondary" style="padding: 10px 20px;">
            <LogOut size={15} />
            <span class="hidden sm:inline">로그아웃</span>
          </button>

        {:else if $userStore === undefined}
          <div class="hidden items-center gap-2 rounded-full border border-[var(--grey-300)] bg-[var(--grey-100)] px-4 py-2 text-sm text-[var(--text-secondary)] md:flex">
            <ScrollText size={14} />
            인증 상태 확인 중
          </div>

        {:else if !isGuildRoute}
          <div class="hidden items-center gap-2 rounded-full border border-[var(--grey-300)] bg-[var(--grey-100)] px-4 py-2 text-sm text-[var(--text-secondary)] md:flex">
            <ScrollText size={14} />
            게스트 모드
          </div>
        {/if}
      </div>
    </div>
  </header>

  <main class="pb-10 pt-6">
    <slot />
  </main>
</div>
