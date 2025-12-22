// src/lib/stores/guildStore.ts
import { writable } from 'svelte/store';
import { db } from '$lib/firebase';
import { 
  doc, 
  collection,
  writeBatch,
  increment,
  addDoc,
  serverTimestamp, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

function createGuildStore() {
  const { subscribe } = writable([]);

  // 초대 코드 생성 (랜덤 6자리)
  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  return {
    subscribe,

    // [Step 4] 길드 생성 기능 (추가됨)
    createGuild: async (guildName: string, user: any) => {
      if (!user) throw new Error("로그인이 필요합니다.");
      if (!guildName) throw new Error("길드 이름을 입력해주세요.");

      const batch = writeBatch(db);
      
      // 1. 길드 문서 생성
      // (Batch 내에서 ID를 미리 받기 위해 doc()을 사용합니다)
      const guildRef = doc(collection(db, "guilds"));
      const guildId = guildRef.id;

      batch.set(guildRef, {
        name: guildName,
        code: generateCode(),
        leaderId: user.uid,
        memberCount: 1,
        description: `${user.displayName || '리더'}님이 이끄는 길드입니다.`,
        createdAt: serverTimestamp()
      });

      // 2. 길드 멤버(리더) 추가
      const memberRef = doc(db, "guilds", guildId, "members", user.uid);
      batch.set(memberRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'leader',
        joinedAt: new Date().toISOString(),
        currentGold: 0
      });

      // 3. 유저 정보 업데이트 (소속 길드 표시)
      const userRef = doc(db, "users", user.uid);
      batch.update(userRef, {
        guildId: guildId
      });

      await batch.commit();
      console.log('Guild created:', guildId);
      return guildId; // 생성된 ID 반환
    },

    // [Step 4] 길드 가입 기능
    joinGuild: async (inviteCode: string, user: any) => {
      if (!user) throw new Error("로그인이 필요합니다.");

      // 1. 코드로 길드 찾기
      const q = query(collection(db, "guilds"), where("code", "==", inviteCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("존재하지 않는 초대 코드입니다.");
      }

      const targetGuild = querySnapshot.docs[0];
      const guildId = targetGuild.id;

      // 2. 배치 처리
      const batch = writeBatch(db);

      // 멤버 추가
      const memberRef = doc(db, "guilds", guildId, "members", user.uid);
      batch.set(memberRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'member',
        joinedAt: new Date().toISOString(),
        currentGold: 0
      });

      // 유저 정보 업데이트
      const userRef = doc(db, "users", user.uid);
      batch.update(userRef, {
        guildId: guildId
      });

      // 멤버 수 증가
      const guildRef = doc(db, "guilds", guildId);
      batch.update(guildRef, {
        memberCount: increment(1)
      });

      await batch.commit();
      return guildId;
    }
  };
}

export const guildStore = createGuildStore();