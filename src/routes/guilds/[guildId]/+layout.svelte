<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { ClipboardList, LayoutGrid, ScrollText, Shield, Users } from "lucide-svelte";
  import { requireRouteParam } from "$lib";
  import { userStore } from "$lib/stores/userStore";

  const navItems = [
    { href: "", label: "허브", icon: LayoutGrid },
    { href: "/members", label: "멤버", icon: Users },
    { href: "/missions", label: "미션", icon: ClipboardList },
    { href: "/logs", label: "로그", icon: ScrollText }
  ];

  onMount(() => {
    const unsubscribe = userStore.subscribe((user) => {
      if (user === null) {
        goto("/", { replaceState: true });
      }
    });

    return () => unsubscribe();
  });

  $: guildId = requireRouteParam($page.params.guildId, "guildId");
  $: pathname = $page.url.pathname;
</script>

<div class="page-wrap">
  <section class="app-workspace reveal-rise mb-5 px-4 py-5 md:mb-6 md:px-6">
    <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div>
        <div class="eyebrow">Guild Command</div>
        <h2 class="section-title mt-3 text-2xl text-white md:text-3xl">길드 운영 대시보드</h2>
        <p class="mt-2 text-sm text-slate-400 md:text-base">
          길드 정보, 멤버 운영, 미션 흐름을 전술형 커맨드 워크스페이스로 정리했습니다.
        </p>
      </div>

      <nav class="guild-tabs -mx-1 flex flex-nowrap gap-2 px-1 md:mx-0 md:flex-wrap md:px-0" aria-label="Guild sections">
        {#each navItems as item}
          <a
            href={`/guilds/${guildId}${item.href}`}
            class:active={pathname === `/guilds/${guildId}${item.href}`}
          >
            <svelte:component this={item.icon} size={16} />
            {item.label}
          </a>
        {/each}
      </nav>
    </div>

    <div class="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
      <Shield size={14} class="text-cyan-300" />
      Tactical workspace ready
    </div>
  </section>

  <slot />
</div>
