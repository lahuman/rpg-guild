import { getGradeInfo } from './constants';
import type {
    CharacterAppearance,
    CharacterAura,
    CharacterBackdrop,
    CharacterFrame,
    CharacterPortrait,
    GuildCharacter,
    JobClass
} from './types';

export const CHARACTER_PORTRAITS = ['knight', 'mage', 'healer', 'ranger', 'rogue', 'tank'] as const;
export const CHARACTER_FRAMES = ['plain', 'bronze', 'silver', 'gold', 'arcane'] as const;
export const CHARACTER_BACKDROPS = ['blueprint', 'forest', 'citadel', 'sky', 'void'] as const;
export const CHARACTER_AURAS = ['none', 'blue', 'green', 'amber', 'rose', 'violet'] as const;

const JOB_PORTRAITS: Record<JobClass, CharacterPortrait> = {
    '검사': 'knight',
    '마법사': 'mage',
    '힐러': 'healer',
    '사냥꾼': 'ranger',
    '도적': 'rogue',
    '탱커': 'tank'
};

const JOB_COLORS: Record<JobClass, string> = {
    '검사': '#1A73E8',
    '마법사': '#8E24AA',
    '힐러': '#188038',
    '사냥꾼': '#F9AB00',
    '도적': '#D93025',
    '탱커': '#3F51B5'
};

const GRADE_FRAMES: Array<{ min: number; frame: CharacterFrame }> = [
    { min: 17, frame: 'arcane' },
    { min: 12, frame: 'gold' },
    { min: 7, frame: 'silver' },
    { min: 3, frame: 'bronze' }
];

const GRADE_AURAS: Array<{ min: number; aura: CharacterAura }> = [
    { min: 17, aura: 'violet' },
    { min: 13, aura: 'rose' },
    { min: 9, aura: 'blue' },
    { min: 5, aura: 'amber' },
    { min: 3, aura: 'green' }
];

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const TITLE_MAX_LENGTH = 18;

function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
    return typeof value === 'string' && options.includes(value);
}

function clampTitle(value: unknown, fallback: string) {
    if (typeof value !== 'string') return fallback;
    const title = value.trim();
    return title.slice(0, TITLE_MAX_LENGTH);
}

function resolveFrame(level: number): CharacterFrame {
    return GRADE_FRAMES.find((option) => level >= option.min)?.frame ?? 'plain';
}

function resolveAura(level: number): CharacterAura {
    return GRADE_AURAS.find((option) => level >= option.min)?.aura ?? 'none';
}

export function getDefaultCharacterAppearance(character: Pick<GuildCharacter, 'jobClass' | 'grade'>): CharacterAppearance {
    const gradeInfo = getGradeInfo(character.grade);
    return {
        portrait: JOB_PORTRAITS[character.jobClass] ?? 'knight',
        frame: resolveFrame(gradeInfo.level),
        backdrop: gradeInfo.level >= 17 ? 'void' : gradeInfo.level >= 12 ? 'citadel' : 'blueprint',
        aura: resolveAura(gradeInfo.level),
        color: JOB_COLORS[character.jobClass] ?? '#1A73E8',
        title: gradeInfo.title.slice(0, TITLE_MAX_LENGTH)
    };
}

export function sanitizeCharacterAppearance(
    appearance: Partial<Record<keyof CharacterAppearance, unknown>> | null | undefined,
    fallback: CharacterAppearance
): CharacterAppearance {
    return {
        portrait: isOneOf(appearance?.portrait, CHARACTER_PORTRAITS) ? appearance.portrait : fallback.portrait,
        frame: isOneOf(appearance?.frame, CHARACTER_FRAMES) ? appearance.frame : fallback.frame,
        backdrop: isOneOf(appearance?.backdrop, CHARACTER_BACKDROPS) ? appearance.backdrop : fallback.backdrop,
        aura: isOneOf(appearance?.aura, CHARACTER_AURAS) ? appearance.aura : fallback.aura,
        color: typeof appearance?.color === 'string' && HEX_COLOR_PATTERN.test(appearance.color)
            ? appearance.color
            : fallback.color,
        title: clampTitle(appearance?.title, fallback.title)
    };
}

export function resolveCharacterAppearance(character: GuildCharacter): CharacterAppearance {
    return sanitizeCharacterAppearance(character.appearance, getDefaultCharacterAppearance(character));
}
