// src/lib/stores/missionStore.ts
import { writable, get } from 'svelte/store';
import { db } from '$lib/firebase';
import { 
    collection, addDoc, query, where, onSnapshot, 
    doc, runTransaction, serverTimestamp, orderBy, Timestamp 
} from 'firebase/firestore';
import { userStore } from './userStore'; // 현재 유저 정보 가져오기 위함

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

export interface MissionLog {
    id?: string;
    missionId: string;
    missionTitle: string;
    creatorId: string; // 미션 만든 사람
    performerIds: string[]; // 수행한 사람 목록
    approverId: string; // 승인한 사람
    totalReward: number;
    performedDate: string; // YYYY-MM-DD
    createdAt: any;
}

function createMissionStore() {
    const { subscribe, set, update } = writable<Mission[]>([]);

    // 날짜 포맷팅 헬퍼 (YYYY-MM-DD)
    const getTodayDateString = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        subscribe,

        // 1. 미션 목록 실시간 동기화
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

        // 2. 미션 생성 (누구나 가능)
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

        // 3. 미션 수행 및 보상 지급 (핵심: Transaction)
        completeMission: async (guildId: string, mission: Mission, performerIds: string[]) => {
            const currentUser = get(userStore);
            if (!currentUser) throw new Error("로그인이 필요합니다.");
            
            const today = getTodayDateString();
            const logRef = doc(collection(db, `guilds/${guildId}/mission_logs`)); // 새 로그 ID 생성

            try {
                await runTransaction(db, async (transaction) => {
                    // A. 중복 수행 체크 (Client 체크를 뚫었을 경우를 대비한 DB단 방어)
                    // (복잡한 쿼리는 트랜잭션 내에서 제약이 있으므로, 여기서는 MVP 레벨로 생략하고 
                    //  UI단 방어 + 사후 로그 감시에 의존하거나, 별도 인덱싱된 문서로 체크해야 함.
                    //  이번 버전은 '신뢰 기반'이므로 Transaction 내 중복 체크는 패스하고 원자성만 보장함)

                    // B. 로그 기록 작성
                    transaction.set(logRef, {
                        missionId: mission.id,
                        missionTitle: mission.title,
                        creatorId: mission.creatorId,
                        performerIds: performerIds,
                        approverId: currentUser.uid,
                        totalReward: mission.cost * performerIds.length,
                        performedDate: today,
                        createdAt: serverTimestamp()
                    });

                    // C. 수행한 멤버 전원에게 골드 지급
                    for (const uid of performerIds) {
                        const memberRef = doc(db, `guilds/${guildId}/members`, uid);
                        // 멤버 문서가 존재하는지 읽어봐야 함
                        const memberDoc = await transaction.get(memberRef);
                        if (!memberDoc.exists()) {
                            throw new Error(`Member ${uid} does not exist!`);
                        }
                        
                        const newGold = (memberDoc.data().currentGold || 0) + mission.cost;
                        transaction.update(memberRef, { currentGold: newGold });
                    }
                });
                console.log("Mission Completed & Gold Rewarded safely!");
            } catch (e) {
                console.error("Transaction failed: ", e);
                throw e;
            }
        },

        // 4. 오늘 수행한 로그 가져오기 (UI 비활성화용)
        fetchTodayLogs: async (guildId: string) => {
            const today = getTodayDateString();
            const q = query(
                collection(db, `guilds/${guildId}/mission_logs`),
                where('performedDate', '==', today)
            );
            // 이 부분은 컴포넌트에서 호출하여 로컬 상태로 관리 권장
            // 단순 참조용 리턴을 구현하려면 별도 함수로 분리하거나 여기서 처리
        }
    };
}

export const missionStore = createMissionStore();