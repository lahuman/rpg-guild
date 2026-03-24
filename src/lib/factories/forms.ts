import type { GuildCharacter } from '$lib/stores/guild/types';
import type { ShopItem } from '$lib/stores/itemStore';
import type { Mission } from '$lib/stores/missionStore';

export function createCharacterForm(): Partial<GuildCharacter> {
    return {
        name: '',
        jobClass: '검사',
        grade: 'Rank01',
        description: ''
    };
}

export function createShopItemForm(): Partial<ShopItem> {
    return {
        name: '',
        cost: 100,
        icon: '🎁',
        description: ''
    };
}

export function createShopManagerForm() {
    return {
        name: '',
        cost: 100,
        description: '',
        icon: '🗡️',
        isOneTime: false
    };
}

export function createMissionForm(): Pick<
    Mission,
    'title' | 'description' | 'cost' | 'type' | 'minParticipants' | 'maxParticipants' | 'isOneTime'
    | 'assignedCharacterId' | 'assignedCharacterName'
> {
    return {
        title: '',
        description: '',
        cost: 100,
        type: 'solo',
        minParticipants: 1,
        maxParticipants: 1,
        isOneTime: false,
        assignedCharacterId: '',
        assignedCharacterName: ''
    };
}
