// src/lib/stores/guildStore.ts
import { writable, get } from 'svelte/store';
import { db } from '$lib/firebase';
import { 
    collection, doc, updateDoc, deleteDoc, addDoc, getDocs,
    query, where, onSnapshot, serverTimestamp, orderBy, runTransaction 
} from 'firebase/firestore';
import { userStore } from './userStore';

export type JobClass = '검사' | '마법사' | '힐러' | '사냥꾼' | '도적' | '탱커';

export interface GuildCharacter {
    id?: string;
    name: string;
    jobClass: JobClass;
    description: string;
    currentGold: number;
    level: number;
    exp?: number; // [추가] 누적 획득 골드 (레벨업 기준)
    createdBy: string;
    createdAt: any;
}

export interface UsageLog {
    characterId: string;
    characterName: string;
    itemName: string;
    cost: number;
    usedAt: any;
    usedByUserId: string;
}

export interface Guild {
    id?: string;
    name: string;
    code: string;
    leaderId: string;
    description: string;
    characters?: GuildCharacter[];
}

function createGuildStore() {
    const { subscribe, set, update } = writable<Guild | null>(null);

    // 초대 코드 생성 헬퍼 (6자리)
    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    return {
        subscribe,

        // 1. 초기화 (리스너 연결)
        init: (guildId: string) => {
            const unsubGuild = onSnapshot(doc(db, 'guilds', guildId), (docSnap) => {
                if (docSnap.exists()) {
                    update(g => ({ ...g, id: docSnap.id, ...docSnap.data() } as Guild));
                }
            });

            const q = query(
                collection(db, `guilds/${guildId}/characters`), 
                orderBy('createdAt', 'desc')
            );
            
            const unsubChars = onSnapshot(q, (snapshot) => {
                const characters = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GuildCharacter));
                update(g => g ? { ...g, characters } : null);
            });

            return () => {
                unsubGuild();
                unsubChars();
            };
        },

        // 2. [복구됨] 길드 생성
        createGuild: async (name: string, user: any) => {
            if (!user) throw new Error("로그인이 필요합니다.");
            
            const code = generateCode();
            const guildRef = await addDoc(collection(db, 'guilds'), {
                name,
                code,
                leaderId: user.uid,
                description: '',
                createdAt: serverTimestamp()
            });

            // 생성자(리더)를 해당 길드 소속으로 업데이트
            await updateDoc(doc(db, 'users', user.uid), {
                guildId: guildRef.id
            });

            return guildRef.id;
        },

        // 3. [복구됨] 길드 가입
        joinGuild: async (code: string, user: any) => {
            if (!user) throw new Error("로그인이 필요합니다.");

            // 코드에 맞는 길드 찾기
            const q = query(collection(db, 'guilds'), where('code', '==', code));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error("잘못된 초대 코드입니다.");
            }

            const guildDoc = snapshot.docs[0];
            const guildId = guildDoc.id;

            // 유저 소속 업데이트
            await updateDoc(doc(db, 'users', user.uid), {
                guildId: guildId
            });

            return guildId;
        },

        // --- 캐릭터 관리 (CRUD) ---

        createCharacter: async (guildId: string, charData: Omit<GuildCharacter, 'id' | 'createdAt' | 'level' | 'currentGold'>) => {
            await addDoc(collection(db, `guilds/${guildId}/characters`), {
                ...charData,
                level: 1,
                currentGold: 0,
                createdAt: serverTimestamp()
            });
        },

        updateCharacter: async (guildId: string, charId: string, updates: Partial<GuildCharacter>) => {
            const ref = doc(db, `guilds/${guildId}/characters`, charId);
            await updateDoc(ref, updates);
        },

        deleteCharacter: async (guildId: string, charId: string) => {
            const ref = doc(db, `guilds/${guildId}/characters`, charId);
            await deleteDoc(ref);
        },

        // --- 골드 사용 (Shop) ---
        
        useGold: async (guildId: string, charId: string, itemName: string, cost: number) => {
            const currentUser = get(userStore);
            if (!currentUser) throw new Error("로그인이 필요합니다.");

            const charRef = doc(db, `guilds/${guildId}/characters`, charId);
            const logRef = doc(collection(db, `guilds/${guildId}/usage_logs`));

            try {
                await runTransaction(db, async (t) => {
                    const charDoc = await t.get(charRef);
                    if (!charDoc.exists()) throw new Error("캐릭터가 존재하지 않습니다.");

                    const currentGold = charDoc.data().currentGold || 0;
                    const charName = charDoc.data().name;

                    if (currentGold < cost) {
                        throw new Error(`골드가 부족합니다! (보유: ${currentGold} G / 필요: ${cost} G)`);
                    }

                    t.set(logRef, {
                        characterId: charId,
                        characterName: charName,
                        itemName: itemName,
                        cost: cost,
                        usedAt: serverTimestamp(),
                        usedByUserId: currentUser.uid
                    });

                    t.update(charRef, {
                        currentGold: currentGold - cost
                    });
                });
            } catch (e) {
                console.error("Gold usage failed:", e);
                throw e;
            }
        }
    };
}

export const guildStore = createGuildStore();