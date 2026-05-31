// src/lib/stores/missionStore.ts
import { writable, get } from 'svelte/store';
import { db } from '$lib/firebase';
import {
    collection, addDoc, query, where, onSnapshot, getDocs,
    doc, runTransaction, serverTimestamp, updateDoc // [NEW] updateDoc 추가
} from 'firebase/firestore';
import { userStore } from './userStore';
import type { Guild } from './guildStore';
import { getTodayDateKey, toDateOrNull } from '$lib';
import { calculateBountyTotalGold, getBountyExpiresAt, isBountyExpired } from '$lib/features/missions/bounty';
import type { FirestoreTimestampLike } from './guild/types';

type MissionFundingType = 'guild' | 'character';
type BountyClosedReason = 'completed' | 'expired' | 'deleted';

export interface Mission {
    id?: string;
    title: string;
    description: string;
    cost: number;
    type: 'solo' | 'party' | 'assigned';
    minParticipants: number;
    maxParticipants: number;
    assignedCharacterId?: string;
    assignedCharacterName?: string;
    creatorId: string;
    status: 'active' | 'inactive';
    isOneTime?: boolean; // [추가] 일회성 미션 여부
    createdAt?: FirestoreTimestampLike | Date | null;
    fundingType?: MissionFundingType;
    sponsorCharacterId?: string;
    sponsorCharacterName?: string;
    bountyTotalGold?: number;
    bountyRemainingGold?: number;
    bountyExpiresAt?: FirestoreTimestampLike | Date | null;
    bountyClosedReason?: BountyClosedReason;
}

interface MissionLogData {
    performerCharacterIds?: string[];
}

export type MissionInput = Pick<
    Mission,
    'title' | 'description' | 'cost' | 'type' | 'minParticipants' | 'maxParticipants' | 'isOneTime'
    | 'assignedCharacterId' | 'assignedCharacterName'
>;

export type FundedMissionInput = MissionInput & {
    sponsorCharacterId: string;
    sponsorCharacterName?: string;
};

export interface MissionCompletionCharacter {
    id: string;
    name: string;
}

function createMissionStore() {
    const { subscribe, set } = writable<Mission[]>([]);

    // 오늘 완료된 미션 ID들을 저장하는 별도 스토어
    const completedMissionIds = writable<Set<string>>(new Set());

    return {
        subscribe,
        completedMissionIds: { subscribe: completedMissionIds.subscribe },

        // 1. 미션 목록 리스너
        init: (guildId: string) => {
            const q = query(
                collection(db, `guilds/${guildId}/missions`),
                where('status', '==', 'active')
            );
            return onSnapshot(q, (snapshot) => {
                const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mission));
                set(missions);
            });
        },

        // 2. 오늘 수행된 로그 리스너
        initTodayStatus: (guildId: string) => {
            const today = getTodayDateKey();
            const q = query(
                collection(db, `guilds/${guildId}/mission_logs`),
                where('performedDate', '==', today)
            );

            return onSnapshot(q, (snapshot) => {
                const ids = new Set<string>();
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.missionId) ids.add(data.missionId);
                });
                completedMissionIds.set(ids);
            });
        },

        addMission: async (guildId: string, mission: MissionInput) => {
            const currentUser = get(userStore);
            if (!currentUser) throw new Error("로그인이 필요합니다.");
            await addDoc(collection(db, `guilds/${guildId}/missions`), {
                ...mission,
                fundingType: 'guild',
                creatorId: currentUser.uid,
                status: 'active',
                createdAt: serverTimestamp()
            });
        },

        addFundedMission: async (guildId: string, mission: FundedMissionInput) => {
            const currentUser = get(userStore);
            if (!currentUser) throw new Error("로그인이 필요합니다.");
            if (!mission.sponsorCharacterId) throw new Error("의뢰자 캐릭터가 필요합니다.");

            const normalizedType = mission.type;
            const normalizedMaxParticipants =
                normalizedType === 'party' ? Math.max(2, Number(mission.maxParticipants) || 2) : 1;
            const normalizedCost = Math.max(0, Number(mission.cost) || 0);
            const bountyTotalGold = calculateBountyTotalGold(normalizedCost, normalizedType, normalizedMaxParticipants);
            const createdAt = new Date();
            const bountyExpiresAt = getBountyExpiresAt(createdAt);
            const sponsorRef = doc(db, `guilds/${guildId}/characters`, mission.sponsorCharacterId);
            const missionRef = doc(collection(db, `guilds/${guildId}/missions`));

            await runTransaction(db, async (t) => {
                const sponsorDoc = await t.get(sponsorRef);
                if (!sponsorDoc.exists()) throw new Error("의뢰자 캐릭터가 존재하지 않습니다.");

                const sponsorData = sponsorDoc.data();
                const sponsorGold = sponsorData.currentGold || 0;
                if (sponsorGold < bountyTotalGold) {
                    throw new Error(`골드가 부족합니다! (보유: ${sponsorGold} G / 필요: ${bountyTotalGold} G)`);
                }

                t.update(sponsorRef, {
                    currentGold: sponsorGold - bountyTotalGold
                });

                t.set(missionRef, {
                    ...mission,
                    cost: normalizedCost,
                    minParticipants: 1,
                    maxParticipants: normalizedMaxParticipants,
                    assignedCharacterId: normalizedType === 'assigned' ? mission.assignedCharacterId || '' : '',
                    assignedCharacterName: normalizedType === 'assigned' ? mission.assignedCharacterName || '' : '',
                    creatorId: currentUser.uid,
                    status: 'active',
                    isOneTime: true,
                    fundingType: 'character',
                    sponsorCharacterId: mission.sponsorCharacterId,
                    sponsorCharacterName: sponsorData.name || mission.sponsorCharacterName || '의뢰자',
                    bountyTotalGold,
                    bountyRemainingGold: bountyTotalGold,
                    bountyExpiresAt,
                    createdAt: serverTimestamp()
                });
            });
        },

        // [NEW] 미션 수정
        updateMission: async (guildId: string, missionId: string, updates: Partial<Mission>) => {
            const ref = doc(db, `guilds/${guildId}/missions`, missionId);
            await updateDoc(ref, {
                ...updates,
                updatedAt: serverTimestamp()
            });
        },

        // [NEW] 미션 삭제 (Soft Delete)
        deleteMission: async (guildId: string, missionId: string) => {
            const ref = doc(db, `guilds/${guildId}/missions`, missionId);
            await runTransaction(db, async (t) => {
                const missionDoc = await t.get(ref);
                if (!missionDoc.exists()) throw new Error("미션이 존재하지 않습니다.");

                const mission = missionDoc.data() as Mission;
                const updates: Record<string, unknown> = {
                    status: 'inactive',
                    deletedAt: serverTimestamp()
                };

                if (mission.status === 'active' && mission.fundingType === 'character') {
                    const refundGold = mission.bountyRemainingGold || 0;
                    if (refundGold > 0 && mission.sponsorCharacterId) {
                        const sponsorRef = doc(db, `guilds/${guildId}/characters`, mission.sponsorCharacterId);
                        const sponsorDoc = await t.get(sponsorRef);
                        if (sponsorDoc.exists()) {
                            t.update(sponsorRef, {
                                currentGold: (sponsorDoc.data().currentGold || 0) + refundGold
                            });
                        }
                    }

                    updates.bountyRemainingGold = 0;
                    updates.bountyClosedReason = 'deleted';
                }

                t.update(ref, updates);
            });
        },

        fetchMissionLogsByDate: async (guildId: string, missionId: string) => {
            const today = getTodayDateKey();
            const q = query(
                collection(db, `guilds/${guildId}/mission_logs`),
                where('missionId', '==', missionId),
                where('performedDate', '==', today)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => d.data() as MissionLogData);
        },

        expireFundedMission: async (guildId: string, missionId: string) => {
            const missionRef = doc(db, `guilds/${guildId}/missions`, missionId);

            return runTransaction(db, async (t) => {
                const missionDoc = await t.get(missionRef);
                if (!missionDoc.exists()) return { expired: false };

                const mission = missionDoc.data() as Mission;
                if (mission.status !== 'active' || mission.fundingType !== 'character') {
                    return { expired: false };
                }

                const expiresAt = toDateOrNull(mission.bountyExpiresAt);
                if (!expiresAt || !isBountyExpired(expiresAt)) {
                    return { expired: false };
                }

                const refundGold = mission.bountyRemainingGold || 0;
                if (refundGold > 0 && mission.sponsorCharacterId) {
                    const sponsorRef = doc(db, `guilds/${guildId}/characters`, mission.sponsorCharacterId);
                    const sponsorDoc = await t.get(sponsorRef);
                    if (sponsorDoc.exists()) {
                        t.update(sponsorRef, {
                            currentGold: (sponsorDoc.data().currentGold || 0) + refundGold
                        });
                    }
                }

                t.update(missionRef, {
                    status: 'inactive',
                    bountyRemainingGold: 0,
                    bountyClosedReason: 'expired',
                    expiredAt: serverTimestamp()
                });

                return { expired: true };
            });
        },

        // [수정] completeMission이 결과 객체를 반환하고 길드 설정을 받도록 변경
        completeMission: async (
            guildId: string,
            mission: Mission,
            characters: MissionCompletionCharacter[],
            guild: Guild
        ) => {
            const currentUser = get(userStore);
            if (!currentUser) throw new Error("로그인이 필요합니다.");
            const today = getTodayDateKey();
            const isFundedMission = mission.fundingType === 'character';

            const q = query(
                collection(db, `guilds/${guildId}/mission_logs`),
                where('missionId', '==', mission.id),
                where('performedDate', '==', today)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                throw new Error("🚫 이미 금일 완료된 미션입니다.");
            }

            // 길드 설정에 따른 확률 로직으로 변경
            let bonusGold = 0;
            let isChestFound = false;
            
            const boxChance = guild.boxChance ?? 0.2;
            const maxBonusGold = guild.maxBonusGold ?? 36;

            if (!isFundedMission && Math.random() < boxChance) {
                isChestFound = true;
                bonusGold = Math.floor(Math.random() * (maxBonusGold + 1));
            }

            const logRef = doc(collection(db, `guilds/${guildId}/mission_logs`));
            
            // [추가] 미션 문서 참조 생성
            const missionRef = doc(db, `guilds/${guildId}/missions`, mission.id!);
            // 트랜잭션 실행 및 결과 반환
            await runTransaction(db, async (t) => {
                const missionDoc = await t.get(missionRef);
                if (!missionDoc.exists()) throw new Error("미션이 존재하지 않습니다.");

                const liveMission = {
                    id: missionDoc.id,
                    ...missionDoc.data()
                } as Mission;
                if (liveMission.status !== 'active') {
                    throw new Error("이미 종료된 미션입니다.");
                }

                const isLiveFundedMission = liveMission.fundingType === 'character';
                if (isLiveFundedMission) {
                    const expiresAt = toDateOrNull(liveMission.bountyExpiresAt);
                    if (!expiresAt || isBountyExpired(expiresAt)) {
                        throw new Error("만료된 지정 미션입니다.");
                    }
                }

                const charRefs = characters.map(char => doc(db, `guilds/${guildId}/characters`, char.id));
                const charDocs = await Promise.all(charRefs.map(ref => t.get(ref)));
                const charDataList = charDocs.map((charDoc) => {
                    if (!charDoc.exists()) throw new Error("Character not found");
                    return charDoc.data();
                });

                const rewardPerCharacter = isLiveFundedMission ? liveMission.cost : liveMission.cost + bonusGold;
                const totalReward = rewardPerCharacter * characters.length;
                const currentBountyGold = liveMission.bountyRemainingGold ?? liveMission.bountyTotalGold ?? 0;
                if (isLiveFundedMission && currentBountyGold < totalReward) {
                    throw new Error("지정 미션 예치금이 부족합니다.");
                }

                const refundGold = isLiveFundedMission ? Math.max(0, currentBountyGold - totalReward) : 0;
                const sponsorId = liveMission.sponsorCharacterId;
                const sponsorIsPerformer = Boolean(sponsorId && characters.some((char) => char.id === sponsorId));
                const sponsorRef = sponsorId ? doc(db, `guilds/${guildId}/characters`, sponsorId) : null;
                const sponsorDoc =
                    isLiveFundedMission && sponsorRef && !sponsorIsPerformer && refundGold > 0
                        ? await t.get(sponsorRef)
                        : null;

                const logData = {
                    missionId: liveMission.id,
                    missionTitle: liveMission.title,
                    performerCharacterIds: characters.map(c => c.id),
                    performerNames: characters.map(c => c.name),
                    approverUserId: currentUser.uid,
                    totalReward,
                    isChestFound: isLiveFundedMission ? false : isChestFound,
                    bonusGold: isLiveFundedMission ? 0 : bonusGold,
                    fundingType: liveMission.fundingType || 'guild',
                    sponsorCharacterId: liveMission.sponsorCharacterId || '',
                    sponsorCharacterName: liveMission.sponsorCharacterName || '',
                    performedDate: today,
                    createdAt: serverTimestamp()
                };
                t.set(logRef, logData);

                // 보상 지급
                charDataList.forEach((data, i) => {
                    const sponsorRefund = isLiveFundedMission && characters[i].id === sponsorId ? refundGold : 0;
                    const currentGold = (data.currentGold || 0) + sponsorRefund;
                    const currentExp = data.exp || 0;
                    const newGold = currentGold + rewardPerCharacter;
                    const newExp = currentExp + rewardPerCharacter;
                    const newLevel = Math.floor(newExp / 1000) + 1;

                    t.update(charRefs[i], {
                        currentGold: newGold,
                        exp: newExp,
                        level: newLevel
                    });
                });

                if (isLiveFundedMission && sponsorRef && !sponsorIsPerformer && refundGold > 0 && sponsorDoc?.exists()) {
                    t.update(sponsorRef, {
                        currentGold: (sponsorDoc.data().currentGold || 0) + refundGold
                    });
                }

                if (isLiveFundedMission) {
                    t.update(missionRef, {
                        status: 'inactive',
                        completedAt: serverTimestamp(),
                        bountyRemainingGold: 0,
                        bountyClosedReason: 'completed'
                    });
                } else if (liveMission.isOneTime) {
                    t.update(missionRef, {
                        status: 'inactive',
                        completedAt: serverTimestamp()
                    });
                }
            });

            // [중요] UI에서 이펙트를 보여주기 위해 결과 반환
            return {
                isChestFound: isFundedMission ? false : isChestFound,
                bonusGold: isFundedMission ? 0 : bonusGold
            };
        }
    };
}

export const missionStore = createMissionStore();
