// src/lib/stores/logStore.ts
import { writable } from 'svelte/store';
import { db } from '$lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { formatDateKey, formatKoreanTime, toDateOrNull } from '$lib';

// 통합 로그 타입 정의
export interface UnifiedLog {
    id: string;
    type: 'mission' | 'usage' | 'grade' | 'transfer';
    title: string;             // 미션명 or 아이템명 or 양도사유
    names: string[];           // 수행자들 or 사용자 or [보낸이, 받은이]
    amount: number;            // 골드 양
    timestamp: Date;           // 정렬용 원본 시간
    dateStr: string;           // YYYY-MM-DD
    timeStr: string;           // HH:mm
}

export interface LogGroup {
    date: string;       // "2023-12-25"
    logs: UnifiedLog[];
}

function createLogStore() {
    const { subscribe, set } = writable<LogGroup[]>([]);

    type FirestoreDateCandidate =
        | Date
        | string
        | number
        | { seconds: number }
        | { toDate: () => Date }
        | null
        | undefined;

    function getLogDate(data: Record<string, unknown>, primaryField: string) {
        const candidates: FirestoreDateCandidate[] = [
            data[primaryField] as FirestoreDateCandidate,
            data.createdAt as FirestoreDateCandidate,
            data.usedAt as FirestoreDateCandidate,
            data.transferredAt as FirestoreDateCandidate
        ];

        for (const candidate of candidates) {
            const parsed = toDateOrNull(candidate);
            if (parsed) return parsed;
        }

        if (typeof data.performedDate === 'string') {
            const fallbackDate = new Date(`${data.performedDate}T00:00:00`);
            if (!Number.isNaN(fallbackDate.getTime())) return fallbackDate;
        }

        return new Date(0);
    }

    return {
        subscribe,

        // 로그 불러오기 (최근 N개)
        fetchLogs: async (guildId: string, limitCount = 50) => {
            // 1. 미션 로그 (수입) 가져오기
            const missionRef = collection(db, `guilds/${guildId}/mission_logs`);
            
            // 2. 사용 로그 (지출) 가져오기
            const usageRef = collection(db, `guilds/${guildId}/usage_logs`);

            const gradeRef = collection(db, `guilds/${guildId}/grade_logs`);

            const transferRef = collection(db, `guilds/${guildId}/transfer_logs`);

            const [missionResult, usageResult, gradeResult, transferResult] = await Promise.allSettled([
                getDocs(missionRef),
                getDocs(usageRef),
                getDocs(gradeRef),
                getDocs(transferRef)
            ]);

            const missionSnaps = missionResult.status === 'fulfilled' ? missionResult.value : null;
            const usageSnaps = usageResult.status === 'fulfilled' ? usageResult.value : null;
            const gradeSnaps = gradeResult.status === 'fulfilled' ? gradeResult.value : null;
            const transferSnaps = transferResult.status === 'fulfilled' ? transferResult.value : null;

            const logs: UnifiedLog[] = [];

            // 3. 미션 로그 변환
            missionSnaps?.forEach(doc => {
                const data = doc.data();
                const dateObj = getLogDate(data, 'createdAt');
                logs.push({
                    id: doc.id,
                    type: 'mission',
                    title: data.missionTitle || '미션 완료',
                    names: data.performerNames || [],
                    amount: data.totalReward || 0,
                    timestamp: dateObj,
                    dateStr: formatDateKey(dateObj),
                    timeStr: formatKoreanTime(dateObj)
                });
            });

            // 4. 사용 로그 변환
            usageSnaps?.forEach(doc => {
                const data = doc.data();
                const dateObj = getLogDate(data, 'usedAt');
                logs.push({
                    id: doc.id,
                    type: 'usage',
                    title: data.itemName || '아이템 사용',
                    names: data.characterName ? [data.characterName] : [], // 배열 형태로 통일
                    amount: data.cost || 0,
                    timestamp: dateObj,
                    dateStr: formatDateKey(dateObj),
                    timeStr: formatKoreanTime(dateObj)
                });
            });

            gradeSnaps?.forEach(doc => {
                const data = doc.data();
                const dateObj = getLogDate(data, 'createdAt');
                const isPromotion = data.result === 'up';
                const isDemotion = data.result === 'down';

                logs.push({
                    id: doc.id,
                    type: 'grade',
                    title: isPromotion
                        ? `${data.previousGradeLabel} → ${data.nextGradeLabel}`
                        : isDemotion
                            ? `${data.previousGradeLabel} → ${data.nextGradeLabel}`
                            : `${data.previousGradeLabel} 유지`,
                    names: [data.characterName],
                    amount: data.rewardGold || 0,
                    timestamp: dateObj,
                    dateStr: formatDateKey(dateObj),
                    timeStr: formatKoreanTime(dateObj)
                });
            });

            transferSnaps?.forEach(doc => {
                const data = doc.data();
                const dateObj = getLogDate(data, 'transferredAt');
                logs.push({
                    id: doc.id,
                    type: 'transfer',
                    title: data.reason || '골드 양도',
                    names: [data.fromName, data.toName],
                    amount: data.amount || 0,
                    timestamp: dateObj,
                    dateStr: formatDateKey(dateObj),
                    timeStr: formatKoreanTime(dateObj)
                });
            });

            // 5. 전체 시간순 정렬 (최신순)
            logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            const limitedLogs = logs.slice(0, limitCount);

            // 6. 날짜별 그룹핑
            const grouped: LogGroup[] = [];
            limitedLogs.forEach(log => {
                const lastGroup = grouped[grouped.length - 1];
                if (lastGroup && lastGroup.date === log.dateStr) {
                    lastGroup.logs.push(log);
                } else {
                    grouped.push({ date: log.dateStr, logs: [log] });
                }
            });

            set(grouped);
        }
    };
}

export const logStore = createLogStore();
