import type { CharacterGrade, LegacyCharacterGrade } from './types';

/**
 * Nike Design System color ramp for RPG rank badges.
 * Only 8 accent colors from Nike Podium CDS ramp are used.
 *
 * Mapping:
 *  Rank01-02  → Red    (#D30005)
 *  Rank03-04  → Orange Badge (#D33918)
 *  Rank05     → Yellow (#FCA600)
 *  Rank06-07  → Green  (#007D48)
 *  Rank08-09  → Teal   (#008E98)
 *  Rank10-12  → Blue   (#1151FF)
 *  Rank13-15  → Purple (#6E0FF6)
 *  Rank16-20  → Pink   (#ED1AA0)
 */
export type RankAccent =
  | 'rank-accent-red'
  | 'rank-accent-orange'
  | 'rank-accent-yellow'
  | 'rank-accent-green'
  | 'rank-accent-teal'
  | 'rank-accent-blue'
  | 'rank-accent-purple'
  | 'rank-accent-pink';

export type GradeChallengeType =
  | 'memory-match'
  | 'aim-trainer'
  | 'timing-bar'
  | 'simon-says'
  | 'color-spotter'
  | 'word-typing'
  | 'mental-math'
  | 'catch-drop'
  | 'dodge-blocks'
  | 'sliding-puzzle';

interface BaseGradeChallengeConfig {
  type: GradeChallengeType;
  stage: number;
  difficulty: number;
  title: string;
  subtitle: string;
  instructions: string;
}

interface MemoryMatchChallengeConfig extends BaseGradeChallengeConfig {
  type: 'memory-match';
  cardPairs: number;
  revealMs: number;
  trapCards: number;
}

interface AimTrainerChallengeConfig extends BaseGradeChallengeConfig {
  type: 'aim-trainer';
  targetCount: number;
  targetSize: number;
  targetTtlMs: number;
  moving: boolean;
  bombCount: number;
}

interface TimingBarChallengeConfig extends BaseGradeChallengeConfig {
  type: 'timing-bar';
  speed: number;
  hitboxPercent: number;
  erratic: boolean;
}

interface SimonSaysChallengeConfig extends BaseGradeChallengeConfig {
  type: 'simon-says';
  buttonCount: number;
  sequenceLength: number;
  flashMs: number;
  reverse: boolean;
}

interface ColorSpotterChallengeConfig extends BaseGradeChallengeConfig {
  type: 'color-spotter';
  gridSize: number;
  colorGap: number;
}

interface WordTypingChallengeConfig extends BaseGradeChallengeConfig {
  type: 'word-typing';
  words: string[];
  timeLimitMs: number;
}

interface MentalMathChallengeConfig extends BaseGradeChallengeConfig {
  type: 'mental-math';
  questionCount: number;
  maxNumber: number;
  timeLimitMs: number;
  operators: Array<'+' | '-' | '*' | '/'>;
  compound: boolean;
}

interface CatchDropChallengeConfig extends BaseGradeChallengeConfig {
  type: 'catch-drop';
  durationMs: number;
  dropIntervalMs: number;
  dropSpeed: number;
  hazardRate: number;
}

interface DodgeBlocksChallengeConfig extends BaseGradeChallengeConfig {
  type: 'dodge-blocks';
  durationMs: number;
  startDelayMs: number;
  blockCount: number;
  blockSpeed: number;
  homing: boolean;
  safeZoneScale: number;
}

interface SlidingPuzzleChallengeConfig extends BaseGradeChallengeConfig {
  type: 'sliding-puzzle';
  gridSize: number;
  shuffleMoves: number;
  timeLimitMs: number;
  blind: boolean;
}

export type GradeChallengeConfig =
  | MemoryMatchChallengeConfig
  | AimTrainerChallengeConfig
  | TimingBarChallengeConfig
  | SimonSaysChallengeConfig
  | ColorSpotterChallengeConfig
  | WordTypingChallengeConfig
  | MentalMathChallengeConfig
  | CatchDropChallengeConfig
  | DodgeBlocksChallengeConfig
  | SlidingPuzzleChallengeConfig;

export const GRADE_ORDER: CharacterGrade[] = [
  'Rank01',
  'Rank02',
  'Rank03',
  'Rank04',
  'Rank05',
  'Rank06',
  'Rank07',
  'Rank08',
  'Rank09',
  'Rank10',
  'Rank11',
  'Rank12',
  'Rank13',
  'Rank14',
  'Rank15',
  'Rank16',
  'Rank17',
  'Rank18',
  'Rank19',
  'Rank20'
];

// Rank level → Nike accent CSS class (defined before use)
const RANK_ACCENTS: Record<number, RankAccent> = {
  1: 'rank-accent-red',    2: 'rank-accent-red',
  3: 'rank-accent-orange', 4: 'rank-accent-orange',
  5: 'rank-accent-yellow',
  6: 'rank-accent-green',  7: 'rank-accent-green',
  8: 'rank-accent-teal',   9: 'rank-accent-teal',
  10: 'rank-accent-blue',  11: 'rank-accent-blue', 12: 'rank-accent-blue',
  13: 'rank-accent-purple', 14: 'rank-accent-purple', 15: 'rank-accent-purple',
  16: 'rank-accent-pink',  17: 'rank-accent-pink',
  18: 'rank-accent-pink',  19: 'rank-accent-pink',  20: 'rank-accent-pink',
};

function formatGradeIcon(level: number) {
  return level.toString().padStart(2, '0');
}

function challengeTier(level: number) {
  return level % 2 === 0 ? 2 : 1;
}

function createGradeChallenge(level: number): GradeChallengeConfig {
  const stage = Math.min(10, Math.max(1, Math.ceil(level / 2)));
  const tier = challengeTier(level);
  const difficulty = Math.min(10, stage + tier - 1);

  switch (stage) {
    case 1:
      return {
        type: 'memory-match',
        stage,
        difficulty,
        title: '카드 짝맞추기',
        subtitle: `${tier === 1 ? '2쌍' : '3쌍'}의 카드 위치를 기억하세요.`,
        instructions: '처음 잠깐 공개되는 카드를 기억한 뒤 같은 문양의 짝을 모두 찾으면 승급합니다.',
        cardPairs: tier === 1 ? 2 : 3,
        revealMs: tier === 1 ? 1600 : 1200,
        trapCards: 0
      };
    case 2:
      return {
        type: 'aim-trainer',
        stage,
        difficulty,
        title: '타겟 클릭',
        subtitle: '나타나는 타겟을 빠르게 클릭하세요.',
        instructions: '제한 시간 안에 모든 타겟을 맞히면 승급합니다. 높은 등급에서는 타겟이 작아지고 사라지는 시간이 짧아집니다.',
        targetCount: tier === 1 ? 5 : 7,
        targetSize: tier === 1 ? 58 : 46,
        targetTtlMs: tier === 1 ? 1300 : 1000,
        moving: false,
        bombCount: 0
      };
    case 3:
      return {
        type: 'timing-bar',
        stage,
        difficulty,
        title: '타이밍 캐치',
        subtitle: '움직이는 포인터를 목표 구간에 멈추세요.',
        instructions: '포인터가 파란 목표 구간 안에 있을 때 멈추면 승급합니다.',
        speed: tier === 1 ? 1.25 : 1.7,
        hitboxPercent: tier === 1 ? 22 : 16,
        erratic: false
      };
    case 4:
      return {
        type: 'simon-says',
        stage,
        difficulty,
        title: '순서 기억하기',
        subtitle: '반짝인 순서를 그대로 입력하세요.',
        instructions: '제시된 버튼 점등 순서를 기억해 같은 순서로 누르면 승급합니다.',
        buttonCount: tier === 1 ? 4 : 5,
        sequenceLength: tier === 1 ? 4 : 5,
        flashMs: tier === 1 ? 520 : 420,
        reverse: false
      };
    case 5:
      return {
        type: 'color-spotter',
        stage,
        difficulty,
        title: '다른 색깔 찾기',
        subtitle: '한 칸만 미묘하게 다른 색을 찾으세요.',
        instructions: '격자 안에서 색이 다른 타일 하나를 클릭하면 승급합니다.',
        gridSize: tier === 1 ? 5 : 6,
        colorGap: tier === 1 ? 20 : 14
      };
    case 6:
      return {
        type: 'word-typing',
        stage,
        difficulty,
        title: '스피드 타이핑',
        subtitle: '표시된 단어를 정확히 입력하세요.',
        instructions: '제한 시간 안에 모든 문자열을 정확히 입력하면 승급합니다.',
        words: tier === 1 ? ['guild', 'quest', 'rank'] : ['arcane-7', 'party_up', 'Rank#12'],
        timeLimitMs: tier === 1 ? 18000 : 15000
      };
    case 7:
      return {
        type: 'mental-math',
        stage,
        difficulty,
        title: '사칙연산 암산',
        subtitle: '수식을 보고 정답을 입력하세요.',
        instructions: '짧은 제한 시간 안에 모든 수식의 정답을 맞히면 승급합니다.',
        questionCount: tier === 1 ? 3 : 4,
        maxNumber: tier === 1 ? 18 : 35,
        timeLimitMs: tier === 1 ? 22000 : 18000,
        operators: tier === 1 ? ['+', '-', '*'] : ['+', '-', '*', '/'],
        compound: tier === 2
      };
    case 8:
      return {
        type: 'catch-drop',
        stage,
        difficulty,
        title: '떨어지는 아이템 받기',
        subtitle: '바구니를 움직여 보상을 받아내세요.',
        instructions: '좌우 이동 버튼으로 목표 아이템을 받고 붉은 방해물은 피하세요.',
        durationMs: 12000,
        dropIntervalMs: tier === 1 ? 900 : 680,
        dropSpeed: tier === 1 ? 2.2 : 3,
        hazardRate: tier === 1 ? 0.22 : 0.34
      };
    case 9:
      return {
        type: 'dodge-blocks',
        stage,
        difficulty,
        title: '장애물 피하기',
        subtitle: '날아오는 블록을 피해 생존하세요.',
        instructions: '이동 버튼으로 캐릭터를 조작해 제한 시간 동안 살아남으면 승급합니다.',
        durationMs: tier === 1 ? 10000 : 11000,
        startDelayMs: tier === 1 ? 1500 : 2000,
        blockCount: tier === 1 ? 4 : 5,
        blockSpeed: tier === 1 ? 1.4 : 1.7,
        homing: tier === 2,
        safeZoneScale: 1
      };
    default:
      return {
        type: 'sliding-puzzle',
        stage,
        difficulty,
        title: '슬라이딩 퍼즐',
        subtitle: '섞인 조각을 원래 순서로 맞추세요.',
        instructions: '빈칸 주변 타일을 눌러 순서를 맞추면 승급합니다.',
        gridSize: tier === 1 ? 3 : 4,
        shuffleMoves: tier === 1 ? 18 : 32,
        timeLimitMs: tier === 1 ? 60000 : 75000,
        blind: tier === 2
      };
  }
}

export const GRADE_INFO: Record<
  CharacterGrade,
  {
    level: number;
    label: string;
    title: string;
    icon: string;
    accent: RankAccent;
    rewardGold: number;
    failPenalty: number;
    challenge: GradeChallengeConfig;
  }
> = {
  Rank01: {
    level: 1, label: '수련병',     title: '본부의 신입',   icon: formatGradeIcon(1),  accent: RANK_ACCENTS[1],  rewardGold: 0,  failPenalty: 0,
    challenge: createGradeChallenge(1)
  },
  Rank02: {
    level: 2, label: '견습 전사',   title: '강철의 새싹',   icon: formatGradeIcon(2),  accent: RANK_ACCENTS[2],  rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(2)
  },
  Rank03: {
    level: 3, label: '철검 병사',   title: '훈련장 생존자', icon: formatGradeIcon(3),  accent: RANK_ACCENTS[3],  rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(3)
  },
  Rank04: {
    level: 4, label: '청동 선봉',   title: '전선의 선발대', icon: formatGradeIcon(4),  accent: RANK_ACCENTS[4],  rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(4)
  },
  Rank05: {
    level: 5, label: '은빛 추적자', title: '안개 추적자',   icon: formatGradeIcon(5),  accent: RANK_ACCENTS[5],  rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(5)
  },
  Rank06: {
    level: 6, label: '황금 결투가', title: '투기장의 황금빛', icon: formatGradeIcon(6), accent: RANK_ACCENTS[6],  rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(6)
  },
  Rank07: {
    level: 7, label: '백금 수호자', title: '룬벽 수호자',   icon: formatGradeIcon(7),  accent: RANK_ACCENTS[7],  rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(7)
  },
  Rank08: {
    level: 8, label: '수정 척후병', title: '유리날 정찰자', icon: formatGradeIcon(8),  accent: RANK_ACCENTS[8],  rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(8)
  },
  Rank09: {
    level: 9, label: '정예 전술가', title: '판세 읽는 자',  icon: formatGradeIcon(9),  accent: RANK_ACCENTS[9],  rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(9)
  },
  Rank10: {
    level: 10, label: '왕관 기사',  title: '왕관의 검',     icon: formatGradeIcon(10), accent: RANK_ACCENTS[10], rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(10)
  },
  Rank11: {
    level: 11, label: '룬 감시자',  title: '봉인 감시관',   icon: formatGradeIcon(11), accent: RANK_ACCENTS[11], rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(11)
  },
  Rank12: {
    level: 12, label: '폭풍 지휘관', title: '천둥의 지휘봉', icon: formatGradeIcon(12), accent: RANK_ACCENTS[12], rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(12)
  },
  Rank13: {
    level: 13, label: '심연 사냥꾼', title: '심연의 송곳니', icon: formatGradeIcon(13), accent: RANK_ACCENTS[13], rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(13)
  },
  Rank14: {
    level: 14, label: '성광 집행자', title: '성역의 심판자', icon: formatGradeIcon(14), accent: RANK_ACCENTS[14], rewardGold: 1,  failPenalty: 1,
    challenge: createGradeChallenge(14)
  },
  Rank15: {
    level: 15, label: '천공 파수꾼', title: '하늘문 수문장', icon: formatGradeIcon(15), accent: RANK_ACCENTS[15], rewardGold: 1,  failPenalty: 2,
    challenge: createGradeChallenge(15)
  },
  Rank16: {
    level: 16, label: '혼돈 정복자', title: '혼돈의 굴레 파괴자', icon: formatGradeIcon(16), accent: RANK_ACCENTS[16], rewardGold: 1, failPenalty: 2,
    challenge: createGradeChallenge(16)
  },
  Rank17: {
    level: 17, label: '초월 군주',  title: '차원을 밟는 왕', icon: formatGradeIcon(17), accent: RANK_ACCENTS[17], rewardGold: 1,  failPenalty: 2,
    challenge: createGradeChallenge(17)
  },
  Rank18: {
    level: 18, label: '신화의 화신', title: '신화의 현신',  icon: formatGradeIcon(18), accent: RANK_ACCENTS[18], rewardGold: 1,  failPenalty: 2,
    challenge: createGradeChallenge(18)
  },
  Rank19: {
    level: 19, label: '별의 계승자', title: '성좌의 후계자', icon: formatGradeIcon(19), accent: RANK_ACCENTS[19], rewardGold: 1,  failPenalty: 2,
    challenge: createGradeChallenge(19)
  },
  Rank20: {
    level: 20, label: '길드의 신',  title: '영원의 길드마스터', icon: formatGradeIcon(20), accent: RANK_ACCENTS[20], rewardGold: 50, failPenalty: 0,
    challenge: createGradeChallenge(20)
  }
};

const LEGACY_GRADE_MAP: Record<LegacyCharacterGrade, CharacterGrade> = {
  Bronze: 'Rank01', Silver: 'Rank01', Gold: 'Rank01',
  Platinum: 'Rank01', Diamond: 'Rank01',
  Master: 'Rank01', GrandMaster: 'Rank01', God: 'Rank01'
};

export function normalizeGrade(grade?: string | null): CharacterGrade {
  if (!grade) return 'Rank01';
  if (grade in GRADE_INFO) return grade as CharacterGrade;
  if (grade in LEGACY_GRADE_MAP) return LEGACY_GRADE_MAP[grade as LegacyCharacterGrade];
  return 'Rank01';
}

export function getGradeInfo(grade?: string | null) {
  return GRADE_INFO[normalizeGrade(grade)];
}

export function getGradeIndex(grade?: string | null) {
  return GRADE_ORDER.indexOf(normalizeGrade(grade));
}

export function isMaxGrade(grade?: string | null) {
  return normalizeGrade(grade) === GRADE_ORDER[GRADE_ORDER.length - 1];
}

export function getGradeChallenge(grade?: string | null) {
  return getGradeInfo(grade).challenge;
}

export function getGradeRewardGold(grade?: string | null) {
  return getGradeInfo(grade).rewardGold;
}

export function getGradePenaltySteps(grade?: string | null) {
  return getGradeInfo(grade).failPenalty;
}

export function getGradeTitle(grade?: string | null) {
  return getGradeInfo(grade).title;
}
