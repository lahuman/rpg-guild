import { get } from 'svelte/store';
import { addDoc, collection, deleteDoc, doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '$lib/firebase';
import { userStore } from '$lib/stores/userStore';
import { getRelativeDateKey, getTodayDateKey } from '$lib';
import {
    GRADE_ORDER,
    getGradeChallenge,
    getGradeInfo,
    getGradeIndex,
    getGradePenaltySteps,
    getGradeRewardGold,
    normalizeGrade
} from './constants';
import { getDefaultCharacterAppearance, sanitizeCharacterAppearance } from './appearance';
import type { CharacterAppearance, GuildCharacter } from './types';

function requireSignedInUser() {
    const currentUser = get(userStore);
    if (!currentUser) throw new Error('로그인이 필요합니다.');
    return currentUser;
}

export function createCharacterActions() {
    return {
        async createCharacter(
            guildId: string,
            charData: Omit<GuildCharacter, 'id' | 'createdAt' | 'level' | 'currentGold'>
        ) {
            await addDoc(collection(db, `guilds/${guildId}/characters`), {
                ...charData,
                grade: charData.grade || 'Rank01',
                level: 1,
                currentGold: 0,
                createdAt: serverTimestamp()
            });
        },

        async updateCharacter(guildId: string, charId: string, updates: Partial<GuildCharacter>) {
            await updateDoc(doc(db, `guilds/${guildId}/characters`, charId), updates);
        },

        async updateCharacterAppearance(guildId: string, charId: string, appearance: Partial<CharacterAppearance>) {
            const charRef = doc(db, `guilds/${guildId}/characters`, charId);

            await runTransaction(db, async (transaction) => {
                const charDoc = await transaction.get(charRef);
                if (!charDoc.exists()) throw new Error('캐릭터가 존재하지 않습니다.');

                const character = {
                    id: charDoc.id,
                    ...charDoc.data()
                } as GuildCharacter;
                const fallback = getDefaultCharacterAppearance(character);

                transaction.update(charRef, {
                    appearance: sanitizeCharacterAppearance(appearance, fallback)
                });
            });
        },

        async deleteCharacter(guildId: string, charId: string) {
            await deleteDoc(doc(db, `guilds/${guildId}/characters`, charId));
        },

        async checkInCharacter(guildId: string, charId: string) {
            const currentUser = requireSignedInUser();
            const charRef = doc(db, `guilds/${guildId}/characters`, charId);
            const logRef = doc(collection(db, `guilds/${guildId}/mission_logs`));
            const today = getTodayDateKey();
            const yesterday = getRelativeDateKey(-1);

            let reward = 0;
            let streak = 0;

            await runTransaction(db, async (transaction) => {
                const charDoc = await transaction.get(charRef);
                if (!charDoc.exists()) throw new Error('캐릭터가 존재하지 않습니다.');

                const data = charDoc.data();
                if (data.lastCheckInDate === today) {
                    throw new Error('이미 오늘 출석했습니다.');
                }

                streak = data.lastCheckInDate === yesterday ? (data.consecutiveDays || 0) + 1 : 1;

                if (streak < 5) reward = 1;
                else if (streak < 10) reward = 2;
                else if (streak < 30) reward = 3;
                else reward = 5;

                const newGold = (data.currentGold || 0) + reward;
                const newExp = (data.exp || 0) + reward;
                const newLevel = Math.floor(newExp / 1000) + 1;

                transaction.update(charRef, {
                    currentGold: newGold,
                    exp: newExp,
                    level: newLevel,
                    lastCheckInDate: today,
                    consecutiveDays: streak
                });

                transaction.set(logRef, {
                    missionId: 'ATTENDANCE',
                    missionTitle: `출석 보상 (${streak}일차)`,
                    performerCharacterIds: [charId],
                    performerNames: [data.name],
                    approverUserId: currentUser.uid,
                    totalReward: reward,
                    performedDate: today,
                    createdAt: serverTimestamp()
                });
            });

            return { reward, streak };
        },

        async updateGrade(guildId: string, charId: string, result: 'up' | 'down' | 'stay') {
            const currentUser = requireSignedInUser();
            const charRef = doc(db, `guilds/${guildId}/characters`, charId);
            const gradeLogRef = doc(collection(db, `guilds/${guildId}/grade_logs`));
            const today = getTodayDateKey();

            await runTransaction(db, async (transaction) => {
                const charDoc = await transaction.get(charRef);
                if (!charDoc.exists()) throw new Error('캐릭터가 존재하지 않습니다.');

                const data = charDoc.data() as GuildCharacter;
                if (data.lastMiniGameDate === today) throw new Error('이미 오늘 등급전에 참여했습니다.');

                const currentGrade = normalizeGrade(data.grade);
                const currentGradeIndex = getGradeIndex(currentGrade);
                let nextGradeIndex = currentGradeIndex;
                let rewardGold = 0;
                let penaltySteps = 0;

                if (result === 'up') {
                    nextGradeIndex = Math.min(currentGradeIndex + 1, GRADE_ORDER.length - 1);
                    rewardGold = getGradeRewardGold(GRADE_ORDER[nextGradeIndex]);
                } else if (result === 'down') {
                    penaltySteps = getGradePenaltySteps(currentGrade);
                    nextGradeIndex = Math.max(currentGradeIndex - penaltySteps, 0);
                }

                const nextGrade = GRADE_ORDER[nextGradeIndex];
                const currentGradeInfo = getGradeInfo(currentGrade);
                const nextGradeInfo = getGradeInfo(nextGrade);
                const characterName = data.name?.trim() || '이름 없는 캐릭터';
                const currentGold = typeof data.currentGold === 'number' ? data.currentGold : 0;
                const newGold = currentGold + rewardGold;

                transaction.update(charRef, {
                    grade: nextGrade,
                    currentGold: newGold,
                    lastMiniGameDate: today
                });

                transaction.set(gradeLogRef, {
                    characterId: charId,
                    characterName,
                    previousGrade: currentGrade,
                    previousGradeLabel: currentGradeInfo.label,
                    nextGrade,
                    nextGradeLabel: nextGradeInfo.label,
                    challengeTitle: currentGradeInfo.challenge.title,
                    result,
                    rewardGold,
                    penaltySteps,
                    performedDate: today,
                    createdAt: serverTimestamp(),
                    approverUserId: currentUser.uid
                });
            });
        },

        async useGold(guildId: string, charId: string, itemName: string, cost: number) {
            const currentUser = requireSignedInUser();
            const charRef = doc(db, `guilds/${guildId}/characters`, charId);
            const logRef = doc(collection(db, `guilds/${guildId}/usage_logs`));

            await runTransaction(db, async (transaction) => {
                const charDoc = await transaction.get(charRef);
                if (!charDoc.exists()) throw new Error('캐릭터가 존재하지 않습니다.');

                const charData = charDoc.data();
                const currentGold = charData.currentGold || 0;

                if (currentGold < cost) {
                    throw new Error(`골드가 부족합니다! (보유: ${currentGold} G / 필요: ${cost} G)`);
                }

                transaction.set(logRef, {
                    characterId: charId,
                    characterName: charData.name,
                    itemName,
                    cost,
                    usedAt: serverTimestamp(),
                    usedByUserId: currentUser.uid
                });

                transaction.update(charRef, {
                    currentGold: currentGold - cost
                });
            });
        },

        async transferGold(
            guildId: string,
            fromId: string,
            toId: string,
            amount: number,
            reason: string
        ) {
            const currentUser = requireSignedInUser();
            const fromRef = doc(db, `guilds/${guildId}/characters`, fromId);
            const toRef = doc(db, `guilds/${guildId}/characters`, toId);
            const logRef = doc(collection(db, `guilds/${guildId}/transfer_logs`));

            await runTransaction(db, async (transaction) => {
                const fromDoc = await transaction.get(fromRef);
                const toDoc = await transaction.get(toRef);

                if (!fromDoc.exists()) throw new Error('보내는 캐릭터가 존재하지 않습니다.');
                if (!toDoc.exists()) throw new Error('받는 캐릭터가 존재하지 않습니다.');

                const fromData = fromDoc.data();
                const toData = toDoc.data();

                if (fromId === toId) throw new Error('자신에게는 보낼 수 없습니다.');
                if (amount <= 0) throw new Error('보낼 금액은 0보다 커야 합니다.');
                if ((fromData.currentGold || 0) < amount) {
                    throw new Error(`골드가 부족합니다! (보유: ${fromData.currentGold || 0} G)`);
                }

                transaction.update(fromRef, {
                    currentGold: (fromData.currentGold || 0) - amount
                });

                transaction.update(toRef, {
                    currentGold: (toData.currentGold || 0) + amount
                });

                transaction.set(logRef, {
                    fromId,
                    fromName: fromData.name,
                    toId,
                    toName: toData.name,
                    amount,
                    reason,
                    transferredAt: serverTimestamp(),
                    transferredByUserId: currentUser.uid
                });
            });
        }
    };
}
