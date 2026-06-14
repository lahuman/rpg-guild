<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { quintOut } from "svelte/easing";
  import { fade, scale } from "svelte/transition";
  import { formatGold } from "$lib";
  import {
    getRewardChestPresentation,
    type RewardChestResult,
    type RewardChestTap,
    type RewardChestTier
  } from "$lib/features/missions/rewardChest";

  export let result: RewardChestResult;

  const dispatch = createEventDispatcher();

  let activeResult: RewardChestResult | null = null;
  let tapIndex = 0;
  let displayedTier: RewardChestTier | null = null;
  let lastTap: RewardChestTap | null = null;
  let revealReward = false;
  let isResolving = false;
  let tapEffectId = 0;
  let revealTimer: ReturnType<typeof setTimeout> | null = null;

  $: if (result !== activeResult) {
    resetChest();
  }

  $: currentTier = displayedTier ?? result.tier;
  $: totalTaps = result.taps.length;
  $: progressLabel = `${Math.min(tapIndex, totalTaps)}/${totalTaps}`;
  $: feedbackText = lastTap ? (lastTap.upgraded ? "등급 상승!" : "등급 유지") : "READY";
  $: tierClass = `tier-${currentTier.key}`;
  $: chestPresentation = getRewardChestPresentation(currentTier);

  onDestroy(() => {
    if (revealTimer) clearTimeout(revealTimer);
  });

  function resetChest() {
    if (revealTimer) clearTimeout(revealTimer);
    activeResult = result;
    tapIndex = 0;
    displayedTier = result.taps[0]?.fromTier ?? result.tier;
    lastTap = null;
    revealReward = false;
    isResolving = false;
    tapEffectId = 0;
    revealTimer = null;
  }

  function handleTap() {
    if (revealReward || isResolving) return;

    const tap = result.taps[tapIndex];
    if (!tap) {
      revealReward = true;
      displayedTier = result.tier;
      return;
    }

    lastTap = tap;
    displayedTier = tap.toTier;
    tapEffectId += 1;
    tapIndex += 1;

    if (tapIndex >= result.taps.length) {
      isResolving = true;
      revealTimer = setTimeout(() => {
        displayedTier = result.tier;
        revealReward = true;
        isResolving = false;
        revealTimer = null;
      }, 520);
    }
  }

  function close() {
    dispatch("close");
  }
</script>

<div
  class="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[var(--black)]/40 p-3 md:p-4"
  transition:fade={{ duration: 240 }}
>
  <div class="relative w-full max-w-md text-center">
    <div class="reward-chest app-card rounded-[2rem] px-5 py-8 md:px-6 md:py-10 {tierClass}">
      {#if !revealReward}
        <div class="app-label">Reward Chest</div>
        <div class="mt-3 flex items-center justify-center gap-2">
          {#each result.taps as tap, index}
            <span
              class:active-step={index < tapIndex}
              class="chest-step"
              aria-label={`tap ${index + 1}`}
            ></span>
          {/each}
        </div>

        <button
          type="button"
          class="chest-button mt-5 select-none bg-transparent {chestPresentation.chestClass}"
          on:click={handleTap}
          disabled={isResolving}
          aria-label="보상 상자 열기"
          in:scale={{ duration: 420, start: 0.86, easing: quintOut }}
        >
          <span class="chest-aura"></span>
          {#each Array(chestPresentation.sparkleCount) as _, sparkleIndex}
            <span class={`chest-sparkle sparkle-${sparkleIndex + 1}`} aria-hidden="true"></span>
          {/each}

          {#key tapEffectId}
            <span
              class="treasure-chest"
              class:tap-impact={tapEffectId > 0}
              class:upgrade-impact={lastTap?.upgraded}
              aria-hidden="true"
            >
              <span class="chest-shadow"></span>
              <span class="chest-lid">
                {#if chestPresentation.ornamentLevel >= 4}
                  <span class="chest-crown"></span>
                {/if}
                <span class="chest-lid-shine"></span>
                <span class="chest-metal-band chest-metal-band-left"></span>
                <span class="chest-metal-band chest-metal-band-right"></span>
              </span>
              <span class="chest-base">
                {#if chestPresentation.ornamentLevel >= 2}
                  <span class="chest-rivet chest-rivet-left"></span>
                  <span class="chest-rivet chest-rivet-right"></span>
                {/if}
                {#if chestPresentation.ornamentLevel >= 3}
                  <span class="chest-gem chest-gem-left"></span>
                  <span class="chest-gem chest-gem-right"></span>
                {/if}
                {#if chestPresentation.ornamentLevel >= 5}
                  <span class="chest-wing chest-wing-left"></span>
                  <span class="chest-wing chest-wing-right"></span>
                {/if}
                <span class="chest-lock"></span>
              </span>
            </span>
          {/key}
        </button>

        <div class="mt-5">
          <div class="text-sm font-bold tracking-normal text-[var(--text-secondary)]">{progressLabel}</div>
          <h2 class="mt-2 text-3xl font-black">{currentTier.icon} {currentTier.label}</h2>
          <p class:upgrade-flash={lastTap?.upgraded} class="mt-2 text-base font-semibold">{feedbackText}</p>
        </div>
      {:else}
        <div class="flex flex-col items-center" in:scale={{ duration: 300, start: 0.8, easing: quintOut }}>
          <div class="result-coin text-[7rem]">💰</div>
          <div class="app-label mt-2">{result.tier.icon} {result.tier.label}</div>
          <h2 class="pop-in-text mt-2 text-3xl font-black">BONUS</h2>
          <div class="pop-in-text-delayed mt-3 text-5xl font-black">
            +{formatGold(result.bonusGold)}
          </div>
          <button on:click={close} class="app-button app-button-primary mt-8 px-8 py-3">
            확인
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .reward-chest {
    position: relative;
    overflow: hidden;
  }

  .reward-chest::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.18;
    background:
      radial-gradient(circle at 50% 0%, var(--tier-glow), transparent 42%),
      linear-gradient(135deg, transparent 0%, var(--tier-soft) 100%);
    pointer-events: none;
  }

  .reward-chest > :global(*) {
    position: relative;
    z-index: 1;
  }

  .tier-rare {
    --tier-glow: #1a73e8;
    --tier-soft: #d2e3fc;
    --chest-main: #4d7fe8;
    --chest-lid: #76a7fa;
    --chest-dark: #2456b8;
    --chest-metal: #d8e2f2;
    --chest-metal-dark: #8aa0bd;
    --chest-gem: #1a73e8;
  }

  .tier-superRare {
    --tier-glow: #00acc1;
    --tier-soft: #b2ebf2;
    --chest-main: #00a5bf;
    --chest-lid: #36d3df;
    --chest-dark: #007187;
    --chest-metal: #d9f4f6;
    --chest-metal-dark: #4fa5b2;
    --chest-gem: #00e5ff;
  }

  .tier-epic {
    --tier-glow: #7e57c2;
    --tier-soft: #d1c4e9;
    --chest-main: #7650c4;
    --chest-lid: #a47ce9;
    --chest-dark: #4d2f91;
    --chest-metal: #eadfff;
    --chest-metal-dark: #8b69cc;
    --chest-gem: #c084fc;
  }

  .tier-mythic {
    --tier-glow: #d81b60;
    --tier-soft: #f8bbd0;
    --chest-main: #c2185b;
    --chest-lid: #f06292;
    --chest-dark: #8c123f;
    --chest-metal: #ffe0ec;
    --chest-metal-dark: #d84f7f;
    --chest-gem: #ff80ab;
  }

  .tier-legendary {
    --tier-glow: #f9ab00;
    --tier-soft: #fde293;
    --chest-main: #d99000;
    --chest-lid: #ffc947;
    --chest-dark: #9a6500;
    --chest-metal: #fff3c4;
    --chest-metal-dark: #e1a700;
    --chest-gem: #fff176;
  }

  .chest-step {
    width: 2rem;
    height: 0.45rem;
    border-radius: 999px;
    background: var(--grey-300);
    transition: background 180ms ease, transform 180ms ease;
  }

  .chest-step.active-step {
    background: var(--tier-glow);
    transform: translateY(-1px);
  }

  .chest-button {
    position: relative;
    display: grid;
    place-items: center;
    width: 9.5rem;
    height: 9.5rem;
    margin-inline: auto;
    cursor: pointer;
    isolation: isolate;
  }

  .chest-button:disabled {
    cursor: default;
  }

  .chest-aura {
    position: absolute;
    inset: 0.5rem;
    border-radius: 999px;
    background: var(--tier-glow);
    opacity: 0.16;
    animation: pulse-aura 860ms ease-in-out infinite;
  }

  .treasure-chest {
    position: relative;
    display: block;
    width: 8.4rem;
    height: 7rem;
    transform-origin: 50% 78%;
    animation: chest-idle 1.8s ease-in-out infinite;
    filter: drop-shadow(0 1rem 1.2rem rgba(0, 0, 0, 0.2));
    z-index: 2;
  }

  .treasure-chest.tap-impact {
    animation: chest-tap 360ms cubic-bezier(0.2, 0.9, 0.2, 1.2), chest-idle 1.8s ease-in-out 360ms infinite;
  }

  .treasure-chest.upgrade-impact::after {
    content: "";
    position: absolute;
    inset: -0.8rem;
    border-radius: 999px;
    border: 2px solid var(--tier-glow);
    opacity: 0;
    animation: upgrade-ring 520ms ease-out;
  }

  .chest-shadow {
    position: absolute;
    left: 1.1rem;
    right: 1.1rem;
    bottom: 0.2rem;
    height: 0.75rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.22);
    filter: blur(5px);
  }

  .chest-lid,
  .chest-base {
    position: absolute;
    left: 0.55rem;
    right: 0.55rem;
    border: 0.16rem solid var(--chest-dark);
    box-shadow: inset 0 -0.5rem 0 rgba(0, 0, 0, 0.13);
  }

  .chest-lid {
    top: 0.8rem;
    height: 3rem;
    border-radius: 1.35rem 1.35rem 0.42rem 0.42rem;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.52), transparent 30%),
      linear-gradient(180deg, var(--chest-lid), var(--chest-main));
    overflow: visible;
  }

  .chest-lid::after {
    content: "";
    position: absolute;
    left: -0.16rem;
    right: -0.16rem;
    bottom: -0.24rem;
    height: 0.62rem;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--chest-metal-dark), var(--chest-metal), var(--chest-metal-dark));
    border: 0.12rem solid var(--chest-dark);
  }

  .chest-lid-shine {
    position: absolute;
    left: 1.1rem;
    top: 0.6rem;
    width: 3.4rem;
    height: 0.55rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.42);
    transform: rotate(-8deg);
  }

  .chest-base {
    top: 3.3rem;
    height: 2.9rem;
    border-radius: 0.45rem 0.45rem 1rem 1rem;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.25), transparent 32%),
      linear-gradient(180deg, var(--chest-main), var(--chest-dark));
  }

  .chest-base::before {
    content: "";
    position: absolute;
    left: 50%;
    top: -0.08rem;
    bottom: -0.16rem;
    width: 1.1rem;
    transform: translateX(-50%);
    border-radius: 0.2rem 0.2rem 0.55rem 0.55rem;
    background: linear-gradient(180deg, var(--chest-metal), var(--chest-metal-dark));
    border: 0.1rem solid var(--chest-dark);
  }

  .chest-metal-band {
    position: absolute;
    top: -0.14rem;
    bottom: -0.16rem;
    width: 0.68rem;
    border-radius: 999px;
    background: linear-gradient(180deg, var(--chest-metal), var(--chest-metal-dark));
    border: 0.08rem solid var(--chest-dark);
  }

  .chest-metal-band-left {
    left: 1.15rem;
  }

  .chest-metal-band-right {
    right: 1.15rem;
  }

  .chest-lock {
    position: absolute;
    left: 50%;
    top: 0.82rem;
    width: 1.45rem;
    height: 1.55rem;
    transform: translateX(-50%);
    border-radius: 0.38rem 0.38rem 0.5rem 0.5rem;
    background:
      radial-gradient(circle at 50% 55%, var(--chest-dark) 0 0.15rem, transparent 0.16rem),
      linear-gradient(180deg, var(--chest-gem), var(--tier-glow));
    border: 0.12rem solid var(--chest-dark);
    box-shadow: 0 0 0.9rem rgba(255, 255, 255, 0.45);
  }

  .chest-rivet {
    position: absolute;
    top: 0.7rem;
    width: 0.46rem;
    height: 0.46rem;
    border-radius: 999px;
    background: var(--chest-metal);
    border: 0.08rem solid var(--chest-dark);
  }

  .chest-rivet-left {
    left: 0.95rem;
  }

  .chest-rivet-right {
    right: 0.95rem;
  }

  .chest-gem {
    position: absolute;
    top: 1.42rem;
    width: 0.72rem;
    height: 0.72rem;
    transform: rotate(45deg);
    border-radius: 0.18rem;
    background: linear-gradient(135deg, #ffffff, var(--chest-gem) 42%, var(--tier-glow));
    border: 0.08rem solid var(--chest-dark);
    box-shadow: 0 0 0.8rem var(--tier-glow);
  }

  .chest-gem-left {
    left: 1.85rem;
  }

  .chest-gem-right {
    right: 1.85rem;
  }

  .chest-crown {
    position: absolute;
    left: 50%;
    top: -1rem;
    width: 2.4rem;
    height: 1.08rem;
    transform: translateX(-50%);
    background:
      linear-gradient(135deg, transparent 0 20%, var(--chest-metal) 21% 34%, transparent 35% 42%, var(--chest-metal) 43% 58%, transparent 59% 66%, var(--chest-metal) 67% 80%, transparent 81%),
      linear-gradient(180deg, var(--chest-metal), var(--chest-metal-dark));
    clip-path: polygon(0 100%, 14% 26%, 30% 100%, 50% 0, 70% 100%, 86% 26%, 100% 100%);
    filter: drop-shadow(0 0 0.45rem var(--tier-glow));
  }

  .chest-wing {
    position: absolute;
    top: 0.45rem;
    width: 1.45rem;
    height: 1.9rem;
    background: linear-gradient(160deg, var(--chest-metal), rgba(255, 255, 255, 0.2));
    opacity: 0.9;
    clip-path: polygon(50% 0, 100% 30%, 76% 42%, 100% 56%, 68% 66%, 84% 82%, 0 100%, 20% 50%);
    filter: drop-shadow(0 0 0.4rem var(--tier-glow));
  }

  .chest-wing-left {
    left: -1.05rem;
    transform: rotate(-18deg) scaleX(-1);
  }

  .chest-wing-right {
    right: -1.05rem;
    transform: rotate(18deg);
  }

  .chest-sparkle {
    position: absolute;
    width: 0.58rem;
    height: 0.58rem;
    background: var(--tier-glow);
    clip-path: polygon(50% 0, 61% 38%, 100% 50%, 61% 62%, 50% 100%, 39% 62%, 0 50%, 39% 38%);
    opacity: 0.82;
    z-index: 3;
    animation: sparkle-float 1.4s ease-in-out infinite;
  }

  .sparkle-1 {
    left: 0.4rem;
    top: 2rem;
  }

  .sparkle-2 {
    right: 0.35rem;
    top: 1.35rem;
    animation-delay: 160ms;
  }

  .sparkle-3 {
    right: 1.05rem;
    bottom: 1.4rem;
    animation-delay: 320ms;
  }

  .sparkle-4 {
    left: 1rem;
    bottom: 1.15rem;
    animation-delay: 480ms;
  }

  .chest-tier-legendary .treasure-chest {
    filter: drop-shadow(0 1rem 1.3rem rgba(0, 0, 0, 0.24)) drop-shadow(0 0 1.1rem var(--tier-glow));
  }

  .upgrade-flash {
    color: var(--tier-glow);
    animation: pop-in 260ms ease-out;
  }

  .result-coin {
    animation: bounce-short 0.5s ease-out 1;
  }

  .pop-in-text {
    animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  .pop-in-text-delayed {
    opacity: 0;
    animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.18s forwards;
  }

  @keyframes pulse-aura {
    0%, 100% { transform: scale(0.88); opacity: 0.12; }
    50% { transform: scale(1); opacity: 0.22; }
  }

  @keyframes chest-idle {
    0%, 100% { transform: translateY(0) rotate(-0.5deg); }
    50% { transform: translateY(-0.35rem) rotate(0.5deg); }
  }

  @keyframes chest-tap {
    0% { transform: translateY(0) scale(1) rotate(0deg); }
    35% { transform: translateY(0.42rem) scale(0.95, 1.05) rotate(-2deg); }
    68% { transform: translateY(-0.38rem) scale(1.08, 0.95) rotate(2deg); }
    100% { transform: translateY(0) scale(1) rotate(0deg); }
  }

  @keyframes upgrade-ring {
    0% { transform: scale(0.45); opacity: 0.72; }
    100% { transform: scale(1.25); opacity: 0; }
  }

  @keyframes sparkle-float {
    0%, 100% { transform: translateY(0) scale(0.82) rotate(0deg); opacity: 0.45; }
    50% { transform: translateY(-0.55rem) scale(1.08) rotate(45deg); opacity: 1; }
  }

  @keyframes bounce-short {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }

  @keyframes pop-in {
    0% { opacity: 0; transform: scale(0.5); }
    70% { transform: scale(1.15); }
    100% { opacity: 1; transform: scale(1); }
  }
</style>
