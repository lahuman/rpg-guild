import { get } from 'svelte/store';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '$lib/firebase';
import { userStore } from '$lib/stores/userStore';
import type { UserData } from '$lib/stores/userStore';

function generateGuildCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
}

function requireSignedInUser() {
    const currentUser = get(userStore);
    if (!currentUser) throw new Error('로그인이 필요합니다.');
    return currentUser;
}

export function createGuildManagementActions() {
    return {
        async createGuild(name: string, user: UserData | null | undefined) {
            if (!user) throw new Error('로그인이 필요합니다.');

            const guildRef = await addDoc(collection(db, 'guilds'), {
                name,
                code: generateGuildCode(),
                leaderId: user.uid,
                description: '',
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, 'users', user.uid), {
                guildId: guildRef.id
            });

            return guildRef.id;
        },

        async joinGuild(code: string, user: UserData | null | undefined) {
            if (!user) throw new Error('로그인이 필요합니다.');

            const guildQuery = query(collection(db, 'guilds'), where('code', '==', code));
            const snapshot = await getDocs(guildQuery);

            if (snapshot.empty) {
                throw new Error('잘못된 초대 코드입니다.');
            }

            const guildId = snapshot.docs[0].id;

            await updateDoc(doc(db, 'users', user.uid), {
                guildId
            });

            return guildId;
        },

        async updateGuildName(guildId: string, newName: string) {
            requireSignedInUser();

            if (!newName || newName.trim().length === 0) {
                throw new Error('길드 이름을 입력해주세요.');
            }

            await updateDoc(doc(db, 'guilds', guildId), {
                name: newName.trim()
            });
        },

        async updateGuildDescription(guildId: string, newDesc: string) {
            requireSignedInUser();

            await updateDoc(doc(db, 'guilds', guildId), {
                description: newDesc.trim()
            });
        },

        async updateGuildRewardSettings(guildId: string, boxChance: number, maxBonusGold: number) {
            requireSignedInUser();

            await updateDoc(doc(db, 'guilds', guildId), {
                boxChance: Number(boxChance),
                maxBonusGold: Number(maxBonusGold)
            });
        }
    };
}
