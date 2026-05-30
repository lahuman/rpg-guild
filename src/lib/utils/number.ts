const compactFormatter = new Intl.NumberFormat('ko-KR', {
	notation: 'compact',
	maximumFractionDigits: 1
});

const standardFormatter = new Intl.NumberFormat('ko-KR', {
	maximumFractionDigits: 0
});

function toFiniteNumber(value: number | null | undefined): number {
	return Number.isFinite(value) ? Number(value) : 0;
}

export function formatCompactNumber(value: number | null | undefined): string {
	const numericValue = toFiniteNumber(value);
	const absoluteValue = Math.abs(numericValue);

	if (absoluteValue >= 1000000) {
		return compactFormatter.format(numericValue);
	}

	return standardFormatter.format(numericValue);
}

export function formatGold(value: number | null | undefined): string {
	return `${formatCompactNumber(value)} G`;
}

export function formatAverageLevel(value: number | null | undefined): string {
	const numericValue = toFiniteNumber(value);

	if (Math.abs(numericValue) >= 10000) {
		return formatCompactNumber(numericValue);
	}

	return numericValue.toFixed(1);
}
