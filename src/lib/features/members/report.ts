import { formatDateKey, toDateOrNull } from '../../utils/date.ts';

export type MemberReportPeriodKey = 'weekly' | 'monthly' | 'yearly';

type FirestoreDateLike =
    | Date
    | string
    | number
    | { seconds: number }
    | { toDate: () => Date }
    | null
    | undefined;

export interface MemberReportPeriod {
    key: MemberReportPeriodKey;
    label: string;
    start: Date;
    end: Date;
}

export interface MemberMissionLogInput {
    id: string;
    missionId?: string;
    missionTitle?: string;
    performerCharacterIds?: string[];
    performerNames?: string[];
    totalReward?: number;
    createdAt?: FirestoreDateLike;
    performedDate?: string;
}

export interface MemberUsageLogInput {
    id: string;
    characterId?: string;
    characterName?: string;
    itemName?: string;
    cost?: number;
    usedAt?: FirestoreDateLike;
}

export interface MemberReportMissionEntry {
    id: string;
    title: string;
    reward: number;
    date: Date;
    performerNames: string[];
}

export interface MemberReportPurchaseEntry {
    id: string;
    itemName: string;
    cost: number;
    date: Date;
}

export interface MemberReportSummary {
    missionCount: number;
    missionGoldEarned: number;
    purchaseCount: number;
    purchaseGoldSpent: number;
}

export interface MemberReport {
    period: MemberReportPeriod;
    summary: MemberReportSummary;
    missions: MemberReportMissionEntry[];
    purchases: MemberReportPurchaseEntry[];
}

export interface BuildMemberReportInput {
    memberId: string;
    period: MemberReportPeriod;
    missionLogs: MemberMissionLogInput[];
    usageLogs: MemberUsageLogInput[];
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function getMemberReportPeriod(key: MemberReportPeriodKey, baseDate = new Date()): MemberReportPeriod {
    if (key === 'weekly') {
        const start = startOfDay(baseDate);
        const day = start.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + mondayOffset);

        const end = endOfDay(start);
        end.setDate(start.getDate() + 6);

        return { key, label: '주간', start, end };
    }

    if (key === 'monthly') {
        const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);

        return { key, label: '월간', start, end };
    }

    const start = new Date(baseDate.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(baseDate.getFullYear(), 11, 31, 23, 59, 59, 999);

    return { key, label: '년간', start, end };
}

export function formatReportPeriodLabel(period: MemberReportPeriod) {
    return `${formatDateKey(period.start)} - ${formatDateKey(period.end)}`;
}

function isInPeriod(date: Date, period: MemberReportPeriod) {
    const time = date.getTime();
    return time >= period.start.getTime() && time <= period.end.getTime();
}

function getMissionDate(log: MemberMissionLogInput) {
    const createdAt = toDateOrNull(log.createdAt);
    if (createdAt) return createdAt;

    if (typeof log.performedDate === 'string') {
        const performedDate = new Date(`${log.performedDate}T00:00:00`);
        if (!Number.isNaN(performedDate.getTime())) return performedDate;
    }

    return null;
}

function getUsageDate(log: MemberUsageLogInput) {
    return toDateOrNull(log.usedAt);
}

function getMemberMissionReward(log: MemberMissionLogInput) {
    const performerIds = log.performerCharacterIds || [];
    if (performerIds.length === 0) return 0;

    return (log.totalReward || 0) / performerIds.length;
}

export function buildMemberReport(input: BuildMemberReportInput): MemberReport {
    const missions = input.missionLogs
        .filter((log) => log.missionId !== 'ATTENDANCE')
        .filter((log) => (log.performerCharacterIds || []).includes(input.memberId))
        .map((log): MemberReportMissionEntry | null => {
            const date = getMissionDate(log);
            if (!date || !isInPeriod(date, input.period)) return null;

            return {
                id: log.id,
                title: log.missionTitle || '미션 완료',
                reward: getMemberMissionReward(log),
                date,
                performerNames: log.performerNames || []
            };
        })
        .filter((entry): entry is MemberReportMissionEntry => Boolean(entry))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    const purchases = input.usageLogs
        .filter((log) => log.characterId === input.memberId)
        .map((log): MemberReportPurchaseEntry | null => {
            const date = getUsageDate(log);
            if (!date || !isInPeriod(date, input.period)) return null;

            return {
                id: log.id,
                itemName: log.itemName || '아이템 구매',
                cost: log.cost || 0,
                date
            };
        })
        .filter((entry): entry is MemberReportPurchaseEntry => Boolean(entry))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
        period: input.period,
        missions,
        purchases,
        summary: {
            missionCount: missions.length,
            missionGoldEarned: missions.reduce((sum, mission) => sum + mission.reward, 0),
            purchaseCount: purchases.length,
            purchaseGoldSpent: purchases.reduce((sum, purchase) => sum + purchase.cost, 0)
        }
    };
}
