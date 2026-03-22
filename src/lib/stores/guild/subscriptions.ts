import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { Updater } from 'svelte/store';
import { db } from '$lib/firebase';
import type { Guild, GuildCharacter } from './types';

type UpdateGuildStore = (updater: Updater<Guild | null>) => void;

export function createGuildSubscriptions(updateStore: UpdateGuildStore) {
    return {
        init(guildId: string) {
            const unsubGuild = onSnapshot(doc(db, 'guilds', guildId), (docSnap) => {
                if (docSnap.exists()) {
                    updateStore((guild: Guild | null) => ({ ...guild, id: docSnap.id, ...docSnap.data() } as Guild));
                }
            });

            const charsQuery = query(
                collection(db, `guilds/${guildId}/characters`),
                orderBy('createdAt', 'desc')
            );

            const unsubChars = onSnapshot(charsQuery, (snapshot) => {
                const characters = snapshot.docs.map((characterDoc) => ({
                    id: characterDoc.id,
                    ...characterDoc.data()
                } as GuildCharacter));

                updateStore((guild: Guild | null) => (guild ? { ...guild, characters } : null));
            });

            return () => {
                unsubGuild();
                unsubChars();
            };
        }
    };
}
