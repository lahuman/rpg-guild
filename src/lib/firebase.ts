
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
// ⚠️ signInWithPopup으로 변경!
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore';
import { goto } from '$app/navigation'; // [추가] 네비게이션 모듈
import { notifyError } from '$lib';


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 앱 초기화
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// 👇 [변경됨] 팝업 로그인 함수
export const login = async () => {
  try {
    console.log("팝업 로그인 시도...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("🎉 팝업 로그인 성공!", result.user);
    // 팝업은 성공하면 여기서 바로 user 정보가 찍혀야 합니다.
  } catch (e) {
    console.error("❌ 로그인 실패:", e);
    notifyError(e, '로그인에 실패했습니다.');
  }
};

export const logout = async () => {
  await signOut(auth);
  goto('/'); // [핵심] 메인 페이지로 강제 이동
  if (typeof window !== 'undefined') window.location.reload();
};
