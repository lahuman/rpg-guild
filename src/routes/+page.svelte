<script lang="ts">
  import { goto } from "$app/navigation";
  import { login } from "$lib/firebase";
  import { guildStore } from "$lib/stores/guildStore";
  import { userStore } from "$lib/stores/userStore";
  import { notify, notifyError } from "$lib";
  import {
    ArrowRight,
    Castle,
    Loader2,
    ScrollText,
    Shield,
    Sparkles,
    Swords,
    Users
  } from "lucide-svelte";

  let mode: "join" | "create" = "join";
  let inputCode = "";
  let inputName = "";
  let isProcessing = false;

  const features = [
    {
      icon: ScrollText,
      title: "Mission Control",
      body: "반복 업무와 이벤트 퀘스트를 하나의 보드에서 운영하고, 오늘의 완료 상태를 바로 파악합니다."
    },
    {
      icon: Users,
      title: "Roster HUD",
      body: "캐릭터, 직업, 성장, 상점 소비 흐름을 같은 화면 언어로 묶어 길드 운영의 맥락을 유지합니다."
    },
    {
      icon: Sparkles,
      title: "Reward Loop",
      body: "보상, 랜덤 박스, 등급전 같은 피드백 루프를 더해 운영을 플레이 경험으로 전환합니다."
    }
  ];

  $: if ($userStore && $userStore.guildId) {
    goto(`/guilds/${$userStore.guildId}`);
  }

  async function handleCreate() {
    if (!inputName.trim()) {
      notify("길드 이름을 입력해주세요.");
      return;
    }

    isProcessing = true;

    try {
      const newGuildId = await guildStore.createGuild(inputName.trim(), $userStore);
      notify("길드가 창설되었습니다.");
      goto(`/guilds/${newGuildId}`);
    } catch (error) {
      notifyError(error, "길드 생성에 실패했습니다.");
    } finally {
      isProcessing = false;
    }
  }

  async function handleJoin() {
    if (!inputCode.trim()) {
      notify("초대 코드를 입력해주세요.");
      return;
    }

    isProcessing = true;

    try {
      const guildId = await guildStore.joinGuild(inputCode.trim().toUpperCase(), $userStore);
      notify("길드에 가입되었습니다.");
      goto(`/guilds/${guildId}`);
    } catch (error) {
      notifyError(error, "길드 가입에 실패했습니다.");
    } finally {
      isProcessing = false;
    }
  }
</script>

<div class="page-wrap space-y-8 py-6 md:py-10">
  <section class="app-hero reveal-rise grid gap-6 overflow-hidden rounded-[2rem] px-5 py-6 md:px-10 md:py-10 lg:grid-cols-[1.2fr_0.8fr]">
    <div class="relative z-10">
      <div class="eyebrow">
        <Castle size={14} />
        Guild Campaign OS
      </div>

      <h1 class="section-title mt-5 max-w-3xl text-4xl leading-none text-white md:mt-6 md:text-7xl">
        길드 운영을
        <span class="block text-amber-300">게임처럼 설계합니다.</span>
      </h1>

      <p class="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:mt-6 md:text-lg">
        출석, 미션, 보상, 로그, 상점까지 길드의 운영 루프를 하나의 RPG HUD처럼 연결합니다.
        단순한 관리 화면이 아니라, 참여를 유도하는 운영 콘솔을 목표로 합니다.
      </p>

      <div class="stagger-grid mt-6 grid gap-3 md:mt-8 md:gap-4 md:grid-cols-3">
        <div class="app-hud">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Focus</div>
          <div class="mt-2 text-2xl font-bold text-white">Mission</div>
          <p class="mt-2 text-sm text-slate-400">반복 업무를 퀘스트 루프로 전환</p>
        </div>
        <div class="app-hud">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Economy</div>
          <div class="mt-2 text-2xl font-bold text-white">Reward</div>
          <p class="mt-2 text-sm text-slate-400">골드와 아이템으로 참여 동기 유지</p>
        </div>
        <div class="app-hud">
          <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Records</div>
          <div class="mt-2 text-2xl font-bold text-white">Logs</div>
          <p class="mt-2 text-sm text-slate-400">활동 이력을 날짜 단위로 축적</p>
        </div>
      </div>
    </div>

    <div class="relative z-10 space-y-5">
      <section class="app-panel rounded-[1.75rem] p-5 md:p-7">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Access</div>
            <h2 class="section-title mt-2 text-2xl text-white md:text-3xl">모험가 입장</h2>
            <p class="mt-2 text-sm leading-6 text-slate-400">
              구글 계정으로 로그인하고, 새 길드를 창설하거나 초대 코드로 합류하세요.
            </p>
          </div>
          <div class="rounded-2xl border border-amber-300/15 bg-amber-400/10 p-3 text-amber-300">
            <Shield size={22} />
          </div>
        </div>

        {#if $userStore === undefined}
          <div class="mt-8 flex flex-col items-center rounded-[1.4rem] border border-white/8 bg-slate-950/40 px-6 py-12 text-center">
            <Loader2 size={30} class="animate-spin text-cyan-300" />
            <div class="mt-4 text-lg font-semibold text-white">인증 상태 확인 중</div>
            <p class="mt-2 text-sm text-slate-400">길드 본부와 연결 상태를 동기화하고 있습니다.</p>
          </div>
        {:else}
          <button on:click={login} class="app-button app-button-primary mt-8 w-full text-base">
            <img src="https://www.google.com/favicon.ico" alt="Google" class="h-5 w-5 rounded-full" />
            구글 계정으로 시작
          </button>
        {/if}
      </section>

      <section class="app-card p-2">
        <div class="grid grid-cols-2 gap-2 rounded-[1.25rem] bg-slate-950/50 p-2">
          <button
            class={`app-button px-3 py-3 text-sm ${mode === "join" ? "bg-amber-400 text-slate-950" : "text-slate-400"}`}
            on:click={() => (mode = "join")}
          >
            길드 참가
          </button>
          <button
            class={`app-button px-3 py-3 text-sm ${mode === "create" ? "bg-cyan-300 text-slate-950" : "text-slate-400"}`}
            on:click={() => (mode = "create")}
          >
            길드 생성
          </button>
        </div>

        <div class="rounded-[1.4rem] px-4 py-5 md:px-6 md:py-6">
          {#if mode === "join"}
            <div class="mb-5">
              <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Invite</div>
              <h3 class="mt-2 text-xl font-semibold text-white md:text-2xl">초대 코드로 합류</h3>
            </div>

            <input
              bind:value={inputCode}
              placeholder="예: X7Z9A1"
              class="app-input text-center text-xl font-black tracking-[0.28em] uppercase md:text-2xl md:tracking-[0.4em]"
            />

            <button on:click={handleJoin} disabled={isProcessing} class="app-button app-button-primary mt-5 w-full">
              <ArrowRight size={18} />
              {isProcessing ? "처리 중..." : "길드 입장"}
            </button>
          {:else}
            <div class="mb-5">
              <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Create</div>
              <h3 class="mt-2 text-xl font-semibold text-white md:text-2xl">새 길드 창설</h3>
            </div>

            <input
              bind:value={inputName}
              placeholder="예: 전설의 용사들"
              class="app-input text-center text-lg font-semibold"
            />

            <button
              on:click={handleCreate}
              disabled={isProcessing}
              class="app-button app-button-secondary mt-5 w-full border-cyan-300/20 bg-cyan-300/12 text-cyan-100"
            >
              <Swords size={18} />
              {isProcessing ? "생성 중..." : "길드 만들기"}
            </button>
          {/if}
        </div>
      </section>
    </div>
  </section>

  <section class="reveal-rise" style="animation-delay: 120ms">
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <div class="text-sm uppercase tracking-[0.18em] text-slate-500">System</div>
        <h2 class="section-title mt-2 text-3xl text-white">핵심 운영 구조</h2>
      </div>
      <div class="hidden text-sm text-slate-500 md:block">RPG UX + Guild Workflow</div>
    </div>

    <div class="stagger-grid grid gap-5 md:grid-cols-3">
      {#each features as feature}
        <article class="app-card p-6">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-amber-300">
            <svelte:component this={feature.icon} size={22} />
          </div>
          <h3 class="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
          <p class="mt-3 text-sm leading-6 text-slate-400">{feature.body}</p>
        </article>
      {/each}
    </div>
  </section>
</div>
