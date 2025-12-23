// src/lib/stores/missionStore.ts
import { writable, get, derived } from 'svelte/store';
import { db } from '$lib/firebase';
import {
    collection, addDoc, query, where, onSnapshot, getDocs,
    doc, runTransaction, serverTimestamp, updateDoc // [NEW] updateDoc 추가
} from 'firebase/firestore';
import { userStore } from './userStore';

export interface Mission {
    id?: string;
    title: string;
    description: string;
    cost: number;
    type: 'solo' | 'party';
    minParticipants: number;
    maxParticipants: number;
    creatorId: string;
    status: 'active' | 'inactive';
}

function createMissionStore() {
    const { subscribe, set } = writable<Mission[]>([]);

    // 오늘 완료된 미션 ID들을 저장하는 별도 스토어
    const completedMissionIds = writable<Set<string>>(new Set());

    const getTodayDateString = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        subscribe,
        completedMissionIds: { subscribe: completedMissionIds.subscribe },

        // 1. 미션 목록 리스너
        init: (guildId: string) => {
            const q = query(
                collection(db, `guilds/${guildId}/missions`),
                where('status', '==', 'active')
            );
            return onSnapshot(q, (snapshot) => {
                const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
                set(missions);
            });
        },

        // 2. 오늘 수행된 로그 리스너
        initTodayStatus: (guildId: string) => {
            const today = getTodayDateString();
            const q = query(
                collection(db, `guilds/${guildId}/mission_logs`),
                where('performedDate', '==', today)
            );

            return onSnapshot(q, (snapshot) => {
                const ids = new Set<string>();
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.missionId) ids.add(data.missionId);
                });
                completedMissionIds.set(ids);
            });
        },

        addMission: async (guildId: string, mission: any) => {
            const currentUser = get(userStore);
            if (!currentUser) throw new Error("로그인이 필요합니다.");
            await addDoc(collection(db, `guilds/${guildId}/missions`), {
                ...mission,
                creatorId: currentUser.uid,
                status: 'active',
                createdAt: serverTimestamp()
            });
        },

        // [NEW] 미션 수정
        updateMission: async (guildId: string, missionId: string, updates: Partial<Mission>) => {
            const ref = doc(db, `guilds/${guildId}/missions`, missionId);
            await updateDoc(ref, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        },

        // [NEW] 미션 삭제 (Soft Delete)
        deleteMission: async (guildId: string, missionId: string) => {
            const ref = doc(db, `guilds/${guildId}/missions`, missionId);
            // 실제로 지우지 않고 status를 inactive로 변경하여 목록에서 숨김
            await updateDoc(ref, {
                status: 'inactive',
                deletedAt: serverTimestamp()
            });
        },

        fetchMissionLogsByDate: async (guildId: string, missionId: string) => {
            const today = getTodayDateString();
            const q = query(
                collection(db, `guilds/${guildId}/mission_logs`),
                where('missionId', '==', missionId),
                where('performedDate', '==', today)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => d.data());
        },

        completeMission: async (guildId: string, mission: Mission, characters: any[]) => {
            const currentUser = get(userStore);
            const today = getTodayDateString();

            const q = query(
                collection(db, `guilds/${guildId}/mission_logs`),
                where('missionId', '==', mission.id),
                where('performedDate', '==', today)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                throw new Error("🚫 이미 금일 완료된 미션입니다.");
            }

            const logRef = doc(collection(db, `guilds/${guildId}/mission_logs`));
            try {
                await runTransaction(db, async (t) => {
                    const charRefs = characters.map(char => doc(db, `guilds/${guildId}/characters`, char.id));
                    const charDocs = await Promise.all(charRefs.map(ref => t.get(ref)));

                    charDocs.forEach((d, i) => { if (!d.exists()) throw new Error("Character not found"); });

                    const logData = {
                        missionId: mission.id,
                        missionTitle: mission.title,
                        performerCharacterIds: characters.map(c => c.id),
                        performerNames: characters.map(c => c.name),
                        approverUserId: currentUser.uid,
                        totalReward: mission.cost * characters.length,
                        performedDate: today,
                        createdAt: serverTimestamp()
                    };
                    t.set(logRef, logData);

                    // 3. [수정됨] 캐릭터 보상 지급 및 레벨업 로직
                    charDocs.forEach((d, i) => {
                        const data = d.data();
                        const currentGold = data.currentGold || 0;

                        // 기존 exp가 없으면 0으로 취급 (기존 데이터 호환성)
                        const currentExp = data.exp || 0;

                        // 골드와 경험치 증가
                        const newGold = currentGold + mission.cost;
                        const newExp = currentExp + mission.cost;

                        // 레벨 계산: (누적 골드 / 1000) + 1
                        // 예: 0~999 -> Lv 1, 1000~1999 -> Lv 2
                        const newLevel = Math.floor(newExp / 1000) + 1;

                        // 업데이트 실행
                        t.update(charRefs[i], {
                            currentGold: newGold,
                            exp: newExp,     // 누적 골드 저장
                            level: newLevel  // 계산된 새 레벨 저장
                        });
                    });
                });
            } catch (e) { throw e; }
        }
    };
}

export const missionStore = createMissionStore();