// src/lib/stores/guildStore.ts
import { writable, get } from 'svelte/store';
import { db } from '$lib/firebase';
import { 
    collection, doc, updateDoc, deleteDoc, addDoc,
    query, onSnapshot, serverTimestamp, orderBy, runTransaction 
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
    createdBy: string;
    createdAt: any;
}

// [NEW] 골드 사용 내역 모델
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

    return {
        subscribe,

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

        // --- 멤버 관리 (CRUD) ---

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

        // --- [NEW] 골드 사용 (Shop) ---
        
        useGold: async (guildId: string, charId: string, itemName: string, cost: number) => {
            const currentUser = get(userStore);
            if (!currentUser) throw new Error("로그인이 필요합니다.");

            const charRef = doc(db, `guilds/${guildId}/characters`, charId);
            const logRef = doc(collection(db, `guilds/${guildId}/usage_logs`));

            try {
                await runTransaction(db, async (t) => {
                    // 1. 읽기 (Read)
                    const charDoc = await t.get(charRef);
                    if (!charDoc.exists()) throw new Error("캐릭터가 존재하지 않습니다.");

                    const currentGold = charDoc.data().currentGold || 0;
                    const charName = charDoc.data().name;

                    // 2. 잔액 검사
                    if (currentGold < cost) {
                        throw new Error(`골드가 부족합니다! (보유: ${currentGold} G / 필요: ${cost} G)`);
                    }

                    // 3. 쓰기 (Write)
                    // A. 로그 기록
                    t.set(logRef, {
                        characterId: charId,
                        characterName: charName,
                        itemName: itemName,
                        cost: cost,
                        usedAt: serverTimestamp(),
                        usedByUserId: currentUser.uid
                    });

                    // B. 골드 차감
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