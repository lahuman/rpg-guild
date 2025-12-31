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

        // [수정] completeMission이 결과 객체를 반환하도록 변경
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

            // 확률 로직 (20%)
            let bonusGold = 0;
            let isChestFound = false;
            
            if (Math.random() < 0.2) {
                isChestFound = true;
                bonusGold = Math.floor(Math.random() * 36); // 0 ~ 36
            }

            const logRef = doc(collection(db, `guilds/${guildId}/mission_logs`));
            
            // 트랜잭션 실행 및 결과 반환
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
                    totalReward: (mission.cost + bonusGold) * characters.length,
                    isChestFound: isChestFound, // 상자 정보 저장
                    bonusGold: bonusGold,       // 보너스 골드 저장
                    performedDate: today,
                    createdAt: serverTimestamp()
                };
                t.set(logRef, logData);

                // 보상 지급
                charDocs.forEach((d, i) => {
                    const data = d.data();
                    const currentGold = data.currentGold || 0;
                    const currentExp = data.exp || 0;
                    
                    const rewardPerCharacter = mission.cost + bonusGold;
                    const newGold = currentGold + rewardPerCharacter;
                    const newExp = currentExp + rewardPerCharacter;
                    const newLevel = Math.floor(newExp / 1000) + 1;

                    t.update(charRefs[i], {
                        currentGold: newGold,
                        exp: newExp,
                        level: newLevel
                    });
                });
            });

            // [중요] UI에서 이펙트를 보여주기 위해 결과 반환
            return { isChestFound, bonusGold };
        }
    };
}

export const missionStore = createMissionStore();