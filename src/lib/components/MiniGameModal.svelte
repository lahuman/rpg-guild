<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Sparkles, Trophy, X } from "lucide-svelte";
  import { guildStore } from "$lib/stores/guildStore";

  export let guildId: string;
  export let characterId: string;
  export let characterName: string;

  type GameType = "rps" | "box" | "highlow";

  const dispatch = createEventDispatcher();
  const games = [
    { id: "rps", name: "가위바위보", desc: "몬스터와 1:1로 대결해 승급을 노립니다.", icon: "✊" },
    { id: "box", name: "운명의 상자", desc: "3개의 상자 중 운명이 담긴 하나를 선택합니다.", icon: "🎁" },
    { id: "highlow", name: "숫자 높낮이", desc: "다음 숫자가 높을지 낮을지 예측합니다.", icon: "🔢" }
  ] as const;

  let currentGame: GameType | null = null;
  let gameStep: "intro" | "playing" | "result" = "intro";
  let gameResult: "up" | "down" | "stay" = "stay";
  let resultMessage = "";
  let isSubmitting = false;

  let userChoice = "";
  let cpuChoice = "";
  let currentNum = 0;

  function selectGame(id: GameType) {
    currentGame = id;
    gameStep = "playing";
    initGame();
  }

  function initGame() {
    userChoice = "";
    cpuChoice = "";

    if (currentGame === "highlow") {
      currentNum = Math.floor(Math.random() * 10) + 1;
    }
  }

  function playRPS(choice: string) {
    const options = ["가위", "바위", "보"];
    userChoice = choice;
    cpuChoice = options[Math.floor(Math.random() * 3)];

    if (userChoice === cpuChoice) {
      gameResult = "stay";
      resultMessage = `비겼습니다. (${userChoice} vs ${cpuChoice})`;
    } else if (
      (userChoice === "가위" && cpuChoice === "보") ||
      (userChoice === "바위" && cpuChoice === "가위") ||
      (userChoice === "보" && cpuChoice === "바위")
    ) {
      gameResult = "up";
      resultMessage = `승리했습니다. 등급이 상승합니다. (${userChoice} vs ${cpuChoice})`;
    } else {
      gameResult = "down";
      resultMessage = `패배했습니다. 등급이 하락합니다. (${userChoice} vs ${cpuChoice})`;
    }

    gameStep = "result";
  }

  function openBox(index: number) {
    const outcomes: Array<"up" | "down" | "stay"> = ["up", "down", "stay"];
    const shuffled = [...outcomes].sort(() => Math.random() - 0.5);
    gameResult = shuffled[index];

    if (gameResult === "up") resultMessage = "축하합니다. 황금 등급권을 찾았습니다.";
    else if (gameResult === "down") resultMessage = "저주받은 상자였습니다.";
    else resultMessage = "빈 상자였습니다. 등급이 유지됩니다.";

    gameStep = "result";
  }

  function playHighLow(guess: "high" | "low") {
    const nextNum = Math.floor(Math.random() * 10) + 1;
    const isCorrect = guess === "high" ? nextNum > currentNum : nextNum < currentNum;

    if (nextNum === currentNum) {
      gameResult = "stay";
      resultMessage = `숫자가 같습니다 (${nextNum}). 등급이 유지됩니다.`;
    } else if (isCorrect) {
      gameResult = "up";
      resultMessage = `정답입니다. 다음 숫자는 ${nextNum}였습니다.`;
    } else {
      gameResult = "down";
      resultMessage = `틀렸습니다. 다음 숫자는 ${nextNum}였습니다.`;
    }

    gameStep = "result";
  }

  async function finishGame() {
    if (isSubmitting) return;
    isSubmitting = true;

    try {
      await guildStore.updateGrade(guildId, characterId, gameResult);
      dispatch("close");
    } catch (error) {
      alert(error instanceof Error ? error.message : "등급전 결과를 저장하지 못했습니다.");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
  <div class="app-modal w-full max-w-xl overflow-hidden">
    <div class="flex items-center justify-between border-b border-white/8 px-6 py-5">
      <div>
        <div class="text-sm uppercase tracking-[0.18em] text-slate-500">Grade Match</div>
        <h3 class="mt-2 text-2xl font-semibold text-white">{characterName}의 등급전</h3>
      </div>
      <button on:click={() => dispatch("close")} class="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white">
        <X size={16} />
      </button>
    </div>

    <div class="px-6 py-6">
      {#if gameStep === "intro"}
        <div class="mb-6 rounded-[1.5rem] border border-white/10 bg-white/4 px-5 py-4">
          <div class="flex items-center gap-2 text-white">
            <Trophy size={18} class="text-amber-300" />
            <span class="font-semibold">오늘의 운을 시험해 등급을 높이세요.</span>
          </div>
          <p class="mt-2 text-sm leading-6 text-slate-400">패배 시 등급이 하락할 수 있습니다.</p>
        </div>

        <div class="grid gap-3">
          {#each games as game}
            <button
              on:click={() => selectGame(game.id)}
              class="app-action-tile p-4 text-left"
            >
              <div class="flex items-center gap-4">
                <div class="float-gentle flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-slate-950/40 text-3xl">
                  {game.icon}
                </div>
                <div>
                  <div class="font-semibold text-white">{game.name}</div>
                  <div class="mt-1 text-sm text-slate-400">{game.desc}</div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {:else if gameStep === "playing"}
        {#if currentGame === "rps"}
          <div class="py-4 text-center">
            <div class="mb-6 text-slate-400">상대 몬스터와 대결합니다.</div>
            <div class="mb-8 text-6xl">👾</div>
            <div class="grid grid-cols-3 gap-3">
              {#each ["가위", "바위", "보"] as item}
                <button
                  on:click={() => playRPS(item)}
                  class="app-action-tile p-4 text-white"
                >
                  <div class="text-3xl">{item === "가위" ? "✌️" : item === "바위" ? "✊" : "✋"}</div>
                  <div class="mt-2 text-sm">{item}</div>
                </button>
              {/each}
            </div>
          </div>
        {:else if currentGame === "box"}
          <div class="py-4 text-center">
            <div class="mb-6 text-slate-400">상자 하나를 골라 운명을 확인하세요.</div>
            <div class="grid grid-cols-3 gap-3">
              {#each [0, 1, 2] as i}
                <button
                  on:click={() => openBox(i)}
                  class="app-action-tile py-8 text-6xl pulse-amber"
                >
                  🎁
                </button>
              {/each}
            </div>
          </div>
        {:else if currentGame === "highlow"}
          <div class="py-4 text-center">
            <div class="text-sm text-slate-400">현재 숫자</div>
            <div class="mt-3 text-7xl font-black text-cyan-200">{currentNum}</div>
            <div class="mt-8 grid grid-cols-2 gap-3">
              <button
                on:click={() => playHighLow("low")}
                class="app-action-tile border border-rose-300/20 bg-rose-300/10 p-4 font-semibold text-rose-100"
              >
                LOW
              </button>
              <button
                on:click={() => playHighLow("high")}
                class="app-action-tile border border-emerald-300/20 bg-emerald-300/10 p-4 font-semibold text-emerald-100"
              >
                HIGH
              </button>
            </div>
          </div>
        {/if}
      {:else if gameStep === "result"}
        <div class="py-4 text-center">
          <div class="mb-6 text-6xl float-gentle">
            {gameResult === "up" ? "🎊" : gameResult === "down" ? "💀" : "😐"}
          </div>
          <h4 class={`text-3xl font-black ${gameResult === "up" ? "text-amber-300" : gameResult === "down" ? "text-rose-300" : "text-slate-300"}`}>
            {gameResult === "up" ? "등급 UP" : gameResult === "down" ? "등급 DOWN" : "변화 없음"}
          </h4>
          <p class="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400">{resultMessage}</p>
          <button on:click={finishGame} disabled={isSubmitting} class="app-button app-button-primary mt-8 w-full px-4 py-4">
            <Sparkles size={16} />
            {isSubmitting ? "기록 중..." : "확인"}
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
