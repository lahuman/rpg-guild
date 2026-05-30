import { formatAverageLevel, formatCompactNumber, formatGold } from './number';

const compactGold = formatGold(100_000_000_000_000);
const compactLevel = formatAverageLevel(12_499_999_999_999);
const normalGold = formatGold(12500);
const fallbackGold = formatGold(Number.POSITIVE_INFINITY);

const numberFormattingCompileAssertions = {
	compactGoldIsShort: compactGold.length < '100,000,000,000,000 G'.length,
	compactLevelIsShort: compactLevel.length < '12499999999999.0'.length,
	normalGold,
	fallbackGold
};

export { numberFormattingCompileAssertions };
