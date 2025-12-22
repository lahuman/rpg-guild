// src/lib/stores/guildStore.ts
import { writable } from 'svelte/store';
import { db } from '$lib/firebase';
import { 
    collection, doc, updateDoc, deleteDoc, addDoc,
    query, onSnapshot, serverTimestamp, orderBy
} from 'firebase/firestore';

// 직업군 정의
export type JobClass = '검사' | '마법사' | '힐러' | '사냥꾼' | '도적' | '탱커';

export interface GuildCharacter {
    id?: string;
    name: string;        // 캐릭터 이름 (예: 아라곤)
    jobClass: JobClass;  // 직업
    description: string; // 캐릭터 설정/소설 내용
    currentGold: number; // 이 캐릭터가 번 골드
    level: number;       // 성장 요소 (추후 확장용)
    createdBy: string;   // 이 캐릭터를 만든 실제 유저 UID (작가)
    createdAt: any;
}

export interface Guild {
    id?: string;
    name: string;
    code: string;
    leaderId: string;
    description: string;
    characters?: GuildCharacter[]; // 가상 인물 리스트
}

function createGuildStore() {
    const { subscribe, set, update } = writable<Guild | null>(null);

    return {
        subscribe,

        // 1. 길드 및 캐릭터 실시간 동기화
        init: (guildId: string) => {
            // 길드 정보
            const unsubGuild = onSnapshot(doc(db, 'guilds', guildId), (docSnap) => {
                if (docSnap.exists()) {
                    update(g => ({ ...g, id: docSnap.id, ...docSnap.data() } as Guild));
                }
            });

            // 캐릭터(가상 길드원) 리스트
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

        // 2. 캐릭터 생성 (가상 인물 추가)
        createCharacter: async (guildId: string, charData: Omit<GuildCharacter, 'id' | 'createdAt' | 'level' | 'currentGold'>) => {
            await addDoc(collection(db, `guilds/${guildId}/characters`), {
                ...charData,
                level: 1,
                currentGold: 0,
                createdAt: serverTimestamp()
            });
        },

        // 3. 캐릭터 정보 수정
        updateCharacter: async (guildId: string, charId: string, updates: Partial<GuildCharacter>) => {
            const ref = doc(db, `guilds/${guildId}/characters`, charId);
            await updateDoc(ref, updates);
        },

        // 4. 캐릭터 삭제
        deleteCharacter: async (guildId: string, charId: string) => {
            const ref = doc(db, `guilds/${guildId}/characters`, charId);
            await deleteDoc(ref);
        }
    };
}

export const guildStore = createGuildStore();