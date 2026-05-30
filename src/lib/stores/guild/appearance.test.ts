import {
    CHARACTER_AURAS,
    CHARACTER_BACKDROPS,
    CHARACTER_FRAMES,
    CHARACTER_PORTRAITS,
    getDefaultCharacterAppearance,
    sanitizeCharacterAppearance
} from './appearance';
import type { CharacterAppearance, GuildCharacter } from './types';

const mage = {
    name: 'Mira',
    jobClass: '마법사',
    grade: 'Rank12',
    description: '',
    currentGold: 0,
    level: 12,
    createdBy: 'user',
    createdAt: null
} satisfies GuildCharacter;

const defaultAppearance = getDefaultCharacterAppearance(mage);
const validatedDefault: CharacterAppearance = defaultAppearance;

const sanitizedAppearance = sanitizeCharacterAppearance(
    {
        portrait: 'unknown',
        frame: 'arcane',
        backdrop: 'void',
        aura: 'violet',
        color: 'not-a-color',
        title: '  A title that is intentionally much longer than the supported character title limit  '
    },
    defaultAppearance
);

const validatedSanitized: CharacterAppearance = sanitizedAppearance;
const paletteGuards = [
    CHARACTER_PORTRAITS.includes(validatedSanitized.portrait),
    CHARACTER_FRAMES.includes(validatedSanitized.frame),
    CHARACTER_BACKDROPS.includes(validatedSanitized.backdrop),
    CHARACTER_AURAS.includes(validatedSanitized.aura),
    validatedDefault.title.length <= 18,
    validatedSanitized.title.length <= 18
];

export const appearanceCompileAssertions = {
    validatedDefault,
    validatedSanitized,
    paletteGuards
};
