// src/lib/stores/missionStore.ts
import { writable, get } from 'svelte/store';
import { db } from '$lib/firebase';
import { 
    collection, addDoc, query, where, onSnapshot, 
    doc, runTransaction, serverTimestamp 
} from 'firebase/firestore';
import { userStore } from './userStore';

export interface Mission {
    id?: string;
    title: string;
    description: string;
    cost: number; // 1인당 보상
    type: 'solo' | 'party';
    minParticipants: number;
    maxParticipants: number;
    creatorId: string; // 작성자(User)
    status: 'active' | 'inactive';
}

export interface MissionLog {
    id?: string;
    missionId: string;
    missionTitle: string;
    performerCharacterIds: string[]; // 수행한 '캐릭터' ID 목록
    performerNames: string[];        // 로그 가독성을 위해 이름도 저장
    approverUserId: string;          // 승인/기록한 '실제 유저' ID
    totalReward: number;
    performedDate: string;           // YYYY-MM-DD
    createdAt: any;
}

function createMissionStore() {
    const { subscribe, set } = writable<Mission[]>([]);

    const getTodayDateString = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        subscribe,

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

        // 2. 미션 등록 (작가 누구나 가능)
        addMission: async (guildId: string, mission: Omit<Mission, 'id' | 'creatorId' | 'status'>) => {
            const currentUser = get(userStore);
            if (!currentUser) throw new Error("로그인이 필요합니다.");

            await addDoc(collection(db, `guilds/${guildId}/missions`), {
                ...mission,
                creatorId: currentUser.uid,
                status: 'active',
                createdAt: serverTimestamp()
            });
        },

        // 3. 미션 수행 처리 (캐릭터에게 보상 지급)
        completeMission: async (
            guildId: string, 
            mission: Mission, 
            characters: { id: string, name: string }[] // 선택된 캐릭터 객체 배열
        ) => {
            const currentUser = get(userStore);
            if (!currentUser) throw new Error("로그인이 필요합니다.");
            
            const today = getTodayDateString();
            const logRef = doc(collection(db, `guilds/${guildId}/mission_logs`));

            try {
                await runTransaction(db, async (t) => {
                    // A. 로그 기록 준비
                    const logData: any = {
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

                    // B. 각 캐릭터에게 골드 지급
                    for (const char of characters) {
                        const charRef = doc(db, `guilds/${guildId}/characters`, char.id);
                        const charDoc = await t.get(charRef);
                        
                        if (!charDoc.exists()) throw new Error(`Character ${char.name} not found!`);
                        
                        const currentGold = charDoc.data().currentGold || 0;
                        t.update(charRef, { 
                            currentGold: currentGold + mission.cost 
                            // 추후 경험치(exp) 로직도 여기에 추가 가능
                        });
                    }
                });
            } catch (e) {
                console.error("Transaction failed: ", e);
                throw e;
            }
        }
    };
}

export const missionStore = createMissionStore();