export type JobClass = '검사' | '마법사' | '힐러' | '사냥꾼' | '도적' | '탱커';
export type CharacterPortrait = 'knight' | 'mage' | 'healer' | 'ranger' | 'rogue' | 'tank';
export type CharacterFrame = 'plain' | 'bronze' | 'silver' | 'gold' | 'arcane';
export type CharacterBackdrop = 'blueprint' | 'forest' | 'citadel' | 'sky' | 'void';
export type CharacterAura = 'none' | 'blue' | 'green' | 'amber' | 'rose' | 'violet';
export type CharacterGrade =
    | 'Rank01'
    | 'Rank02'
    | 'Rank03'
    | 'Rank04'
    | 'Rank05'
    | 'Rank06'
    | 'Rank07'
    | 'Rank08'
    | 'Rank09'
    | 'Rank10'
    | 'Rank11'
    | 'Rank12'
    | 'Rank13'
    | 'Rank14'
    | 'Rank15'
    | 'Rank16'
    | 'Rank17'
    | 'Rank18'
    | 'Rank19'
    | 'Rank20';

export type LegacyCharacterGrade =
    | 'Bronze'
    | 'Silver'
    | 'Gold'
    | 'Platinum'
    | 'Diamond'
    | 'Master'
    | 'GrandMaster'
    | 'God';

export type FirestoreTimestampLike = {
    seconds: number;
    nanoseconds?: number;
};

export interface CharacterAppearance {
    portrait: CharacterPortrait;
    frame: CharacterFrame;
    backdrop: CharacterBackdrop;
    aura: CharacterAura;
    color: string;
    title: string;
}

export interface GuildCharacter {
    id?: string;
    name: string;
    jobClass: JobClass;
    grade: CharacterGrade | LegacyCharacterGrade;
    description: string;
    currentGold: number;
    level: number;
    exp?: number;
    createdBy: string;
    createdAt: FirestoreTimestampLike | Date | null;
    lastCheckInDate?: string;
    consecutiveDays?: number;
    lastMiniGameDate?: string;
    appearance?: CharacterAppearance;
}

export interface UsageLog {
    characterId: string;
    characterName: string;
    itemName: string;
    cost: number;
    usedAt: FirestoreTimestampLike | Date | null;
    usedByUserId: string;
}

export interface TransferLog {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number;
    reason: string;
    transferredAt: FirestoreTimestampLike | Date | null;
    transferredByUserId: string;
}

export interface Guild {
    id?: string;
    name: string;
    code: string;
    leaderId: string;
    description: string;
    createdAt?: FirestoreTimestampLike | Date | null;
    characters?: GuildCharacter[];
    boxChance?: number;
    maxBonusGold?: number;
}
