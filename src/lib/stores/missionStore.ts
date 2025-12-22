// src/lib/stores/missionStore.ts
import { writable } from 'svelte/store';
import { db } from '$lib/firebase'; // Step 2에서 설정한 firebase 인스턴스
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

// 미션 데이터 타입 정의
export interface Mission {
  title: string;
  description: string;
  grade: 'S' | 'A' | 'B' | 'C' | 'D'; // 등급
  cost: number;         // 비용 (또는 보상 골드)
  maxParticipants: number; // 최대 참가 인원
  targetDate: string;   // 미션 수행 날짜 (YYYY-MM-DD)
  guildId: string;
  createdAt?: any;
}

function createMissionStore() {
  const { subscribe, set, update } = writable<Mission[]>([]);

  return {
    subscribe,
    
    // 미션 생성 함수
    createMission: async (guildId: string, missionData: Omit<Mission, 'guildId' | 'createdAt'>) => {
      try {
        // guilds 컬렉션 아래 missions 서브 컬렉션 사용
        const missionsRef = collection(db, 'guilds', guildId, 'missions');
        
        await addDoc(missionsRef, {
          ...missionData,
          guildId,
          createdAt: serverTimestamp(),
          currentParticipants: 0, // 현재 참가자 수는 0부터 시작
          status: 'open' // open, closed, completed
        });
        
        console.log('Mission created successfully!');
        return true;
      } catch (error) {
        console.error('Error creating mission:', error);
        throw error;
      }
    },

    // (옵션) 특정 길드의 특정 날짜 미션 불러오기
    fetchMissions: async (guildId: string, date: string) => {
        // 추후 구현: 쿼리 로직
    }
  };
}

export const missionStore = createMissionStore();