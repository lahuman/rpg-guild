// src/lib/stores/guildStore.ts
import { writable } from 'svelte/store';
import { db, auth } from '$lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  writeBatch,
  arrayUnion 
} from 'firebase/firestore';

// ... (기존 createGuild 코드는 유지) ...

function createGuildStore() {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,

    // [New] 길드 가입 함수
    joinGuild: async (guildId: string, user: any) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      
      // 이미 다른 길드에 가입했는지 확인하는 로직이 있으면 좋음 (생략 가능하지만 권장)
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().guildId) {
        throw new Error("이미 가입된 길드가 있습니다. 탈퇴 후 시도해주세요.");
      }

      const batch = writeBatch(db);

      // 1. 길드의 members 서브 컬렉션에 유저 추가
      // (나중에 6단계에서 이곳에 '골드', '기여도' 등을 저장하게 됨)
      const memberRef = doc(db, "guilds", guildId, "members", user.uid);
      batch.set(memberRef, {
        uid: user.uid,
        email: user.email,
        joinedAt: new Date().toISOString(),
        role: 'member', // 누구나 관리 가능하므로 role은 단순 참고용
        currentGold: 0  // 6단계를 위한 초기화
      });

      // 2. 유저 정보에 '소속 길드 ID' 업데이트
      batch.update(userRef, {
        guildId: guildId
      });

      // 3. 길드 메타데이터의 'memberCount' 증가 (옵션: 보여주기용)
      const guildRef = doc(db, "guilds", guildId);
      batch.update(guildRef, {
        memberCount: increment(1)
      });

      await batch.commit();
      console.log(`Joined guild ${guildId} successfully!`);
    }
  };
}

export const guildStore = createGuildStore();