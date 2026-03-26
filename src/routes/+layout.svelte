<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import { auth } from "$lib/firebase";
  import { userStore } from "$lib/stores/userStore";
  import { Crown, LogOut, Shield, Sparkles, Swords } from "lucide-svelte";

  function logout() {
    auth.signOut();
  }

  $: isGuildRoute = $page.url.pathname.startsWith("/guilds/");
</script>

<div class="app-shell">
  <header class="app-topbar sticky top-0 z-40">
    <div class="page-wrap app-topbar-inner flex items-center justify-between gap-3 px-2 py-3 sm:gap-4 sm:px-3 sm:py-4">
      <a href="/" class="flex min-w-0 items-center gap-3">
        <div class="app-topbar-mark">
          <Crown size={20} />
        </div>
        <div class="min-w-0">
          <div class="section-title truncate text-base font-semibold text-white sm:text-lg">RPG Guild</div>
          <div class="hidden truncate text-xs tracking-[0.18em] text-slate-400 uppercase sm:block">Guild Operations Console</div>
        </div>
      </a>

      <div class="flex shrink-0 items-center gap-2 sm:gap-3">
        {#if $userStore}
          <div class="app-user-chip hidden items-center gap-3 md:flex">
            {#if $userStore.photoURL}
              <img
                src={$userStore.photoURL}
                alt={$userStore.displayName || "user"}
                class="h-9 w-9 rounded-full border border-white/10 object-cover"
              />
            {:else}
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/15 text-amber-200">
                <Shield size={16} />
              </div>
            {/if}

            <div class="leading-tight">
              <div class="max-w-48 truncate text-sm font-semibold text-white">
                {$userStore.displayName || "Unknown Adventurer"}
              </div>
              <div class="max-w-48 truncate text-xs text-slate-400">
                {$userStore.email}
              </div>
            </div>
          </div>

          <button on:click={logout} class="app-button app-button-secondary px-3 py-2 text-sm sm:px-4">
            <LogOut size={16} />
            <span class="hidden sm:inline">로그아웃</span>
          </button>
        {:else if $userStore === undefined}
          <div class="app-user-chip hidden items-center gap-2 text-sm text-slate-300 md:flex">
            <Sparkles size={15} class="text-cyan-300" />
            인증 상태 확인 중
          </div>
        {:else if !isGuildRoute}
          <div class="app-user-chip hidden items-center gap-2 text-sm text-slate-300 md:flex">
            <Swords size={15} class="text-amber-300" />
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
