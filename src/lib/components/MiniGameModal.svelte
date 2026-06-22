<script lang="ts">
  import { createEventDispatcher, onDestroy, tick } from "svelte";
  import { Sparkles, Trophy, X } from "lucide-svelte";
  import { formatGold, getErrorMessage, lockBodyScroll } from "$lib";
  import {
    GRADE_ORDER,
    getGradeChallenge,
    getGradeInfo,
    getGradeIndex,
    getGradePenaltySteps,
    getGradeRewardGold,
    guildStore,
    isMaxGrade,
    type GradeChallengeConfig,
    type GuildCharacter
  } from "$lib/stores/guildStore";

  type GameStep = "intro" | "playing" | "result" | "max";
  type GameResult = "up" | "down" | "stay";
  type MemoryCard = { id: number; symbol: string; matched: boolean; visible: boolean };
  type AimTarget = { id: number; x: number; y: number; size: number; bomb: boolean; vx: number; vy: number };
  type MathQuestion = { expression: string; answer: number };
  type FallingItem = { x: number; y: number; hazard: boolean };
  type Obstacle = { x: number; y: number; vx: number; vy: number; size: number };

  export let guildId: string;
  export let characterId: string;
  export let characterName: string;
  export let characterGrade: GuildCharacter["grade"];

  const dispatch = createEventDispatcher();
  const releaseBodyScrollLock = lockBodyScroll();
  const memorySymbols = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const simonColors = ["#1a73e8", "#188038", "#f9ab00", "#d93025", "#8e24aa"];

  let gameStep: GameStep = "intro";
  let gameResult: GameResult = "stay";
  let resultMessage = "";
  let isSubmitting = false;
  let countdownMs = 0;
  let activeTimeouts: ReturnType<typeof setTimeout>[] = [];
  let activeIntervals: ReturnType<typeof setInterval>[] = [];
  let activeAnimationFrame: number | null = null;

  let memoryCards: MemoryCard[] = [];
  let memorySelection: number[] = [];
  let memoryLocked = false;

  let aimTargets: AimTarget[] = [];
  let aimHits = 0;
  let aimTargetSerial = 0;

  let timingPosition = 0;
  let timingDirection = 1;

  let simonSequence: number[] = [];
  let simonInput: number[] = [];
  let simonHighlight: number | null = null;
  let simonRevealing = false;

  let colorTiles: string[] = [];
  let colorAnswerIndex = 0;

  let typingInput = "";
  let typingIndex = 0;

  let mathQuestion: MathQuestion | null = null;
  let mathInput = "";
  let mathIndex = 0;

  let catchCanvas: HTMLCanvasElement | null = null;
  let catchScore = 0;
  let catchLives = 2;
  let catchBasketX = 150;
  let catchDirection = 0;
  let catchItems: FallingItem[] = [];
  let catchLastDrop = 0;
  let catchStartTime = 0;

  let dodgeCanvas: HTMLCanvasElement | null = null;
  let dodgePlayer = { x: 150, y: 120 };
  let dodgeDirection = { x: 0, y: 0 };
  let dodgeObstacles: Obstacle[] = [];
  let dodgeStartTime = 0;
  let dodgePreparing = false;

  let puzzleTiles: number[] = [];

  $: gradeInfo = getGradeInfo(characterGrade);
  $: challenge = getGradeChallenge(characterGrade);
  $: gradeIndex = getGradeIndex(characterGrade);
  $: nextGrade = GRADE_ORDER[Math.min(gradeIndex + 1, GRADE_ORDER.length - 1)];
  $: nextGradeInfo = getGradeInfo(nextGrade);
  $: isFinalGrade = isMaxGrade(characterGrade);
  $: rewardGold = isFinalGrade ? 0 : getGradeRewardGold(nextGrade);
  $: failPenalty = getGradePenaltySteps(characterGrade);
  $: countdownLabel = countdownMs > 0 ? `${dodgePreparing ? "준비 " : ""}${Math.ceil(countdownMs / 1000)}초` : "";
  $: if (isFinalGrade && gameStep === "intro") {
    gameStep = "max";
  }

  function randomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  function shuffle<T>(items: T[]) {
    const nextItems = [...items];
    for (let index = nextItems.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(index + 1);
      [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
    }
    return nextItems;
  }

  function queueTimeout(callback: () => void, ms: number) {
    const timeoutId = setTimeout(callback, ms);
    activeTimeouts = [...activeTimeouts, timeoutId];
    return timeoutId;
  }

  function queueInterval(callback: () => void, ms: number) {
    const intervalId = setInterval(callback, ms);
    activeIntervals = [...activeIntervals, intervalId];
    return intervalId;
  }

  function clearRuntime() {
    activeTimeouts.forEach(clearTimeout);
    activeIntervals.forEach(clearInterval);
    activeTimeouts = [];
    activeIntervals = [];

    if (activeAnimationFrame !== null) {
      cancelAnimationFrame(activeAnimationFrame);
      activeAnimationFrame = null;
    }
  }

  function startCountdown(durationMs: number, onExpire: () => void) {
    countdownMs = durationMs;
    queueInterval(() => {
      countdownMs = Math.max(0, countdownMs - 100);
      if (countdownMs <= 0) {
        clearRuntime();
        onExpire();
      }
    }, 100);
  }

  function resetState() {
    clearRuntime();
    gameResult = "stay";
    resultMessage = "";
    countdownMs = 0;
    memoryCards = [];
    memorySelection = [];
    memoryLocked = false;
    aimTargets = [];
    aimHits = 0;
    aimTargetSerial = 0;
    timingPosition = 0;
    timingDirection = 1;
    simonSequence = [];
    simonInput = [];
    simonHighlight = null;
    simonRevealing = false;
    colorTiles = [];
    colorAnswerIndex = 0;
    typingInput = "";
    typingIndex = 0;
    mathQuestion = null;
    mathInput = "";
    mathIndex = 0;
    catchScore = 0;
    catchLives = 2;
    catchBasketX = 150;
    catchDirection = 0;
    catchItems = [];
    catchLastDrop = 0;
    catchStartTime = 0;
    dodgePlayer = { x: 150, y: 120 };
    dodgeDirection = { x: 0, y: 0 };
    dodgeObstacles = [];
    dodgeStartTime = 0;
    dodgePreparing = false;
    puzzleTiles = [];
  }

  async function startChallenge() {
    resetState();
    gameStep = "playing";
    await tick();

    if (challenge.type === "memory-match") startMemoryMatch(challenge);
    if (challenge.type === "aim-trainer") startAimTrainer(challenge);
    if (challenge.type === "timing-bar") startTimingBar(challenge);
    if (challenge.type === "simon-says") startSimonSays(challenge);
    if (challenge.type === "color-spotter") startColorSpotter(challenge);
    if (challenge.type === "word-typing") startWordTyping(challenge);
    if (challenge.type === "mental-math") startMentalMath(challenge);
    if (challenge.type === "catch-drop") startCatchDrop(challenge);
    if (challenge.type === "dodge-blocks") startDodgeBlocks(challenge);
    if (challenge.type === "sliding-puzzle") startSlidingPuzzle(challenge);
  }

  function resolveResult(result: GameResult, message: string) {
    clearRuntime();
    gameResult = result;
    resultMessage = message;
    gameStep = "result";
  }

  function startMemoryMatch(config: Extract<GradeChallengeConfig, { type: "memory-match" }>) {
    const cards = memorySymbols.slice(0, config.cardPairs).flatMap((symbol, pairIndex) => [
      { id: pairIndex * 2, symbol, matched: false, visible: true },
      { id: pairIndex * 2 + 1, symbol, matched: false, visible: true }
    ]);
    memoryCards = shuffle(cards);
    queueTimeout(() => {
      memoryCards = memoryCards.map((card) => ({ ...card, visible: false }));
    }, config.revealMs);
  }

  function flipMemoryCard(index: number) {
    const card = memoryCards[index];
    if (!card || card.visible || card.matched || memoryLocked) return;

    memoryCards = memoryCards.map((item, itemIndex) => itemIndex === index ? { ...item, visible: true } : item);
    memorySelection = [...memorySelection, index];

    if (memorySelection.length === 1) return;

    const [firstIndex, secondIndex] = memorySelection;
    const firstCard = memoryCards[firstIndex];
    const secondCard = memoryCards[secondIndex];

    if (firstCard?.symbol === secondCard?.symbol) {
      memoryCards = memoryCards.map((item, itemIndex) =>
        itemIndex === firstIndex || itemIndex === secondIndex ? { ...item, matched: true, visible: true } : item
      );
      memorySelection = [];

      if (memoryCards.every((item) => item.matched || itemIndexMatches(item, firstIndex, secondIndex))) {
        resolveResult("up", "모든 카드 짝을 찾아 승급 시험을 통과했습니다.");
      }
      return;
    }

    memoryLocked = true;
    queueTimeout(() => {
      memoryCards = memoryCards.map((item, itemIndex) =>
        itemIndex === firstIndex || itemIndex === secondIndex ? { ...item, visible: false } : item
      );
      memorySelection = [];
      memoryLocked = false;
    }, 650);
  }

  function itemIndexMatches(card: MemoryCard, firstIndex: number, secondIndex: number) {
    const firstCard = memoryCards[firstIndex];
    const secondCard = memoryCards[secondIndex];
    return card.id === firstCard?.id || card.id === secondCard?.id;
  }

  function startAimTrainer(config: Extract<GradeChallengeConfig, { type: "aim-trainer" }>) {
    spawnAimTarget(config);
  }

  function spawnAimTarget(config: Extract<GradeChallengeConfig, { type: "aim-trainer" }>) {
    clearRuntime();
    const size = config.targetSize;
    const target: AimTarget = {
      id: aimTargetSerial + 1,
      x: 8 + Math.random() * (84 - size / 5),
      y: 8 + Math.random() * 62,
      size,
      bomb: false,
      vx: Math.random() > 0.5 ? 0.25 : -0.25,
      vy: Math.random() > 0.5 ? 0.18 : -0.18
    };
    const bombs = Array.from({ length: config.bombCount }, (_, index) => ({
      id: aimTargetSerial + 2 + index,
      x: 10 + Math.random() * 76,
      y: 8 + Math.random() * 62,
      size: Math.max(28, size - 8),
      bomb: true,
      vx: 0,
      vy: 0
    }));
    aimTargetSerial = target.id + bombs.length;
    aimTargets = [target, ...bombs];

    if (config.moving) {
      queueInterval(() => {
        aimTargets = aimTargets.map((item) => ({
          ...item,
          x: Math.min(90, Math.max(4, item.x + item.vx)),
          y: Math.min(72, Math.max(4, item.y + item.vy)),
          vx: item.x <= 4 || item.x >= 90 ? -item.vx : item.vx,
          vy: item.y <= 4 || item.y >= 72 ? -item.vy : item.vy
        }));
      }, 16);
    }

    queueTimeout(() => resolveResult("down", "타겟이 사라지기 전에 맞히지 못했습니다."), config.targetTtlMs);
  }

  function clickAimTarget(target: AimTarget) {
    const config = challenge as Extract<GradeChallengeConfig, { type: "aim-trainer" }>;
    if (target.bomb) {
      resolveResult("down", "폭탄 타겟을 눌러 시험에 실패했습니다.");
      return;
    }

    const nextHits = aimHits + 1;
    aimHits = nextHits;
    if (nextHits >= config.targetCount) {
      resolveResult("up", `${nextHits}개의 타겟을 모두 명중했습니다.`);
      return;
    }
    spawnAimTarget(config);
  }

  function startTimingBar(config: Extract<GradeChallengeConfig, { type: "timing-bar" }>) {
    queueInterval(() => {
      const speed = config.erratic ? config.speed * (0.8 + Math.random() * 0.6) : config.speed;
      const nextPosition = timingPosition + timingDirection * speed;
      if (nextPosition >= 100 || nextPosition <= 0) {
        timingDirection *= -1;
      }
      timingPosition = Math.min(100, Math.max(0, nextPosition));
    }, 16);
  }

  function stopTimingBar() {
    const config = challenge as Extract<GradeChallengeConfig, { type: "timing-bar" }>;
    const hitStart = 50 - config.hitboxPercent / 2;
    const hitEnd = 50 + config.hitboxPercent / 2;
    if (timingPosition >= hitStart && timingPosition <= hitEnd) {
      resolveResult("up", "목표 구간 안에서 정확히 멈췄습니다.");
      return;
    }
    resolveResult("down", "타이밍이 목표 구간을 벗어났습니다.");
  }

  function startSimonSays(config: Extract<GradeChallengeConfig, { type: "simon-says" }>) {
    simonSequence = Array.from({ length: config.sequenceLength }, () => randomInt(config.buttonCount));
    simonInput = [];
    revealSimonSequence(config);
  }

  function revealSimonSequence(config: Extract<GradeChallengeConfig, { type: "simon-says" }>) {
    simonRevealing = true;
    const revealSequence = config.reverse ? [...simonSequence].reverse() : simonSequence;
    revealSequence.forEach((value, index) => {
      queueTimeout(() => {
        simonHighlight = value;
        queueTimeout(() => {
          simonHighlight = null;
          if (index === revealSequence.length - 1) simonRevealing = false;
        }, Math.max(180, config.flashMs - 130));
      }, index * config.flashMs);
    });
  }

  function pressSimonButton(value: number) {
    if (simonRevealing) return;
    const config = challenge as Extract<GradeChallengeConfig, { type: "simon-says" }>;
    const expected = config.reverse ? [...simonSequence].reverse() : simonSequence;
    const nextInput = [...simonInput, value];
    simonInput = nextInput;

    if (expected[nextInput.length - 1] !== value) {
      resolveResult("down", "기억한 순서와 입력 순서가 달랐습니다.");
      return;
    }

    if (nextInput.length === expected.length) {
      resolveResult("up", "제시된 순서를 정확히 재현했습니다.");
    }
  }

  function startColorSpotter(config: Extract<GradeChallengeConfig, { type: "color-spotter" }>) {
    const hue = 205 + randomInt(32);
    const base = `hsl(${hue} 76% 56%)`;
    const answer = `hsl(${hue} 76% ${Math.max(34, 56 - config.colorGap)}%)`;
    const total = config.gridSize * config.gridSize;
    colorAnswerIndex = randomInt(total);
    colorTiles = Array.from({ length: total }, (_, index) => index === colorAnswerIndex ? answer : base);
  }

  function chooseColorTile(index: number) {
    if (index === colorAnswerIndex) {
      resolveResult("up", "미세하게 다른 색의 타일을 찾아냈습니다.");
      return;
    }
    resolveResult("down", "일반 타일을 선택했습니다.");
  }

  function startWordTyping(config: Extract<GradeChallengeConfig, { type: "word-typing" }>) {
    typingInput = "";
    typingIndex = 0;
    startCountdown(config.timeLimitMs, () => resolveResult("down", "타이핑 제한 시간이 끝났습니다."));
  }

  function submitTyping() {
    const config = challenge as Extract<GradeChallengeConfig, { type: "word-typing" }>;
    if (typingInput.trim() !== config.words[typingIndex]) {
      resolveResult("down", "입력한 문자열이 제시어와 다릅니다.");
      return;
    }

    if (typingIndex >= config.words.length - 1) {
      resolveResult("up", "모든 제시어를 정확히 입력했습니다.");
      return;
    }

    typingIndex += 1;
    typingInput = "";
  }

  function createMathQuestion(config: Extract<GradeChallengeConfig, { type: "mental-math" }>): MathQuestion {
    const op = config.operators[randomInt(config.operators.length)];
    const left = randomInt(config.maxNumber) + 2;
    const right = randomInt(Math.max(6, Math.floor(config.maxNumber / 2))) + 2;

    if (config.compound) {
      const extra = randomInt(config.maxNumber) + 1;
      return {
        expression: `(${left} * ${right}) - ${extra}`,
        answer: left * right - extra
      };
    }

    if (op === "/") {
      return { expression: `${left * right} / ${left}`, answer: right };
    }
    if (op === "*") return { expression: `${left} * ${right}`, answer: left * right };
    if (op === "-") return { expression: `${left + right} - ${right}`, answer: left };
    return { expression: `${left} + ${right}`, answer: left + right };
  }

  function startMentalMath(config: Extract<GradeChallengeConfig, { type: "mental-math" }>) {
    mathIndex = 0;
    mathQuestion = createMathQuestion(config);
    mathInput = "";
    startCountdown(config.timeLimitMs, () => resolveResult("down", "암산 제한 시간이 끝났습니다."));
  }

  function submitMath() {
    const config = challenge as Extract<GradeChallengeConfig, { type: "mental-math" }>;
    if (!mathQuestion || Number(mathInput) !== mathQuestion.answer) {
      resolveResult("down", "수식의 정답이 틀렸습니다.");
      return;
    }

    if (mathIndex >= config.questionCount - 1) {
      resolveResult("up", "모든 수식을 정확히 풀었습니다.");
      return;
    }

    mathIndex += 1;
    mathQuestion = createMathQuestion(config);
    mathInput = "";
  }

  function startCatchDrop(config: Extract<GradeChallengeConfig, { type: "catch-drop" }>) {
    catchStartTime = performance.now();
    startCountdown(config.durationMs, () => {
      if (catchScore >= 5) resolveResult("up", `${catchScore}개의 아이템을 받아냈습니다.`);
      else resolveResult("down", "필요한 아이템 수를 채우지 못했습니다.");
    });
    runCatchFrame(config, catchStartTime);
  }

  function runCatchFrame(config: Extract<GradeChallengeConfig, { type: "catch-drop" }>, timestamp: number) {
    const canvas = catchCanvas;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const now = performance.now();
    catchBasketX = Math.min(canvas.width - 50, Math.max(10, catchBasketX + catchDirection * 5));
    if (now - catchLastDrop > config.dropIntervalMs) {
      catchItems = [
        ...catchItems,
        { x: 16 + Math.random() * (canvas.width - 32), y: 0, hazard: Math.random() < config.hazardRate }
      ];
      catchLastDrop = now;
    }

    catchItems = catchItems
      .map((item) => ({ ...item, y: item.y + config.dropSpeed }))
      .filter((item) => item.y < canvas.height + 20);

    catchItems = catchItems.filter((item) => {
      const caught = item.y >= canvas.height - 34 && Math.abs(item.x - (catchBasketX + 25)) < 34;
      if (!caught) return true;
      if (item.hazard) catchLives -= 1;
      else catchScore += 1;
      return false;
    });

    if (catchLives < 0) {
      resolveResult("down", "방해물을 너무 많이 받았습니다.");
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f8f9fa";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#202124";
    context.fillRect(catchBasketX, canvas.height - 24, 50, 14);
    catchItems.forEach((item) => {
      context.fillStyle = item.hazard ? "#d93025" : "#1a73e8";
      context.beginPath();
      context.arc(item.x, item.y, item.hazard ? 8 : 7, 0, Math.PI * 2);
      context.fill();
    });

    activeAnimationFrame = requestAnimationFrame((nextTimestamp) => runCatchFrame(config, nextTimestamp || timestamp));
  }

  function startDodgeBlocks(config: Extract<GradeChallengeConfig, { type: "dodge-blocks" }>) {
    const canvasWidth = dodgeCanvas?.width ?? 320;
    const canvasHeight = dodgeCanvas?.height ?? 220;
    dodgeObstacles = Array.from({ length: config.blockCount }, () => createDodgeObstacle(config, canvasWidth, canvasHeight));
    drawDodgeScene(config);

    if (config.startDelayMs > 0) {
      dodgePreparing = true;
      startCountdown(config.startDelayMs, () => {
        dodgePreparing = false;
        dodgeStartTime = performance.now();
        startCountdown(config.durationMs, () => resolveResult("up", "장애물 지대를 끝까지 버텼습니다."));
        runDodgeFrame(config);
      });
      return;
    }

    dodgeStartTime = performance.now();
    startCountdown(config.durationMs, () => resolveResult("up", "장애물 지대를 끝까지 버텼습니다."));
    runDodgeFrame(config);
  }

  function createDodgeObstacle(
    config: Extract<GradeChallengeConfig, { type: "dodge-blocks" }>,
    canvasWidth: number,
    canvasHeight: number
  ): Obstacle {
    const safeRadius = Math.min(canvasWidth, canvasHeight) * 0.28;
    let x = Math.random() * canvasWidth;
    let y = Math.random() * canvasHeight;

    for (let attempt = 0; attempt < 20 && Math.hypot(x - dodgePlayer.x, y - dodgePlayer.y) < safeRadius; attempt += 1) {
      x = Math.random() * canvasWidth;
      y = Math.random() * canvasHeight;
    }

    return {
      x,
      y,
      vx: (Math.random() > 0.5 ? 1 : -1) * config.blockSpeed,
      vy: (Math.random() > 0.5 ? 1 : -1) * config.blockSpeed,
      size: 12 + Math.random() * 8
    };
  }

  function runDodgeFrame(config: Extract<GradeChallengeConfig, { type: "dodge-blocks" }>) {
    const canvas = dodgeCanvas;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    dodgePlayer = {
      x: Math.min(canvas.width - 12, Math.max(12, dodgePlayer.x + dodgeDirection.x * 4)),
      y: Math.min(canvas.height - 12, Math.max(12, dodgePlayer.y + dodgeDirection.y * 4))
    };

    dodgeObstacles = dodgeObstacles.map((block) => {
      let nextVx = block.vx;
      let nextVy = block.vy;
      if (config.homing) {
        nextVx += Math.sign(dodgePlayer.x - block.x) * 0.04;
        nextVy += Math.sign(dodgePlayer.y - block.y) * 0.04;
      }

      let nextX = block.x + nextVx;
      let nextY = block.y + nextVy;
      if (nextX <= 0 || nextX >= canvas.width) nextVx *= -1;
      if (nextY <= 0 || nextY >= canvas.height) nextVy *= -1;
      nextX = Math.min(canvas.width, Math.max(0, nextX));
      nextY = Math.min(canvas.height, Math.max(0, nextY));
      return { ...block, x: nextX, y: nextY, vx: nextVx, vy: nextVy };
    });

    const hit = dodgeObstacles.some((block) => Math.hypot(block.x - dodgePlayer.x, block.y - dodgePlayer.y) < block.size + 8);
    if (hit) {
      resolveResult("down", "장애물과 충돌했습니다.");
      return;
    }

    drawDodgeScene(config);
    activeAnimationFrame = requestAnimationFrame(() => runDodgeFrame(config));
  }

  function drawDodgeScene(config: Extract<GradeChallengeConfig, { type: "dodge-blocks" }>) {
    const canvas = dodgeCanvas;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f8f9fa";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#dadce0";
    context.strokeRect(
      canvas.width * (1 - config.safeZoneScale) / 2,
      canvas.height * (1 - config.safeZoneScale) / 2,
      canvas.width * config.safeZoneScale,
      canvas.height * config.safeZoneScale
    );
    context.fillStyle = "#1a73e8";
    context.beginPath();
    context.arc(dodgePlayer.x, dodgePlayer.y, 8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#202124";
    dodgeObstacles.forEach((block) => context.fillRect(block.x - block.size / 2, block.y - block.size / 2, block.size, block.size));
  }

  function startSlidingPuzzle(config: Extract<GradeChallengeConfig, { type: "sliding-puzzle" }>) {
    const total = config.gridSize * config.gridSize;
    let tiles = Array.from({ length: total }, (_, index) => (index + 1) % total);
    let blankIndex = total - 1;

    for (let count = 0; count < config.shuffleMoves; count += 1) {
      const options = getPuzzleNeighbors(blankIndex, config.gridSize);
      const nextIndex = options[randomInt(options.length)];
      [tiles[blankIndex], tiles[nextIndex]] = [tiles[nextIndex], tiles[blankIndex]];
      blankIndex = nextIndex;
    }

    puzzleTiles = tiles;
    startCountdown(config.timeLimitMs, () => resolveResult("down", "퍼즐 제한 시간이 끝났습니다."));
  }

  function getPuzzleNeighbors(index: number, gridSize: number) {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    return [
      row > 0 ? index - gridSize : -1,
      row < gridSize - 1 ? index + gridSize : -1,
      col > 0 ? index - 1 : -1,
      col < gridSize - 1 ? index + 1 : -1
    ].filter((value) => value >= 0);
  }

  function movePuzzleTile(index: number) {
    const config = challenge as Extract<GradeChallengeConfig, { type: "sliding-puzzle" }>;
    const blankIndex = puzzleTiles.indexOf(0);
    if (!getPuzzleNeighbors(blankIndex, config.gridSize).includes(index)) return;

    const nextTiles = [...puzzleTiles];
    [nextTiles[blankIndex], nextTiles[index]] = [nextTiles[index], nextTiles[blankIndex]];
    puzzleTiles = nextTiles;

    const solved = nextTiles.every((value, tileIndex) => value === (tileIndex + 1) % nextTiles.length);
    if (solved) {
      resolveResult("up", "슬라이딩 퍼즐을 원래 순서로 복구했습니다.");
    }
  }

  function setCatchDirection(direction: number) {
    catchDirection = direction;
  }

  function setDodgeDirection(x: number, y: number) {
    dodgeDirection = { x, y };
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
    clearRuntime();
    releaseBodyScrollLock();
  });
</script>

<div class="fixed inset-0 z-50 overflow-y-auto bg-[var(--black)]/40 p-3 sm:p-4">
  <div class="flex min-h-full items-start justify-center sm:items-center">
    <div class="grade-match-modal app-modal w-full max-w-2xl overflow-hidden bg-white">
      <div class="grade-match-header flex items-center justify-between border-b border-[var(--grey-300)] px-5 py-5 md:px-6">
        <div class="min-w-0">
          <div class="grade-match-eyebrow app-stitch-tag">Grade Match</div>
          <h3 class="grade-match-title mt-2 text-2xl font-semibold">{characterName}의 등급전</h3>
          <p class="grade-match-route mt-2 text-sm text-[var(--text-secondary)]">
            현재 등급 {gradeInfo.icon} {gradeInfo.label}
            {#if !isFinalGrade}
              <span class="grade-route-arrow text-[var(--grey-500)]">→</span>
              목표 {nextGradeInfo.icon} {nextGradeInfo.label}
            {/if}
          </p>
        </div>
        <button on:click={() => dispatch("close")} class="app-icon-btn shrink-0">
          <X size={16} />
        </button>
      </div>

      <div class="grade-match-body px-5 py-5 md:px-6">
        {#if gameStep === "max"}
          <div class="py-10 text-center">
            <div class="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-[var(--gc-blue-tint)] text-2xl font-bold text-[var(--gc-blue)]">
              {gradeInfo.icon}
            </div>
            <h4 class="text-3xl font-black text-[var(--black)]">{gradeInfo.label}</h4>
            <p class="mx-auto mt-4 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
              이미 20단계 최고 등급에 도달했습니다. 더 이상 승급 시험은 없습니다.
            </p>
            <button on:click={() => dispatch("close")} class="app-button app-button-primary mt-8 px-6 py-3">
              확인
            </button>
          </div>

        {:else if gameStep === "intro"}
          <div class="grade-intro-card">
            <div class="flex min-w-0 items-center gap-3">
              <div class="app-coin-icon">
                <Trophy size={18} />
              </div>
              <div class="min-w-0">
                <div class="grade-intro-title font-semibold">{challenge.title}</div>
                <p class="grade-intro-subtitle mt-1 text-sm text-[var(--text-secondary)]">{challenge.subtitle}</p>
              </div>
            </div>
          </div>

          <div class="grade-intro-details mt-3">
            <div class="grade-intro-stat">
              <div class="app-label">단계</div>
              <strong>Stage {challenge.stage}</strong>
              <span>난이도 {challenge.difficulty}/10</span>
            </div>
            <div class="grade-intro-stat">
              <div class="app-label">보상</div>
              <strong>+{formatGold(rewardGold)}</strong>
              <span>승급 시 지급</span>
            </div>
            <div class="grade-intro-stat">
              <div class="app-label">실패</div>
              <strong>
                {failPenalty === 0 ? "유지" : `${failPenalty}단계 강등`}
              </strong>
              <span>현재 등급 기준</span>
            </div>
          </div>

          <button on:click={startChallenge} class="grade-start-button app-button app-button-primary mt-4 w-full px-4 py-3 sm:mt-5 sm:py-4">
            <Sparkles size={16} />
            시험 시작
          </button>

        {:else if gameStep === "playing"}
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--grey-300)] bg-[var(--grey-100)] px-4 py-3 text-sm">
            <span class="font-semibold">{challenge.title}</span>
            {#if countdownLabel}
              <span class="app-stitch-tag">{countdownLabel}</span>
            {/if}
          </div>

          {#if challenge.type === "memory-match"}
            <div class="mini-grid" style={`--cols:${Math.ceil(Math.sqrt(memoryCards.length))}`}>
              {#each memoryCards as card, index (card.id)}
                <button on:click={() => flipMemoryCard(index)} class:matched={card.matched} class="mini-card">
                  {card.visible || card.matched ? card.symbol : ""}
                </button>
              {/each}
            </div>

          {:else if challenge.type === "aim-trainer"}
            <div class="aim-arena">
              {#each aimTargets as target (target.id)}
                <button
                  on:click={() => clickAimTarget(target)}
                  class:bomb={target.bomb}
                  class="aim-target"
                  style={`left:${target.x}%; top:${target.y}%; width:${target.size}px; height:${target.size}px;`}
                >
                  {target.bomb ? "!" : aimHits + 1}
                </button>
              {/each}
            </div>
            <div class="mt-3 text-center text-sm text-[var(--text-secondary)]">{aimHits}/{challenge.targetCount} 명중</div>

          {:else if challenge.type === "timing-bar"}
            <div class="timing-track" style={`--hit:${challenge.hitboxPercent}%`}>
              <div class="timing-hitbox"></div>
              <div class="timing-pointer" style={`left:${timingPosition}%`}></div>
            </div>
            <button on:click={stopTimingBar} class="app-button app-button-primary mt-5 w-full px-4 py-4">멈추기</button>

          {:else if challenge.type === "simon-says"}
            <div class="mb-4 text-center text-sm text-[var(--text-secondary)]">
              {simonRevealing ? "순서를 보여주는 중" : `입력 ${simonInput.length}/${challenge.sequenceLength}`}
            </div>
            <div class="simon-grid">
              {#each Array.from({ length: challenge.buttonCount }, (_, i) => i) as index}
                <button
                  on:click={() => pressSimonButton(index)}
                  disabled={simonRevealing}
                  class:active={simonHighlight === index}
                  class="simon-button"
                  style={`--simon:${simonColors[index % simonColors.length]}`}
                >
                  {index + 1}
                </button>
              {/each}
            </div>

          {:else if challenge.type === "color-spotter"}
            <div class="color-grid" style={`--cols:${challenge.gridSize}`}>
              {#each colorTiles as color, index}
                <button
                  on:click={() => chooseColorTile(index)}
                  class="color-tile"
                  style={`background:${color}`}
                  aria-label={`색상 타일 ${index + 1}`}
                ></button>
              {/each}
            </div>

          {:else if challenge.type === "word-typing"}
            <form on:submit|preventDefault={submitTyping} class="space-y-4">
              <div class="typing-word">{challenge.words[typingIndex]}</div>
              <input bind:value={typingInput} class="app-input text-center text-lg font-semibold" autocomplete="off" />
              <button class="app-button app-button-primary w-full px-4 py-4">입력</button>
            </form>

          {:else if challenge.type === "mental-math"}
            <form on:submit|preventDefault={submitMath} class="space-y-4">
              <div class="typing-word">{mathQuestion?.expression}</div>
              <div class="text-center text-sm text-[var(--text-secondary)]">{mathIndex + 1}/{challenge.questionCount}</div>
              <input bind:value={mathInput} class="app-input text-center text-lg font-semibold" inputmode="numeric" autocomplete="off" />
              <button class="app-button app-button-primary w-full px-4 py-4">정답 제출</button>
            </form>

          {:else if challenge.type === "catch-drop"}
            <canvas bind:this={catchCanvas} class="game-canvas" width="320" height="220"></canvas>
            <div class="mt-3 grid grid-cols-3 gap-2">
              <button on:pointerdown={() => setCatchDirection(-1)} on:pointerup={() => setCatchDirection(0)} on:pointerleave={() => setCatchDirection(0)} class="app-button app-button-secondary">왼쪽</button>
              <div class="app-stat-card text-center text-sm font-semibold">점수 {catchScore} · 생명 {catchLives}</div>
              <button on:pointerdown={() => setCatchDirection(1)} on:pointerup={() => setCatchDirection(0)} on:pointerleave={() => setCatchDirection(0)} class="app-button app-button-secondary">오른쪽</button>
            </div>

          {:else if challenge.type === "dodge-blocks"}
            <canvas bind:this={dodgeCanvas} class="game-canvas" width="320" height="220"></canvas>
            <div class="move-pad mt-3">
              <button on:pointerdown={() => setDodgeDirection(0, -1)} on:pointerup={() => setDodgeDirection(0, 0)} class="app-button app-button-secondary">위</button>
              <button on:pointerdown={() => setDodgeDirection(-1, 0)} on:pointerup={() => setDodgeDirection(0, 0)} class="app-button app-button-secondary">왼쪽</button>
              <button on:pointerdown={() => setDodgeDirection(1, 0)} on:pointerup={() => setDodgeDirection(0, 0)} class="app-button app-button-secondary">오른쪽</button>
              <button on:pointerdown={() => setDodgeDirection(0, 1)} on:pointerup={() => setDodgeDirection(0, 0)} class="app-button app-button-secondary">아래</button>
            </div>

          {:else if challenge.type === "sliding-puzzle"}
            <div class="puzzle-grid" style={`--cols:${challenge.gridSize}`}>
              {#each puzzleTiles as tile, index}
                <button on:click={() => movePuzzleTile(index)} class:blank={tile === 0} class="puzzle-tile">
                  {tile || ""}
                </button>
              {/each}
            </div>
          {/if}

        {:else if gameStep === "result"}
          <div class="py-4 text-center">
            <div class="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[var(--gc-blue-tint)] text-2xl font-black text-[var(--gc-blue)]">
              {gameResult === "up" ? "UP" : gameResult === "down" ? "DN" : "-"}
            </div>
            <h4 class={`text-3xl font-black ${gameResult === "up" ? "text-[var(--green)]" : gameResult === "down" ? "text-[var(--red)]" : "text-[var(--text-secondary)]"}`}>
              {gameResult === "up" ? "등급 UP" : gameResult === "down" ? "등급 DOWN" : "변화 없음"}
            </h4>
            <p class="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{resultMessage}</p>

            {#if gameResult === "up"}
              <div class="app-stat-card mx-auto mt-4 max-w-sm px-4 py-4 text-sm">
                {nextGradeInfo.icon} {nextGradeInfo.label} 승급 보상으로 {formatGold(rewardGold)}를 획득합니다.
              </div>
            {:else if gameResult === "down"}
              <div class="app-stat-card mx-auto mt-4 max-w-sm border-l-[3px] border-[var(--red)] px-4 py-4 text-sm text-[var(--red)]">
                실패 패널티로 {failPenalty}단계 하락합니다.
              </div>
            {:else}
              <div class="app-stat-card mx-auto mt-4 max-w-sm px-4 py-4 text-sm">
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

<style>
  .grade-match-modal {
    display: flex;
    max-height: min(88vh, 52rem);
    flex-direction: column;
    padding: 0;
  }

  .grade-match-header {
    flex: 0 0 auto;
  }

  .grade-match-title {
    line-height: 1.2;
  }

  .grade-match-route {
    display: flex;
    min-width: 0;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    line-height: 1.35;
  }

  .grade-route-arrow {
    margin: 0 0.25rem;
  }

  .grade-match-body {
    flex: 1 1 auto;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .grade-intro-card {
    min-width: 0;
    overflow: hidden;
    border-radius: var(--radius-md);
    border: 1px solid var(--gc-divider);
    background: var(--gc-surface-2);
    color: var(--gc-ink);
    padding: 1rem;
  }

  .grade-intro-title,
  .grade-intro-subtitle {
    overflow-wrap: anywhere;
  }

  .grade-intro-details {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .grade-intro-stat {
    min-width: 0;
    overflow: hidden;
    border-radius: var(--radius-md);
    border: 1px solid var(--gc-divider);
    background: var(--gc-surface-2);
    padding: 0.85rem 0.75rem;
  }

  .grade-intro-stat strong,
  .grade-intro-stat span {
    display: block;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .grade-intro-stat strong {
    margin-top: 0.45rem;
    color: var(--gc-ink);
    font-size: clamp(0.95rem, 3.4vw, 1.15rem);
    line-height: 1.2;
  }

  .grade-intro-stat span {
    margin-top: 0.3rem;
    color: var(--text-secondary);
    font-size: 0.78rem;
    line-height: 1.3;
  }

  @media (max-width: 480px) {
    .grade-match-modal {
      max-height: calc(100dvh - 1.5rem);
    }

    .grade-match-header {
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.9rem 0.95rem 0.8rem;
    }

    .grade-match-eyebrow {
      display: none;
    }

    .grade-match-title {
      margin-top: 0;
      font-size: 1.18rem;
    }

    .grade-match-route {
      margin-top: 0.35rem;
      font-size: 0.78rem;
    }

    .grade-match-body {
      padding: 0.85rem 0.95rem max(0.95rem, env(safe-area-inset-bottom));
    }

    .grade-intro-card {
      padding: 0.75rem;
    }

    .grade-intro-card :global(.app-coin-icon) {
      height: 2.15rem;
      width: 2.15rem;
      flex: 0 0 auto;
    }

    .grade-intro-subtitle {
      font-size: 0.82rem;
      line-height: 1.35;
    }

    .grade-intro-details {
      margin-top: 0.6rem;
      gap: 0.45rem;
    }

    .grade-intro-stat {
      border-radius: 0.85rem;
      padding: 0.65rem 0.55rem;
    }

    .grade-intro-stat :global(.app-label) {
      font-size: 0.62rem;
      letter-spacing: 0.08em;
    }

    .grade-intro-stat strong {
      margin-top: 0.35rem;
      font-size: 0.86rem;
    }

    .grade-intro-stat span {
      display: none;
    }

    .grade-start-button {
      margin-top: 0.75rem;
      min-height: 2.75rem;
      padding-top: 0.7rem;
      padding-bottom: 0.7rem;
    }
  }

  .mini-grid,
  .color-grid,
  .puzzle-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    gap: 0.55rem;
  }

  .mini-card,
  .puzzle-tile {
    aspect-ratio: 1;
    border-radius: 0.8rem;
    border: 1px solid var(--gc-divider);
    background: var(--gc-surface-2);
    color: var(--gc-ink);
    font-size: clamp(1.15rem, 6vw, 2rem);
    font-weight: 800;
  }

  .mini-card.matched {
    border-color: var(--gc-green);
    background: rgba(24, 128, 56, 0.1);
    color: var(--gc-green);
  }

  .aim-arena {
    position: relative;
    height: min(58vh, 24rem);
    min-height: 18rem;
    overflow: hidden;
    border-radius: 1rem;
    border: 1px solid var(--gc-divider);
    background: linear-gradient(135deg, #ffffff, #f1f3f4);
  }

  .aim-target {
    position: absolute;
    display: grid;
    place-items: center;
    border-radius: 999px;
    border: 0;
    background: var(--gc-blue);
    color: #fff;
    font-weight: 800;
    box-shadow: var(--gc-shadow-4);
  }

  .aim-target.bomb {
    background: var(--gc-red);
  }

  .timing-track {
    position: relative;
    height: 4rem;
    overflow: hidden;
    border-radius: 999px;
    border: 1px solid var(--gc-divider);
    background: var(--gc-surface-2);
  }

  .timing-hitbox {
    position: absolute;
    left: calc(50% - var(--hit) / 2);
    top: 0.4rem;
    width: var(--hit);
    height: calc(100% - 0.8rem);
    border-radius: 999px;
    background: var(--gc-blue-tint);
    border: 1px solid var(--gc-blue);
  }

  .timing-pointer {
    position: absolute;
    top: 0;
    width: 0.35rem;
    height: 100%;
    border-radius: 999px;
    background: var(--gc-ink);
    transform: translateX(-50%);
  }

  .simon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
    gap: 0.75rem;
  }

  .simon-button {
    min-height: 5.5rem;
    border-radius: 1rem;
    border: 1px solid var(--gc-divider);
    background: color-mix(in srgb, var(--simon) 18%, white);
    color: var(--gc-ink);
    font-size: 1.3rem;
    font-weight: 800;
    transition: transform 120ms ease, background 120ms ease;
  }

  .simon-button.active {
    background: var(--simon);
    color: #fff;
    transform: scale(1.04);
  }

  .color-tile {
    aspect-ratio: 1;
    border: 0;
    border-radius: 0.45rem;
  }

  .typing-word {
    border-radius: 1rem;
    border: 1px solid var(--gc-divider);
    background: var(--gc-surface-2);
    padding: 1.25rem;
    text-align: center;
    font-size: clamp(1.35rem, 7vw, 2.35rem);
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  .game-canvas {
    display: block;
    width: 100%;
    max-height: 58vh;
    border-radius: 1rem;
    border: 1px solid var(--gc-divider);
    background: var(--gc-surface-2);
  }

  .move-pad {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .puzzle-tile.blank {
    background: var(--gc-canvas);
    border-style: dashed;
    color: transparent;
  }

  @media (max-width: 430px) {
    .aim-arena {
      min-height: 15rem;
    }

    .simon-button {
      min-height: 4.4rem;
    }
  }
</style>
