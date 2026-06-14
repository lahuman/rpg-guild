const DEFAULT_BOX_CHANCE_PERCENT = 20;

function clampRewardChancePercent(value: number) {
    return Math.min(100, Math.max(1, value));
}

export function chanceRatioToPercentInput(chanceRatio?: number | null) {
    const percent = Number(chanceRatio) * 100;

    if (!Number.isFinite(percent)) {
        return DEFAULT_BOX_CHANCE_PERCENT;
    }

    return clampRewardChancePercent(Math.round(percent));
}

export function percentInputToChanceRatio(percentInput?: number | string | null) {
    const percent = Number(percentInput);
    const normalizedPercent = Number.isFinite(percent)
        ? clampRewardChancePercent(percent)
        : DEFAULT_BOX_CHANCE_PERCENT;

    return normalizedPercent / 100;
}
