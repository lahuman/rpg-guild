import type { JobClass } from '$lib/stores/guild/types';

export const JOB_ICONS: Record<JobClass, string> = {
    '검사': '⚔️',
    '마법사': '🔮',
    '힐러': '🌿',
    '사냥꾼': '🏹',
    '도적': '🗡️',
    '탱커': '🛡️'
};

export interface EmojiCategory {
    name: string;
    icons: string[];
}

export const SHOP_EMOJI_CATEGORIES: EmojiCategory[] = [
    { name: '공격', icons: ['⚔️', '🗡️', '🏹', '🪓', '🔫', '🪄', '💣', '🧨'] },
    { name: '방어', icons: ['🛡️', '🪖', '🧥', '🥋', '🧱', '⛓️'] },
    { name: '소비', icons: ['🧪', '💊', '🩹', '🥩', '🍞', '🍎', '🍷', '☕'] },
    { name: '보상', icons: ['🎁', '📦', '💎', '💰', '🪙', '🗝️', '🏺', '👑'] },
    { name: '기타', icons: ['📜', '💍', '💀', '🐴', '🎒', '🔦', '⚜️', '🔮'] }
];
