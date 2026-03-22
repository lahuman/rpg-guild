export type JobClass = '검사' | '마법사' | '힐러' | '사냥꾼' | '도적' | '탱커';
export type CharacterGrade = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'GrandMaster' | 'God';

export type FirestoreTimestampLike = {
    seconds: number;
    nanoseconds?: number;
};

export interface GuildCharacter {
    id?: string;
    name: string;
    jobClass: JobClass;
    grade: CharacterGrade;
    description: string;
    currentGold: number;
    level: number;
    exp?: number;
    createdBy: string;
    createdAt: FirestoreTimestampLike | Date | null;
    lastCheckInDate?: string;
    consecutiveDays?: number;
    lastMiniGameDate?: string;
}

export interface UsageLog {
    characterId: string;
    characterName: string;
    itemName: string;
    cost: number;
    usedAt: FirestoreTimestampLike | Date | null;
    usedByUserId: string;
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
