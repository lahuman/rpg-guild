import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRewardChestPresentation, REWARD_CHEST_TIERS, rollRewardChest } from './rewardChest.ts';

const alwaysUpgrade = rollRewardChest(100, () => 0);
const neverUpgrade = rollRewardChest(100, () => 0.99);
const cappedReward = rollRewardChest(36, () => 0);
const zeroReward = rollRewardChest(0, () => 0);
const tierPresentations = REWARD_CHEST_TIERS.map(getRewardChestPresentation);

export const rewardChestCompileAssertions = {
    reachesLegendaryWithinFourTaps: alwaysUpgrade.tier.key === 'legendary',
    staysRareWhenUpgradesFail: neverUpgrade.tier.key === 'rare',
    bonusNeverExceedsCap: cappedReward.bonusGold <= 36,
    zeroCapGivesZeroBonus: zeroReward.bonusGold === 0,
    tapPathHasFourEntries: alwaysUpgrade.taps.length === 4,
    chestPresentationsHaveUniqueClasses:
        new Set(tierPresentations.map((presentation) => presentation.chestClass)).size === REWARD_CHEST_TIERS.length,
    chestOrnamentsGrowByTier: tierPresentations.every((presentation, index) => presentation.ornamentLevel === index + 1)
};

test('rollRewardChest reaches legendary within four taps when all upgrades succeed', () => {
    const result = rollRewardChest(100, () => 0);

    assert.equal(result.tier.key, 'legendary');
    assert.equal(result.taps.length, 4);
});

test('rollRewardChest stays rare when all upgrades fail', () => {
    const result = rollRewardChest(100, () => 0.99);

    assert.equal(result.tier.key, 'rare');
});

test('rollRewardChest never exceeds max bonus gold', () => {
    const result = rollRewardChest(36, () => 0.999);

    assert.ok(result.bonusGold <= 36);
});

test('rollRewardChest returns zero bonus when max bonus is zero', () => {
    const result = rollRewardChest(0, () => 0);

    assert.equal(result.bonusGold, 0);
});

test('reward chest presentation becomes more ornate with each tier', () => {
    const presentations = REWARD_CHEST_TIERS.map(getRewardChestPresentation);

    assert.deepEqual(
        presentations.map((presentation) => presentation.ornamentLevel),
        [1, 2, 3, 4, 5]
    );
    assert.deepEqual(
        presentations.map((presentation) => presentation.sparkleCount),
        [0, 1, 2, 3, 4]
    );
    assert.equal(new Set(presentations.map((presentation) => presentation.chestClass)).size, presentations.length);
});
