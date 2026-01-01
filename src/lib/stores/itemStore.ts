// src/lib/stores/itemStore.ts
import { writable } from 'svelte/store';
import { db } from '$lib/firebase';
import { 
    collection, addDoc, doc, updateDoc, deleteDoc, 
    query, onSnapshot, serverTimestamp, orderBy 
} from 'firebase/firestore';

export interface ShopItem {
    id?: string;
    name: string;
    cost: number;
    icon: string;
    description?: string;
    isOneTime?: boolean; // [추가] 일회성 아이템 여부
    createdAt?: any;
}

function createItemStore() {
    const { subscribe, set } = writable<ShopItem[]>([]);

    return {
        subscribe,

        init: (guildId: string) => {
            if (!guildId) {
                console.error("❌ itemStore init 실패: guildId가 없습니다.");
                return () => {};
            }

            console.log(`📡 [${guildId}] 상점 아이템 구독 시작...`);

            // [수정 포인트 1] 일단 에러 배제를 위해 orderBy 제거하고 기본 query만 사용
            // const q = query(
            //     collection(db, `guilds/${guildId}/items`),
            //     orderBy('cost', 'asc') 
            // );
            
            // 👇 단순 쿼리로 변경 (테스트용)
            const q = query(collection(db, `guilds/${guildId}/items`));
            
            return onSnapshot(q, (snapshot) => {
                console.log(`📦 데이터 수신: ${snapshot.docs.length}개 발견`); // 로그 확인용
                
                const items = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // console.log(" - 아이템:", data.name, data.cost);
                    return { 
                        id: doc.id, 
                        ...data 
                    } as ShopItem;
                });
                
                // 가격 순 정렬을 클라이언트(JS)에서 처리 (DB 색인 문제 회피)
                items.sort((a, b) => a.cost - b.cost);

                set(items);
            }, (error) => {
                console.error("🔥 데이터 조회 실패 (Snapshot Error):", error);
            });
        },

        addItem: async (guildId: string, item: ShopItem) => {
            // (기존 코드 동일)
            await addDoc(collection(db, `guilds/${guildId}/items`), {
                ...item,
                createdAt: serverTimestamp()
            });
        },

        updateItem: async (guildId: string, itemId: string, updates: Partial<ShopItem>) => {
             // (기존 코드 동일)
            const ref = doc(db, `guilds/${guildId}/items`, itemId);
            await updateDoc(ref, updates);
        },

        deleteItem: async (guildId: string, itemId: string) => {
             // (기존 코드 동일)
            const ref = doc(db, `guilds/${guildId}/items`, itemId);
            await deleteDoc(ref);
        }
    };
}

export const itemStore = createItemStore();