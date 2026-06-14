export type RewardChestTierKey = 'rare' | 'superRare' | 'epic' | 'mythic' | 'legendary';

export interface RewardChestTier {
    key: RewardChestTierKey;
    level: number;
    label: string;
    icon: string;
    upgradeChance: number;
    minBonusRate: number;
    maxBonusRate: number;
}

export interface RewardChestTap {
    tapNumber: number;
    fromTier: RewardChestTier;
    toTier: RewardChestTier;
    upgraded: boolean;
}

export interface RewardChestResult {
    tier: RewardChestTier;
    bonusGold: number;
    taps: RewardChestTap[];
}

export interface RewardChestPresentation {
    chestClass: string;
    ornamentLevel: number;
    sparkleCount: number;
}

type RandomSource = () => number;

export const REWARD_CHEST_TAP_COUNT = 4;

export const REWARD_CHEST_TIERS: RewardChestTier[] = [
    {
        key: 'rare',
        level: 1,
        label: '희귀',
        icon: '💧',
        upgradeChance: 0.55,
        minBonusRate: 0,
        maxBonusRate: 0.2
    },
    {
        key: 'superRare',
        level: 2,
        label: '초희귀',
        icon: '✨',
        upgradeChance: 0.35,
        minBonusRate: 0.21,
        maxBonusRate: 0.4
    },
    {
        key: 'epic',
        level: 3,
        label: '영웅',
        icon: '⚡',
        upgradeChance: 0.2,
        minBonusRate: 0.41,
        maxBonusRate: 0.65
    },
    {
        key: 'mythic',
        level: 4,
        label: '신화',
        icon: '🔮',
        upgradeChance: 0.08,
        minBonusRate: 0.66,
        maxBonusRate: 0.85
    },
    {
        key: 'legendary',
        level: 5,
        label: '전설',
        icon: '👑',
        upgradeChance: 0,
        minBonusRate: 0.86,
        maxBonusRate: 1
    }
];

export function getRewardChestPresentation(tier: RewardChestTier): RewardChestPresentation {
    const ornamentLevel = Math.min(
        REWARD_CHEST_TIERS.length,
        Math.max(1, Math.floor(Number(tier.level) || 1))
    );

    return {
        chestClass: `chest-tier-${tier.key}`,
        ornamentLevel,
        sparkleCount: ornamentLevel - 1
    };
}

function clampRandom(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.min(Math.max(value, 0), 0.999999999999);
}

function rollBonusGold(maxBonusGold: number, tier: RewardChestTier, rng: RandomSource) {
    const cap = Math.max(0, Math.floor(Number(maxBonusGold) || 0));
    if (cap === 0) return 0;

    const minGold = Math.min(cap, Math.ceil(cap * tier.minBonusRate));
    const maxGold = Math.min(cap, Math.max(minGold, Math.floor(cap * tier.maxBonusRate)));
    const range = maxGold - minGold + 1;

    return minGold + Math.floor(clampRandom(rng()) * range);
}

export function rollRewardChest(
    maxBonusGold: number,
    rng: RandomSource = Math.random,
    tapCount = REWARD_CHEST_TAP_COUNT
): RewardChestResult {
    const taps: RewardChestTap[] = [];
    let tierIndex = 0;
    const normalizedTapCount = Math.max(0, Math.floor(tapCount));

    for (let i = 0; i < normalizedTapCount; i += 1) {
        const fromTier = REWARD_CHEST_TIERS[tierIndex];
        const upgraded =
            tierIndex < REWARD_CHEST_TIERS.length - 1 &&
            clampRandom(rng()) < fromTier.upgradeChance;

        if (upgraded) tierIndex += 1;

        taps.push({
            tapNumber: i + 1,
            fromTier,
            toTier: REWARD_CHEST_TIERS[tierIndex],
            upgraded
        });
    }

    const tier = REWARD_CHEST_TIERS[tierIndex];

    return {
        tier,
        bonusGold: rollBonusGold(maxBonusGold, tier, rng),
        taps
    };
}
