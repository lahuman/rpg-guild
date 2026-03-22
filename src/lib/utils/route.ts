export function requireRouteParam(value: string | undefined, paramName: string): string {
    if (!value) {
        throw new Error(`${paramName} is required`);
    }

    return value;
}
