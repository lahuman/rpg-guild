// src/lib/stores/logStore.ts
import { writable } from 'svelte/store';
import { db } from '$lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// 통합 로그 타입 정의
export interface UnifiedLog {
    id: string;
    type: 'mission' | 'usage'; // 수입 vs 지출
    title: string;             // 미션명 or 아이템명
    names: string[];           // 수행자들 or 사용자
    amount: number;            // 골드 양
    timestamp: any;            // 정렬용 원본 시간
    dateStr: string;           // YYYY-MM-DD
    timeStr: string;           // HH:mm
}

export interface LogGroup {
    date: string;       // "2023-12-25"
    logs: UnifiedLog[];
}

function createLogStore() {
    const { subscribe, set } = writable<LogGroup[]>([]);

    return {
        subscribe,

        // 로그 불러오기 (최근 N개)
        fetchLogs: async (guildId: string, limitCount = 50) => {
            // 1. 미션 로그 (수입) 가져오기
            const missionRef = collection(db, `guilds/${guildId}/mission_logs`);
            const missionQ = query(missionRef, orderBy('createdAt', 'desc'), limit(limitCount));
            
            // 2. 사용 로그 (지출) 가져오기
            const usageRef = collection(db, `guilds/${guildId}/usage_logs`);
            const usageQ = query(usageRef, orderBy('usedAt', 'desc'), limit(limitCount));

            // 병렬 실행
            const [missionSnaps, usageSnaps] = await Promise.all([
                getDocs(missionQ),
                getDocs(usageQ)
            ]);

            const logs: UnifiedLog[] = [];

            // 3. 미션 로그 변환
            missionSnaps.forEach(doc => {
                const data = doc.data();
                const dateObj = data.createdAt?.toDate() || new Date();
                logs.push({
                    id: doc.id,
                    type: 'mission',
                    title: data.missionTitle,
                    names: data.performerNames || [],
                    amount: data.totalReward,
                    timestamp: dateObj,
                    dateStr: dateObj.toISOString().split('T')[0],
                    timeStr: dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                });
            });

            // 4. 사용 로그 변환
            usageSnaps.forEach(doc => {
                const data = doc.data();
                const dateObj = data.usedAt?.toDate() || new Date();
                logs.push({
                    id: doc.id,
                    type: 'usage',
                    title: data.itemName,
                    names: [data.characterName], // 배열 형태로 통일
                    amount: data.cost,
                    timestamp: dateObj,
                    dateStr: dateObj.toISOString().split('T')[0],
                    timeStr: dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                });
            });

            // 5. 전체 시간순 정렬 (최신순)
            logs.sort((a, b) => b.timestamp - a.timestamp);

            // 6. 날짜별 그룹핑
            const grouped: LogGroup[] = [];
            logs.forEach(log => {
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