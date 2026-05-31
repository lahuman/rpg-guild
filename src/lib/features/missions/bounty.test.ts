import {
    BOUNTY_DURATION_MS,
    calculateBountyTotalGold,
    formatBountyTimeRemaining,
    getBountyExpiresAt,
    isBountyExpired
} from './bounty';

const createdAt = new Date('2026-05-31T00:00:00.000Z');
const expiresAt = getBountyExpiresAt(createdAt);

export const bountyCompileAssertions = {
    durationIsOneDay: BOUNTY_DURATION_MS === 24 * 60 * 60 * 1000,
    expiresAfterOneDay: expiresAt.getTime() === Date.parse('2026-06-01T00:00:00.000Z'),
    soloDepositUsesOneReward: calculateBountyTotalGold(120, 'solo', 5) === 120,
    partyDepositUsesMaxParticipants: calculateBountyTotalGold(120, 'party', 3) === 360,
    assignedDepositUsesOneReward: calculateBountyTotalGold(120, 'assigned', 3) === 120,
    remainingTimeIsCompact: formatBountyTimeRemaining(90 * 60 * 1000) === '1시간 30분',
    expiredTimeFallsBackToZero: formatBountyTimeRemaining(-1000) === '0분',
    exactExpiryIsExpired: isBountyExpired(expiresAt, expiresAt)
};
