export function getRankStyle(level = 1) {
    if (level >= 30) {
        return {
            border: 'border-yellow-400 border-2',
            shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.6)]',
            bg: 'bg-gradient-to-br from-yellow-50 to-white',
            badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            effect: 'animate-pulse-slow',
            levelText: 'text-red-600 font-black text-sm drop-shadow-sm'
        };
    }

    if (level >= 20) {
        return {
            border: 'border-purple-400 border-2',
            shadow: 'shadow-lg shadow-purple-100',
            bg: 'bg-gradient-to-br from-purple-50 to-white',
            badge: 'bg-purple-100 text-purple-800 border-purple-200',
            effect: '',
            levelText: 'text-purple-600 font-bold'
        };
    }

    if (level >= 10) {
        return {
            border: 'border-blue-400 border-2',
            shadow: 'shadow-md shadow-blue-100',
            bg: 'bg-blue-50/30',
            badge: 'bg-blue-100 text-blue-800 border-blue-200',
            effect: '',
            levelText: 'text-blue-600 font-bold'
        };
    }

    return {
        border: 'border-gray-100',
        shadow: 'shadow-md hover:shadow-xl',
        bg: 'bg-white',
        badge: 'bg-white border text-gray-600',
        effect: '',
        levelText: 'text-gray-400 font-medium'
    };
}
