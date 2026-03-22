import { writable } from 'svelte/store';
import { createCharacterActions } from './guild/characters';
import { GRADE_INFO, GRADE_ORDER } from './guild/constants';
import { createGuildManagementActions } from './guild/management';
import { createGuildSubscriptions } from './guild/subscriptions';
import type { CharacterGrade, Guild, GuildCharacter, JobClass, UsageLog } from './guild/types';

export type { CharacterGrade, Guild, GuildCharacter, JobClass, UsageLog };
export { GRADE_INFO, GRADE_ORDER };

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
