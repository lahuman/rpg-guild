<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { Sparkles, Trophy, X } from "lucide-svelte";
  import { getErrorMessage, lockBodyScroll } from "$lib";
  import {
    GRADE_ORDER,
    getGradeChallenge,
    getGradeInfo,
    getGradeIndex,
    getGradePenaltySteps,
    getGradeRewardGold,
    guildStore,
    isMaxGrade,
    type GuildCharacter
  } from "$lib/stores/guildStore";

  export let guildId: string;
  export let characterId: string;
  export let characterName: string;
  export let characterGrade: GuildCharacter["grade"];

  const dispatch = createEventDispatcher();
  const releaseBodyScrollLock = lockBodyScroll();
  const runeSet = ["✦", "✧", "✪", "✹", "✺", "❖", "⬢", "⬡"];

  let gameStep: "intro" | "playing" | "result" | "max" = "intro";
  let gameResult: "up" | "down" | "stay" = "stay";
  let resultMessage = "";
  let isSubmitting = false;

  let rpsWins = 0;
  let rpsLosses = 0;
  let rpsRound = 0;
  let userChoice = "";
  let cpuChoice = "";

  let boxOutcomes: Array<"up" | "down" | "stay"> = [];

  let currentNum = 0;
  let highlowRound = 1;
  let highlowMessage = "";

  let runeSequence: string[] = [];
  let runeInput: string[] = [];
  let isRuneReveal = true;
  let runeHint = "";

  $: gradeInfo = getGradeInfo(characterGrade);
  $: challenge = getGradeChallenge(characterGrade);
  $: gradeIndex = getGradeIndex(characterGrade);
  $: nextGrade = GRADE_ORDER[Math.min(gradeIndex + 1, GRADE_ORDER.length - 1)];
  $: nextGradeInfo = getGradeInfo(nextGrade);
  $: isFinalGrade = isMaxGrade(characterGrade);
  $: rewardGold = isFinalGrade ? 0 : getGradeRewardGold(nextGrade);
  $: failPenalty = getGradePenaltySteps(characterGrade);

  $: if (isFinalGrade && gameStep === "intro") {
    gameStep = "max";
  }

  function shuffle<T>(items: T[]) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  function startChallenge() {
    resetState();
    gameStep = "playing";

    if (challenge.type === "rps") {
      return;
    }

    if (challenge.type === "box") {
      boxOutcomes = shuffle(challenge.outcomes);
      return;
    }

    if (challenge.type === "highlow") {
      currentNum = Math.floor(Math.random() * challenge.rangeMax) + 1;
      highlowRound = 1;
      highlowMessage = "";
      return;
    }

    if (challenge.type === "memory") {
      const pool = runeSet.slice(0, challenge.runePool);
      runeSequence = Array.from({ length: challenge.length }, () => pool[Math.floor(Math.random() * pool.length)]);
      runeInput = [];
      isRuneReveal = true;
      runeHint = challenge.reverse ? "역순으로 입력하세요." : "보인 순서를 그대로 입력하세요.";

      setTimeout(() => {
        isRuneReveal = false;
      }, challenge.revealMs);
    }
  }

  function resetState() {
    gameResult = "stay";
    resultMessage = "";
    rpsWins = 0;
    rpsLosses = 0;
    rpsRound = 0;
    userChoice = "";
    cpuChoice = "";
    boxOutcomes = [];
    currentNum = 0;
    highlowRound = 1;
    highlowMessage = "";
    runeSequence = [];
    runeInput = [];
    isRuneReveal = true;
    runeHint = "";
  }

  function resolveResult(result: "up" | "down" | "stay", message: string) {
    gameResult = result;
    resultMessage = message;
    gameStep = "result";
  }

  function playRPS(choice: string) {
    if (challenge.type !== "rps") return;

    const options = ["가위", "바위", "보"];
    userChoice = choice;
    cpuChoice = options[Math.floor(Math.random() * 3)];
    rpsRound += 1;

    if (userChoice === cpuChoice) {
      if (rpsRound >= challenge.rounds && rpsWins < challenge.targetWins) {
        resolveResult("down", `무승부가 많아 판수 제한을 넘겼습니다. (${rpsWins}승 ${rpsLosses}패)`);
      }
      return;
    }

    const isWin =
      (userChoice === "가위" && cpuChoice === "보") ||
      (userChoice === "바위" && cpuChoice === "가위") ||
      (userChoice === "보" && cpuChoice === "바위");

    if (isWin) {
      rpsWins += 1;
      if (rpsWins >= challenge.targetWins) {
        resolveResult("up", `${challenge.rounds}판 시험에서 ${rpsWins}승을 달성했습니다.`);
        return;
      }
    } else {
      rpsLosses += 1;
      if (rpsLosses > challenge.maxLosses) {
        resolveResult("down", `허용 패배 수를 넘겼습니다. (${rpsWins}승 ${rpsLosses}패)`);
        return;
      }
    }

    if (rpsRound >= challenge.rounds && rpsWins < challenge.targetWins) {
      resolveResult("down", `필요 승수를 채우지 못했습니다. (${rpsWins}승 ${rpsLosses}패)`);
    }
  }

  function openBox(index: number) {
    if (challenge.type !== "box") return;

    const outcome = boxOutcomes[index];

    if (outcome === "up") {
      resolveResult("up", `${challenge.boxCount}개의 상자 중 승급 상자를 찾았습니다.`);
    } else if (outcome === "stay") {
      resolveResult("stay", "안전한 상자였지만 승급에는 실패했습니다.");
    } else {
      resolveResult("down", "함정 상자를 열었습니다. 강등됩니다.");
    }
  }

  function playHighLow(guess: "high" | "low") {
    if (challenge.type !== "highlow") return;

    let nextNum = currentNum;
    while (nextNum === currentNum) {
      nextNum = Math.floor(Math.random() * challenge.rangeMax) + 1;
    }

    const isCorrect = guess === "high" ? nextNum > currentNum : nextNum < currentNum;

    if (!isCorrect) {
      resolveResult("down", `예측 실패. ${currentNum} 다음 숫자는 ${nextNum}였습니다.`);
      return;
    }

    if (highlowRound >= challenge.rounds) {
      resolveResult("up", `${challenge.rounds}번 연속 예측에 성공했습니다.`);
      return;
    }

    highlowMessage = `정답. ${currentNum} → ${nextNum}`;
    currentNum = nextNum;
    highlowRound += 1;
  }

  function pressRune(rune: string) {
    if (challenge.type !== "memory" || isRuneReveal) return;

    runeInput = [...runeInput, rune];

    if (runeInput.length < challenge.length) {
      return;
    }

    const expected = challenge.reverse ? [...runeSequence].reverse() : runeSequence;
    const isSuccess = expected.every((expectedRune, index) => runeInput[index] === expectedRune);

    if (isSuccess) {
      resolveResult(
        "up",
        challenge.reverse
          ? "역순 룬 배열을 정확히 복기했습니다."
          : "룬 순서를 정확히 재현했습니다."
      );
      return;
    }

    resolveResult(
      "down",
      challenge.reverse
        ? `역순 복기에 실패했습니다. 정답은 ${expected.join(" ")} 입니다.`
        : `기억한 순서가 다릅니다. 정답은 ${expected.join(" ")} 입니다.`
    );
  }

  function undoRune() {
    runeInput = runeInput.slice(0, -1);
  }

  async function finishGame() {
    if (isSubmitting) return;
    isSubmitting = true;

    try {
      await guildStore.updateGrade(guildId, characterId, gameResult);
      dispatch("close");
    } catch (error) {
      alert(getErrorMessage(error, "등급전 결과를 저장하지 못했습니다."));
    } finally {
      isSubmitting = false;
    }
  }

  onDestroy(() => {
    releaseBodyScrollLock();
  });
</script>

<div class="fixed inset-0 z-50 overflow-y-auto bg-[var(--black)]/40 p-3 sm:p-4">
  <div class="flex min-h-full items-start justify-center py-3 sm:items-center sm:py-4">
    <div class="app-modal app-modal-scroll w-full max-w-2xl overflow-x-hidden overflow-y-auto bg-white">
      <div class="flex items-center justify-between border-b border-[var(--grey-300)] px-5 py-5 md:px-6">
        <div>
          <div class="app-stitch-tag">Grade Match</div>
          <h3 class="mt-2 text-2xl font-semibold">{characterName}의 등급전</h3>
          <p class="mt-2 text-sm text-[var(--text-secondary)]">
            현재 등급 {gradeInfo.icon} {gradeInfo.label}
            {#if !isFinalGrade}
              <span class="mx-2 text-[var(--grey-500)]">→</span>
              목표 {nextGradeInfo.icon} {nextGradeInfo.label}
            {/if}
          </p>
        </div>
        <button on:click={() => dispatch("close")} class="app-icon-btn">
          <X size={16} />
        </button>
      </div>

      <div class="px-5 py-5 md:px-6">
        {#if gameStep === "max"}
          <div class="py-10 text-center">
            <div class="mb-5 text-6xl">🔱</div>
            <h4 class="text-3xl font-black text-[var(--black)]">{gradeInfo.label}</h4>
            <p class="mx-auto mt-4 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
              이미 20단계 최고 등급에 도달했습니다. 더 이상 승급 시험은 없습니다.
            </p>
            <button on:click={() => dispatch("close")} class="app-button app-button-primary mt-8 px-6 py-3">
              확인
            </button>
          </div>

        {:else if gameStep === "intro"}
          <div class="app-stat-card mb-5 px-4 py-4">
            <div class="flex items-center gap-2 font-semibold">
              <div class="app-coin-icon">
                <Trophy size={18} />
              </div>
              <span>{challenge.title}</span>
            </div>
            <p class="mt-2 text-sm">{challenge.subtitle}</p>
            <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{challenge.instructions}</p>
          </div>

          <div class="app-stat-card px-4 py-4">
            <div class="app-label">Stage {gradeInfo.level}</div>
            <div class="mt-2 text-lg font-semibold">{gradeInfo.icon} {gradeInfo.label}</div>
            <div class="mt-1 text-sm text-[var(--text-secondary)]">{gradeInfo.title}</div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div class="app-stat-card px-4 py-4">
              <div class="app-label">Promotion Reward</div>
              <div class="mt-2 text-xl font-bold">+{rewardGold} G</div>
              <div class="mt-1 text-sm text-[var(--text-secondary)]">승급 시 즉시 지급</div>
            </div>
            <div class="app-stat-card px-4 py-4">
              <div class="app-label">Failure Penalty</div>
              <div class="mt-2 text-xl font-bold">
                {failPenalty === 0 ? "유지" : `${failPenalty}단계 강등`}
              </div>
              <div class="mt-1 text-sm text-[var(--text-secondary)]">현재 등급 기준 패널티</div>
            </div>
          </div>

          <button on:click={startChallenge} class="app-button app-button-primary mt-6 w-full px-4 py-4">
            <Sparkles size={16} />
            시험 시작
          </button>

        {:else if gameStep === "playing"}
          {#if challenge.type === "rps"}
            <div class="text-center">
              <div class="mb-4 app-stat-card px-4 py-3 text-sm">
                현재 {rpsWins}승 {rpsLosses}패 · {rpsRound}/{challenge.rounds} 판
              </div>
              <div class="mb-6 text-sm text-[var(--text-secondary)]">상대 결투자와 규정 승수를 먼저 달성하세요.</div>
              <div class="mb-6 text-6xl">⚔️</div>
              {#if userChoice && cpuChoice}
                <div class="mb-6 text-sm text-[var(--text-secondary)]">{userChoice} vs {cpuChoice}</div>
              {/if}
              <div class="grid grid-cols-3 gap-3">
                {#each ["가위", "바위", "보"] as item}
                  <button on:click={() => playRPS(item)} class="app-button app-button-secondary p-4">
                    <div class="text-3xl">{item === "가위" ? "✌️" : item === "바위" ? "✊" : "✋"}</div>
                    <div class="mt-2 text-sm">{item}</div>
                  </button>
                {/each}
              </div>
            </div>

          {:else if challenge.type === "box"}
            <div class="text-center">
              <p class="mb-6 text-sm text-[var(--text-secondary)]">{challenge.boxCount}개의 상자 중 승급 상자를 고르세요.</p>
              <div class={`grid gap-3 ${challenge.boxCount >= 5 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
                {#each Array.from({ length: challenge.boxCount }, (_, i) => i) as _}
                  <button on:click={() => openBox(_)} class="app-button app-button-secondary py-8 text-6xl">
                    🎁
                  </button>
                {/each}
              </div>
            </div>

          {:else if challenge.type === "highlow"}
            <div class="py-4 text-center">
              <div class="text-sm text-[var(--text-secondary)]">현재 숫자</div>
              <div class="mt-3 text-7xl font-black">{currentNum}</div>
              <div class="mt-3 text-sm text-[var(--text-secondary)]">
                {highlowRound}/{challenge.rounds} 라운드
              </div>
              {#if highlowMessage}
                <div class="mt-4 app-stat-card px-4 py-3 text-sm">
                  {highlowMessage}
                </div>
              {/if}
              <div class="mt-8 grid grid-cols-2 gap-3">
                <button on:click={() => playHighLow("low")} class="app-button app-button-secondary p-4 font-semibold">
                  LOW
                </button>
                <button on:click={() => playHighLow("high")} class="app-button app-button-secondary p-4 font-semibold">
                  HIGH
                </button>
              </div>
            </div>

          {:else if challenge.type === "memory"}
            <div class="text-center">
              <div class="mb-4 app-stat-card px-4 py-3 text-sm">
                {runeHint}
              </div>

              {#if isRuneReveal}
                <div class="mb-4 text-sm text-[var(--blue)]">패턴을 기억하세요...</div>
                <div class="grid grid-cols-4 gap-3">
                  {#each runeSequence as rune}
                    <div class="app-button app-button-secondary flex items-center justify-center py-6 text-4xl">
                      {rune}
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="mb-4 text-sm text-[var(--text-secondary)]">
                  입력 진행 {runeInput.length}/{challenge.length}
                </div>
                <div class="mb-4 rounded-[1.25rem] border border-[var(--grey-300)] bg-[var(--grey-100)] px-4 py-4 text-2xl tracking-[0.25em]">
                  {runeInput.length ? runeInput.join(" ") : "· · ·"}
                </div>
                <div class="grid grid-cols-4 gap-3">
                  {#each runeSet.slice(0, challenge.runePool) as rune}
                    <button on:click={() => pressRune(rune)} class="app-button app-button-secondary py-5 text-3xl">
                      {rune}
                    </button>
                  {/each}
                </div>
                <button on:click={undoRune} disabled={runeInput.length === 0} class="app-button app-button-secondary mt-4 w-full px-4 py-3 text-sm">
                  한 칸 지우기
                </button>
              {/if}
            </div>
          {/if}

        {:else if gameStep === "result"}
          <div class="py-4 text-center">
            <div class="mb-6 text-6xl">
              {gameResult === "up" ? "🎊" : gameResult === "down" ? "💀" : "😐"}
            </div>
            <h4 class={`text-3xl font-black ${gameResult === "up" ? "text-[var(--green)]" : gameResult === "down" ? "text-[var(--red)]" : "text-[var(--text-secondary)]"}`}>
              {gameResult === "up" ? "등급 UP" : gameResult === "down" ? "등급 DOWN" : "변화 없음"}
            </h4>
            <p class="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{resultMessage}</p>

            {#if gameResult === "up"}
              <div class="app-stat-card mt-4 mx-auto max-w-sm px-4 py-4 text-sm">
                {nextGradeInfo.icon} {nextGradeInfo.label} 승급 보상으로 {rewardGold}G를 획득합니다.
              </div>
            {:else if gameResult === "down"}
              <div class="app-stat-card mt-4 mx-auto max-w-sm border-l-[3px] border-[var(--red)] px-4 py-4 text-sm text-[var(--red)]">
                실패 패널티로 {failPenalty}단계 하락합니다.
              </div>
            {:else}
              <div class="app-stat-card mt-4 mx-auto max-w-sm px-4 py-4 text-sm">
                이번 시험 기록은 남지만 등급은 유지됩니다.
              </div>
            {/if}

            <button on:click={finishGame} disabled={isSubmitting} class="app-button app-button-primary mt-8 w-full px-4 py-4">
              <Sparkles size={16} />
              {isSubmitting ? "기록 중..." : "확인"}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>