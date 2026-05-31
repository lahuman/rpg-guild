export const BOUNTY_DURATION_MS = 24 * 60 * 60 * 1000;

type MissionType = 'solo' | 'party' | 'assigned';

export function calculateBountyTotalGold(cost: number, type: MissionType, maxParticipants: number) {
    const participantCount = type === 'party' ? Math.max(2, maxParticipants || 2) : 1;
    return Math.max(0, cost || 0) * participantCount;
}

export function getBountyExpiresAt(createdAt: Date) {
    return new Date(createdAt.getTime() + BOUNTY_DURATION_MS);
}

export function isBountyExpired(expiresAt: Date, now = new Date()) {
    return expiresAt.getTime() <= now.getTime();
}

export function formatBountyTimeRemaining(remainingMs: number) {
    const totalMinutes = Math.max(0, Math.ceil(remainingMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours}시간 ${minutes}분`;
    if (hours > 0) return `${hours}시간`;
    return `${minutes}분`;
}
