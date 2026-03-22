import type { CharacterGrade } from './types';

export const GRADE_ORDER: CharacterGrade[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'GrandMaster', 'God'];

export const GRADE_INFO: Record<CharacterGrade, { label: string; icon: string; color: string }> = {
    Bronze: { label: '브론즈', icon: '🥉', color: 'text-orange-600' },
    Silver: { label: '실버', icon: '🥈', color: 'text-gray-400' },
    Gold: { label: '골드', icon: '🥇', color: 'text-yellow-500' },
    Platinum: { label: '플래티넘', icon: '💿', color: 'text-blue-300' },
    Diamond: { label: '다이아몬드', icon: '💎', color: 'text-blue-400' },
    Master: { label: '마스터', icon: '👑', color: 'text-purple-500' },
    GrandMaster: { label: '그랜드 마스터', icon: '🌟', color: 'text-red-500' },
    God: { label: '가족의 신', icon: '🔱', color: 'text-indigo-600 font-black' }
};
