export function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function getTodayDateKey(): string {
    return formatDateKey(new Date());
}

export function getRelativeDateKey(offsetDays: number): string {
    return formatDateKey(new Date(Date.now() + offsetDays * 86400000));
}

export function formatRelativeDateLabel(dateStr: string): string {
    if (dateStr === getTodayDateKey()) return '오늘 (Today)';
    if (dateStr === getRelativeDateKey(-1)) return '어제 (Yesterday)';
    return dateStr;
}

export function formatKoreanTime(date: Date): string {
    return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

type FirestoreDateLike =
    | Date
    | string
    | number
    | { seconds: number }
    | { toDate: () => Date }
    | null
    | undefined;

export function toDateOrNull(value: FirestoreDateLike): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    if ('toDate' in value && typeof value.toDate === 'function') {
        return value.toDate();
    }
    if ('seconds' in value && typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000);
    }
    return null;
}
