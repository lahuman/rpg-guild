import { writable } from 'svelte/store';
import { auth, db } from '$lib/firebase'; // firebase 초기화 파일
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

// 유저 데이터 타입 정의 (확장성을 위해 미리 정의)
export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  guildId?: string | null; // 소속 길드 ID
  currentGold?: number;    // 보유 골드 (6단계용)
  createdAt?: string;
}

function createUserStore() {
  // [변경] 초기값을 undefined로 설정하여 '로딩 중' 상태를 표현합니다.
  const { subscribe, set } = writable<UserData | null | undefined>(undefined);

  // 브라우저 환경에서만 실행 (SSR 이슈 방지)
  if (typeof window !== 'undefined') {
    
    // 1. Firebase Auth 상태 감시
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // A. 로그인 상태: Firestore 데이터 실시간 연동
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Firestore 리스너 (DB 데이터가 바뀌면 스토어도 자동 업데이트 됨)
        onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            // DB에 정보가 있으면 합쳐서 Store에 저장
            const dbData = docSnap.data();
            set({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              guildId: dbData.guildId || null,
              currentGold: dbData.currentGold || 0,
              ...dbData
            });
          } else {
            // DB에 문서가 없으면(최초 로그인 등) 기본 문서 생성
            const initialData = {
              email: firebaseUser.email,
              guildId: null,
              currentGold: 0,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, initialData, { merge: true });
            
            // Store 업데이트
            set({
              uid: firebaseUser.uid,
              ...initialData,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            });
          }
        });

      } else {
        // B. 로그아웃 상태: Store를 명확히 null로 설정
        set(null);
      }
    });
  }

  return {
    subscribe,
    // 👇 [NEW] 길드 탈퇴 함수 추가
    leaveGuild: async (uid: string) => {
        const userRef = doc(db, 'users', uid);
        // guildId를 null로 밀어서 소속을 없앱니다.
        await updateDoc(userRef, { 
            guildId: null 
        });
    }
  };
}

export const userStore = createUserStore();