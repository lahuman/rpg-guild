export function getErrorMessage(error: unknown, fallback = '알 수 없는 오류가 발생했습니다.'): string {
    if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'permission-denied'
    ) {
        return '권한이 없습니다. Firestore 보안 규칙에서 현재 길드의 characters 또는 grade_logs 쓰기를 허용해야 합니다.';
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === 'string' && error.trim()) {
        return error;
    }

    return fallback;
}
