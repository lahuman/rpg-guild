// src/lib/stores/missionStore.ts
import { writable, get, derived } from 'svelte/store'; // derived 추가
import { db } from '$lib/firebase';
import { 
    collection, addDoc, query, where, onSnapshot, getDocs,
    doc, runTransaction, serverTimestamp 
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

// ... MissionLog 인터페이스 등 기존 코드 유지 ...

function createMissionStore() {
    const { subscribe, set } = writable<Mission[]>([]);
    
    // [NEW] 오늘 완료된 미션 ID들을 저장하는 별도 스토어
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
        // 완료된 미션 ID 목록을 구독할 수 있게 노출
        completedMissionIds: { subscribe: completedMissionIds.subscribe },

        // 1. 미션 목록 리스너 (기존 동일)
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

        // 2. [NEW] 오늘 수행된 로그 리스너 (실시간 '완료됨' 마킹용)
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

        // ... addMission, completeMission 등 기존 함수들은 그대로 유지 ...
        addMission: async (guildId: string, mission: any) => { /* ... 기존 코드 ... */
            const currentUser = get(userStore);
            if (!currentUser) throw new Error("로그인이 필요합니다.");
            await addDoc(collection(db, `guilds/${guildId}/missions`), {
                ...mission,
                creatorId: currentUser.uid,
                status: 'active',
                createdAt: serverTimestamp()
            });
        },

        fetchMissionLogsByDate: async (guildId: string, missionId: string) => { /* ... 기존 코드 ... */
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
            /* ... 기존 completeMission 코드 복사 (수정 없음) ... */
             const currentUser = get(userStore);
             /* (이전 답변의 트랜잭션 로직 그대로 사용) */
             const today = getTodayDateString();

             // 중복 체크 로직도 그대로 유지
             const q = query(
                collection(db, `guilds/${guildId}/mission_logs`),
                where('missionId', '==', mission.id),
                where('performedDate', '==', today)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                 // 사실 UI에서 막겠지만, 백엔드 이중 방어
                 throw new Error("🚫 이미 금일 완료된 미션입니다.");
            }
            
            /* ... 트랜잭션 로직 ... */
             const logRef = doc(collection(db, `guilds/${guildId}/mission_logs`));
             try {
                await runTransaction(db, async (t) => {
                     /* ... (이전 답변의 Phase 1 읽기 -> Phase 2 쓰기 로직) ... */
                     const charRefs = characters.map(char => doc(db, `guilds/${guildId}/characters`, char.id));
                     const charDocs = await Promise.all(charRefs.map(ref => t.get(ref)));
                     
                     charDocs.forEach((d, i) => { if(!d.exists()) throw new Error("Character not found"); });

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
                    
                    charDocs.forEach((d, i) => {
                        const newGold = (d.data().currentGold || 0) + mission.cost;
                        t.update(charRefs[i], { currentGold: newGold });
                    });
                });
             } catch(e) { throw e; }
        }
    };
}

export const missionStore = createMissionStore();