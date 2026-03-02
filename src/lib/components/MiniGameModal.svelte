<script lang="ts">
    import { guildStore } from '$lib/stores/guildStore';
    import { createEventDispatcher } from 'svelte';

    export let guildId: string;
    export let characterId: string;
    export let characterName: string;

    const dispatch = createEventDispatcher();
    
    type GameType = 'rps' | 'box' | 'highlow';
    let currentGame: GameType | null = null;
    let gameStep: 'intro' | 'playing' | 'result' = 'intro';
    let gameResult: 'up' | 'down' | 'stay' = 'stay';
    let resultMessage = '';
    let isSubmitting = false;

    // 게임 데이터
    const games = [
        { id: 'rps', name: '가위바위보', desc: '몬스터와 대결하여 등급을 쟁취하세요!', icon: '✊' },
        { id: 'box', name: '운명의 상자', desc: '3개의 상자 중 등급 업이 들어있는 상자는?', icon: '🎁' },
        { id: 'highlow', name: '숫자 높낮이', desc: '다음에 나올 숫자가 더 클까요, 작을까요?', icon: '🔢' }
    ];

    function selectGame(id: GameType) {
        currentGame = id;
        gameStep = 'playing';
        initGame();
    }

    // --- 가위바위보 로직 ---
    let userChoice = '';
    let cpuChoice = '';
    function playRPS(choice: string) {
        const options = ['가위', '바위', '보'];
        userChoice = choice;
        cpuChoice = options[Math.floor(Math.random() * 3)];
        
        if (userChoice === cpuChoice) {
            gameResult = 'stay';
            resultMessage = `비겼습니다! (${userChoice} vs ${cpuChoice})`;
        } else if (
            (userChoice === '가위' && cpuChoice === '보') ||
            (userChoice === '바위' && cpuChoice === '가위') ||
            (userChoice === '보' && cpuChoice === '바위')
        ) {
            gameResult = 'up';
            resultMessage = `승리! 등급이 상승합니다! (${userChoice} vs ${cpuChoice})`;
        } else {
            gameResult = 'down';
            resultMessage = `패배... 등급이 하락합니다. (${userChoice} vs ${cpuChoice})`;
        }
        gameStep = 'result';
    }

    // --- 운명의 상자 로직 ---
    function openBox(index: number) {
        const outcomes: ('up' | 'down' | 'stay')[] = ['up', 'down', 'stay'];
        const shuffled = outcomes.sort(() => Math.random() - 0.5);
        gameResult = shuffled[index];
        
        if (gameResult === 'up') resultMessage = "축하합니다! 황금 등급권을 찾았습니다!";
        else if (gameResult === 'down') resultMessage = "앗! 저주받은 상자였습니다...";
        else resultMessage = "평범한 빈 상자였습니다. 등급이 유지됩니다.";
        
        gameStep = 'result';
    }

    // --- 숫자 높낮이 로직 ---
    let currentNum = 0;
    function initGame() {
        if (currentGame === 'highlow') currentNum = Math.floor(Math.random() * 10) + 1;
    }
    function playHighLow(guess: 'high' | 'low') {
        const nextNum = Math.floor(Math.random() * 10) + 1;
        const isCorrect = guess === 'high' ? nextNum > currentNum : nextNum < currentNum;
        
        if (nextNum === currentNum) {
            gameResult = 'stay';
            resultMessage = `숫자가 같습니다(${nextNum})! 등급이 유지됩니다.`;
        } else if (isCorrect) {
            gameResult = 'up';
            resultMessage = `정답입니다! 다음 숫자는 ${nextNum}였습니다!`;
        } else {
            gameResult = 'down';
            resultMessage = `틀렸습니다... 다음 숫자는 ${nextNum}였습니다.`;
        }
        gameStep = 'result';
    }

    async function finishGame() {
        if (isSubmitting) return;
        isSubmitting = true;
        try {
            await guildStore.updateGrade(guildId, characterId, gameResult);
            dispatch('close');
        } catch (e) {
            alert(e.message);
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div class="bg-slate-900 border-2 border-indigo-500 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_30px_rgba(79,70,229,0.3)]">
        <!-- Header -->
        <div class="bg-indigo-600 p-4 flex justify-between items-center">
            <h3 class="text-white font-bold text-lg">🎖️ {characterName}의 등급전</h3>
            <button on:click={() => dispatch('close')} class="text-white/80 hover:text-white">✕</button>
        </div>

        <div class="p-6">
            {#if gameStep === 'intro'}
                <div class="text-center mb-6">
                    <p class="text-slate-300 mb-2">오늘의 운을 시험하여 등급을 높이세요!</p>
                    <p class="text-xs text-rose-400 font-bold">* 패배 시 등급이 하락할 수 있습니다.</p>
                </div>
                <div class="grid gap-3">
                    {#each games as game}
                        <button 
                            on:click={() => selectGame(game.id)}
                            class="flex items-center gap-4 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 rounded-xl transition-all group"
                        >
                            <span class="text-3xl group-hover:scale-110 transition-transform">{game.icon}</span>
                            <div class="text-left">
                                <div class="text-white font-bold">{game.name}</div>
                                <div class="text-xs text-slate-400">{game.desc}</div>
                            </div>
                        </button>
                    {/each}
                </div>

            {:else if gameStep === 'playing'}
                {#if currentGame === 'rps'}
                    <div class="text-center py-8">
                        <div class="text-5xl mb-8 animate-bounce">👾</div>
                        <div class="grid grid-cols-3 gap-4">
                            {#each ['가위', '바위', '보'] as item}
                                <button on:click={() => playRPS(item)} class="p-4 bg-slate-800 border-2 border-slate-600 rounded-xl hover:border-indigo-500 text-white text-xl">
                                    {item === '가위' ? '✌️' : item === '바위' ? '✊' : '✋'}<br/>
                                    <span class="text-sm">{item}</span>
                                </button>
                            {/each}
                        </div>
                    </div>
                {:else if currentGame === 'box'}
                    <div class="text-center py-8">
                        <div class="grid grid-cols-3 gap-4">
                            {#each [0, 1, 2] as i}
                                <button on:click={() => openBox(i)} class="text-6xl hover:scale-110 transition-transform duration-200">🎁</button>
                            {/each}
                        </div>
                        <p class="mt-8 text-slate-400">하나의 상자를 선택하세요...</p>
                    </div>
                {:else if currentGame === 'highlow'}
                    <div class="text-center py-8">
                        <div class="text-sm text-slate-400 mb-2">현재 숫자</div>
                        <div class="text-7xl font-black text-indigo-400 mb-8">{currentNum}</div>
                        <div class="flex gap-4">
                            <button on:click={() => playHighLow('low')} class="flex-1 p-4 bg-rose-900/40 border-2 border-rose-500 rounded-xl text-rose-200 font-bold hover:bg-rose-900/60">
                                LOW (작음)
                            </button>
                            <button on:click={() => playHighLow('high')} class="flex-1 p-4 bg-emerald-900/40 border-2 border-emerald-500 rounded-xl text-emerald-200 font-bold hover:bg-emerald-900/60">
                                HIGH (큼)
                            </button>
                        </div>
                    </div>
                {/if}

            {:else if gameStep === 'result'}
                <div class="text-center py-8">
                    <div class="text-6xl mb-6">
                        {gameResult === 'up' ? '🎊' : gameResult === 'down' ? '💀' : '😐'}
                    </div>
                    <h4 class="text-2xl font-black mb-2 {gameResult === 'up' ? 'text-yellow-400' : gameResult === 'down' ? 'text-rose-500' : 'text-slate-400'}">
                        {gameResult === 'up' ? '등급 UP!' : gameResult === 'down' ? '등급 DOWN...' : '변화 없음'}
                    </h4>
                    <p class="text-slate-300 mb-8">{resultMessage}</p>
                    <button 
                        on:click={finishGame}
                        disabled={isSubmitting}
                        class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20"
                    >
                        {isSubmitting ? '기록 중...' : '확인'}
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>