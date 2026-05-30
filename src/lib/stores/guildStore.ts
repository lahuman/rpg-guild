import { writable } from 'svelte/store';
import { createCharacterActions } from './guild/characters';
import {
    GRADE_INFO,
    GRADE_ORDER,
    getGradeChallenge,
    getGradeInfo,
    getGradeIndex,
    getGradePenaltySteps,
    getGradeRewardGold,
    getGradeTitle,
    normalizeGrade,
    isMaxGrade
} from './guild/constants';
import type { GradeChallengeConfig, GradeChallengeType } from './guild/constants';
import { createGuildManagementActions } from './guild/management';
import { createGuildSubscriptions } from './guild/subscriptions';
import type {
    CharacterAppearance,
    CharacterAura,
    CharacterBackdrop,
    CharacterFrame,
    CharacterGrade,
    CharacterPortrait,
    Guild,
    GuildCharacter,
    JobClass,
    LegacyCharacterGrade,
    UsageLog
} from './guild/types';

export type {
    CharacterAppearance,
    CharacterAura,
    CharacterBackdrop,
    CharacterFrame,
    CharacterGrade,
    CharacterPortrait,
    Guild,
    GuildCharacter,
    JobClass,
    LegacyCharacterGrade,
    UsageLog,
    GradeChallengeConfig,
    GradeChallengeType
};
export {
    GRADE_INFO,
    GRADE_ORDER,
    getGradeChallenge,
    getGradeInfo,
    getGradeIndex,
    getGradePenaltySteps,
    getGradeRewardGold,
    getGradeTitle,
    normalizeGrade,
    isMaxGrade
};

function createGuildStore() {
    const { subscribe, update } = writable<Guild | null>(null);

    return {
        subscribe,
        ...createGuildSubscriptions(update),
        ...createGuildManagementActions(),
        ...createCharacterActions()
    };
}

export const guildStore = createGuildStore();
