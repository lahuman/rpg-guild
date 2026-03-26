import type { CharacterGrade, LegacyCharacterGrade } from './types';

export type GradeChallengeType = 'rps' | 'box' | 'highlow' | 'memory';

interface RpsChallengeConfig {
    type: 'rps';
    title: string;
    subtitle: string;
    instructions: string;
    rounds: number;
    targetWins: number;
    maxLosses: number;
}

interface BoxChallengeConfig {
    type: 'box';
    title: string;
    subtitle: string;
    instructions: string;
    boxCount: number;
    outcomes: Array<'up' | 'stay' | 'down'>;
}

interface HighLowChallengeConfig {
    type: 'highlow';
    title: string;
    subtitle: string;
    instructions: string;
    rounds: number;
    rangeMax: number;
}

interface MemoryChallengeConfig {
    type: 'memory';
    title: string;
    subtitle: string;
    instructions: string;
    length: number;
    runePool: number;
    revealMs: number;
    reverse: boolean;
}

export type GradeChallengeConfig =
    | RpsChallengeConfig
    | BoxChallengeConfig
    | HighLowChallengeConfig
    | MemoryChallengeConfig;

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

function formatGradeIcon(level: number) {
    return level.toString().padStart(2, '0');
}

export const GRADE_INFO: Record<
    CharacterGrade,
    {
        level: number;
        label: string;
        title: string;
        icon: string;
        color: string;
        rewardGold: number;
        failPenalty: number;
        challenge: GradeChallengeConfig;
    }
> = {
    Rank01: {
        level: 1,
        label: '수련병',
        title: '본부의 신입',
        icon: formatGradeIcon(1),
        color: 'text-orange-300',
        rewardGold: 0,
        failPenalty: 0,
        challenge: {
            type: 'rps',
            title: '초급 결투',
            subtitle: '한 번의 결투에서 승리하세요.',
            instructions: '가위바위보 1승만 먼저 만들면 승급합니다.',
            rounds: 1,
            targetWins: 1,
            maxLosses: 0
        }
    },
    Rank02: {
        level: 2,
        label: '견습 전사',
        title: '강철의 새싹',
        icon: formatGradeIcon(2),
        color: 'text-orange-200',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'rps',
            title: '연속 승부',
            subtitle: '세 판 안에 두 번 이겨야 합니다.',
            instructions: '3판 제한, 2승 1패 구조입니다.',
            rounds: 3,
            targetWins: 2,
            maxLosses: 1
        }
    },
    Rank03: {
        level: 3,
        label: '철검 병사',
        title: '훈련장 생존자',
        icon: formatGradeIcon(3),
        color: 'text-amber-300',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'rps',
            title: '숙련 결투',
            subtitle: '다섯 판 안에 세 번 승리하세요.',
            instructions: '무승부는 흐름을 끊지만 승부 판수에는 포함됩니다.',
            rounds: 5,
            targetWins: 3,
            maxLosses: 2
        }
    },
    Rank04: {
        level: 4,
        label: '청동 선봉',
        title: '전선의 선발대',
        icon: formatGradeIcon(4),
        color: 'text-amber-200',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'rps',
            title: '선봉 시험',
            subtitle: '일곱 판 안에 네 번 승리해야 합니다.',
            instructions: '후반부로 갈수록 실수가 치명적입니다.',
            rounds: 7,
            targetWins: 4,
            maxLosses: 3
        }
    },
    Rank05: {
        level: 5,
        label: '은빛 추적자',
        title: '안개 추적자',
        icon: formatGradeIcon(5),
        color: 'text-slate-200',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'box',
            title: '세 갈래 상자',
            subtitle: '3개의 상자 중 승급 상자를 찾으세요.',
            instructions: '승급 1개, 유지 1개, 강등 1개가 섞여 있습니다.',
            boxCount: 3,
            outcomes: ['up', 'stay', 'down']
        }
    },
    Rank06: {
        level: 6,
        label: '황금 결투가',
        title: '투기장의 황금빛',
        icon: formatGradeIcon(6),
        color: 'text-yellow-300',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'box',
            title: '혼선 상자',
            subtitle: '4개의 상자 중 하나만 승급입니다.',
            instructions: '승급 1개, 유지 1개, 강등 2개입니다.',
            boxCount: 4,
            outcomes: ['up', 'stay', 'down', 'down']
        }
    },
    Rank07: {
        level: 7,
        label: '백금 수호자',
        title: '룬벽 수호자',
        icon: formatGradeIcon(7),
        color: 'text-cyan-200',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'box',
            title: '심층 상자',
            subtitle: '5개의 상자에서 정답은 하나뿐입니다.',
            instructions: '승급 1개, 유지 1개, 강등 3개입니다.',
            boxCount: 5,
            outcomes: ['up', 'stay', 'down', 'down', 'down']
        }
    },
    Rank08: {
        level: 8,
        label: '수정 척후병',
        title: '유리날 정찰자',
        icon: formatGradeIcon(8),
        color: 'text-cyan-300',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'box',
            title: '절망 상자',
            subtitle: '6개의 상자에서 승급 상자를 고르세요.',
            instructions: '승급은 단 하나, 나머지는 모두 강등입니다.',
            boxCount: 6,
            outcomes: ['up', 'down', 'down', 'down', 'down', 'down']
        }
    },
    Rank09: {
        level: 9,
        label: '정예 전술가',
        title: '판세 읽는 자',
        icon: formatGradeIcon(9),
        color: 'text-sky-300',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'highlow',
            title: '예측 시험 I',
            subtitle: '2번 연속 숫자 흐름을 맞히세요.',
            instructions: '1부터 10 사이 숫자가 다음에 더 높을지 낮을지 예측합니다.',
            rounds: 2,
            rangeMax: 10
        }
    },
    Rank10: {
        level: 10,
        label: '왕관 기사',
        title: '왕관의 검',
        icon: formatGradeIcon(10),
        color: 'text-sky-200',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'highlow',
            title: '예측 시험 II',
            subtitle: '3번 연속 예측에 성공해야 합니다.',
            instructions: '숫자 범위가 넓어지고 연속 성공이 요구됩니다.',
            rounds: 3,
            rangeMax: 14
        }
    },
    Rank11: {
        level: 11,
        label: '룬 감시자',
        title: '봉인 감시관',
        icon: formatGradeIcon(11),
        color: 'text-blue-300',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'highlow',
            title: '예측 시험 III',
            subtitle: '3번 연속 예측, 숫자 범위 20.',
            instructions: '숫자 범위가 커져 오판 가능성이 높아집니다.',
            rounds: 3,
            rangeMax: 20
        }
    },
    Rank12: {
        level: 12,
        label: '폭풍 지휘관',
        title: '천둥의 지휘봉',
        icon: formatGradeIcon(12),
        color: 'text-blue-200',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'highlow',
            title: '예측 시험 IV',
            subtitle: '4번 연속 예측에 성공해야 합니다.',
            instructions: '길어진 연속 판정에서 집중력을 유지하세요.',
            rounds: 4,
            rangeMax: 24
        }
    },
    Rank13: {
        level: 13,
        label: '심연 사냥꾼',
        title: '심연의 송곳니',
        icon: formatGradeIcon(13),
        color: 'text-fuchsia-300',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'memory',
            title: '룬 기억 I',
            subtitle: '3개 룬 순서를 그대로 재현하세요.',
            instructions: '보여준 순서를 그대로 입력해야 승급합니다.',
            length: 3,
            runePool: 4,
            revealMs: 1700,
            reverse: false
        }
    },
    Rank14: {
        level: 14,
        label: '성광 집행자',
        title: '성역의 심판자',
        icon: formatGradeIcon(14),
        color: 'text-fuchsia-200',
        rewardGold: 1,
        failPenalty: 1,
        challenge: {
            type: 'memory',
            title: '룬 기억 II',
            subtitle: '4개 룬 순서를 그대로 재현하세요.',
            instructions: '룬 수가 늘어나며 헷갈리는 문양이 추가됩니다.',
            length: 4,
            runePool: 5,
            revealMs: 1600,
            reverse: false
        }
    },
    Rank15: {
        level: 15,
        label: '천공 파수꾼',
        title: '하늘문 수문장',
        icon: formatGradeIcon(15),
        color: 'text-purple-300',
        rewardGold: 1,
        failPenalty: 2,
        challenge: {
            type: 'memory',
            title: '룬 기억 III',
            subtitle: '5개 룬 순서를 정확히 기억하세요.',
            instructions: '짧은 시간 안에 긴 패턴을 암기해야 합니다.',
            length: 5,
            runePool: 6,
            revealMs: 1550,
            reverse: false
        }
    },
    Rank16: {
        level: 16,
        label: '혼돈 정복자',
        title: '혼돈의 굴레 파괴자',
        icon: formatGradeIcon(16),
        color: 'text-violet-300',
        rewardGold: 1,
        failPenalty: 2,
        challenge: {
            type: 'memory',
            title: '룬 기억 IV',
            subtitle: '6개 룬 순서를 그대로 재현하세요.',
            instructions: '암기량과 속도 모두 요구되는 구간입니다.',
            length: 6,
            runePool: 7,
            revealMs: 1450,
            reverse: false
        }
    },
    Rank17: {
        level: 17,
        label: '초월 군주',
        title: '차원을 밟는 왕',
        icon: formatGradeIcon(17),
        color: 'text-violet-200',
        rewardGold: 1,
        failPenalty: 2,
        challenge: {
            type: 'memory',
            title: '역행 룬 I',
            subtitle: '보인 순서를 거꾸로 입력하세요.',
            instructions: '이제부터는 역순 복기가 필요합니다.',
            length: 4,
            runePool: 5,
            revealMs: 1400,
            reverse: true
        }
    },
    Rank18: {
        level: 18,
        label: '신화의 화신',
        title: '신화의 현신',
        icon: formatGradeIcon(18),
        color: 'text-rose-300',
        rewardGold: 1,
        failPenalty: 2,
        challenge: {
            type: 'memory',
            title: '역행 룬 II',
            subtitle: '5개 룬을 역순으로 입력하세요.',
            instructions: '단순 암기가 아니라 재구성이 필요한 시험입니다.',
            length: 5,
            runePool: 6,
            revealMs: 1350,
            reverse: true
        }
    },
    Rank19: {
        level: 19,
        label: '별의 계승자',
        title: '성좌의 후계자',
        icon: formatGradeIcon(19),
        color: 'text-rose-200',
        rewardGold: 1,
        failPenalty: 2,
        challenge: {
            type: 'memory',
            title: '역행 룬 III',
            subtitle: '6개 룬을 역순으로 재현하세요.',
            instructions: '거의 마지막 관문입니다. 실수 한 번이 강등으로 이어집니다.',
            length: 6,
            runePool: 7,
            revealMs: 1250,
            reverse: true
        }
    },
    Rank20: {
        level: 20,
        label: '길드의 신',
        title: '영원의 길드마스터',
        icon: formatGradeIcon(20),
        color: 'text-indigo-200 font-black',
        rewardGold: 50,
        failPenalty: 0,
        challenge: {
            type: 'memory',
            title: '최종 위업',
            subtitle: '최고 등급에 도달했습니다.',
            instructions: '이 등급은 더 이상 승급 대상이 아닙니다.',
            length: 7,
            runePool: 8,
            revealMs: 1200,
            reverse: true
        }
    }
};

const LEGACY_GRADE_MAP: Record<LegacyCharacterGrade, CharacterGrade> = {
    Bronze: 'Rank01',
    Silver: 'Rank01',
    Gold: 'Rank01',
    Platinum: 'Rank01',
    Diamond: 'Rank01',
    Master: 'Rank01',
    GrandMaster: 'Rank01',
    God: 'Rank01'
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
