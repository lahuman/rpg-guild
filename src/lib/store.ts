// src/lib/store.ts
import { writable } from 'svelte/store';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

import {
    collection, addDoc, updateDoc, serverTimestamp,
    query, where, getDocs
} from 'firebase/firestore';

// --- [데이터 타입 정의] ---

// 1. 사용자 데이터 (내 캐릭터 정보)
export interface UserProfile {
    uid: string;
    email: string | null;
    name: string;        // 표시 이름 (닉네임)
    photoURL: string | null;

    // RPG 요소
    job: string;         // 직업 (예: 검사, 마법사 - 초기값: '모험가')
    gold: number;        // 보유 골드

    // 소속 정보
    guildId: string | null; // 가입된 길드 ID (없으면 null)
    role: 'leader' | 'member' | null; // 길드 내 권한
}

// 2. 길드 데이터 (공동체 정보)
export interface GuildInfo {
    id: string;
    name: string;
    code: string;        // 초대 코드 (예: AB12CD)
    createdAt: any;
}

// --- [Svelte Stores] ---
export const user = writable<UserProfile | null>(null); // 내 정보
export const guild = writable<GuildInfo | null>(null);  // 내가 속한 길드 정보
export const isLoading = writable(true); // 로딩 상태

// --- [인증 리스너 (앱 시작 시 1회 실행)] ---
export const initAuth = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
        isLoading.set(true);
        console.log('auth state changed:', firebaseUser);
        if (firebaseUser) {
            // 1. 로그인 됨 -> Firestore에서 '내 캐릭터 정보' 가져오기
            const userRef = doc(db, 'users', firebaseUser.uid);

            // 내 정보 실시간 구독 (골드 변화 등을 바로 반영하기 위해)
            onSnapshot(userRef, async (userSnap) => {
                if (userSnap.exists()) {
                    // A. 이미 가입된 유저
                    const userData = userSnap.data() as UserProfile;
                    user.set({ ...userData, uid: firebaseUser.uid });

                    // B. 길드가 있다면 길드 정보도 구독
                    if (userData.guildId) {
                        onSnapshot(doc(db, 'guilds', userData.guildId), (guildSnap) => {
                            if (guildSnap.exists()) {
                                guild.set({ id: guildSnap.id, ...guildSnap.data() } as GuildInfo);
                            }
                        });
                    } else {
                        guild.set(null);
                    }

                } else {
                    // C. 신규 유저 -> DB에 기본 정보 생성 (초기화)
                    const newUser: UserProfile = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: firebaseUser.displayName || '이름 없음',
                        photoURL: firebaseUser.photoURL,
                        job: '모험가', // 기본 직업
                        gold: 0,      // 초기 자금 0원
                        guildId: null,
                        role: null
                    };
                    await setDoc(userRef, newUser);
                    user.set(newUser);
                }
                isLoading.set(false);
            });

        } else {
            // 2. 로그아웃 됨
            user.set(null);
            guild.set(null);
            isLoading.set(false);
        }
    });
};


// src/lib/store.ts 맨 아래에 추가


// 1. 랜덤 초대 코드 생성 유틸리티 (6자리 영문+숫자)
const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// 2. 길드 생성하기 (Create)
export const createGuild = async (guildName: string, userId: string) => {
    // A. 길드 문서 생성
    const newGuildRef = await addDoc(collection(db, 'guilds'), {
        name: guildName,
        leaderId: userId,
        code: generateCode(), // 랜덤 초대 코드
        createdAt: serverTimestamp()
    });

    // B. 나(유저)를 길드장으로 업데이트
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        guildId: newGuildRef.id,
        role: 'leader'
    });
};

// 3. 길드 가입하기 (Join)
export const joinGuild = async (inviteCode: string, userId: string) => {
    // A. 코드로 길드 찾기
    const q = query(collection(db, 'guilds'), where('code', '==', inviteCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("존재하지 않는 초대 코드입니다. 다시 확인해주세요!");
    }

    // B. 길드 ID 가져오기
    const targetGuildId = querySnapshot.docs[0].id;

    // C. 나(유저)를 멤버로 업데이트
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        guildId: targetGuildId,
        role: 'member'
    });
};

// 4. 길드 탈퇴/초기화 (Leave - 테스트용)
export const leaveGuild = async (userId: string) => {
    if (!confirm("정말 길드를 떠나시겠습니까? (데이터 초기화)")) return;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        guildId: null,
        role: null
    });
};